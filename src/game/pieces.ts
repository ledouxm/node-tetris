export interface BasePiece {
    name: string;
    cells: Array<{ x: number; y: number }>;
}

export const basePieces: BasePiece[] = [
    {
        name: "I",
        cells: [
            { x: 0, y: -1 },
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
        ],
    },
    {
        name: "J",
        cells: [
            { x: 0, y: -1 },
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ],
    },
    {
        name: "L",
        cells: [
            { x: 0, y: -1 },
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 1 },
        ],
    },
    {
        name: "Z",
        cells: [
            { x: 0, y: -1 },
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
        ],
    },
    {
        name: "S",
        cells: [
            { x: 0, y: 1 },
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: -1 },
        ],
    },
    {
        name: "O",
        cells: [
            { x: 0, y: 1 },
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
        ],
    },
    {
        name: "T",
        cells: [
            { x: 0, y: 1 },
            { x: 0, y: 0 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
        ],
    },
];
