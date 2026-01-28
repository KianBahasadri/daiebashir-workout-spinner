import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { calculateMathStats, pickExerciseIndex } from "../workoutMath";
import { type Exercise, type MathStats } from "../types";
import {
    CARD_GAP,
    CARD_WIDTH,
    CENTER_REPEAT,
    MAX_LOOPS,
    MAX_UNLOCKED_TABS,
    MIN_LOOPS,
    SPIN_DURATION_MS,
    TRACK_REPEATS,
    WHEEL_SLOTS,
} from "../config";
import { usePersistentState } from "./usePersistentState";

type TrackItem = {
    name: string;
    color: string;
    key: string;
    rarity: string;
};

const measureReelMetrics = (
    reelEl: HTMLDivElement | null,
    trackEl: HTMLDivElement | null,
) => {
    const measuredReelWidth = reelEl?.getBoundingClientRect().width ?? 0;
    let measuredCardWidth = CARD_WIDTH;
    let measuredStride = CARD_WIDTH + CARD_GAP;

    if (!trackEl)
        return {
            reelWidth: measuredReelWidth,
            cardWidth: measuredCardWidth,
            stride: measuredStride,
        };

    const firstItem = trackEl.querySelector<HTMLElement>(".reel-item");
    const secondItem = firstItem?.nextElementSibling as HTMLElement | null;

    if (firstItem)
        measuredCardWidth =
            firstItem.getBoundingClientRect().width || CARD_WIDTH;

    if (firstItem && secondItem) {
        const firstRect = firstItem.getBoundingClientRect();
        const secondRect = secondItem.getBoundingClientRect();
        const s = secondRect.left - firstRect.left;
        if (s > 0) measuredStride = s;
    }

    return {
        reelWidth: measuredReelWidth,
        cardWidth: measuredCardWidth,
        stride: measuredStride,
    };
};

const getOffsetForIndex = (
    index: number,
    reelWidth: number,
    cardWidth: number,
    stride: number,
) => {
    const pointerX = reelWidth / 2;
    const itemCenter = index * stride + cardWidth / 2;
    return Math.round(pointerX - itemCenter);
};

const getNearestIndexForOffset = (
    offset: number,
    reelWidth: number,
    cardWidth: number,
    stride: number,
) => {
    const pointerX = reelWidth / 2;
    const rawIndex = (pointerX - offset - cardWidth / 2) / stride;
    return Math.round(rawIndex);
};

export type UseGameStateArgs = {
    exercises: Exercise[];
    wheelSlots: Exercise[];
    initAudioContext: () => void;
};

export type UseGameStateResult = {
    // persistence-backed progress
    unlockedTabsCount: number;

    // game/spin state
    isSpinning: boolean;
    selectedExercise: string | null;
    selectedIndex: number | null;

    // wheel state
    reelRef: RefObject<HTMLDivElement | null>;
    trackRef: RefObject<HTMLDivElement | null>;
    offset: number;
    reelWidth: number;
    cardWidth: number;
    stride: number;
    trackItems: TrackItem[];

    // derived stats
    math: MathStats;

    // actions
    spin: () => void;
};

