import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { SessionsTab } from './SessionsTab'
import { ExercisesTab } from './ExercisesTab'
import { RulesTab } from './RulesTab'
import { useRouletteSound } from './useRouletteSound'
import { type Exercise, type ExplanationKey, type MathStats } from './types.tsx'

const EXERCISES: Exercise[] = [
  { name: '10 mins run', color: '#FF6B6B', weight: 1, duration: 10, isExitCondition: false },
  { name: '10 mins row', color: '#4ECDC4', weight: 1, duration: 10, isExitCondition: false },
  { name: '10 mins cycle', color: '#45B7D1', weight: 1, duration: 10, isExitCondition: false },
  { name: '1 min battle ropes', color: '#96CEB4', weight: 1, duration: 1, isExitCondition: false },
  { name: '2 mins pushups', color: '#FFEAA7', weight: 1, duration: 2, isExitCondition: false },
  { name: '1 min plank', color: '#DDA0DD', weight: 1, duration: 1, isExitCondition: false },
  { name: 'shawarama', color: '#F7DC6F', weight: 0.25, duration: 0, isExitCondition: true },
]

const LENGTH_CURVE_TARGET_CDF = 0.95

const spinsForCdf = (p: number, targetCdf: number) => {
  if (!Number.isFinite(p) || p <= 0) return Number.POSITIVE_INFINITY
  if (p >= 1) return 1
  const clampedTarget = Math.max(0, Math.min(0.999999, targetCdf))
  // Smallest k such that 1 - (1 - p)^k >= targetCdf
  return Math.max(1, Math.ceil(Math.log(1 - clampedTarget) / Math.log(1 - p)))
}

const clampWeight = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0)

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

const getTranslateXFromComputedTransform = (el: HTMLElement) => {
  const transform = window.getComputedStyle(el).transform
  if (!transform || transform === 'none') return 0

  // `matrix(a, b, c, d, tx, ty)`
  if (transform.startsWith('matrix(')) {
    const values = transform.slice(7, -1).split(',').map((v) => Number.parseFloat(v.trim()))
    if (values.length >= 6 && Number.isFinite(values[4])) return values[4]
    return 0
  }

  // `matrix3d(..., tx, ty, tz)`
  if (transform.startsWith('matrix3d(')) {
    const values = transform.slice(9, -1).split(',').map((v) => Number.parseFloat(v.trim()))
    if (values.length >= 16 && Number.isFinite(values[12])) return values[12]
    return 0
  }

  return 0
}

