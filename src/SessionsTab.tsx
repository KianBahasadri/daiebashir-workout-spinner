import { InfoPopup } from './InfoPopup'
import { type MathStats, type ExplanationKey, formatPercent } from './types.tsx'

const spinsForCdf = (p: number, targetCdf: number) => {
  if (!Number.isFinite(p) || p <= 0) return Number.POSITIVE_INFINITY
  if (p >= 1) return 1
  const clampedTarget = Math.max(0, Math.min(0.999999, targetCdf))
  // Smallest k such that 1 - (1 - p)^k >= targetCdf
  return Math.max(1, Math.ceil(Math.log(1 - clampedTarget) / Math.log(1 - p)))
}

type SessionsTabProps = {
  math: MathStats
  activePopup: ExplanationKey | null
  setActivePopup: (key: ExplanationKey | null) => void
}

export function SessionsTab({ math, activePopup, setActivePopup }: SessionsTabProps) {
  const medianSpins = spinsForCdf(math.exitProbability, 0.5)
  const medianSpinsLabel = Number.isFinite(medianSpins) ? `${medianSpins}` : '∞'
  const medianChance = Number.isFinite(medianSpins) ? math.chanceEndWithin(medianSpins) : 0
  const medianDurationLabel = Number.isFinite(medianSpins)
    ? `${(Math.max(0, medianSpins - 1) * math.expectedDurationPerSpin).toFixed(0)}`
    : '∞'

  // Expected duration stats
  const expectedSpins = Math.round(math.expectedSpinsUntilEnd)
  const expectedSpinsLabel = Number.isFinite(expectedSpins) ? `${expectedSpins}` : '∞'
  const expectedChance = Number.isFinite(expectedSpins) ? math.chanceEndWithin(expectedSpins) : 0
  const expectedDurationLabel = Number.isFinite(expectedSpins)
    ? `${(Math.max(0, expectedSpins - 1) * math.expectedDurationPerSpin).toFixed(0)}`
    : '∞'

  return (
    <div className="math-grid">
      <div className="math-card math-card--full">
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

      <div className="math-card math-card--full">
        <h3>
          Workout length curve
          <InfoPopup explanationKey="lengthCurve" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
        </h3>
        <p className="math-subtitle">
          Likelihood the workout ends on spin <span className="math-mono">k</span> (geometric
          distribution). Mean is <span className="math-mono">E[L] = 1 / p</span>.
          Expected duration: <span className="math-mono">{Number.isFinite(math.expectedTotalDuration) ? `${math.expectedTotalDuration.toFixed(1)} min` : '∞'}</span>.
        </p>

        {(() => {
          const lengthCurvePoints = Math.max(1, math.lengthCurve.length)
          const chartW = 800
          const chartH = 200
          const pad = 20
          const innerW = chartW - pad * 2
          const innerH = chartH - pad * 2

          const maxProb = Math.max(
            ...math.lengthCurve.map((point) => point.probabilityEndOnSpin),
            0,
          )
          const safeMax = maxProb > 0 ? maxProb * 1.1 : 1

          const points = math.lengthCurve
            .map((point, idx) => {
              const t = math.lengthCurve.length > 1 ? idx / (math.lengthCurve.length - 1) : 0
              const x = pad + t * innerW
              const y = pad + innerH - (point.probabilityEndOnSpin / safeMax) * innerH
              return `${x.toFixed(2)},${y.toFixed(2)}`
            })
            .join(' ')

          const expected = math.expectedSpinsUntilEnd
          const expectedT = Number.isFinite(expected)
            ? Math.max(0, Math.min(1, (expected - 1) / (lengthCurvePoints - 1)))
            : 1
          const expectedX = pad + expectedT * innerW

          // Generate x-axis labels (every 2 spins)
          const xAxisLabels = []
          const xStep = Math.max(2, Math.floor(lengthCurvePoints / 10))
          for (let i = 1; i <= lengthCurvePoints; i += xStep) {
            const t = (i - 1) / (lengthCurvePoints - 1)
            xAxisLabels.push({ value: i, x: pad + t * innerW })
          }
          // Always include the last value
          if (xAxisLabels[xAxisLabels.length - 1]?.value !== lengthCurvePoints) {
            const t = (lengthCurvePoints - 1) / (lengthCurvePoints - 1)
            xAxisLabels.push({ value: lengthCurvePoints, x: pad + t * innerW })
          }

          // Generate y-axis labels (5 ticks from 0 to max)
          const yAxisTicks = 5
          const yAxisLabels = []
          for (let i = 0; i <= yAxisTicks; i++) {
            const prob = (safeMax * i) / yAxisTicks
            const y = pad + innerH - (prob / safeMax) * innerH
            yAxisLabels.push({ value: prob, y })
          }

          return (
            <svg
              className="math-chart"
              viewBox={`0 0 ${chartW} ${chartH}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`Curve of probability the workout ends on spin k (k = 1..${lengthCurvePoints}).`}
            >
              <rect x="0" y="0" width={chartW} height={chartH} rx="10" ry="10" />

              {/* Grid lines */}
              <g opacity="0.2">
                {xAxisLabels.map((label) => (
                  <line
                    key={`grid-x-${label.value}`}
                    x1={label.x}
                    y1={pad}
                    x2={label.x}
                    y2={chartH - pad}
                    stroke="rgba(148, 163, 184, 0.3)"
                    strokeWidth="1"
                  />
                ))}
                {yAxisLabels.map((label, idx) => (
                  <line
                    key={`grid-y-${idx}`}
                    x1={pad}
                    y1={label.y}
                    x2={chartW - pad}
                    y2={label.y}
                    stroke="rgba(148, 163, 184, 0.3)"
                    strokeWidth="1"
                  />
                ))}
              </g>

              {/* Axes */}
              <g>
                <line x1={pad} y1={chartH - pad} x2={chartW - pad} y2={chartH - pad} strokeWidth="2" />
                <line x1={pad} y1={pad} x2={pad} y2={chartH - pad} strokeWidth="2" />
              </g>

              {/* Y-axis labels */}
              <g>
                {yAxisLabels.map((label, idx) => (
                  <g key={`y-label-${idx}`}>
                    <line
                      x1={pad - 5}
                      y1={label.y}
                      x2={pad}
                      y2={label.y}
                      strokeWidth="1.5"
                    />
                    <text
                      x={pad - 10}
                      y={label.y + 4}
                      textAnchor="end"
                      style={{ fontSize: '11px', fill: 'rgba(226, 232, 240, 0.9)' }}
                    >
                      {formatPercent(label.value)}
                    </text>
                  </g>
                ))}
              </g>

              {/* X-axis labels */}
              <g>
                {xAxisLabels.map((label) => (
                  <g key={`x-label-${label.value}`}>
                    <line
                      x1={label.x}
                      y1={chartH - pad}
                      x2={label.x}
                      y2={chartH - pad + 5}
                      strokeWidth="1.5"
                    />
                    <text
                      x={label.x}
                      y={chartH - pad + 18}
                      textAnchor="middle"
                      style={{ fontSize: '11px', fill: 'rgba(226, 232, 240, 0.9)' }}
                    >
                      {label.value}
                    </text>
                  </g>
                ))}
              </g>

              {/* Data line */}
              <polyline points={points} />

              {/* Expected value line */}
              <g>
                <line
                  x1={expectedX}
                  y1={pad}
                  x2={expectedX}
                  y2={chartH - pad}
                  stroke="rgba(248, 250, 252, 0.65)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <text
                  x={expectedX}
                  y={pad + 12}
                  textAnchor="middle"
                  style={{ fontSize: '11px', fill: 'rgba(248, 250, 252, 0.9)' }}
                >
                  E[L]
                </text>
              </g>
            </svg>
          )
        })()}

        <div className="math-mini-table" aria-label="Chance the workout has ended within N spins">
          <div>
            <span className="math-mono">P(L ≤ {medianSpinsLabel})</span>: {formatPercent(medianChance)}
            <span className="math-duration">≤ {medianDurationLabel} min</span>
          </div>
          <div>
            <span className="math-mono">P(L ≤ {expectedSpinsLabel})</span>: {formatPercent(expectedChance)}
            <span className="math-duration">≤ {expectedDurationLabel} min</span>
          </div>
          <div>
            <span className="math-mono">P(L ≤ {math.lengthCurve.length})</span>: {formatPercent(math.chanceEndWithin(math.lengthCurve.length))}
            <span className="math-duration">≤ {((Math.max(0, math.lengthCurve.length - 1)) * math.expectedDurationPerSpin).toFixed(0)} min</span>
            <InfoPopup explanationKey="cdf" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
          </div>
        </div>
      </div>
    </div>
  )
}
