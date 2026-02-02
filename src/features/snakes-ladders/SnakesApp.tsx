import { useMemo, useState } from "react";
import { GameHeader } from "../../shared/components/GameHeader";
import { EXERCISES } from "../../shared/config";
import { type Exercise } from "../../shared/types";
import { BOARD_CONFIG } from "./config/boardConfig";
import { useBoardState } from "./hooks/useBoardState";
import { useDiceRoll } from "./hooks/useDiceRoll";
import { Board } from "./components/Board";
import { Dice } from "./components/Dice";
import "./styles/board.css";
import { BoardStatsTab } from "./tabs/BoardStatsTab";
import { ProgressTab } from "./tabs/ProgressTab";
import {
    computeExpectedRolls,
    computeExpectedRollsNoJumps,
} from "./snakesMath";

export function SnakesApp() {
    const exercises = useMemo<Exercise[]>(() => EXERCISES, []);
    const [activeTab, setActiveTab] = useState<"progress" | "stats">(
        "progress",
    );

    const {
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
    } = useBoardState({ config: BOARD_CONFIG, exercises });

    const {
        value: dieValue,
        isRolling,
        roll,
    } = useDiceRoll({
        sides: BOARD_CONFIG.diceSides,
    });

    const onRoll = async () => {
        const rolled = await roll();
        applyRoll(rolled);
    };

    const progressPct = Math.round((position / BOARD_CONFIG.finalSquare) * 100);

    const baselineExpected = useMemo(
        () => computeExpectedRollsNoJumps(BOARD_CONFIG),
        [],
    );
    const expected = useMemo(() => computeExpectedRolls(BOARD_CONFIG), []);

    return (
        <div className="app">
            <GameHeader
                title="Shawarma Snakes & Ladders"
                switchTo="/spinner"
                switchLabel="Spinner"
            />

            <div className="sl-layout">
                <div className="sl-controls">
                    <div className="sl-status">
                        <div>
                            <strong>Position:</strong> {position} /{" "}
                            {BOARD_CONFIG.finalSquare} ({progressPct}%)
                        </div>
                        <div>
                            <strong>Turns:</strong> {turns}
                            {isComplete ? " • Finished" : ""}
                        </div>
                    </div>

                    <div className="sl-actions">
                        <Dice
                            value={dieValue}
                            isRolling={isRolling}
                            onRoll={onRoll}
                            disabled={isComplete}
                        />
                        <button
                            type="button"
                            className="sl-action-button"
                            onClick={reset}
                            disabled={isRolling}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            className="sl-action-button"
                            onClick={newBoard}
                            disabled={isRolling}
                        >
                            New board
                        </button>
                    </div>
                </div>

                <Board
                    boardSize={BOARD_CONFIG.boardSize}
                    position={position}
                    snakesMap={snakesMap}
                    laddersMap={laddersMap}
                    squareExercises={squareExercises}
                />
            </div>

            {currentExercise && (
                <section
                    className="sl-current-exercise"
                    aria-label="Current exercise"
                >
                    <p className="sl-current-exercise-title">
                        {isComplete ? "Reward:" : "Do this now:"}
                    </p>
                    <p className="sl-current-exercise-name">
                        {currentExercise.name}
                    </p>
                    <p className="sl-current-exercise-meta">
                        Duration: {currentExercise.duration} min
                    </p>
                </section>
            )}

            <section className="math" aria-label="Snakes & ladders tabs">
                <div className="math-tabs">
                    <button
                        className={`math-tab${activeTab === "progress" ? " active" : ""}`}
                        type="button"
                        onClick={() => setActiveTab("progress")}
                    >
                        Progress
                    </button>
                    <button
                        className={`math-tab${activeTab === "stats" ? " active" : ""}`}
                        type="button"
                        onClick={() => setActiveTab("stats")}
                    >
                        Stats
                    </button>
                </div>

                {activeTab === "progress" && <ProgressTab history={history} />}

                {activeTab === "stats" && (
                    <BoardStatsTab
                        config={BOARD_CONFIG}
                        position={position}
                        expectedFromStart={
                            expected.expectedRollsBySquare[1] ?? 0
                        }
                        expectedFromHere={
                            expected.expectedRollsBySquare[position] ?? 0
                        }
                        baselineFromStart={baselineExpected[1] ?? 0}
                        converged={expected.converged}
                        iterations={expected.iterations}
                    />
                )}
            </section>
        </div>
    );
}
