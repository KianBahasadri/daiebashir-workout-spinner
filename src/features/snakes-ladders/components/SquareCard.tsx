import { type Exercise } from "../../../shared/types";
import { PlayerToken } from "./PlayerToken";

export type SquareCardProps = {
    square: number;
    isCurrent: boolean;
    exercise: Exercise | undefined;
    ladderTo?: number;
    snakeTo?: number;
};

export function SquareCard({
    square,
    isCurrent,
    exercise,
    ladderTo,
    snakeTo,
}: SquareCardProps) {
    const isFinal = exercise?.isExitCondition;
    const badge =
        ladderTo !== undefined
            ? `L→${ladderTo}`
            : snakeTo !== undefined
              ? `S→${snakeTo}`
              : null;

    return (
        <div
            className={`sl-square${isCurrent ? " sl-square--current" : ""}${isFinal ? " sl-square--final" : ""}`}
            title={[
                `Square ${square}`,
                badge ? `Jump: ${badge}` : null,
                exercise ? `Exercise: ${exercise.name}` : null,
            ]
                .filter(Boolean)
                .join(" • ")}
        >
            <div className="sl-square-top">
                <span className="sl-square-number">{square}</span>
                {badge && <span className="sl-square-badge">{badge}</span>}
            </div>

            <div className="sl-square-bottom">
                {isCurrent && <PlayerToken />}
            </div>
        </div>
    );
}
