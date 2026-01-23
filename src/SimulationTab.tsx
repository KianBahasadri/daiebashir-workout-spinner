import { useState, useMemo } from 'react'
import { type Exercise, type MathStats, RARITY_CONFIG } from './types.tsx'
import { pickExerciseIndex } from './workoutMath'

type SimulationTabProps = {
  exercises: Exercise[]
  math: MathStats
}

type RarityStats = {
  rarity: string
  expected: number
  actual: number
  count: number
}

export function SimulationTab({ exercises, math }: SimulationTabProps) {
  const [targetSpins, setTargetSpins] = useState(1000)
  const [results, setResults] = useState<{
    rarityStats: RarityStats[]
    avgLength: number
    totalSpins: number
    totalWorkouts: number
    isSimulating: boolean
  } | null>(null)

  const runSimulation = () => {
    if (exercises.length === 0) return

    setResults(prev => prev ? { ...prev, isSimulating: true } : null)

    // Use setTimeout to allow UI to update before heavy calculation
    setTimeout(() => {
      const rarityCounts: Record<string, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        godly: 0,
      }
      let totalSpins = 0
      let totalWorkouts = 0

      // Simulate until we reach the target number of spins
      while (totalSpins < targetSpins) {
        totalWorkouts++
        let workoutFinished = false
        let workoutLength = 0
        
        // Simulate one full workout until an exit condition is met
        while (!workoutFinished) {
          totalSpins++
          workoutLength++
          const index = pickExerciseIndex(exercises)
          const exercise = exercises[index]
          rarityCounts[exercise.rarity]++
          
          if (exercise.isExitCondition) {
            workoutFinished = true
          }

          // Safety break to prevent infinite loops if no exit condition exists
          if (workoutLength > 1000) break 
        }
      }

      const rarityStats: RarityStats[] = (Object.keys(RARITY_CONFIG) as (keyof typeof RARITY_CONFIG)[]).map(rarity => ({
        rarity,
        expected: RARITY_CONFIG[rarity].probability,
        actual: totalSpins > 0 ? rarityCounts[rarity] / totalSpins : 0,
        count: rarityCounts[rarity]
      }))

      setResults({
        rarityStats,
        avgLength: totalSpins / totalWorkouts,
        totalSpins,
        totalWorkouts,
        isSimulating: false
      })
    }, 0)
  }

  return (
    <div className="simulation-tab">
      <div className="math-card math-card--full">
        <h3>Monte Carlo Simulation</h3>
        <p className="math-subtitle">
          Run thousands of simulated spins to verify that the random selection logic
          matches the theoretical mathematical model.
        </p>

        <div className="sim-controls">
          <label>
            Target number of spins:
            <select 
              value={targetSpins} 
              onChange={(e) => setTargetSpins(Number(e.target.value))}
              disabled={results?.isSimulating}
            >
              <option value={10}>10</option>
              <option value={100}>100</option>
              <option value={1000}>1,000</option>
              <option value={10000}>10,000</option>
              <option value={100000}>100,000</option>
              <option value={1000000}>1,000,000</option>
            </select>
          </label>
          <button 
            className="sim-button" 
            onClick={runSimulation}
            disabled={results?.isSimulating || exercises.length === 0}
          >
            {results?.isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {results && (
        <div className="sim-results">
          <div className="math-card">
            <h3>Rarity Distribution</h3>
            <p className="math-subtitle">Across all {results.totalSpins.toLocaleString()} spins</p>
            <table className="sim-table">
              <thead>
                <tr>
                  <th>Rarity</th>
                  <th>Expected</th>
                  <th>Actual</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                {results.rarityStats.map(stat => {
                  const delta = stat.actual - stat.expected
                  const deltaColor = Math.abs(delta) > 0.01 ? '#ff4d4f' : '#52c41a'
                  return (
                    <tr key={stat.rarity}>
                      <td style={{ color: RARITY_CONFIG[stat.rarity as keyof typeof RARITY_CONFIG].color, fontWeight: 'bold' }}>
                        {stat.rarity.charAt(0).toUpperCase() + stat.rarity.slice(1)}
                      </td>
                      <td>{(stat.expected * 100).toFixed(2)}%</td>
                      <td>{(stat.actual * 100).toFixed(2)}%</td>
                      <td style={{ color: deltaColor }}>
                        {delta > 0 ? '+' : ''}{(delta * 100).toFixed(3)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="math-card">
            <h3>Workout Length</h3>
            <p className="math-subtitle">Across {results.totalWorkouts.toLocaleString()} full workouts</p>
            <div className="sim-kpi-group">
              <div className="sim-kpi">
                <span className="sim-kpi-label">Expected Avg Spins</span>
                <span className="sim-kpi-value">{math.expectedSpinsUntilEnd.toFixed(2)}</span>
              </div>
              <div className="sim-kpi">
                <span className="sim-kpi-label">Actual Avg Spins</span>
                <span className="sim-kpi-value">{results.avgLength.toFixed(2)}</span>
              </div>
              <div className="sim-kpi">
                <span className="sim-kpi-label">Delta</span>
                <span className="sim-kpi-value" style={{ 
                  color: Math.abs(results.avgLength - math.expectedSpinsUntilEnd) > 0.5 ? '#ff4d4f' : '#52c41a'
                }}>
                  {(results.avgLength - math.expectedSpinsUntilEnd).toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          <div className="math-card math-card--full">
            <h3>Distribution Visualization</h3>
            <div className="sim-chart">
              {results.rarityStats.map(stat => {
                const rarity = stat.rarity as keyof typeof RARITY_CONFIG
                const color = RARITY_CONFIG[rarity].color
                const maxVal = Math.max(...results.rarityStats.map(s => Math.max(s.expected, s.actual)))
                
                return (
                  <div key={stat.rarity} className="sim-chart-row">
                    <div className="sim-chart-label">
                      {stat.rarity.charAt(0).toUpperCase() + stat.rarity.slice(1)}
                    </div>
                    <div className="sim-chart-bars">
                      <div className="sim-bar-container">
                        <div 
                          className="sim-bar sim-bar--expected" 
                          style={{ 
                            width: `${(stat.expected / maxVal) * 100}%`,
                            backgroundColor: `${color}44`,
                            border: `1px dashed ${color}`
                          }}
                        >
                          <span className="sim-bar-value">{(stat.expected * 100).toFixed(1)}%</span>
                        </div>
                        <div 
                          className="sim-bar sim-bar--actual" 
                          style={{ 
                            width: `${(stat.actual / maxVal) * 100}%`,
                            backgroundColor: color
                          }}
                        >
                          <span className="sim-bar-value">{(stat.actual * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="sim-chart-legend">
                <div className="legend-item">
                  <span className="legend-box legend-box--expected"></span>
                  <span>Expected</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box legend-box--actual"></span>
                  <span>Actual</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
