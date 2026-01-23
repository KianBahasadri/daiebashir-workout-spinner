import { InfoPopup } from './InfoPopup'
import { type MathStats, type ExplanationKey, formatPercent } from './types.tsx'

type SessionsTabProps = {
  math: MathStats
  lengthCurvePoints: number
  activePopup: ExplanationKey | null
  setActivePopup: (key: ExplanationKey | null) => void
}

export function SessionsTab({ math, lengthCurvePoints, activePopup, setActivePopup }: SessionsTabProps) {
  return (
    <div className="math-grid">
      <div className="math-card">
        <h3>How likely the game is to end</h3>
        <dl className="math-kpis">
          <div className="math-kpi">
            <dt>
              Average exercises before shawarma
              <InfoPopup explanationKey="avgExercises" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </dt>
            <dd>
              {Number.isFinite(math.expectedExercisesBeforeEnd)
                ? math.expectedExercisesBeforeEnd.toFixed(2)
                : '∞'}
            </dd>
          </div>
          <div className="math-kpi">
            <dt>
              Average mins per exercise
              <InfoPopup explanationKey="avgDuration" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </dt>
            <dd>{math.expectedDurationPerSpin.toFixed(1)} min</dd>
          </div>
          <div className="math-kpi">
            <dt>
              Average workout duration before shawarma
              <InfoPopup explanationKey="totalDuration" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </dt>
            <dd>
              {Number.isFinite(math.expectedTotalDuration)
                ? `${math.expectedTotalDuration.toFixed(1)} min`
                : '∞'}
            </dd>
          </div>
        </dl>

        <p className="math-note">
          Assumes each spin is independent, using the same weights each time.
        </p>
      </div>
    </div>
  )
}