function App() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activePopup, setActivePopup] = useState<ExplanationKey | null>(null)
  const [mathTab, setMathTab] = useState<'sessions' | 'exercises' | 'rules'>('sessions')
  const [currentIndex, setCurrentIndex] = useState(4 * EXERCISES.length)
  const [offset, setOffset] = useState(0)
  const [reelWidth, setReelWidth] = useState(0)
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH)
  const [stride, setStride] = useState(CARD_WIDTH + CARD_GAP)
  const reelRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const { initAudioContext, playTick } = useRouletteSound()
  const tickRafRef = useRef<number | null>(null)
  const lastTickIndexRef = useRef<number | null>(null)
  const lastTickAtMsRef = useRef(0)

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

  useEffect(() => {
    if (!isSpinning) {
      if (tickRafRef.current !== null) {
        window.cancelAnimationFrame(tickRafRef.current)
        tickRafRef.current = null
      }
      lastTickIndexRef.current = null
      return
    }

    const loop = () => {
      const trackEl = trackRef.current
      const reelEl = reelRef.current
      if (!trackEl || !reelEl) return

      const metrics = measureReelMetrics(reelEl, trackEl)
      const latestReelWidth = metrics.reelWidth || reelWidth
      const latestCardWidth = metrics.cardWidth || cardWidth
      const latestStride = metrics.stride || stride

      if (!latestReelWidth) {
        tickRafRef.current = window.requestAnimationFrame(loop)
        return
      }

      const currentTranslateX = getTranslateXFromComputedTransform(trackEl)
      const rawIndex = getNearestIndexForOffset(
        currentTranslateX,
        latestReelWidth,
        latestCardWidth,
        latestStride,
      )

      const maxIndex = trackItems.length - 1
      const clampedIndex = Math.max(0, Math.min(rawIndex, maxIndex))

      const lastIndex = lastTickIndexRef.current
      if (lastIndex === null) {
        lastTickIndexRef.current = clampedIndex
      } else if (clampedIndex !== lastIndex) {
        const nowMs = performance.now()
        // Prevent double-firing due to rounding jitter around boundaries.
        if (nowMs - lastTickAtMsRef.current > 25) {
          playTick()
          lastTickAtMsRef.current = nowMs
        }
        lastTickIndexRef.current = clampedIndex
      }

      tickRafRef.current = window.requestAnimationFrame(loop)
    }

    tickRafRef.current = window.requestAnimationFrame(loop)

    return () => {
      if (tickRafRef.current !== null) {
        window.cancelAnimationFrame(tickRafRef.current)
        tickRafRef.current = null
      }
      lastTickIndexRef.current = null
    }
  }, [cardWidth, isSpinning, playTick, reelWidth, stride, trackItems.length])

  const math = useMemo((): MathStats => {
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

    // Expected total workout duration = expected exercises before shawarma × expected duration per exercise
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
        
        // Check if this group contains exit conditions
        const hasExitConditions = exercises.some(e => e.isExitCondition)
        
        // Expected hits per workout:
        // - For exit conditions: P(ending with this exit) = weight / exitWeight
        // - For regular exercises: expectedExercisesBeforeEnd × perItemProbability
        const expectedHitsPerWorkout = hasExitConditions
          ? exitWeight > 0 ? weight / exitWeight : 0
          : Number.isFinite(expectedExercisesBeforeEnd)
            ? expectedExercisesBeforeEnd * perItemProbability
            : Number.POSITIVE_INFINITY
        
        return { 
          weight, 
          exercises, 
          perItemProbability, 
          groupProbability,
          expectedHitsPerWorkout,
          hasExitConditions
        }
      })
      .sort((a, b) => b.weight - a.weight || b.exercises.length - a.exercises.length)

    const k95 = spinsForCdf(exitProbability, LENGTH_CURVE_TARGET_CDF)
    const lengthCurvePoints = Number.isFinite(k95) ? k95 : 20

    const lengthCurve = Array.from({ length: lengthCurvePoints }, (_, i) => {
      const spins = i + 1
      const probabilityEndOnSpin =
        exitProbability > 0 ? Math.pow(1 - exitProbability, spins - 1) * exitProbability : 0
      // Expected duration if workout ends on this spin (spins - 1 exercises completed before exit)
      const durationAtSpin = (spins - 1) * expectedDurationPerSpin
      return { spins, probabilityEndOnSpin, durationAtSpin }
    })

    return {
      totalWeight,
      exitWeight,
      nonExitWeight,
      usesUniformFallback,
      exitProbability,
      expectedSpinsUntilEnd,
      expectedExercisesBeforeEnd,
      expectedDurationPerSpin,
      expectedTotalDuration,
      exitExerciseCount: exitExercises.length,
      shawarmaWeight,
      shawarmaGivenExit,
      expectedWorkoutsUntilShawarma,
      chanceEndWithin: cdf,
      groupedByWeight,
      lengthCurve,
    }
  }, [])

  const spin = () => {
    if (isSpinning || !reelWidth) return

    // Initialize audio context within the user gesture so tick sounds can play during the animation.
    initAudioContext()

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
        <div className="math-tabs">
          <button
            className={`math-tab${mathTab === 'sessions' ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setMathTab('sessions'); }}
            type="button"
          >
            Sessions
          </button>
          <button
            className={`math-tab${mathTab === 'exercises' ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setMathTab('exercises'); }}
            type="button"
          >
            Exercises
          </button>
          <button
            className={`math-tab${mathTab === 'rules' ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setMathTab('rules'); }}
            type="button"
          >
            Rules
          </button>
        </div>

        {mathTab === 'sessions' && (
          <SessionsTab
            math={math}
            activePopup={activePopup}
            setActivePopup={setActivePopup}
          />
        )}

        {mathTab === 'exercises' && (
          <ExercisesTab
            math={math}
            activePopup={activePopup}
            setActivePopup={setActivePopup}
          />
        )}

        {mathTab === 'rules' && (
          <RulesTab />
        )}
      </section>
    </div>
  )
}

export default App
