import { sortBy } from "@pastable/utils";

import { CURRENT_CELL, EMPTY_CELL, Game, getLinesToClear, HEIGHT, makeLine, WIDTH } from "./game";
import { ConfigData, IAConfig } from "./iaConfig";
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
        this.avgScore = results.reduce((acc, current) => acc + current.score, 0) / results.length;

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

const ROTATIONS = [0, 90, 180, 270];

const wait = async (delay: number) =>
    new Promise((resolve) => setTimeout(() => resolve(true), delay));

export const findBestMove = (game: Game, config: IAConfig) => findAllMoves(game, config)[0];

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
    basePeaks.reduce((acc, current) => (current === HEIGHT ? acc : acc + HEIGHT - 1 - current), 0);

export const getPeaks = (grid: Grid) => {
    const peaks = [];
    let currentHeight = 0;
    // each row
    while (peaks.length < WIDTH) {
        // bottom -> reset
        if (currentHeight === HEIGHT) {
            peaks.push(HEIGHT);

            currentHeight = 0;
        } else if (![EMPTY_CELL, CURRENT_CELL].includes(grid[currentHeight][peaks.length])) {
            peaks.push(currentHeight);

            currentHeight = 0;
        } else currentHeight++;
    }

    return peaks;
};

export const getMinMaxHeight = (grid: Grid) => {
    const peaks = getPeaks(grid);

    const max = peaks.reduce(
        (acc, current) => (current === HEIGHT ? acc : Math.max(acc, HEIGHT - 1 - current)),
        0
    );
    let min = HEIGHT;
    let y = 0;
    while (y < WIDTH) {
        let currentMin;
        let x = 0;
        while (x < HEIGHT && !currentMin) {
            if (grid[x][y] !== EMPTY_CELL) currentMin = x;
            x++;
        }
        if (!currentMin) min = 0;
        else if (currentMin < min) min = currentMin;

        y++;
    }
    return { max, min };
};

export const getAverageHeight = (grid: Grid) => {
    const peaks = getPeaks(grid);

    return peaks.reduce((avg, current) => avg + (HEIGHT - current), 0) / peaks.length;
};

export const getNbHoles = (grid: Grid, basePeaks?: number[]) => {
    const peaks = basePeaks || getPeaks(grid);

    let nbHoles = 0;
    let nbColumnsWithHoles = 0;

    peaks.forEach((peak, y) => {
        if (peak === -1) return;
        let holesInThisLine = 0;

        for (let i = peak; i < HEIGHT; i++) {
            if (grid[i][y] === EMPTY_CELL) {
                holesInThisLine++;
            }
        }
        // const holesInThisLine = grid[x].filter((cell, index) => index > peak && cell === 0).length;
        nbHoles += holesInThisLine;
        if (holesInThisLine) nbColumnsWithHoles++;
    });

    return { nbHoles, nbColumnsWithHoles };
};

export const getBumpiness = (grid: Grid, basePeaks?: number[]) => {
    const peaks = basePeaks || getPeaks(grid);

    let bumpiness = 0;

    peaks.forEach((peak, y, peaks) => {
        if (y === 0) return;
        bumpiness += Math.abs(peaks[y - 1] - peak);
    });

    return bumpiness;
};

export const getTransitions = (grid: Grid) => {
    let nbRowTransitions = 0;
    let nbColumnTransitions = 0;

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j] !== EMPTY_CELL) {
                if (grid[i][j - 1] === EMPTY_CELL) nbRowTransitions++;
                if (grid[i][j + 1] === EMPTY_CELL) nbRowTransitions++;
                if (grid[i - 1]?.[j] === EMPTY_CELL) nbColumnTransitions++;
                if (grid[i + 1]?.[j] === EMPTY_CELL) nbColumnTransitions++;
            }
        }
    }

    return { nbRowTransitions, nbColumnTransitions };
};

export const getWells = (grid: Grid, basePeaks?: number[]) => {
    const peaks = basePeaks || getPeaks(grid);

    const wells: number[] = [];

    peaks.forEach((peak, y, peaks) => {
        if (y === 0) {
            const w = peaks[1] - peak;
            return wells.push(Math.max(0, w));
        }
        if (y === peaks.length - 1) {
            const w = peaks[peaks.length - 2] - peak;
            return wells.push(Math.max(0, w));
        }

        const w1 = peaks[y - 1] - peak;
        const w2 = peaks[y + 1] - peak;

        const w = Math.max(0, w1, w2);
        return wells.push(w);
    });

    return wells;
};

export const getDeepestWell = (grid: Grid, basePeaks?: number[]) => {
    const wells = getWells(grid, basePeaks);

    return Math.max(...wells);
};

export const getPits = (grid: Grid, basePeaks?: number[]) => {
    const peaks = basePeaks || getPeaks(grid);

    return peaks.filter((peak) => peak === HEIGHT).length;
};

export const getScore = (grid: Grid) => {
    const linesToClear = getLinesToClear(grid);

    linesToClear.forEach((lineIndex) => {
        grid.splice(lineIndex, 1);
        grid.unshift(makeLine());
    });

    return {
        rowsCleared: linesToClear.length,
        weightedHeight: Math.pow(getHeight(grid), 1.5),
        cumulativeHeight: getCumulativeHeight(grid),
        relativeHeight: getRelativeHeight(grid),
        holes: getHoles(grid),
        roughness: getRoughness(grid),
    };
};

// export const getScore = (grid: Grid) => {
//     const linesToClear = getLinesToClear(grid);

//     linesToClear.forEach((lineIndex) => {
//         grid.splice(lineIndex, 1);
//         grid.unshift(makeLine());
//     });

//     const peaks = getPeaks(grid);
//     const { nbHoles } = getNbHoles(grid, peaks);

//     return {
//         aggregatedHeight: getAggregatedHeight(peaks),
//         bumpiness: getBumpiness(grid, peaks),
//         nbHoles,
//         nbClearedRows: linesToClear.length,
//     };
// };

export const computeScore = (grid: Grid, config: IAConfig) => {
    const score = getScore(grid);

    let rating = 0;
    rating += score.rowsCleared * config.nbClearedRowsFactor;
    rating += score.weightedHeight * config.weightedHeightFactor;
    rating += score.cumulativeHeight * config.cumulativeHeightFactor;
    rating += score.relativeHeight * config.relativeHeightFactor;
    rating += score.holes * config.nbHolesFactor;
    rating += score.roughness * config.roughnessFactor;

    return { scores: score, total: rating, grid };
};
