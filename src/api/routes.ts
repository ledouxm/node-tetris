import { Router } from "express";
import { getBestGeneration, getGenerationBestScores } from "./generation";
import fs from "fs/promises";
const router = Router();

router.get("/game/best", async (_req, res) => {
    const best = await getBestGeneration();
    //   const game = new Game(best.seed);
    //   game.start();

    //   const ia = new Ia([game], best.config);

    //   const result = ia.playWholeGame();
    let moves = [];
    try {
        moves = JSON.parse(await fs.readFile("worstGame.json", "utf-8"));
    } catch (e) {
        console.log(e);
    }
    res.status(200).send({
        generation: best.generation,
        score: best.bestScore,
        moves,
        best,
    });
});

router.get("/evolutions", async (_req, res) => {
    const data = await getGenerationBestScores();

    res.status(200).send(data);
});

export { router };
