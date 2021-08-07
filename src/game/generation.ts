import { makeArrayOf, sortBy } from "@pastable/utils";

import { Game } from "./game";
import { Ia } from "./ia";
import { IAConfig, random, randomWeight } from "./iaConfig";
import fs from "fs/promises";
import { getOrMakeDbConnection } from "../db";
import { Collection } from "mongodb";

import gaussian from "gaussian";

const POPULATION_SIZE = 100;
const ELITISM_PERCENTAGE = 0.5;
const MUTATION_PERCENTAGE = 0.02;
const PARALLEL_GAME = 1;

const lastGenerationFile = "lastGeneration.json";
const bestGameFile = "bestGame.json";

let bestScore = 0;

interface JsonGeneration {
  configs: IAConfig[];
  generation: number;
}

const distribution = gaussian(0, 1);

export class Generation {
  public genNumber = 0;
  public oldPop: Population;
  public population: Population;
  public lastGeneration: JsonGeneration;
  public collection: Collection;

  constructor() {}

  async init() {
    const { collection } = await getOrMakeDbConnection();
    this.collection = collection;
    if (!this.oldPop) {
      try {
        // retrieve last generation from localstorage if any
        const lastGenerationStr = await fs.readFile(
          lastGenerationFile,
          "utf-8"
        );
        this.lastGeneration = JSON.parse(lastGenerationStr);

        this.genNumber = this.lastGeneration.generation + 1;

        // create a new population with retrieve configs
        this.oldPop = new Population(null);
        this.oldPop.initIndividuals(this.lastGeneration.configs);
      } catch (e) {
        console.log("no previous generation");
      }
    }
  }

  async start() {
    while (true) {
      await this.startOnePopulation();
    }
  }

  async startOnePopulation(update?: (game: Game) => void) {
    // create current population based on last population
    this.population = new Population(this.oldPop, update);

    // process every agent of the population
    const results = await this.population.start();

    console.log(
      `generation no ${this.genNumber} - ${this.population.individuals.length}` +
        "\n" +
        `best score: ${results.bestScore}\naverage: ${results.average}\nnbPiece: ${results.best.bestGame.nbPiece}\ncleared rows: ${results.best.bestGame.nbClearedLines}` +
        "\n" +
        `\nbest: ${results.best.config.toString()}
                \n
                scores: ${results.scores.join(", ")}`
    );

    // store current generation data as last generation
    try {
      await fs.writeFile(
        lastGenerationFile,
        JSON.stringify(
          {
            generation: this.genNumber,
            configs: this.population.individuals.map((agent) => agent.config),
          },
          null,
          4
        )
      );
    } catch (e) {
      console.log(e);
    }

    try {
      if (results.bestScore > bestScore) {
        bestScore = results.bestScore;
        await fs.writeFile(
          bestGameFile,
          JSON.stringify(results.best.moves, null, 4)
        );
      }
    } catch (e) {
      console.log(e);
    }

    try {
      await this.collection.insertOne({
        generation: this.genNumber,
        bestScore: results.best.score,
        config: results.best.config,
        seed: results.best.bestGame.seed,
        average: results.average,
        median: results.median,
        worstScore: results.worstScore,
        createdAt: Date.now(),
      });
    } catch (e) {
      console.log(e);
    }

    this.oldPop = this.population;

    this.genNumber++;
  }
}

const createGame = (update?: (game: Game) => void) => {
  const game = new Game();
  game.start(update);
  return game;
};
export const makeClone = (update?: (game: Game) => void) =>
  makeArrayOf(PARALLEL_GAME).map(() => createGame(update));

export class Population {
  public individuals: Ia[] = [];

  constructor(
    public oldPopulation: Population,
    public update?: (game: Game) => void
  ) {
    this.crossover();
    this.mutate();
  }

  initIndividuals(configs?: Partial<IAConfig>) {
    this.individuals = makeArrayOf(POPULATION_SIZE).map(
      (_, index) =>
        new Ia(makeClone(index === 0 ? this.update : null), configs?.[index])
    );
  }

  crossover() {
    if (!this.oldPopulation) {
      this.initIndividuals();
      return;
    }

    const sorted = sortBy(this.oldPopulation.individuals, "avgScore", "desc");
    // const bestHalf = sorted.slice(0, Math.round(sorted.length / 2));
    // console.log(sorted.map(individual => individual.avgScore));

    const totalScore = sorted.reduce(
      (acc, current) => acc + current.avgScore,
      0
    );
    const probs = sorted.map((agent) => agent.avgScore / totalScore);
    this.individuals = [];

    let avgA = 0;
    let avgB = 0;
    let cpt = 0;

    for (let i = 0; i < POPULATION_SIZE; i++) {
      if (i < POPULATION_SIZE * ELITISM_PERCENTAGE) {
        this.individuals.push(new Ia(makeClone(), sorted[i].config));
      } else {
        const a = randomWithProbs(probs);
        const b = randomWithProbs(probs);

        avgA += a;
        avgB += b;
        cpt++;

        const parentA = sorted[a];
        const parentB = sorted[b];

        const configData = { ...parentA.config };
        Object.keys(parentA.config).map((key) => {
          const r = Math.random();
          //@ts-ignore
          if (r >= 0.5) configData[key] = parentB.config[key];
        });
        const config = new IAConfig(configData);
        config.normalize();
        this.individuals.push(new Ia(makeClone(), config));
      }
    }

    avgA /= cpt;
    avgB /= cpt;

    console.log({ avgA, avgB });
  }

  mutate() {
    this.individuals = this.individuals.map((individual) => {
      const { config } = individual;

      Object.keys(config).map((key) => {
        if (Math.random() < MUTATION_PERCENTAGE) {
          //@ts-ignore
          config[key] = randomWeight();
        }
      });

      individual.config = config;
      individual.config.normalize();

      return individual;
    });
  }

  async start() {
    const results = this.individuals.map((individual) =>
      individual.playWholeGame()
    );

    const sorted = sortBy(results, "score", "desc");
    const best = sorted[0];

    const average =
      results.reduce((acc, current) => acc + current.score, 0) / results.length;
    const median = sorted[Math.floor(POPULATION_SIZE / 2)].score;

    const worstScore = sortBy(results, "score", "asc")[0].score;
    return {
      best,
      average,
      median,
      worstScore,
      bestScore: best.score,
      scores: sorted.map((result) => result.score),
    };
  }
}

export const randomWithProbs = (probs: number[], riggedRandom?: number) => {
  const randomNb = riggedRandom || random();
  let i = 0;
  let acc = probs[i];
  while (randomNb > acc) {
    i++;
    acc += probs[i];
  }

  return i;
};
