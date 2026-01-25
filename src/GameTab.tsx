export function GameTab() {
  return (
    <div className="math-grid">
      <div className="math-card math-card--full">
        <div className="rules-content simple-rules">
          <div className="rule-step">
            <span className="step-number">1.</span>
            <span className="step-text">SPIN THE WHEEL</span>
          </div>
          <div className="rule-step">
            <span className="step-number">2.</span>
            <span className="step-text">DO THE EXERCISE</span>
          </div>
          <div className="rule-step">
            <span className="step-number">3.</span>
            <span className="step-text">REPEAT UNTIL <span className="shawarma-text">SHAWARMA</span></span>
          </div>
          <p className="simple-rules-note">
            EAT THE SHAWARMA. NO EXCUSES.
          </p>
        </div>
      </div>
    </div>
  )
}