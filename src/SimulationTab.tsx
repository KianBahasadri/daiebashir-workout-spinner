import { useMemo, useState } from 'react'
import { InfoPopup } from './InfoPopup'
import { type Exercise, type MathStats, type ExplanationKey, RARITY_CONFIG } from './types'
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
                  <th>Count</th>
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
                      <td>{stat.count.toLocaleString()}</td>
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
                          <span 
                            className="sim-bar-value"
                            style={{ 
                              color: stat.rarity === 'common' ? '#0f172a' : 'white',
                              textShadow: stat.rarity === 'common' ? 'none' : undefined
                            }}
                          >
                            {(stat.actual * 100).toFixed(1)}% ({stat.count.toLocaleString()})
                          </span>
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
              The <span style={{ borderBottom: '1.5px solid #fcd34d', paddingBottom: '2px', color: '#fcd34d' }}>yellow dashed line</span> shows the theoretical mathematical model.
            </p>
            {(() => {
              const chartW = 800
              const chartH = 260
              const pad = 45
              const innerW = chartW - pad * 2
              const innerH = chartH - pad * 2
              
              const displayMax = histogramData.length
              const safeMax = maxFreq > 0 ? maxFreq * 1.1 : 1

              // Calculate bar width - ensure it's at least 1px
              const barWidth = displayMax > 0 ? Math.max(1, (innerW / displayMax) * 0.8) : 0
              const barGap = displayMax > 0 ? (innerW / displayMax) * 0.2 : 0

              // Generate x-axis labels (every few spins)
              const xAxisLabels = []
              const xStep = Math.max(5, Math.floor(displayMax / 10))
              for (let i = 1; i <= displayMax; i += xStep) {
                const t = (i - 0.5) / displayMax
                xAxisLabels.push({ value: i, x: pad + t * innerW })
              }
              // Always include the last value if not already present and space permits
              if (displayMax > 0 && xAxisLabels[xAxisLabels.length - 1]?.value !== displayMax) {
                const t = (displayMax - 0.5) / displayMax
                xAxisLabels.push({ value: displayMax, x: pad + t * innerW })
              }

              // Generate y-axis labels
              const yAxisTicks = 5
              const yAxisLabels = []
              for (let i = 0; i <= yAxisTicks; i++) {
                const val = (safeMax * i) / yAxisTicks
                const y = pad + innerH - (val / safeMax) * innerH
                yAxisLabels.push({ value: val, y })
              }

              const polylinePoints = histogramData.map((d, i) => {
                const t = (i + 0.5) / displayMax
                const x = pad + t * innerW
                const p = math.exitProbability
                const theoreticalProb = Math.pow(1 - p, d.length - 1) * p
                const theoreticalCount = theoreticalProb * results.totalWorkouts
                const y = pad + innerH - (theoreticalCount / safeMax) * innerH
                return `${x.toFixed(2)},${y.toFixed(2)}`
              }).join(" ")

              return (
                <div className="sim-histogram-wrapper" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                  <svg
                    className="math-chart"
                    viewBox={`0 0 ${chartW} ${chartH}`}
                    style={{ height: 'auto', maxHeight: '300px' }}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <rect x="0" y="0" width={chartW} height={chartH} rx="10" ry="10" fill="rgba(15, 23, 42, 0.45)" stroke="rgba(148, 163, 184, 0.22)" />
                    
                    {/* Grid lines */}
                    <g opacity="0.1">
                      {xAxisLabels.map((label) => (
                        <line key={`grid-x-${label.value}`} x1={label.x} y1={pad} x2={label.x} y2={chartH - pad} stroke="#94a3b8" strokeWidth="1" />
                      ))}
                      {yAxisLabels.map((label, idx) => (
                        <line key={`grid-y-${idx}`} x1={pad} y1={label.y} x2={chartW - pad} y2={label.y} stroke="#94a3b8" strokeWidth="1" />
                      ))}
                    </g>

                    {/* Axes */}
                    <g stroke="rgba(148, 163, 184, 0.5)" strokeWidth="2">
                      <line x1={pad} y1={chartH - pad} x2={chartW - pad} y2={chartH - pad} />
                      <line x1={pad} y1={pad} x2={pad} y2={chartH - pad} />
                    </g>

                    {/* Bars */}
                    <g shapeRendering="crispEdges">
                      {histogramData.map((d, i) => {
                        const t = i / displayMax
                        const x = pad + t * innerW + barGap / 2
                        const h = (d.count / safeMax) * innerH
                        const y = pad + innerH - h
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={y}
                            width={Math.max(1, barWidth)}
                            height={Math.max(0, h)}
                            // NOTE: The global `.math-chart rect { ... }` rule would otherwise override these.
                            style={{ fill: '#6366f1', stroke: 'none', opacity: 1 }}
                            rx={barWidth > 4 ? 2 : 0}
                          >
                            <title>{`${d.count.toLocaleString()} workouts lasted ${d.length} spins`}</title>
                          </rect>
                        )
                      })}
                    </g>

                    {/* Y-axis labels */}
                    <g fill="rgba(226, 232, 240, 0.9)" fontSize="11" textAnchor="end">
                      {yAxisLabels.map((label, idx) => (
                        <text key={idx} x={pad - 12} y={label.y + 4}>
                          {Math.round(label.value).toLocaleString()}
                        </text>
                      ))}
                    </g>

                    {/* X-axis labels */}
                    <g fill="rgba(226, 232, 240, 0.9)" fontSize="11" textAnchor="middle">
                      {xAxisLabels.map((label) => (
                        <text key={label.value} x={label.x} y={chartH - pad + 20}>
                          {label.value}
                        </text>
                      ))}
                      <text x={chartW / 2} y={chartH - 12} fontSize="12" fontWeight="600" fill="rgba(226, 232, 240, 0.6)">
                        Workout Length (number of spins)
                      </text>
                    </g>

                    {/* Theoretical curve */}
                    {displayMax > 0 && (
                      <polyline
                        points={polylinePoints}
                        fill="none"
                        strokeWidth="2.5"
                        strokeDasharray="6 3"
                        style={{ stroke: '#fcd34d', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}
                      />
                    )}
                  </svg>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
