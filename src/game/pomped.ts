import { CURRENT_CELL, EMPTY_CELL, HEIGHT } from "./game";
import { getPeaks, Grid } from "./ia";

export const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

/**
 * Returns the cumulative height of all the columns.
 * @return {Number} The cumulative height.
 */
export const getCumulativeHeight = (grid: Grid) =>
    getPeaks(grid).reduce((acc, current) => acc + HEIGHT - current);

/**
 * Returns the number of holes in the grid.
 * @return {Number} The number of holes.
 */

export const getHoles = (grid: Grid) => {
    const peaks = getPeaks(grid);
    // console.log(peaks);

    var holes = 0;
    for (var y = 0; y < peaks.length; y++) {
        for (var x = peaks[y]; x < grid.length; x++) {
            // console.log({ x, y, value: grid[y][x], isHole: grid[y][y] === EMPTY_CELL });
            if (grid[x][y] === EMPTY_CELL) {
                holes++;
            }
        }
    }
    return holes;
};

/**
 * Returns an array that replaces all the holes in the grid with -1.
 * @return {Array} The modified grid array.
 */
export function getHolesArray(grid: Grid) {
    var array = clone(grid);
    const peaks = getPeaks(grid);
    for (var x = 0; x < peaks.length; x++) {
        for (var y = peaks[x]; y < grid.length; y++) {
            if (grid[y][x] === EMPTY_CELL) {
                array[y][x] = -1;
            }
        }
    }
    return array;
}

/**
 * Returns the roughness of the grid.
 * @return {Number} The roughness of the grid.
 */
export function getRoughness(grid: Grid) {
    const peaks = getPeaks(grid);
    var roughness = 0;
    var differences = [];
    for (var i = 0; i < peaks.length - 1; i++) {
        roughness += Math.abs(peaks[i] - peaks[i + 1]);
        differences[i] = Math.abs(peaks[i] - peaks[i + 1]);
    }
    return roughness;
}

/**
 * Returns the range of heights of the columns on the grid.
 * @return {Number} The relative height.
 */
export function getRelativeHeight(grid: Grid) {
    const peaks = getPeaks(grid);
    return Math.max.apply(Math, peaks) - Math.min.apply(Math, peaks);
}

/**
 * Returns the height of the biggest column on the grid.
 * @return {Number} The absolute height.
 */
export function getHeight(grid: Grid) {
    const peaks = getPeaks(grid);
    return HEIGHT - Math.min(...peaks);
}
