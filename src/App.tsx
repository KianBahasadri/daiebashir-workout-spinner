import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const MATH_EXPLANATIONS = {
  exitProbability: {
    title: 'Exit Probability',
    content: `This is the chance of landing on any exit condition each spin. Calculated as: (sum of exit exercise weights) ÷ (total weight of all exercises). With equal weights, it's simply: (number of exit exercises) ÷ (total exercises).`,
  },
  exitConditions: {
    title: 'Exit Conditions',
    content: `The number of exercises marked as "exit conditions" - landing on any of these ends the workout. These are exercises like "end workout" or rewards like "shawarma".`,
  },
  avgSpins: {
    title: 'Average Spins Until End',
    content: `The expected number of spins before hitting an exit condition. This follows a geometric distribution where E[X] = 1/p, where p is the exit probability. Example: if p = 25%, you'd expect 4 spins on average.`,
  },
  avgExercises: {
    title: 'Average Exercises Before End',
    content: `The expected number of actual exercises you'll do before the workout ends. This is (1-p)/p where p is the exit probability - essentially the average spins minus the final exit spin itself.`,
  },
  avgDuration: {
    title: 'Average Duration Per Exercise',
    content: `The weighted average duration of non-exit exercises. Each exercise's duration is multiplied by its probability of being selected (given you didn't hit an exit), then summed up.`,
  },
  totalDuration: {
    title: 'Expected Workout Duration',
    content: `Total expected workout time = (average exercises before end) × (average duration per exercise). This gives you a rough idea of how long your workout will last.`,
  },
  shawarma: {
    title: 'Workouts Until Shawarma',
    content: `Given that each workout ends with some exit condition, this is the expected number of complete workouts until one specifically ends with shawarma. Calculated as: (total exit weight) ÷ (shawarma weight). The ultimate reward!`,
  },
  lengthCurve: {
    title: 'Workout Length Curve',
    content: `This shows the geometric distribution of workout length. The probability of ending on exactly spin k is: (1-p)^(k-1) × p. The curve decays exponentially - most workouts end early, but some can go long!`,
  },
  cdf: {
    title: 'Cumulative Probability',
    content: `P(L ≤ n) is the probability your workout ends within n spins. Calculated as 1 - (1-p)^n. This tells you "what's the chance I'm done by spin n?"`,
  },
  weights: {
    title: 'Weight System',
    content: `Each exercise has a weight that determines how likely it is to be selected. The expected hits per workout = (average exercises before end) × (exercise weight ÷ total weight). Higher weight = more expected hits per workout.`,
  },
} as const

type ExplanationKey = keyof typeof MATH_EXPLANATIONS

