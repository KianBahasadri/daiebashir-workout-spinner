import { useEffect, useState } from 'react'

const STARS_ENABLED_STORAGE_KEY = 'starsEnabled'

export function RulesTab() {
  const [starsEnabled, setStarsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STARS_ENABLED_STORAGE_KEY)
      if (saved === null) return false
      return saved === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STARS_ENABLED_STORAGE_KEY, starsEnabled ? 'true' : 'false')
    } catch {
      // ignore storage errors (e.g., disabled storage)
    }
  }, [starsEnabled])

  return (
    <div className="math-grid">
      <div className="math-card math-card--full">
        <h3>Rules & Mechanics</h3>

        <div className="rules-content">
          <div className="rule-section">
            <h4>
              🏆 The Double <span className="shawarma-text">Shawarma</span> Rule
            </h4>
            <p>
              First-spin exception: If <span className="shawarma-text">shawarma</span> appears on
              your first spin, this is the only time you may choose not to take it. You may keep spinning and “bank”
              the <span className="shawarma-text">shawarma</span> for later.
            </p>
            <p>
              Ultimate victory: If you used the exception and then hit{' '}
              <span className="shawarma-text">shawarma</span> a second time in the same workout, you’ve earned the
              true ending: two shawarmas, two drinks, and a side.
            </p>
          </div>

          <div className="rule-section">
            <h4>🧱 The Commitment Condition</h4>
            <p>
              Before you spin, commit to doing whatever exercise it lands on. If you don’t think you can attempt it
              today, don’t spin.
            </p>
            <p>If you start and have to stop halfway, that’s okay—but you may not spin again that day.</p>
          </div>

          <div className="rule-section">
            <h4>⏱️ Timer Rule</h4>
            <p>Machine adjustments, rest breaks, and setup time are part of the duration—no need to pause the timer.</p>
            <p>For set-based exercises, you choose the sets, reps, and rest.</p>
          </div>

          <div className="rule-section">
            <h4>⚖️ How Weighting Works</h4>
            <p>
              The wheel isn't perfectly balanced; it uses a Weighted Rarity System to determine what
              you'll do next:
            </p>
            <ul>
              <li>
                Tiers: Exercises are grouped into five tiers:{' '}
                <span className="rarity-common">Common</span>, <span className="rarity-rare">Rare</span>,{' '}
                <span className="rarity-epic">Epic</span>, <span className="rarity-legendary">Legendary</span>, and{' '}
                <span className="rarity-godly">Godly</span>.
              </li>
              <li>
                Fixed Probabilities: Each tier has a fixed chance of being selected (e.g.,{' '}
                <span className="rarity-common">Common</span> is 50%,{' '}
                <span className="rarity-godly">Godly</span> is 1%).
              </li>
              <li>
                Internal Selection: Once a tier is selected, the game picks one exercise from that tier with
                equal probability.
              </li>
              <li>
                Exit Conditions: <span className="rarity-legendary">Legendary</span> and{' '}
                <span className="rarity-godly">Godly</span> tiers contain “exit conditions” that end your workout.
              </li>
            </ul>
            <p>
              Check the Exercises tab for the specific math and probabilities for each exercise!
            </p>
          </div>
        </div>
      </div>

      <div className="math-card math-card--full">
        <div className="rules-card-header">
          <h3>Stars (Advanced Mode)</h3>
          <button
            className={`stars-toggle${starsEnabled ? ' stars-toggle--enabled' : ''}`}
            onClick={() => setStarsEnabled((prev) => !prev)}
            type="button"
            aria-pressed={starsEnabled}
          >
            {starsEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        <div className={`rules-content stars-content${starsEnabled ? '' : ' stars-content--disabled'}`}>
          <div className="rule-section">
            <h4>⭐ Stars Overview</h4>
            <p>
              Stars add extra rules to Workout Spinner. They start disabled by default because they add complexity,
              but they also create more gameplay options.
            </p>
            <p>Stars can slightly affect your odds. If you play smart, you may be able to use them to your advantage.</p>
            <p>
              How stars appear: Whenever you land on an exercise, if it doesn’t already have a star, it gains
              one.
            </p>
          </div>

          <div className="rule-section">
            <h4>⭐ Star Power</h4>
            <p>When you land on a starred exercise, you may get a bonus option:</p>
            <ul>
              <li>
                Any Exercise: You can choose to end the workout immediately,
                but you may not spin again that day.
              </li>
              <li>
                <span className="rarity-common">Common:</span> You can spin again for a new
                exercise with 0% chance of <span className="shawarma-text">shawarma</span>.
              </li>
              <li>
                <span className="rarity-rare">Rare:</span> Swap to any other{' '}
                <span className="rarity-rare">Rare</span> exercise.
              </li>
              <li>
                <span className="rarity-epic">Epic:</span> Choose one:
                <ul>
                  <li>
                    Trade it into five <span className="rarity-rare">Rare</span> exercises.
                  </li>
                  <li>
                    Place one star on any exercise of your choice.
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="rule-section">
            <h4>🔁 Trading Exercises (Tier Completion)</h4>
            <p>
              If you land on an exercise with a star, and every exercise in its tier has a star, you can trade them all in for one exercise from the next tier up.
            </p>
            <p>
              Limit: You may not use this to get a <span className="rarity-legendary">Legendary</span> or{' '}
              <span className="rarity-godly">Godly</span> tier item.
            </p>
          </div>

          <div className="rule-section">
            <h4>
              🍀 Pity <span className="shawarma-text">Shawarma</span>
            </h4>
            <p>
              If you have at least one star on every exercise, and you land on a slot next to{' '}
              <span className="shawarma-text">shawarma</span>, you may take the{' '}
              <span className="shawarma-text">shawarma</span> as if you landed on it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
