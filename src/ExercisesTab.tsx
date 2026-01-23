import { InfoPopup } from './InfoPopup'
import { type MathStats, type ExplanationKey, formatPercent, RARITY_CONFIG } from './types.tsx'

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
          Odds by rarity (grouped)
          <InfoPopup explanationKey="rarity" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
        </h3>
        <p className="math-subtitle">
          Odds by rarity for each exercise, grouped by rarity tier.
        </p>

        <div className="weight-groups">
          {math.groupedByRarity.map((group) => {
            const rarityConfig = RARITY_CONFIG[group.rarity]
            return (
              <div key={group.rarity} className="weight-group">
                <div className="weight-group-header">
                  <div className="weight-group-title">
                    <span
                      className="rarity-badge"
                      style={{
                        backgroundColor: rarityConfig.color,
                        color: group.rarity === 'common' ? '#000' : '#fff'
                      }}
                    >
                      {rarityConfig.name}
                    </span>
                    <span className="category-tag">{rarityConfig.category}</span>
                    <span className="math-mono">{formatPercent(group.groupProbability)}</span> total
                  </div>
                </div>
                <div className="weight-group-stats">
                  <span><span className="math-mono">{formatPercent(group.perItemProbability)}</span> per exercise</span>
                </div>
                <div className="weight-group-items-compact">
                  {group.exercises.map((exercise) => (
                    <span
                      key={exercise.name}
                      className={`weight-pill-compact${exercise.isExitCondition ? ' end' : ''} ${exercise.rarity === 'legendary' ? 'legendary-tier' : ''} ${exercise.rarity === 'godly' ? 'godly-tier' : ''}`}
                      style={{ backgroundColor: (exercise.rarity === 'legendary' || exercise.rarity === 'godly') ? undefined : exercise.color }}
                      title={`${exercise.name}: ${formatPercent(group.perItemProbability)} per spin, ${exercise.duration} min${exercise.isExitCondition ? ' (exit)' : ''}`}
                    >
                      {exercise.name}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
