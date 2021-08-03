import { Router } from "express";
import { Game, getRandomPiece } from "../game/game";
import { Ia } from "../game/ia";
import { getBestGeneration } from "./generation";

const router = Router();

router.get("/game/best", async (_req, res) => {
    const best = await getBestGeneration();
    const game = new Game(best.seed);
    game.start();

    const ia = new Ia([game], best.config);

    const result = ia.playWholeGame();

    res.status(200).send({ ...result, generation: best.generation });
});

export { router };
