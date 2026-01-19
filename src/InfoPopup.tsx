import { MATH_EXPLANATIONS, type ExplanationKey, type MathStats } from './types.tsx'

type InfoPopupProps = {
  explanationKey: ExplanationKey
  activePopup: ExplanationKey | null
  setActivePopup: (key: ExplanationKey | null) => void
  math: MathStats
}

export function InfoPopup({ explanationKey, activePopup, setActivePopup, math }: InfoPopupProps) {
  const isOpen = activePopup === explanationKey
  const explanation = MATH_EXPLANATIONS[explanationKey]

  return (
    <span className="info-popup-container">
      <button
        type="button"
        className={`info-button${isOpen ? ' active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setActivePopup(isOpen ? null : explanationKey)
        }}
        aria-label={`Explain: ${explanation.title}`}
      >
        ?
      </button>
      {isOpen && (
        <div className="info-popup info-popup--with-formula" onClick={(e) => e.stopPropagation()}>
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
                <span className="formula-expr">{explanation.formula(math).general}</span>
              </div>
              <div className="formula-row formula-row--substituted">
                <span className="formula-label">With values:</span>
                <span className="formula-expr">{explanation.formula(math).substituted}</span>
              </div>
              <div className="formula-row formula-row--result">
                <span className="formula-expr formula-expr--result">{explanation.formula(math).result}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  )
}
