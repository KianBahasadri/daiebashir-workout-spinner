import { InfoPopup } from './InfoPopup'
import { type MathStats, type ExplanationKey, formatPercent } from './types.tsx'

type ExercisesTabProps = {
  math: MathStats
  activePopup: ExplanationKey | null
  setActivePopup: (key: ExplanationKey | null) => void
}

export function ExercisesTab({ math, activePopup, setActivePopup }: ExercisesTabProps) {
  return (
    <div className="math-grid">
      <div className="math-card math-card--full">
        <h3>
          Odds by weight (grouped)
          <InfoPopup explanationKey="weights" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
        </h3>
        <p className="math-subtitle">
          Expected hits per workout for each exercise, grouped by weight tier.
        </p>

        <div className="weight-groups">
          {math.groupedByWeight.map((group) => (
            <div key={group.weight} className="weight-group">
              <div className="weight-group-header">
                <div className="weight-group-title">
                  Weight <span className="math-mono">{group.weight}</span>
                </div>
              </div>
              <div className="weight-group-stats">
                <span><span className="math-mono">{formatPercent(group.perItemProbability)}</span> per spin</span>
              </div>
              <div className="weight-group-items-compact">
                {group.exercises.map((exercise) => (
                  <span
                    key={exercise.name}
                    className={`weight-pill-compact${exercise.isExitCondition ? ' end' : ''}`}
                    style={{ backgroundColor: exercise.color }}
                    title={`${exercise.name}: ${formatPercent(group.perItemProbability)} per spin, ${exercise.duration} min${exercise.isExitCondition ? ' (exit)' : ''}`}
                  >
                    {exercise.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
