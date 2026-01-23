import { InfoPopup } from './InfoPopup'
import { type MathStats, type ExplanationKey, formatPercent, RARITY_CONFIG } from './types.tsx'

type ExercisesTabProps = {
  math: MathStats
  activePopup: ExplanationKey | null
  setActivePopup: (key: ExplanationKey | null) => void
}

const PROBABILITY_GRID_BOXES = 100

const buildProbabilityGrid = (math: MathStats, totalBoxes: number) => {
  const items = math.groupedByRarity.flatMap((group) =>
    group.exercises.map((exercise) => ({
      exercise,
      probability: group.perItemProbability,
    })),
  )

  const totalProbability = items.reduce((sum, item) => sum + item.probability, 0)
  if (items.length === 0 || totalProbability <= 0 || !Number.isFinite(totalProbability)) {
    return { cells: [], countsByRarity: {} as Record<string, number>, countsByExercise: {} as Record<string, number> }
  }

  const plans = items.map((item) => {
    const normalizedProbability = item.probability / totalProbability
    const rawCopies = normalizedProbability * totalBoxes
    const copies = Math.floor(rawCopies)
    return { ...item, copies, remainder: rawCopies - copies }
  })

  let used = plans.reduce((sum, plan) => sum + plan.copies, 0)
  let remaining = totalBoxes - used

  if (remaining > 0) {
    plans
      .slice()
      .sort((a, b) => b.remainder - a.remainder)
      .slice(0, remaining)
      .forEach((plan) => {
        plan.copies += 1
      })
  } else if (remaining < 0) {
    plans
      .slice()
      .sort((a, b) => a.remainder - b.remainder)
      .slice(0, Math.abs(remaining))
      .forEach((plan) => {
        plan.copies = Math.max(0, plan.copies - 1)
      })
  }

  const countsByRarity: Record<string, number> = {}
  const countsByExercise: Record<string, number> = {}
  for (const plan of plans) {
    countsByRarity[plan.exercise.rarity] = (countsByRarity[plan.exercise.rarity] ?? 0) + plan.copies
    countsByExercise[plan.exercise.name] = plan.copies
  }

  // Sort by rarity: most rare (Godly) to least rare (Common)
  const rarityRank: Record<string, number> = { godly: 0, legendary: 1, epic: 2, rare: 3, common: 4 }
  
  const cells: Array<{ exerciseName: string; rarity: string; color: string; probability: number }> = []
  
  // Sort plans by rarity rank before generating cells
  const sortedPlans = [...plans].sort((a, b) => rarityRank[a.exercise.rarity] - rarityRank[b.exercise.rarity])
  
  for (const plan of sortedPlans) {
    for (let i = 0; i < plan.copies; i++) {
      cells.push({
        exerciseName: plan.exercise.name,
        rarity: plan.exercise.rarity,
        color: plan.exercise.color,
        probability: plan.probability,
      })
    }
  }

  return { cells, countsByRarity, countsByExercise }
}

export function ExercisesTab({ math, activePopup, setActivePopup }: ExercisesTabProps) {
  const probabilityGrid = buildProbabilityGrid(math, PROBABILITY_GRID_BOXES)

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

        {probabilityGrid.cells.length > 0 && (
          <div className="probability-grid-section">
            <div className="probability-grid-header">
              <h4 className="probability-grid-title">Probability grid ({PROBABILITY_GRID_BOXES} boxes)</h4>
              <p className="math-subtitle">
                Each box represents ~{formatPercent(1 / PROBABILITY_GRID_BOXES)} chance per spin.
                <br />
                <span style={{ color: '#a5b4fc', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  Hover over boxes to see details.
                </span>
              </p>
            </div>

            <div className="probability-grid-legend" aria-label="Probability grid legend">
              {math.groupedByRarity
                .slice()
                .sort((a, b) => {
                  const rarityRank: Record<string, number> = { godly: 0, legendary: 1, epic: 2, rare: 3, common: 4 }
                  return rarityRank[a.rarity] - rarityRank[b.rarity]
                })
                .map((group) => {
                  const rarityConfig = RARITY_CONFIG[group.rarity]
                  const boxCount = probabilityGrid.countsByRarity[group.rarity] ?? 0
                  return (
                    <div key={group.rarity} className="probability-grid-legend-item">
                      <span
                        className="probability-grid-swatch"
                        style={{
                          backgroundColor: rarityConfig.color,
                          borderColor: group.rarity === 'common' ? 'rgba(148, 163, 184, 0.75)' : 'rgba(15, 23, 42, 0.45)',
                        }}
                        aria-hidden="true"
                      />
                      <span className="probability-grid-legend-label">
                        <span className="math-mono">{boxCount}</span> {rarityConfig.name} (
                        <span className="math-mono">{formatPercent(group.groupProbability)}</span>)
                      </span>
                    </div>
                  )
                })}
            </div>

            <div className="probability-grid" aria-label={`Probability grid with ${PROBABILITY_GRID_BOXES} boxes`}>
              {probabilityGrid.cells.map((cell, index) => {
                const rarityConfig = RARITY_CONFIG[cell.rarity as keyof typeof RARITY_CONFIG]
                return (
                  <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${cell.exerciseName}-${index}`}
                    className={`probability-cell${cell.rarity === 'common' ? ' probability-cell--common' : ''}`}
                    style={{ backgroundColor: cell.color || rarityConfig.color }}
                    title={`${cell.exerciseName}: ${formatPercent(cell.probability)} per spin (${rarityConfig.name})`}
                    aria-label={`${cell.exerciseName}, ${formatPercent(cell.probability)} per spin`}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
