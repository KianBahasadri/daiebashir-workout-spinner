import { useCallback, useEffect, useRef, useState } from "react";

export type UseDiceRollOptions = {
    sides?: number;
    rollDurationMs?: number;
    tickMs?: number;
};

export function useDiceRoll(options: UseDiceRollOptions = {}) {
    const { sides = 6, rollDurationMs = 650, tickMs = 70 } = options;

    const [value, setValue] = useState(1);
    const [isRolling, setIsRolling] = useState(false);

    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const roll = useCallback(() => {
        if (isRolling) return Promise.resolve(value);
        setIsRolling(true);

        return new Promise<number>((resolve) => {
            intervalRef.current = window.setInterval(() => {
                setValue(1 + Math.floor(Math.random() * sides));
            }, tickMs);

            timeoutRef.current = window.setTimeout(() => {
                if (intervalRef.current !== null) {
                    window.clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                const final = 1 + Math.floor(Math.random() * sides);
                setValue(final);
                setIsRolling(false);
                resolve(final);
            }, rollDurationMs);
        });
    }, [isRolling, rollDurationMs, sides, tickMs, value]);

    useEffect(() => {
        return () => {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    return { value, isRolling, roll };
}
