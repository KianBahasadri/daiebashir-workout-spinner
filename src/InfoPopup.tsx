import { MATH_EXPLANATIONS, type ExplanationKey } from './types'

type InfoPopupProps = {
  explanationKey: ExplanationKey
  activePopup: ExplanationKey | null
  setActivePopup: (key: ExplanationKey | null) => void
}

export function InfoPopup({ explanationKey, activePopup, setActivePopup }: InfoPopupProps) {
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
        <div className="info-popup" onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}
    </span>
  )
}
