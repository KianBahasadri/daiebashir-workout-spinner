import { type BoardConfig, buildJumpMap } from "./config/boardConfig";

export type ExpectedRollsResult = {
    expectedRollsBySquare: number[];
    iterations: number;
    converged: boolean;
};

const buildTransitions = (config: BoardConfig) => {
    const snakesMap = buildJumpMap(config.snakes);
    const laddersMap = buildJumpMap(config.ladders);

    const applyJumps = (square: number) => {
        const ladderTo = laddersMap.get(square);
        if (ladderTo !== undefined) return ladderTo;
        const snakeTo = snakesMap.get(square);
        if (snakeTo !== undefined) return snakeTo;
        return square;
    };

    // transitions[square][die] = nextSquare
    const transitions: number[][] = Array.from(
        { length: config.finalSquare + 1 },
        () => Array.from({ length: config.diceSides + 1 }, () => 0),
    );

    for (let square = 1; square <= config.finalSquare; square += 1) {
        for (let die = 1; die <= config.diceSides; die += 1) {
            const stepped = Math.min(config.finalSquare, square + die);
            transitions[square][die] = applyJumps(stepped);
        }
    }

    // Absorbing
    for (let die = 1; die <= config.diceSides; die += 1) {
        transitions[config.finalSquare][die] = config.finalSquare;
    }

    return transitions;
};

export function computeExpectedRolls(
    config: BoardConfig,
    options: { maxIterations?: number; tolerance?: number } = {},
): ExpectedRollsResult {
    const { maxIterations = 20000, tolerance = 1e-10 } = options;
    const transitions = buildTransitions(config);

    // E[square] = expected number of rolls to reach finalSquare from this square.
    const E = Array.from({ length: config.finalSquare + 1 }, () => 0);
    E[config.finalSquare] = 0;

    let converged = false;
    let iterations = 0;

    for (let iter = 0; iter < maxIterations; iter += 1) {
        iterations = iter + 1;
        let maxDelta = 0;

        // Gauss-Seidel update (in-place)
        for (let square = config.finalSquare - 1; square >= 1; square -= 1) {
            let sum = 0;
            for (let die = 1; die <= config.diceSides; die += 1) {
                sum += E[transitions[square][die]];
            }
            const next = 1 + sum / config.diceSides;
            const delta = Math.abs(next - E[square]);
            if (delta > maxDelta) maxDelta = delta;
            E[square] = next;
        }

        if (maxDelta < tolerance) {
            converged = true;
            break;
        }
    }

    return { expectedRollsBySquare: E, iterations, converged };
}

export function computeExpectedRollsNoJumps(config: BoardConfig) {
    // Exact DP because transitions only move forward (with overshoot to final).
    const E = Array.from({ length: config.finalSquare + 1 }, () => 0);
    E[config.finalSquare] = 0;

    for (let square = config.finalSquare - 1; square >= 1; square -= 1) {
        let sum = 0;
        for (let die = 1; die <= config.diceSides; die += 1) {
            const stepped = Math.min(config.finalSquare, square + die);
            sum += E[stepped];
        }
        E[square] = 1 + sum / config.diceSides;
    }

    return E;
}
