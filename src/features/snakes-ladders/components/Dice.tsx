export type DiceProps = {
    value: number;
    isRolling: boolean;
    onRoll: () => void;
    disabled?: boolean;
};

export function Dice({ value, isRolling, onRoll, disabled }: DiceProps) {
    return (
        <div className="sl-dice">
            <div
                className={`sl-dice-face${isRolling ? " sl-dice-face--rolling" : ""}`}
            >
                {value}
            </div>
            <button
                type="button"
                className="sl-roll-button"
                onClick={onRoll}
                disabled={disabled || isRolling}
            >
                {isRolling ? "Rolling..." : "Roll"}
            </button>
        </div>
    );
}
