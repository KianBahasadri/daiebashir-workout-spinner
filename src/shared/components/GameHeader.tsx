import { Link } from "react-router-dom";

export interface GameHeaderProps {
    title: string;
    switchTo: string;
    switchLabel: string;
}

export function GameHeader({ title, switchTo, switchLabel }: GameHeaderProps) {
    return (
        <header className="game-header">
            <div className="game-header-row">
                <h1 className="game-header-title">{title}</h1>
                <Link
                    className="mode-switch-button"
                    to={switchTo}
                    aria-label={`Switch to ${switchLabel}`}
                >
                    {switchLabel}
                </Link>
            </div>
        </header>
    );
}
