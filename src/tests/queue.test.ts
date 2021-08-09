import { makeRandomQueue } from "../game/game";
import createGenerator from "seedrandom";
import { singlePieces } from "../game/utils";

describe("queue tests", () => {
    it("should test queue", () => {
        const generator = createGenerator();
        console.log(singlePieces);
    });
});
