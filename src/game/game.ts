import { makeArrayOf } from "@pastable/utils";
// import gen from "random-seed";
import createGenerator from "seedrandom";
import { BasePiece, basePieces, getCellsByNameAndRotation, randomSeed } from "./utils";

type Grid = string[][];

export const EMPTY_CELL = "*";
export const CURRENT_CELL = "#";
export const QUEUE_SIZE = 5;
export const WIDTH = 10;
export const HEIGHT = 20;
export const TETRIS_FACTOR = 50;
export const PIECE_FACTOR = 1;

const basePiecesWithoutRotation = basePieces.filter(
    (basePiece: BasePiece) => basePiece.rotation === 0
);

export const makeLine = () => makeArrayOf(10).map(() => EMPTY_CELL);
const makeGrid = () => makeArrayOf(20).map(makeLine);

// const getRandomPiece = () => pickOne(basePieces.filter((basePiece) => basePiece.rotation === 0));
export const getRandomPiece = (generator: any) => {
    const random = generator() * basePiecesWithoutRotation.length;
    const piece = basePiecesWithoutRotation[Math.floor(random)];

    // console.log({ random, piece, seed: generator.seed });
    return piece;
};
export class Game {
    public score = 0;
    public status = "initial";
    public grid: Grid = makeGrid();
    public queue: BasePiece[] = [];
    public currentPiece: Piece = null;
    public seed: string;
    public generator;
    public nbPiece = 0;
    public nbClearedLines = 0;
    public notify?: (game: Game) => void;

    constructor(seed?: string) {
        this.seed = seed || randomSeed();
        this.generator = createGenerator(String(this.seed));
        this.generator.seed = randomSeed();
    }

    clone(needSeed: boolean = true) {
        const clone = new Game(needSeed ? this.seed : undefined);

        clone.generator = this.generator;
        clone.score = this.score;
        clone.status = this.status;
        clone.grid = [...this.grid.map((row) => [...row])];
        clone.queue = this.queue;
        clone.currentPiece = this.currentPiece.clone();

        return clone;
    }

    start(notify?: (game: Game) => void) {
        this.notify = notify;

        this.status = "playing";
        this.grid = makeGrid();
        this.score = 0;
        this.nbClearedLines = 0;

        this.queue = makeArrayOf(QUEUE_SIZE).map(() => getRandomPiece(this.generator));

        this.nextPiece();
        this.update();
    }

    nextPiece() {
        if (this.currentPiece) {
            this.printCurrentPiece(this.currentPiece.name);

            this.checkTetris();

            this.nbPiece++;
            this.score += PIECE_FACTOR;
        }

        if (this.status === "lost") return;

        this.currentPiece = new Piece(this.queue.shift());
        this.queue.push(getRandomPiece(this.generator));

        this.currentPiece.snapToGrid();

        if (this.isCurrentPieceOverlapping()) {
            return this.lose();
        }
    }

    moveLeft() {
        if (this.status !== "playing") return;
        this.clearPiece();
        const possible = this.currentPiece.goLeft(this.grid);

        this.update();
        return possible;
    }

    moveRight() {
        if (this.status !== "playing") return;
        this.clearPiece();
        const possible = this.currentPiece.goRight(this.grid);

        this.update();
        return possible;
    }

    rotate() {
        if (this.status !== "playing") return;
        this.currentPiece.rotateClockWise();
        this.clearPiece();

        this.update();
    }

    clearPiece() {
        for (let i = 0; i < this.grid.length; i++) {
            for (let j = 0; j < this.grid[i].length; j++) {
                if (this.grid[i][j] === CURRENT_CELL) this.grid[i][j] = EMPTY_CELL;
            }
        }
    }

    isCurrentPieceOverlapping() {
        return this.currentPiece
            .getCellCoordinates()
            .some(
                (coord) =>
                    !isOutOfBounds(coord.x, coord.y) && this.grid[coord.x][coord.y] !== EMPTY_CELL
            );
    }

    printCurrentPiece(newValue?: string) {
        this.currentPiece?.getCellCoordinates().forEach((coord) => {
            if (newValue && coord.x < 0) return this.lose();
            if (isOutOfBounds(coord.x, coord.y)) return;
            this.grid[coord.x][coord.y] = newValue || CURRENT_CELL;
        });
    }

