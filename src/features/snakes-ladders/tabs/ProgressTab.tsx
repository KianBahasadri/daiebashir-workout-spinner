import { type TurnResult } from "../hooks/useBoardState";

export function ProgressTab({ history }: { history: TurnResult[] }) {
    return (
        <div className="math-grid">
            <div className="math-card math-card--full">
                <h3>Turn history</h3>
                {history.length === 0 ? (
                    <p className="math-subtitle">Roll the dice to start.</p>
                ) : (
                    <div className="math-mini-table">
                        {history
                            .slice()
                            .reverse()
                            .slice(0, 12)
                            .map((t) => (
                                <div key={t.turn}>
                                    <span className="math-mono">
                                        Turn {t.turn}
                                    </span>
                                    : rolled {t.roll} • {t.from} → {t.to}
                                    {t.appliedJump ? (
                                        <span className="math-duration">
                                            {" "}
                                            • {t.appliedJump.type}{" "}
                                            {t.appliedJump.from}→
                                            {t.appliedJump.to}
                                        </span>
                                    ) : null}
                                    <span className="math-duration">
                                        {" "}
                                        • {t.exercise.name}
                                    </span>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
