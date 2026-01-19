import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type Exercise = {
  name: string
  color: string
  /**
   * Relative weight (>= 0). Higher = more likely.
   * These are treated as weights and normalized at runtime.
   */
  weight: number
}

const EXERCISES: Exercise[] = [
  { name: '10 mins run', color: '#FF6B6B', weight: 1 },
  { name: '10 mins row', color: '#4ECDC4', weight: 1 },
  { name: '10 mins cycle', color: '#45B7D1', weight: 1 },
  { name: '1 min battle ropes', color: '#96CEB4', weight: 1 },
  { name: '15 pushups', color: '#FFEAA7', weight: 1 },
  { name: '1 min plank', color: '#DDA0DD', weight: 1 },
  { name: 'end workout', color: '#98D8C8', weight: 1 },
  { name: 'shawarama', color: '#F7DC6F', weight: 1 },
]

const END_WORKOUT_NAME = 'end workout'
const LENGTH_CURVE_POINTS = 20

const clampWeight = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0)

const formatPercent = (probability: number) => {
  if (!Number.isFinite(probability) || probability <= 0) return '0%'
  const pct = probability * 100
  if (pct >= 10) return `${pct.toFixed(1)}%`
  if (pct >= 1) return `${pct.toFixed(2)}%`
  return `${pct.toFixed(3)}%`
}

const pickExerciseIndex = () => {
  const total = EXERCISES.reduce((sum, exercise) => sum + Math.max(0, exercise.weight), 0)

  // Fallback to uniform if weights are all 0/invalid.
  if (total <= 0) return Math.floor(Math.random() * EXERCISES.length)

  const roll = Math.random() * total
  let cumulative = 0

  for (let i = 0; i < EXERCISES.length; i += 1) {
    cumulative += Math.max(0, EXERCISES[i].weight)
    if (roll < cumulative) return i
  }

  return EXERCISES.length - 1
}

const SPIN_DURATION_MS = 4000
const CARD_WIDTH = 160
const CARD_GAP = 16
const TRACK_REPEATS = 500
const MIN_LOOPS = 4
const MAX_LOOPS = 7

const getOffsetForIndex = (index: number, reelWidth: number, cardWidth: number, stride: number) => {
  const pointerX = reelWidth / 2
  const itemCenter = index * stride + cardWidth / 2
  return Math.round(pointerX - itemCenter)
}

const getNearestIndexForOffset = (offset: number, reelWidth: number, cardWidth: number, stride: number) => {
  const pointerX = reelWidth / 2
  const rawIndex = (pointerX - offset - cardWidth / 2) / stride
  return Math.round(rawIndex)
}

