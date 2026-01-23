import { useState, useMemo } from 'react'
import { InfoPopup } from './InfoPopup'
import { type Exercise, type MathStats, type ExplanationKey, RARITY_CONFIG } from './types.tsx'
import { pickExerciseIndex } from './workoutMath'

type SimulationTabProps = {
  exercises: Exercise[]
  math: MathStats
  activePopup: ExplanationKey | null
  setActivePopup: (key: ExplanationKey | null) => void
}

type RarityStats = {
  rarity: string
  expected: number
  actual: number
  count: number
}

export function SimulationTab({ exercises, math, activePopup, setActivePopup }: SimulationTabProps) {
  const [targetSpins, setTargetSpins] = useState(1000)
  const [results, setResults] = useState<{
    rarityStats: RarityStats[]
    avgLength: number
    totalSpins: number
    totalWorkouts: number
    isSimulating: boolean
    lengthFrequencies: Record<number, number>
    stdDev: number
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
      let sumOfLengthsSquared = 0
      const lengthFrequencies: Record<number, number> = {}

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
        sumOfLengthsSquared += (workoutLength * workoutLength)
        lengthFrequencies[workoutLength] = (lengthFrequencies[workoutLength] || 0) + 1
      }

      const rarityStats: RarityStats[] = (Object.keys(RARITY_CONFIG) as (keyof typeof RARITY_CONFIG)[]).map(rarity => ({
        rarity,
        expected: RARITY_CONFIG[rarity].probability,
        actual: totalSpins > 0 ? rarityCounts[rarity] / totalSpins : 0,
        count: rarityCounts[rarity]
      }))

      const avgLength = totalSpins / totalWorkouts
      const variance = (sumOfLengthsSquared / totalWorkouts) - (avgLength * avgLength)
      const stdDev = Math.sqrt(Math.max(0, variance))

      setResults({
        rarityStats,
        avgLength,
        totalSpins,
        totalWorkouts,
        isSimulating: false,
        lengthFrequencies,
        stdDev
      })
    }, 0)
  }

  const histogramData = useMemo(() => {
    if (!results || !results.lengthFrequencies) return []
    
    const freqs = results.lengthFrequencies
    const lengths = Object.keys(freqs).map(Number).sort((a, b) => a - b)
    if (lengths.length === 0) return []

    // Cap display at 99th percentile or 100 spins to keep chart readable
    const displayMax = Math.min(Math.max(...lengths), 80)
    
    const data = []
    for (let i = 1; i <= displayMax; i++) {
      data.push({
        length: i,
        count: freqs[i] || 0
      })
    }
    return data
  }, [results])

  const maxFreq = useMemo(() => 
    histogramData.length > 0 ? Math.max(...histogramData.map(d => d.count)) : 0
  , [histogramData])

  const theoreticalPoints = useMemo(() => {
    if (!results || histogramData.length === 0) return ""
    
    return histogramData.map((d, i) => {
      const x = (i + 0.5) * (100 / histogramData.length)
      // P(L = k) = (1-p)^(k-1) * p
      const p = math.exitProbability
      const theoreticalProb = Math.pow(1 - p, d.length - 1) * p
      const theoreticalCount = theoreticalProb * results.totalWorkouts
      const y = 100 - (theoreticalCount / maxFreq) * 100
      return `${x},${y}`
    }).join(" ")
  }, [histogramData, results, math.exitProbability, maxFreq])

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
            <h3>
              Rarity Distribution
              <InfoPopup explanationKey="rarity" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </h3>
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
            <h3>
              Workout Length
              <InfoPopup explanationKey="avgExercises" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </h3>
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
                <span className="sim-kpi-label">Std Deviation</span>
                <span className="sim-kpi-value">{results.stdDev.toFixed(2)}</span>
              </div>
              <div className="sim-kpi">
                <span className="sim-kpi-label">Delta (Mean)</span>
                <span className="sim-kpi-value" style={{ 
                  color: Math.abs(results.avgLength - math.expectedSpinsUntilEnd) > 0.5 ? '#ff4d4f' : '#52c41a'
                }}>
                  {(results.avgLength - math.expectedSpinsUntilEnd).toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          <div className="math-card math-card--full">
            <h3>Rarity Distribution Visualization</h3>
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

          <div className="math-card math-card--full">
            <h3>
              Workout Length Frequency (Geometric Distribution)
              <InfoPopup explanationKey="lengthCurve" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </h3>
            <p className="math-subtitle">
              Shows how many workouts ended after exactly N spins. 
              The most frequent result is 1 spin, with a long tail for longer workouts.
              The <span style={{ borderBottom: '1.5px solid #fcd34d', paddingBottom: '2px', color: '#fcd34d' }}>yellow line</span> shows the theoretical mathematical model.
            </p>
            <div className="sim-histogram-wrapper">
              <div className="sim-histogram">
                {histogramData.map((d, i) => {
                  const height = maxFreq > 0 ? (d.count / maxFreq) * 100 : 0
                  return (
                    <div 
                      key={i} 
                      className="sim-histogram-bar" 
                      style={{ height: `${height}%` }}
                      title={`${d.count.toLocaleString()} workouts lasted ${d.length} spins`}
                    />
                  )
                })}
                {theoreticalPoints && (
                  <svg className="sim-histogram-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline 
                      points={theoreticalPoints} 
                      fill="none" 
                      stroke="#fcd34d" 
                      strokeWidth="0.6"
                    />
                  </svg>
                )}
              </div>
              <div className="sim-histogram-labels">
                <span>1 spin</span>
                <span>{Math.floor(histogramData.length / 2)} spins</span>
                <span>{histogramData.length}+ spins</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
