import { useCallback, useMemo, useState } from "react";
import { type Exercise, RARITY_CONFIG } from "../../../shared/types";
import { type BoardConfig, buildJumpMap } from "../config/boardConfig";

export type TurnResult = {
    turn: number;
    roll: number;
    from: number;
    to: number;
    appliedJump?: { type: "snake" | "ladder"; from: number; to: number };
    exercise: Exercise;
};

const pickNonExitExercise = (exercises: Exercise[]) => {
    const nonExit = exercises.filter((e) => !e.isExitCondition);
    if (nonExit.length === 0) {
        // Fallback: just return any exercise.
        return exercises[
            Math.floor(Math.random() * Math.max(1, exercises.length))
        ];
    }

    const byRarity = nonExit.reduce(
        (acc, ex) => {
            (acc[ex.rarity] ??= []).push(ex);
            return acc;
        },
        {} as Record<string, Exercise[]>,
    );

    const eligibleRarities = (
        Object.keys(RARITY_CONFIG) as Array<keyof typeof RARITY_CONFIG>
    ).filter(
        (r) =>
            (byRarity[r]?.length ?? 0) > 0 &&
            r !== "legendary" &&
            r !== "godly",
    );

    if (eligibleRarities.length === 0) {
        return nonExit[Math.floor(Math.random() * nonExit.length)];
    }

    // Normalize rarity probabilities across eligible non-exit tiers.
    const totalP = eligibleRarities.reduce(
        (sum, r) => sum + RARITY_CONFIG[r].probability,
        0,
    );
    const roll = Math.random() * (totalP > 0 ? totalP : 1);
    let cumulative = 0;
    for (const r of eligibleRarities) {
        cumulative +=
            totalP > 0
                ? RARITY_CONFIG[r].probability
                : 1 / eligibleRarities.length;
        if (roll < cumulative) {
            const pool = byRarity[r]!;
            return pool[Math.floor(Math.random() * pool.length)];
        }
    }

    const last = eligibleRarities[eligibleRarities.length - 1];
    const pool = byRarity[last]!;
    return pool[Math.floor(Math.random() * pool.length)];
};

const buildSquareExercises = (config: BoardConfig, exercises: Exercise[]) => {
    const finalSquare = config.finalSquare;
    const squareExercises = new Map<number, Exercise>();

    const shawarma =
        exercises.find((e) => e.rarity === "legendary") ??
        exercises.find((e) => e.isExitCondition) ??
        exercises[0];

    for (let pos = 1; pos <= finalSquare; pos += 1) {
        if (pos === finalSquare) {
            squareExercises.set(pos, shawarma);
        } else {
            squareExercises.set(pos, pickNonExitExercise(exercises));
        }
    }

    return squareExercises;
};

export function useBoardState({
    config,
    exercises,
}: {
    config: BoardConfig;
    exercises: Exercise[];
}) {
    const snakesMap = useMemo(
        () => buildJumpMap(config.snakes),
        [config.snakes],
    );
    const laddersMap = useMemo(
        () => buildJumpMap(config.ladders),
        [config.ladders],
    );

    const [boardSeed, setBoardSeed] = useState(0);
    const squareExercises = useMemo(
        () => buildSquareExercises(config, exercises),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [boardSeed, config.finalSquare],
    );

    const [position, setPosition] = useState(1);
    const [turns, setTurns] = useState(0);
    const [history, setHistory] = useState<TurnResult[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const reset = useCallback(() => {
        setPosition(1);
        setTurns(0);
        setHistory([]);
        setIsComplete(false);
    }, []);

    const newBoard = useCallback(() => {
        setBoardSeed((s) => s + 1);
        reset();
    }, [reset]);

    const applyRoll = useCallback(
        (roll: number) => {
            if (isComplete) return;

            const from = position;
            const stepped = Math.min(config.finalSquare, from + roll);

            let to = stepped;
            let appliedJump: TurnResult["appliedJump"] | undefined;

            const ladderTo = laddersMap.get(to);
            if (ladderTo !== undefined) {
                appliedJump = { type: "ladder", from: to, to: ladderTo };
                to = ladderTo;
            } else {
                const snakeTo = snakesMap.get(to);
                if (snakeTo !== undefined) {
                    appliedJump = { type: "snake", from: to, to: snakeTo };
                    to = snakeTo;
                }
            }

            const exercise = squareExercises.get(to) ?? squareExercises.get(1)!;
            const nextTurn = turns + 1;

            setTurns(nextTurn);
            setPosition(to);
            setHistory((prev) => [
                ...prev,
                { turn: nextTurn, roll, from, to, appliedJump, exercise },
            ]);

            if (to >= config.finalSquare) {
                setIsComplete(true);
            }
        },
        [
            config.finalSquare,
            isComplete,
            laddersMap,
            position,
            snakesMap,
            squareExercises,
            turns,
        ],
    );

    const currentExercise =
        history.length > 0 ? history[history.length - 1].exercise : null;

    return {
        snakesMap,
        laddersMap,
        squareExercises,
        position,
        turns,
        history,
        isComplete,
        currentExercise,
        applyRoll,
        reset,
        newBoard,
    };
}