function InfoPopup({ explanationKey, activePopup, setActivePopup }: {
  explanationKey: ExplanationKey
  activePopup: ExplanationKey | null
  setActivePopup: (key: ExplanationKey | null) => void
}) {
  const isOpen = activePopup === explanationKey
  const explanation = MATH_EXPLANATIONS[explanationKey]

  return (
    <span className="info-popup-container">
      <button
        type="button"
        className={`info-button${isOpen ? ' active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setActivePopup(isOpen ? null : explanationKey)
        }}
        aria-label={`Explain: ${explanation.title}`}
      >
        ?
      </button>
      {isOpen && (
        <div className="info-popup" onClick={(e) => e.stopPropagation()}>
          <div className="info-popup-header">
            <strong>{explanation.title}</strong>
            <button
              type="button"
              className="info-popup-close"
              onClick={() => setActivePopup(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p>{explanation.content}</p>
        </div>
      )}
    </span>
  )
}

type Exercise = {
  name: string
  color: string
  /**
   * Relative weight (>= 0). Higher = more likely.
   * These are treated as weights and normalized at runtime.
   */
  weight: number
  /** Duration of the exercise in minutes */
  duration: number
  /** Whether landing on this exercise ends the workout */
  isExitCondition: boolean
}

const EXERCISES: Exercise[] = [
  { name: '10 mins run', color: '#FF6B6B', weight: 1, duration: 10, isExitCondition: false },
  { name: '10 mins row', color: '#4ECDC4', weight: 1, duration: 10, isExitCondition: false },
  { name: '10 mins cycle', color: '#45B7D1', weight: 1, duration: 10, isExitCondition: false },
  { name: '1 min battle ropes', color: '#96CEB4', weight: 1, duration: 1, isExitCondition: false },
  { name: '2 mins pushups', color: '#FFEAA7', weight: 1, duration: 2, isExitCondition: false },
  { name: '1 min plank', color: '#DDA0DD', weight: 1, duration: 1, isExitCondition: false },
  { name: 'end workout', color: '#98D8C8', weight: 1, duration: 0, isExitCondition: true },
  { name: 'shawarama', color: '#F7DC6F', weight: 0.25, duration: 0, isExitCondition: true },
]

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

const measureReelMetrics = (reelEl: HTMLDivElement | null, trackEl: HTMLDivElement | null) => {
  const measuredReelWidth = reelEl?.getBoundingClientRect().width ?? 0
  let measuredCardWidth = CARD_WIDTH
  let measuredStride = CARD_WIDTH + CARD_GAP

  if (!trackEl) return { reelWidth: measuredReelWidth, cardWidth: measuredCardWidth, stride: measuredStride }

  const firstItem = trackEl.querySelector<HTMLElement>('.reel-item')
  const secondItem = firstItem?.nextElementSibling as HTMLElement | null

  if (firstItem) measuredCardWidth = firstItem.getBoundingClientRect().width || CARD_WIDTH

  if (firstItem && secondItem) {
    const firstRect = firstItem.getBoundingClientRect()
    const secondRect = secondItem.getBoundingClientRect()
    const s = secondRect.left - firstRect.left
    if (s > 0) measuredStride = s
  }

  return { reelWidth: measuredReelWidth, cardWidth: measuredCardWidth, stride: measuredStride }
}

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
  const [activePopup, setActivePopup] = useState<ExplanationKey | null>(null)
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
      const metrics = measureReelMetrics(reelRef.current, trackRef.current)
      setReelWidth(metrics.reelWidth)
      setCardWidth(metrics.cardWidth)
      setStride(metrics.stride)
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

    // Calculate exit probability using isExitCondition
    const exitExercises = EXERCISES.filter((exercise) => exercise.isExitCondition)
    const exitWeight = exitExercises.reduce((sum, exercise) => sum + clampWeight(exercise.weight), 0)

    const exitProbability = usesUniformFallback
      ? exitExercises.length > 0
        ? exitExercises.length / EXERCISES.length
        : 0
      : exitWeight / totalWeight

    // Calculate shawarma-specific stats
    const shawarmaExercise = EXERCISES.find((exercise) => exercise.name.toLowerCase().includes('shawarama') || exercise.name.toLowerCase().includes('shawarma'))
    const shawarmaWeight = clampWeight(shawarmaExercise?.weight ?? 0)
    const shawarmaGivenExit = exitWeight > 0 ? shawarmaWeight / exitWeight : 0
    const expectedWorkoutsUntilShawarma = shawarmaGivenExit > 0 ? 1 / shawarmaGivenExit : Number.POSITIVE_INFINITY

    const expectedSpinsUntilEnd = exitProbability > 0 ? 1 / exitProbability : Number.POSITIVE_INFINITY
    const expectedExercisesBeforeEnd =
      exitProbability > 0 ? (1 - exitProbability) / exitProbability : Number.POSITIVE_INFINITY

    // Calculate expected duration per non-exit spin
    const nonExitExercises = EXERCISES.filter((exercise) => !exercise.isExitCondition)
    const nonExitWeight = nonExitExercises.reduce((sum, exercise) => sum + clampWeight(exercise.weight), 0)
    
    const expectedDurationPerSpin = usesUniformFallback
      ? nonExitExercises.length > 0
        ? nonExitExercises.reduce((sum, exercise) => sum + exercise.duration, 0) / nonExitExercises.length
        : 0
      : nonExitWeight > 0
        ? nonExitExercises.reduce((sum, exercise) => sum + clampWeight(exercise.weight) * exercise.duration, 0) / nonExitWeight
        : 0

    // Expected total workout duration = expected exercises before end × expected duration per exercise
    const expectedTotalDuration = Number.isFinite(expectedExercisesBeforeEnd)
      ? expectedExercisesBeforeEnd * expectedDurationPerSpin
      : Number.POSITIVE_INFINITY

    const cdf = (spins: number) => {
      if (exitProbability <= 0) return 0
      if (spins <= 0) return 0
      return 1 - Math.pow(1 - exitProbability, spins)
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
        // Expected hits per workout = expected exercises before end × probability per spin
        const expectedHitsPerWorkout = Number.isFinite(expectedExercisesBeforeEnd)
          ? expectedExercisesBeforeEnd * perItemProbability
          : Number.POSITIVE_INFINITY
        return { 
          weight, 
          exercises, 
          perItemProbability, 
          groupProbability,
          expectedHitsPerWorkout 
        }
      })
      .sort((a, b) => b.weight - a.weight || b.exercises.length - a.exercises.length)

    const lengthCurve = Array.from({ length: LENGTH_CURVE_POINTS }, (_, i) => {
      const spins = i + 1
      const probabilityEndOnSpin =
        exitProbability > 0 ? Math.pow(1 - exitProbability, spins - 1) * exitProbability : 0
      // Expected duration if workout ends on this spin (spins - 1 exercises completed before exit)
      const durationAtSpin = (spins - 1) * expectedDurationPerSpin
      return { spins, probabilityEndOnSpin, durationAtSpin }
    })

    return {
      totalWeight,
      usesUniformFallback,
      exitProbability,
      expectedSpinsUntilEnd,
      expectedExercisesBeforeEnd,
      expectedDurationPerSpin,
      expectedTotalDuration,
      exitExerciseCount: exitExercises.length,
      shawarmaGivenExit,
      expectedWorkoutsUntilShawarma,
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
      const metrics = measureReelMetrics(reelRef.current, trackRef.current)
      const latestReelWidth = metrics.reelWidth || reelWidth
      const latestCardWidth = metrics.cardWidth || cardWidth
      const latestStride = metrics.stride || stride

      // Keep state in sync with the DOM in case the user resized mid-spin.
      setReelWidth(latestReelWidth)
      setCardWidth(latestCardWidth)
      setStride(latestStride)

      const latestIndex = getNearestIndexForOffset(
        targetOffset,
        latestReelWidth,
        latestCardWidth,
        latestStride,
      )
      const maxIndex = trackItems.length - 1
      const snappedIndex = Math.max(0, Math.min(latestIndex, maxIndex))
      const snappedOffset = getOffsetForIndex(snappedIndex, latestReelWidth, latestCardWidth, latestStride)

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

      <section className="math" aria-label="Math and odds" onClick={() => setActivePopup(null)}>
        <h2>Math</h2>

        <div className="math-grid">
          <div className="math-card">
            <h3>How likely the game is to end</h3>
            <dl className="math-kpis">
              <div className="math-kpi">
                <dt>
                  Chance to hit exit condition (per spin)
                  <InfoPopup explanationKey="exitProbability" activePopup={activePopup} setActivePopup={setActivePopup} />
                </dt>
                <dd>{formatPercent(math.exitProbability)}</dd>
              </div>
              <div className="math-kpi">
                <dt>
                  Average exercises before end
                  <InfoPopup explanationKey="avgExercises" activePopup={activePopup} setActivePopup={setActivePopup} />
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
                  <InfoPopup explanationKey="avgDuration" activePopup={activePopup} setActivePopup={setActivePopup} />
                </dt>
                <dd>{math.expectedDurationPerSpin.toFixed(1)} min</dd>
              </div>
              <div className="math-kpi">
                <dt>
                  Expected workout duration
                  <InfoPopup explanationKey="totalDuration" activePopup={activePopup} setActivePopup={setActivePopup} />
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
                  <InfoPopup explanationKey="shawarma" activePopup={activePopup} setActivePopup={setActivePopup} />
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
              <InfoPopup explanationKey="lengthCurve" activePopup={activePopup} setActivePopup={setActivePopup} />
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
                <span className="math-duration">≤ {(4 * math.expectedDurationPerSpin).toFixed(0)} min</span>
              </div>
              <div>
                <span className="math-mono">P(L ≤ 10)</span>: {formatPercent(math.chanceEndWithin(10))}
                <span className="math-duration">≤ {(9 * math.expectedDurationPerSpin).toFixed(0)} min</span>
              </div>
              <div>
                <span className="math-mono">P(L ≤ 20)</span>: {formatPercent(math.chanceEndWithin(20))}
                <span className="math-duration">≤ {(19 * math.expectedDurationPerSpin).toFixed(0)} min</span>
                <InfoPopup explanationKey="cdf" activePopup={activePopup} setActivePopup={setActivePopup} />
              </div>
            </div>
          </div>

          <div className="math-card math-card--full">
            <h3>
              Odds by weight (grouped)
              <InfoPopup explanationKey="weights" activePopup={activePopup} setActivePopup={setActivePopup} />
            </h3>
            <p className="math-subtitle">
              Expected number of times you'll hit each exercise per workout. Items with identical weights are grouped below.
            </p>

            <div className="weight-groups">
              {math.groupedByWeight.map((group) => (
                <div key={group.weight} className="weight-group">
                  <div className="weight-group-header">
                    <div className="weight-group-title">
                      Weight <span className="math-mono">{group.weight}</span>
                    </div>
                    <div className="weight-group-odds">
                      <span className="math-mono">
                        {Number.isFinite(group.expectedHitsPerWorkout)
                          ? group.expectedHitsPerWorkout.toFixed(2)
                          : '∞'}
                      </span>{' '}
                      hits per workout each
                    </div>
                  </div>

                  <div className="weight-group-items">
                    {group.exercises.map((exercise) => (
                      <span
                        key={exercise.name}
                        className={`weight-pill${exercise.isExitCondition ? ' end' : ''}`}
                        style={{ backgroundColor: exercise.color }}
                        title={`${exercise.name}: ${Number.isFinite(group.expectedHitsPerWorkout) ? group.expectedHitsPerWorkout.toFixed(2) : '∞'} hits per workout, ${exercise.duration} min${exercise.isExitCondition ? ' (exit)' : ''}`}
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