function App() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(4 * EXERCISES.length)
  const [offset, setOffset] = useState(0)
  const [reelWidth, setReelWidth] = useState(0)
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH)
  const [stride, setStride] = useState(CARD_WIDTH + CARD_GAP)
  const reelRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const trackItems = useMemo(() => {
    const items: Array<{ name: string; color: string; key: string }> = []
    for (let repeat = 0; repeat < TRACK_REPEATS; repeat += 1) {
      for (const exercise of EXERCISES) {
        items.push({
          name: exercise.name,
          color: exercise.color,
          key: `${repeat}-${exercise.name}`,
        })
      }
    }
    return items
  }, [])

  useEffect(() => {
    const measure = () => {
      const reelEl = reelRef.current
      const trackEl = trackRef.current

      setReelWidth(reelEl?.offsetWidth ?? 0)

      if (!trackEl) return

      const firstItem = trackEl.querySelector<HTMLElement>('.reel-item')
      const secondItem = firstItem?.nextElementSibling as HTMLElement | null

      if (firstItem) {
        setCardWidth(firstItem.offsetWidth || CARD_WIDTH)
      }

      if (firstItem && secondItem) {
        const measuredStride = secondItem.offsetLeft - firstItem.offsetLeft
        if (measuredStride > 0) setStride(measuredStride)
      }
    }

    measure()
    window.addEventListener('resize', measure)

    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (isSpinning) return
    if (!reelWidth) return
    setOffset(getOffsetForIndex(currentIndex, reelWidth, cardWidth, stride))
  }, [cardWidth, currentIndex, isSpinning, reelWidth, stride])

  const math = useMemo(() => {
    const totalWeight = EXERCISES.reduce((sum, exercise) => sum + clampWeight(exercise.weight), 0)
    const usesUniformFallback = totalWeight <= 0
    const endExercise = EXERCISES.find((exercise) => exercise.name === END_WORKOUT_NAME)
    const endWeight = clampWeight(endExercise?.weight ?? 0)

    const endProbability = usesUniformFallback
      ? endExercise
        ? 1 / EXERCISES.length
        : 0
      : endWeight / totalWeight
    const expectedSpinsUntilEnd = endProbability > 0 ? 1 / endProbability : Number.POSITIVE_INFINITY
    const expectedExercisesBeforeEnd =
      endProbability > 0 ? (1 - endProbability) / endProbability : Number.POSITIVE_INFINITY

    const cdf = (spins: number) => {
      if (endProbability <= 0) return 0
      if (spins <= 0) return 0
      return 1 - Math.pow(1 - endProbability, spins)
    }

    const groupsMap = new Map<number, Exercise[]>()
    for (const exercise of EXERCISES) {
      const w = clampWeight(exercise.weight)
      const group = groupsMap.get(w)
      if (group) group.push(exercise)
      else groupsMap.set(w, [exercise])
    }

    const groupedByWeight = Array.from(groupsMap.entries())
      .map(([weight, exercises]) => {
        const perItemProbability = usesUniformFallback ? 1 / EXERCISES.length : weight / totalWeight
        const groupProbability = usesUniformFallback
          ? exercises.length / EXERCISES.length
          : perItemProbability * exercises.length
        return { weight, exercises, perItemProbability, groupProbability }
      })
      .sort((a, b) => b.weight - a.weight || b.exercises.length - a.exercises.length)

    const lengthCurve = Array.from({ length: LENGTH_CURVE_POINTS }, (_, i) => {
      const spins = i + 1
      const probabilityEndOnSpin =
        endProbability > 0 ? Math.pow(1 - endProbability, spins - 1) * endProbability : 0
      return { spins, probabilityEndOnSpin }
    })

    return {
      totalWeight,
      usesUniformFallback,
      endProbability,
      expectedSpinsUntilEnd,
      expectedExercisesBeforeEnd,
      chanceEndWithin: cdf,
      groupedByWeight,
      lengthCurve,
    }
  }, [])

  const spin = () => {
    if (isSpinning || !reelWidth) return

    setIsSpinning(true)
    setSelectedExercise(null)
    setSelectedIndex(null)

    const loops = MIN_LOOPS + Math.floor(Math.random() * (MAX_LOOPS - MIN_LOOPS + 1))
    const exerciseIndex = pickExerciseIndex()
    
    // Calculate distance to target to ensure we land exactly on the item
    const currentRelativeIndex = currentIndex % EXERCISES.length
    const distanceToTarget = (exerciseIndex - currentRelativeIndex + EXERCISES.length) % EXERCISES.length
    
    const targetIndex = currentIndex + loops * EXERCISES.length + distanceToTarget
    const targetOffset = getOffsetForIndex(targetIndex, reelWidth, cardWidth, stride)

    setOffset(targetOffset)

    window.setTimeout(() => {
      // Snap to the nearest card center (prevents ever landing in the gap,
      // even if sizes changed during the spin).
      const latestReelWidth = reelRef.current?.offsetWidth ?? reelWidth
      const latestIndex = getNearestIndexForOffset(targetOffset, latestReelWidth, cardWidth, stride)
      const maxIndex = trackItems.length - 1
      const snappedIndex = Math.max(0, Math.min(latestIndex, maxIndex))
      const snappedOffset = getOffsetForIndex(snappedIndex, latestReelWidth, cardWidth, stride)

      setOffset(snappedOffset)
      setSelectedExercise(EXERCISES[snappedIndex % EXERCISES.length].name)
      setCurrentIndex(snappedIndex)
      setSelectedIndex(snappedIndex)
      setIsSpinning(false)
    }, SPIN_DURATION_MS)
  }

  return (
    <div className="app">
      <h1>Workout Roulette</h1>

      <div className="roulette">
        <div className="pointer" aria-hidden="true">
          ▼
        </div>
        <div className="reel-window" ref={reelRef}>
          <div
            className="reel-track"
            ref={trackRef}
            style={{
              transform: `translateX(${offset}px)`,
              transition: isSpinning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.2, 0.9, 0.2, 1)`
                : 'none',
            }}
          >
            {trackItems.map((exercise, index) => (
              <div
                key={exercise.key}
                className={`reel-item${index === selectedIndex ? ' selected' : ''}`}
                style={{ backgroundColor: exercise.color }}
              >
                {exercise.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="spin-button" onClick={spin} disabled={isSpinning} type="button">
        {isSpinning ? 'Spinning...' : 'SPIN!'}
      </button>

      {selectedExercise && (
        <div className="result">
          <h2>Your exercise:</h2>
          <p className="exercise-name">{selectedExercise}</p>
        </div>
      )}

      <section className="math" aria-label="Math and odds">
        <h2>Math</h2>

        <div className="math-grid">
          <div className="math-card">
            <h3>How likely the game is to end</h3>
            <dl className="math-kpis">
              <div className="math-kpi">
                <dt>Chance to land on “{END_WORKOUT_NAME}” (per spin)</dt>
                <dd>{formatPercent(math.endProbability)}</dd>
              </div>
              <div className="math-kpi">
                <dt>Average spins until end</dt>
                <dd>
                  {Number.isFinite(math.expectedSpinsUntilEnd)
                    ? math.expectedSpinsUntilEnd.toFixed(2)
                    : '∞'}
                </dd>
              </div>
              <div className="math-kpi">
                <dt>Average exercises before end</dt>
                <dd>
                  {Number.isFinite(math.expectedExercisesBeforeEnd)
                    ? math.expectedExercisesBeforeEnd.toFixed(2)
                    : '∞'}
                </dd>
              </div>
            </dl>

            <p className="math-note">
              Assumes each spin is independent, using the same weights each time.
            </p>
          </div>

          <div className="math-card">
            <h3>Workout length curve</h3>
            <p className="math-subtitle">
              Likelihood the workout ends on spin <span className="math-mono">k</span> (geometric
              distribution). Mean is <span className="math-mono">E[L] = 1 / p</span>.
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
                ? Math.max(0, Math.min(1, (expected - 1) / (LENGTH_CURVE_POINTS - 1)))
                : 1
              const expectedX = pad + expectedT * innerW

              return (
                <svg
                  className="math-chart"
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  role="img"
                  aria-label={`Curve of probability the workout ends on spin k (k = 1..${LENGTH_CURVE_POINTS}).`}
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
                      {LENGTH_CURVE_POINTS}
                    </text>
                  </g>
                </svg>
              )
            })()}

            <div className="math-mini-table" aria-label="Chance the workout has ended within N spins">
              <div>
                <span className="math-mono">P(L ≤ 5)</span>: {formatPercent(math.chanceEndWithin(5))}
              </div>
              <div>
                <span className="math-mono">P(L ≤ 10)</span>: {formatPercent(math.chanceEndWithin(10))}
              </div>
              <div>
                <span className="math-mono">P(L ≤ 20)</span>: {formatPercent(math.chanceEndWithin(20))}
              </div>
            </div>
          </div>

          <div className="math-card math-card--full">
            <h3>Odds by weight (grouped)</h3>
            <p className="math-subtitle">
              Each item’s chance per spin is <span className="math-mono">weight / totalWeight</span>.
              Items with identical weights are grouped below.
            </p>

            <div className="weight-groups">
              {math.groupedByWeight.map((group) => (
                <div key={group.weight} className="weight-group">
                  <div className="weight-group-header">
                    <div className="weight-group-title">
                      Weight <span className="math-mono">{group.weight}</span>
                    </div>
                    <div className="weight-group-odds">
                      <span className="math-mono">{formatPercent(group.perItemProbability)}</span> each
                      · <span className="math-mono">{formatPercent(group.groupProbability)}</span> total
                    </div>
                  </div>

                  <div className="weight-group-items">
                    {group.exercises.map((exercise) => (
                      <span
                        key={exercise.name}
                        className={`weight-pill${exercise.name === END_WORKOUT_NAME ? ' end' : ''}`}
                        style={{ backgroundColor: exercise.color }}
                        title={`${exercise.name}: ${formatPercent(group.perItemProbability)} per spin`}
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
      </section>
    </div>
  )
}

export default App
