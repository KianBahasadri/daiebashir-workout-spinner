import { type Exercise } from "../../../shared/types";
import { SquareCard } from "./SquareCard";

export type BoardProps = {
    boardSize: number;
    position: number;
    snakesMap: Map<number, number>;
    laddersMap: Map<number, number>;
    squareExercises: Map<number, Exercise>;
};

export function Board({
    boardSize,
    position,
    snakesMap,
    laddersMap,
    squareExercises,
}: BoardProps) {
    const rows: number[] = [];
    for (
        let rowFromBottom = boardSize - 1;
        rowFromBottom >= 0;
        rowFromBottom -= 1
    ) {
        rows.push(rowFromBottom);
    }

    return (
        <div
            className="sl-board"
            style={{
                gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
            }}
            role="grid"
            aria-label="Snakes and ladders board"
        >
            {rows.flatMap((rowFromBottom) => {
                const base = rowFromBottom * boardSize;
                const leftToRight = rowFromBottom % 2 === 0;
                const cols = Array.from({ length: boardSize }, (_, c) => c);

                return cols.map((col) => {
                    const square = leftToRight
                        ? base + col + 1
                        : base + (boardSize - col);
                    const exercise = squareExercises.get(square);
                    return (
                        <SquareCard
                            key={square}
                            square={square}
                            isCurrent={square === position}
                            exercise={exercise}
                            ladderTo={laddersMap.get(square)}
                            snakeTo={snakesMap.get(square)}
                        />
                    );
                });
            })}
        </div>
    );
}
