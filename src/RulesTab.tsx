import React from 'react'

export function RulesTab() {
  return (
    <div className="math-grid">
      <div className="math-card math-card--full">
        <h3>How to Play Workout Roulette</h3>

        <div className="rules-content">
          <div className="rule-section">
            <h4>🎯 Objective</h4>
            <p>Spin the workout wheel to receive random exercises until you land on "<span className="shawarma-text">shawarma</span>" - your delicious exit condition!</p>
            <p>If you land on <span className="shawarma-text">shawarma</span>, you must honour the spinner and eat <span className="shawarma-text">shawarma</span>. This is a sacred obligation.</p>
          <p>Spins are completely independent of each other.</p>
          </div>

          <div className="rule-section">
            <h4>🏆 The Double <span className="shawarma-text">Shawarma</span> Rule</h4>
            <p><strong>Bonus Round:</strong> If <span className="shawarma-text">shawarma</span> appears on your very first spin, you're free to continue spinning as long as you want and still claim your reward.</p>
            <p><strong>Ultimate Victory:</strong> Should you land on <span className="shawarma-text">shawarma</span> initially and then hit <span className="shawarma-text">shawarma</span> again during your bonus round, you've unlocked the legendary Double <span className="shawarma-text">Shawarma</span> Rule! Three <span className="shawarma-text">shawarmas</span>, drinks, fries - whatever your heart desires. You've earned it!</p>
          </div>

          <div className="rule-section">
            <h4>⚖️ How Weighting Works</h4>
            <p>The wheel isn't perfectly balanced; it uses a <strong>Weighted Rarity System</strong> to determine what you'll do next:</p>
            <ul>
              <li><strong>Tiers:</strong> Exercises are grouped into five tiers: Common, Rare, Epic, Legendary, and Godly.</li>
              <li><strong>Fixed Probabilities:</strong> Each tier has a fixed chance of being selected (e.g., Common is 50%, Godly is 1%).</li>
              <li><strong>Internal Selection:</strong> Once a tier is selected, the game picks one exercise from that tier with equal probability.</li>
              <li><strong>Exit Strategy:</strong> Legendary and Godly tiers contain "Exit Conditions" that end your workout session.</li>
            </ul>
            <p>Check the <strong>Exercises</strong> tab for the specific math and probabilities for each exercise!</p>
          </div>
        </div>
      </div>
    </div>
  )
}