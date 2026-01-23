export function RulesTab() {
  return (
    <div className="math-grid">
      <div className="math-card math-card--full">
        <h3>How to Play Workout Roulette</h3>

        <div className="rules-content">
          <div className="rule-section">
            <h4>🎯 Objective</h4>
            <p>Spin the workout wheel to receive random exercises until you land on "<span className="shawarma-text">shawarma</span>" - your delicious exit condition!</p>
          </div>

          <div className="rule-section">
            <h4>🏆 The Double Shawarma Rule</h4>
            <p><strong>Bonus Round:</strong> If <span className="shawarma-text">shawarma</span> appears on your very first spin, you're free to continue spinning as long as you want and still claim your reward.</p>
            <p><strong>Ultimate Victory:</strong> Should you land on <span className="shawarma-text">shawarma</span> initially and then hit <span className="shawarma-text">shawarma</span> again during your bonus round, you've unlocked the legendary Double Shawarma Rule!</p>
            <p><strong>The Double <span className="shawarma-text">Shawarma</span> Prize:</strong> Go all out at the <span className="shawarma-text">shawarma</span> shop! Three <span className="shawarma-text">shawarmas</span>, drinks, fries - whatever your heart desires. You've earned it!</p>
          </div>

          <div className="rule-section">
            <h4>💎 Rarity System</h4>
            <p>Exercises are divided into four rarity tiers with different probabilities:</p>

            <div className="rarity-grid">
              <div className="rarity-item">
                <div className="rarity-header">
                  <span className="rarity-badge" style={{backgroundColor: '#FFFFFF', color: '#000'}}>Common</span>
                  <span className="rarity-prob">50%</span>
                </div>
                <p><strong>Cardio</strong> - Endurance exercises</p>
                <ul>
                  <li>10 mins run (cardio)</li>
                  <li>10 mins row (cardio)</li>
                  <li>10 mins cycle</li>
                </ul>
              </div>

              <div className="rarity-item">
                <div className="rarity-header">
                  <span className="rarity-badge" style={{backgroundColor: '#4A90E2'}}>Rare</span>
                  <span className="rarity-prob">35%</span>
                </div>
                <p><strong>Bodyweight</strong> - Calisthenics & core</p>
                <ul>
                  <li>1 min battle ropes</li>
                  <li>1 min pushups</li>
                  <li>1 min plank</li>
                </ul>
              </div>

              <div className="rarity-item">
                <div className="rarity-header">
                  <span className="rarity-badge" style={{backgroundColor: '#9B59B6'}}>Epic</span>
                  <span className="rarity-prob">10%</span>
                </div>
                <p><strong>Strength</strong> - Weight training</p>
                <ul>
                  <li>10 mins squats</li>
                  <li>10 mins bench press</li>
                  <li>10 mins rows (strength)</li>
                </ul>
              </div>

              <div className="rarity-item">
                <div className="rarity-header">
                  <span className="rarity-badge legendary-tier">Legendary</span>
                  <span className="rarity-prob">4%</span>
                </div>
                <p><strong>Reward</strong> - Exit condition</p>
                <ul>
                  <li><span className="shawarma-text">shawarma</span> (ends workout)</li>
                </ul>
              </div>

              <div className="rarity-item">
                <div className="rarity-header">
                  <span className="rarity-badge godly-tier">Godly</span>
                  <span className="rarity-prob">1%</span>
                </div>
                <p><strong>Ultimate</strong> - Rare exit condition</p>
                <ul>
                  <li><span className="godly-text">Shawarma + Beer</span> (ends workout)</li>
                </ul>
              </div>
            </div>

            <p><em>Each exercise within a tier has equal chance of being selected.</em></p>
          </div>
        </div>
      </div>
    </div>
  )
}