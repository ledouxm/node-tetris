import { sortBy } from "@pastable/utils";

import {
    CURRENT_CELL,
    EMPTY_CELL,
    Game,
    getLinesToClear,
    HEIGHT,
    makeLine,
    WIDTH,
} from "./game";
import { IAConfig } from "./iaConfig";
import {
    getCumulativeHeight,
    getHeight,
    getHoles,
    getRelativeHeight,
    getRoughness,
} from "./pomped";
import { randomSeed } from "./utils";

export type Grid = string[][];
export class Ia {
    public config: IAConfig;
    public name: string;
    public avgScore?: number;
    public lastMove?: ReturnType<typeof findBestMove>;

    constructor(public games: Game[], config?: IAConfig) {
        this.config = new IAConfig(config);
        this.config.normalize();
        this.name = randomSeed();
    }

    playWholeGame() {
        const results = this.games.map((game) => {
            const moves = [];
            while (game.status !== "lost") {
                moves.push(this.playAMove(game));
            }
            return {
                score: game.score,
                nbPiece: game.nbPiece,
                nbClearedLines: game.nbClearedLines,
                moves,
                seed: game.seed,
            };
        });
        this.avgScore =
            results.reduce((acc, current) => acc + current.score, 0) /
            results.length;

        const bestGame = sortBy(results, "score", "desc")[0];

        return {
            score: this.avgScore,
            config: this.config,
            bestGame,
            moves: bestGame.moves,
        };
    }

    playAMove(game: Game) {
        if (game.status === "lost") return;

        const lastMove = findBestMove(game, this.config);

        this.lastMove = lastMove;

        const { y, rotation } = lastMove;
        game.currentPiece.rotate(rotation);
        // console.log(game.currentPiece);
        moveTo(game, y);
        return game.dropPiece();
    }
}

export const ROTATIONS = [0, 90, 180, 270];

const wait = async (delay: number) =>
    new Promise((resolve) => setTimeout(() => resolve(true), delay));

export const findBestMove = (game: Game, config: IAConfig) =>
    findAllMoves(game, config)[0];

export const findAllMoves = (game: Game, config: IAConfig) => {
    const scores: { y: number; rotation: number; score: number }[] = [];

    ROTATIONS.forEach((rotation) => {
        const gameClone = game.clone();

        const { min, max } = getYRange(gameClone);

        for (let y = min; y <= max; y++) {
            const clone = gameClone.clone(false);
            clone.currentPiece.rotate(rotation);
            moveTo(clone, y);

            clone.dropPiece();

            const computedScore = computeScore(clone.grid, config);
            scores.push({
                y,
                // game: clone,
                rotation,
                // scores: computedScore.scores,
                score: computedScore.total,
            });
        }
    });
    return sortBy(scores, "score", "desc");
};
export const moveTo = (game: Game, y: number) => {
    const diff = game.currentPiece.y - y;

    for (let i = 0; i < Math.abs(diff); i++) {
        if (diff < 0) game.moveRight();
        else game.moveLeft();
    }
};

export const getYRange = (game: Game) => {
    const yRange = { min: 0, max: WIDTH - 1 };
    while (game.moveLeft()) {}
    yRange.min = game.currentPiece.y;
    while (game.moveRight()) {}
    yRange.max = game.currentPiece.y;

    return yRange;
};

export const getAggregatedHeight = (basePeaks: number[]) =>
    basePeaks.reduce(
        (acc, current) =>
            current === HEIGHT ? acc : acc + HEIGHT - 1 - current,
        0
    );

export const getScore = (grid: Grid) => {
    const linesToClear = getLinesToClear(grid);

    linesToClear.forEach((lineIndex) => {
        grid.splice(lineIndex, 1);
        grid.unshift(makeLine());
    });

    return {
        rowsCleared: linesToClear.length,
        cumulativeHeight: getCumulativeHeight(grid),
        holes: getHoles(grid),
        bumpiness: getRoughness(grid),
        relativeHeight: getRelativeHeight(grid),
        height: getHeight(grid),
    };
};

export const computeScore = (grid: Grid, config: IAConfig) => {
    const score = getScore(grid);

    let rating = 0;
    rating += score.rowsCleared * config.nbClearedRowsFactor;
    rating -= score.cumulativeHeight * config.cumulativeHeightFactor;
    rating -= Math.pow(score.holes, 2) * config.nbHolesFactor;
    rating -= score.bumpiness * config.bumpinessFactor;
    rating -= score.relativeHeight * config.relativeHeightFactor;
    rating -= score.height * config.heightFactor;

    return { scores: score, total: rating, grid };
};
