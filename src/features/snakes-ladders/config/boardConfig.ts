export type SnakeOrLadder = {
    from: number;
    to: number;
};

export type BoardConfig = {
    boardSize: number;
    finalSquare: number;
    snakes: SnakeOrLadder[];
    ladders: SnakeOrLadder[];
    diceSides: number;
};

export const BOARD_CONFIG: BoardConfig = {
    boardSize: 10,
    finalSquare: 100,
    diceSides: 6,
    // A classic-ish 10x10 board layout. Keep these disjoint and away from 1/100.
    snakes: [
        { from: 99, to: 78 },
        { from: 95, to: 75 },
        { from: 87, to: 24 },
        { from: 64, to: 60 },
        { from: 62, to: 19 },
        { from: 56, to: 53 },
        { from: 49, to: 11 },
        { from: 16, to: 6 },
    ],
    ladders: [
        { from: 2, to: 38 },
        { from: 4, to: 14 },
        { from: 9, to: 31 },
        { from: 21, to: 42 },
        { from: 28, to: 84 },
        { from: 36, to: 44 },
        { from: 51, to: 67 },
        { from: 71, to: 91 },
        { from: 80, to: 100 },
    ],
};

export const buildJumpMap = (jumps: SnakeOrLadder[]) => {
    const map = new Map<number, number>();
    for (const { from, to } of jumps) map.set(from, to);
    return map;
};
