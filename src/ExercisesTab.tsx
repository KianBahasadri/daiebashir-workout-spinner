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
                <span><span className="math-mono">{Number.isFinite(group.expectedHitsPerWorkout) ? group.expectedHitsPerWorkout.toFixed(2) : '∞'}</span> hits/workout</span>
                <span><span className="math-mono">{(group.exercises.reduce((sum, e) => sum + e.duration, 0) / group.exercises.length * (Number.isFinite(group.expectedHitsPerWorkout) ? group.expectedHitsPerWorkout : 0)).toFixed(1)}</span> min expected</span>
                <span><span className="math-mono">{group.expectedHitsPerWorkout > 0 ? (1 / group.expectedHitsPerWorkout).toFixed(1) : '∞'}</span> workouts until hit<InfoPopup explanationKey="workoutsUntilHit" activePopup={activePopup} setActivePopup={setActivePopup} math={math} /></span>
              </div>
              <div className="weight-group-items-compact">
                {group.exercises.map((exercise) => (
                  <span
                    key={exercise.name}
                    className={`weight-pill-compact${exercise.isExitCondition ? ' end' : ''}`}
                    style={{ backgroundColor: exercise.color }}
                    title={`${exercise.name}: ${formatPercent(group.perItemProbability)} per spin, ${Number.isFinite(group.expectedHitsPerWorkout) ? group.expectedHitsPerWorkout.toFixed(2) : '∞'} hits/workout, ~${group.expectedHitsPerWorkout > 0 ? (1 / group.expectedHitsPerWorkout).toFixed(1) : '∞'} workouts until hit, ${exercise.duration} min${exercise.isExitCondition ? ' (exit)' : ''}`}
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
