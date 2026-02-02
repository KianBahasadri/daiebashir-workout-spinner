import type { ReactNode } from "react";
import "../styles/info-popup.css";
import "../styles/math-notation.css";

export type InfoPopupFormula = {
    general: ReactNode;
    substituted: ReactNode;
    result: ReactNode;
};

export type InfoPopupExplanation<TMath> = {
    title: string;
    content: string;
    formula?: (math: TMath) => InfoPopupFormula;
};

export type InfoPopupProps<K extends string, TMath> = {
    explanationKey: K;
    activePopup: K | null;
    setActivePopup: (key: K | null) => void;
    math: TMath;
    explanations: Record<K, InfoPopupExplanation<TMath>>;
};

export function InfoPopup<K extends string, TMath>({
    explanationKey,
    activePopup,
    setActivePopup,
    math,
    explanations,
}: InfoPopupProps<K, TMath>) {
    const isOpen = activePopup === explanationKey;
    const explanation = explanations[explanationKey];

    return (
        <span className="info-popup-container">
            <button
                type="button"
                className={`info-button${isOpen ? " active" : ""}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setActivePopup(isOpen ? null : explanationKey);
                }}
                aria-label={`Explain: ${explanation.title}`}
            >
                ?
            </button>
            {isOpen && (
                <div
                    className="info-popup info-popup--with-formula"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="info-popup-header">
                        <strong>{explanation.title}</strong>
                        <button
                            type="button"
                            className="info-popup-close"
                            onClick={() => setActivePopup(null)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    <p>{explanation.content}</p>

                    {explanation.formula && (
                        <div className="formula-section">
                            <div className="formula-row formula-row--general">
                                <span className="formula-label">Formula:</span>
                                <span className="formula-expr">
                                    {explanation.formula(math).general}
                                </span>
                            </div>
                            <div className="formula-row formula-row--substituted">
                                <span className="formula-label">
                                    With values:
                                </span>
                                <span className="formula-expr">
                                    {explanation.formula(math).substituted}
                                </span>
                            </div>
                            <div className="formula-row formula-row--result">
                                <span className="formula-expr formula-expr--result">
                                    {explanation.formula(math).result}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </span>
    );
}
