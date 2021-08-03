import { Game } from "./game";
import { Ia } from "./ia";

describe("generation test", () => {
    it("should get best move", () => {
        const game = new Game();
        game.start();
        const ia = new Ia([game]);
        const results = ia.playAMove(game);
        console.log(results);
    });
});
