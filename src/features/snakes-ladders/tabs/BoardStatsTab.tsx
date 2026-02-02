import { type BoardConfig } from "../config/boardConfig";

export type BoardStatsTabProps = {
    config: BoardConfig;
    position: number;
    expectedFromStart: number;
    expectedFromHere: number;
    baselineFromStart: number;
    converged: boolean;
    iterations: number;
};

export function BoardStatsTab({
    config,
    position,
    expectedFromStart,
    expectedFromHere,
    baselineFromStart,
    converged,
    iterations,
}: BoardStatsTabProps) {
    const delta = expectedFromStart - baselineFromStart;

    return (
        <div className="math-grid">
            <div className="math-card math-card--full">
                <h3>Expected rolls to finish</h3>
                <p className="math-subtitle">
                    Computed from the board’s dice transitions (overshoots clamp
                    to the final square). This is an exact expectation computed
                    via iterative solving.
                </p>

                <dl className="math-kpis">
                    <div className="math-kpi">
                        <dt>Expected rolls (from start)</dt>
                        <dd>{expectedFromStart.toFixed(2)}</dd>
                    </div>
                    <div className="math-kpi">
                        <dt>
                            Expected rolls (from your current square: {position}
                            )
                        </dt>
                        <dd>{expectedFromHere.toFixed(2)}</dd>
                    </div>
                    <div className="math-kpi">
                        <dt>Baseline (no snakes/ladders)</dt>
                        <dd>{baselineFromStart.toFixed(2)}</dd>
                    </div>
                    <div className="math-kpi">
                        <dt>Snake/ladder impact (vs baseline)</dt>
                        <dd>
                            {delta >= 0 ? "+" : ""}
                            {delta.toFixed(2)} rolls
                        </dd>
                    </div>
                </dl>

                <div
                    className="math-mini-table"
                    aria-label="Board configuration"
                >
                    <div>
                        <span className="math-mono">Board</span>:{" "}
                        {config.boardSize}×{config.boardSize}
                    </div>
                    <div>
                        <span className="math-mono">Snakes</span>:{" "}
                        {config.snakes.length}
                    </div>
                    <div>
                        <span className="math-mono">Ladders</span>:{" "}
                        {config.ladders.length}
                    </div>
                    <div>
                        <span className="math-mono">Solver</span>:{" "}
                        {converged ? "converged" : "not converged"} in{" "}
                        {iterations} iters
                    </div>
                </div>
            </div>
        </div>
    );
}
