import { startApi } from "./api";
import { Game } from "./game/game";
import { Ia } from "./game/ia";

const main = async () => {
    // startApi();
    const game = new Game();
    game.start();
    const ia = new Ia([game]);
    const results = ia.playAMove(game);
    console.log(results);
};

main();
