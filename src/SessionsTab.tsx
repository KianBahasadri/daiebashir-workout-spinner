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
              Chance to hit exit condition (per spin)
              <InfoPopup explanationKey="exitProbability" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </dt>
            <dd>{formatPercent(math.exitProbability)}</dd>
          </div>
          <div className="math-kpi">
            <dt>
              Average exercises before end
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
              Expected workout duration
              <InfoPopup explanationKey="totalDuration" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </dt>
            <dd>
              {Number.isFinite(math.expectedTotalDuration)
                ? `${math.expectedTotalDuration.toFixed(1)} min`
                : '∞'}
            </dd>
          </div>
          <div className="math-kpi math-kpi--highlight">
            <dt>
              🥙 Avg workouts until shawarma
              <InfoPopup explanationKey="shawarma" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
            </dt>
            <dd>
              {Number.isFinite(math.expectedWorkoutsUntilShawarma)
                ? math.expectedWorkoutsUntilShawarma.toFixed(1)
                : '∞'}
            </dd>
          </div>
        </dl>

        <p className="math-note">
          Assumes each spin is independent, using the same weights each time.
        </p>
      </div>

      <div className="math-card">
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
          const chartW = 320
          const chartH = 140
          const pad = 12
          const innerW = chartW - pad * 2
          const innerH = chartH - pad * 2

          const maxProb = Math.max(
            ...math.lengthCurve.map((point) => point.probabilityEndOnSpin),
            0,
          )
          const safeMax = maxProb > 0 ? maxProb : 1

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

          return (
            <svg
              className="math-chart"
              viewBox={`0 0 ${chartW} ${chartH}`}
              role="img"
              aria-label={`Curve of probability the workout ends on spin k (k = 1..${lengthCurvePoints}).`}
            >
              <rect x="0" y="0" width={chartW} height={chartH} rx="10" ry="10" />

              <g>
                <line x1={pad} y1={chartH - pad} x2={chartW - pad} y2={chartH - pad} />
                <line x1={pad} y1={pad} x2={pad} y2={chartH - pad} />
              </g>

              <polyline points={points} />

              <g>
                <line x1={expectedX} y1={pad} x2={expectedX} y2={chartH - pad} />
                <text x={expectedX} y={pad + 10} textAnchor="middle">
                  E[L]
                </text>
              </g>

              <g>
                <text x={pad} y={chartH - 2} textAnchor="start">
                  1
                </text>
                <text x={chartW - pad} y={chartH - 2} textAnchor="end">
                  {lengthCurvePoints}
                </text>
              </g>
            </svg>
          )
        })()}

        <div className="math-mini-table" aria-label="Chance the workout has ended within N spins">
          <div>
            <span className="math-mono">P(L ≤ 5)</span>: {formatPercent(math.chanceEndWithin(5))}
            <span className="math-duration">≤ {(4 * math.expectedDurationPerSpin).toFixed(0)} min</span>
          </div>
          <div>
            <span className="math-mono">P(L ≤ 10)</span>: {formatPercent(math.chanceEndWithin(10))}
            <span className="math-duration">≤ {(9 * math.expectedDurationPerSpin).toFixed(0)} min</span>
          </div>
          <div>
            <span className="math-mono">P(L ≤ 20)</span>: {formatPercent(math.chanceEndWithin(20))}
            <span className="math-duration">≤ {(19 * math.expectedDurationPerSpin).toFixed(0)} min</span>
            <InfoPopup explanationKey="cdf" activePopup={activePopup} setActivePopup={setActivePopup} math={math} />
          </div>
        </div>
      </div>
    </div>
  )
}