export function useGameState({
    exercises,
    wheelSlots,
    initAudioContext,
}: UseGameStateArgs) {
    const [unlockedTabsCount, setUnlockedTabsCount] =
        usePersistentState<number>("unlockedTabsCount", 0);

    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<string | null>(
        null,
    );
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Wheel rendering + positioning state (kept in the hook so App stays mostly presentational)
    const [currentIndex, setCurrentIndex] = useState(() => {
        const slotCount = wheelSlots.length;
        if (slotCount === 0) return CENTER_REPEAT * WHEEL_SLOTS;

        const targetIndices: number[] = [];
        for (let i = 0; i < slotCount; i++) {
            if (wheelSlots[i].isExitCondition) {
                targetIndices.push(i);
            }
        }

        const chosenSlotIndex =
            targetIndices.length > 0
                ? targetIndices[
                      Math.floor(Math.random() * targetIndices.length)
                  ]
                : 0;

        return CENTER_REPEAT * slotCount + chosenSlotIndex;
    });
    const [offset, setOffset] = useState(0);
    const [reelWidth, setReelWidth] = useState(0);
    const [cardWidth, setCardWidth] = useState(CARD_WIDTH);
    const [stride, setStride] = useState(CARD_WIDTH + CARD_GAP);
    const reelRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);

    const trackItems = useMemo(() => {
        const items: TrackItem[] = [];
        for (let repeat = 0; repeat < TRACK_REPEATS; repeat += 1) {
            for (let i = 0; i < wheelSlots.length; i += 1) {
                const exercise = wheelSlots[i];
                items.push({
                    name: exercise.name,
                    color: exercise.color,
                    rarity: exercise.rarity,
                    key: `${repeat}-${i}-${exercise.name}`,
                });
            }
        }
        return items;
    }, [wheelSlots]);

    useEffect(() => {
        const measure = () => {
            const metrics = measureReelMetrics(
                reelRef.current,
                trackRef.current,
            );
            setReelWidth(metrics.reelWidth);
            setCardWidth(metrics.cardWidth);
            setStride(metrics.stride);
        };

        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    useEffect(() => {
        if (isSpinning) return;
        if (!reelWidth) return;
        setOffset(
            getOffsetForIndex(currentIndex, reelWidth, cardWidth, stride),
        );
    }, [cardWidth, currentIndex, isSpinning, reelWidth, stride]);

    const math = useMemo(() => calculateMathStats(exercises), [exercises]);

    const timeoutRef = useRef<number | null>(null);
    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    const spin = () => {
        if (
            isSpinning ||
            !reelWidth ||
            exercises.length === 0 ||
            wheelSlots.length === 0
        )
            return;

        // Initialize audio context within the user gesture so tick sounds can play during the animation.
        initAudioContext();

        setIsSpinning(true);
        setSelectedExercise(null);
        setSelectedIndex(null);

        const loops =
            MIN_LOOPS + Math.floor(Math.random() * (MAX_LOOPS - MIN_LOOPS + 1));
        const exerciseIndex = pickExerciseIndex(exercises);
        const pickedName = exercises[exerciseIndex]?.name;

        const candidateSlots: number[] = [];
        for (let i = 0; i < wheelSlots.length; i += 1) {
            if (wheelSlots[i].name === pickedName) candidateSlots.push(i);
        }

        const slotIndex =
            candidateSlots.length > 0
                ? candidateSlots[
                      Math.floor(Math.random() * candidateSlots.length)
                  ]
                : Math.floor(Math.random() * wheelSlots.length);

        // Calculate distance to target to ensure we land exactly on the slot
        const baseSteps = loops * exercises.length;
        const baseIndex = currentIndex + baseSteps;
        const baseRelativeIndex = baseIndex % wheelSlots.length;
        const alignSteps =
            (slotIndex - baseRelativeIndex + wheelSlots.length) %
            wheelSlots.length;

        const targetIndex = baseIndex + alignSteps;
        const targetOffset = getOffsetForIndex(
            targetIndex,
            reelWidth,
            cardWidth,
            stride,
        );

        setOffset(targetOffset);

        timeoutRef.current = window.setTimeout(() => {
            // Snap to the nearest card center (prevents ever landing in the gap,
            // even if sizes changed during the spin).
            const metrics = measureReelMetrics(
                reelRef.current,
                trackRef.current,
            );
            const latestReelWidth = metrics.reelWidth || reelWidth;
            const latestCardWidth = metrics.cardWidth || cardWidth;
            const latestStride = metrics.stride || stride;

            // Keep state in sync with the DOM in case the user resized mid-spin.
            setReelWidth(latestReelWidth);
            setCardWidth(latestCardWidth);
            setStride(latestStride);

            const latestIndex = getNearestIndexForOffset(
                targetOffset,
                latestReelWidth,
                latestCardWidth,
                latestStride,
            );
            const maxIndex = TRACK_REPEATS * wheelSlots.length - 1;
            const snappedIndex = Math.max(0, Math.min(latestIndex, maxIndex));
            const slotCount = wheelSlots.length;
            if (slotCount === 0) {
                setIsSpinning(false);
                return;
            }

            // Re-center to keep the track short (prevents index drift over many spins).
            const snappedSlotIndex = snappedIndex % slotCount;
            const normalizedIndex =
                CENTER_REPEAT * slotCount + snappedSlotIndex;
            const normalizedOffset = getOffsetForIndex(
                normalizedIndex,
                latestReelWidth,
                latestCardWidth,
                latestStride,
            );

            setOffset(normalizedOffset);
            setSelectedExercise(wheelSlots[snappedSlotIndex].name);
            setCurrentIndex(normalizedIndex);
            setSelectedIndex(normalizedIndex);
            setUnlockedTabsCount((prev) =>
                Math.min(prev + 1, MAX_UNLOCKED_TABS),
            );
            setIsSpinning(false);
        }, SPIN_DURATION_MS);
    };

    return {
        unlockedTabsCount,
        isSpinning,
        selectedExercise,
        selectedIndex,
        reelRef,
        trackRef,
        offset,
        reelWidth,
        cardWidth,
        stride,
        trackItems,
        math,
        spin,
    } satisfies UseGameStateResult;
}