    dropPiece() {
        this.clearPiece();
        this.currentPiece.goToBottom(this.grid);

        const payload = {
            cells: [...this.currentPiece.getCellCoordinates()],
            piece: this.currentPiece.name,
        };

        this.nextPiece();

        this.update();

        return payload;
    }

    checkTetris() {
        const linesToClear = getLinesToClear(this.grid);

        linesToClear.forEach((lineIndex) => {
            this.nbClearedLines++;
            this.grid.splice(lineIndex, 1);
            this.grid.unshift(makeLine());
        });

        // if (linesToClear.length) console.log("clearing", linesToClear);
        this.score += TETRIS_FACTOR * linesToClear.length;
    }

    lose() {
        this.status = "lost";
    }

    update() {
        this.printCurrentPiece();

        const newGrid = [...this.grid.map((row) => [...row])];
        this.notify?.({ ...this, grid: newGrid });
    }
}

export const getLinesToClear = (grid: Grid) => {
    return grid.reduce((arr, currentRow, currentIndex) => {
        if (currentRow.every((cell) => cell !== EMPTY_CELL && cell !== CURRENT_CELL)) {
            arr.push(currentIndex);
        }
        return arr;
    }, [] as number[]);
};

export class Piece {
    public x = 0;
    public y = Math.round(WIDTH / 2);
    public rotation = 0;

    constructor(public piece: BasePiece) {
        this.rotation = piece.rotation;
    }

    get name() {
        return this.piece.name;
    }

    clone() {
        const clone = new Piece(this.piece);
        clone.x = this.x;
        clone.y = this.y;
        clone.rotation = this.rotation;

        return clone;
    }

    goLeft(grid: Grid) {
        if (this.y < 0 || !this.isMoveAllowed(grid, this.x, this.y - 1)) return false;
        this.y--;
        return true;
    }
    goRight(grid: Grid) {
        if (this.y >= WIDTH || !this.isMoveAllowed(grid, this.x, this.y + 1)) return false;
        this.y++;
        return true;
    }

    rotate(toAngle: number) {
        const newPiece = getCellsByNameAndRotation(this.piece.name, toAngle);
        this.piece = newPiece;
        this.rotation = toAngle;

        this.snapToGrid();
    }

    rotateClockWise() {
        this.rotate((this.rotation + 90) % 360);
    }

    isMoveAllowed(grid: Grid, x: number, y: number) {
        return this.getCellCoordinates(x, y).every(
            (coord) => !isOutOfBounds(coord.x, coord.y) && grid[coord.x][coord.y] === EMPTY_CELL
        );
    }

    getCellCoordinates(x?: number, y?: number) {
        return this.piece.cells.map((pos) => ({
            x: (x !== undefined ? x : this.x) + pos.x,
            y: (y !== undefined ? y : this.y) + pos.y,
        }));
    }

    snapToGrid() {
        const movement = {
            x: 0,
            y: 0,
        };
        this.getCellCoordinates().forEach((coord) => {
            const { vertical, horizontal } = getDistanceFromBounds(coord.x, coord.y);
            if (Math.abs(movement.x) < Math.abs(vertical)) {
                movement.x = vertical;
            }
            if (Math.abs(movement.y) < Math.abs(horizontal)) {
                movement.y = horizontal;
            }
        });

        this.x += movement.x;
        this.y += movement.y;
    }

    goToBottom(grid: Grid, y?: number) {
        const targetX = this.getMaxX(grid, y);
        const targetY = y !== undefined ? y : this.y;

        this.x = targetX;
        this.y = targetY;
    }

    getMaxX(grid: Grid, y?: number) {
        let maxX = this.x;
        for (let currentX = this.x; currentX >= 0; currentX++) {
            if (
                this.getCellCoordinates(currentX, y !== undefined ? y : this.y).every(
                    (coord) =>
                        coord.x >= 0 && coord.x < HEIGHT && grid[coord.x][coord.y] === EMPTY_CELL
                )
            ) {
                maxX = currentX;
            } else {
                return maxX;
            }
        }
    }
}

const isOutOfBounds = (x: number, y: number) => {
    const distance = getDistanceFromBounds(x, y);

    return distance.horizontal !== 0 || distance.vertical !== 0;
};

const getDistanceFromBounds = (x: number, y: number) => ({
    vertical: x < 0 ? -x : x >= HEIGHT ? x - HEIGHT - 1 : 0,
    horizontal: y < 0 ? -y : y >= WIDTH ? -y + (WIDTH - 1) : 0,
});
