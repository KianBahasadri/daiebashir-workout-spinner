import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { SessionsTab } from './SessionsTab'
import { ExercisesTab } from './ExercisesTab'
import { type Exercise, type ExplanationKey, type MathStats } from './types.tsx'

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
const TRACK_REPEATS = 500
const MIN_LOOPS = 4
const MAX_LOOPS = 7

// Calculate the width multiplier for each exercise based on its probability
const calculateExerciseWidths = () => {
  const totalWeight = EXERCISES.reduce((sum, exercise) => sum + Math.max(0, exercise.weight), 0)
  
  // Fallback to uniform if weights are all 0/invalid
  if (totalWeight <= 0) {
    return EXERCISES.map(() => 1)
  }
  
  // Calculate probability for each exercise
  return EXERCISES.map(exercise => {
    const probability = Math.max(0, exercise.weight) / totalWeight
    // Width is proportional to probability
    return probability
  })
}

const EXERCISE_WIDTH_MULTIPLIERS = calculateExerciseWidths()

const measureReelMetrics = (reelEl: HTMLDivElement | null, trackEl: HTMLDivElement | null) => {
  const measuredReelWidth = reelEl?.getBoundingClientRect().width ?? 0
  
  if (!trackEl) return { reelWidth: measuredReelWidth, itemPositions: [] as number[] }

  // Measure actual positions of all items
  const items = trackEl.querySelectorAll<HTMLElement>('.reel-item')
  const itemPositions: number[] = []
  
  items.forEach((item) => {
    const rect = item.getBoundingClientRect()
    const trackRect = trackEl.getBoundingClientRect()
    // Store the center position of each item relative to track
    itemPositions.push(rect.left - trackRect.left + rect.width / 2)
  })

  return { reelWidth: measuredReelWidth, itemPositions }
}

const getOffsetForIndex = (index: number, reelWidth: number, itemPositions: number[]) => {
  if (itemPositions.length === 0 || index >= itemPositions.length) return 0
  
  const pointerX = reelWidth / 2
  const itemCenter = itemPositions[index]
  return Math.round(pointerX - itemCenter)
}

const getNearestIndexForOffset = (offset: number, reelWidth: number, itemPositions: number[]) => {
  if (itemPositions.length === 0) return 0
  
  const pointerX = reelWidth / 2
  const targetX = pointerX - offset
  
  // Find the item whose center is closest to the target position
  let nearestIndex = 0
  let minDistance = Math.abs(itemPositions[0] - targetX)
  
  for (let i = 1; i < itemPositions.length; i++) {
    const distance = Math.abs(itemPositions[i] - targetX)
    if (distance < minDistance) {
      minDistance = distance
      nearestIndex = i
    }
  }
  
  return nearestIndex
}

function App() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activePopup, setActivePopup] = useState<ExplanationKey | null>(null)
  const [mathTab, setMathTab] = useState<'sessions' | 'exercises'>('sessions')
  const [currentIndex, setCurrentIndex] = useState(4 * EXERCISES.length)
  const [offset, setOffset] = useState(0)
  const [reelWidth, setReelWidth] = useState(0)
  const [itemPositions, setItemPositions] = useState<number[]>([])
  const reelRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const trackItems = useMemo(() => {
    const items: Array<{ name: string; color: string; key: string; widthMultiplier: number }> = []
    for (let repeat = 0; repeat < TRACK_REPEATS; repeat += 1) {
      for (let i = 0; i < EXERCISES.length; i += 1) {
        const exercise = EXERCISES[i]
        items.push({
          name: exercise.name,
          color: exercise.color,
          key: `${repeat}-${exercise.name}`,
          widthMultiplier: EXERCISE_WIDTH_MULTIPLIERS[i],
        })
      }
    }
    return items
  }, [])

  useEffect(() => {
    const measure = () => {
      const metrics = measureReelMetrics(reelRef.current, trackRef.current)
      setReelWidth(metrics.reelWidth)
      setItemPositions(metrics.itemPositions)
    }

    measure()
    window.addEventListener('resize', measure)

    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (isSpinning) return
    if (!reelWidth || itemPositions.length === 0) return
    setOffset(getOffsetForIndex(currentIndex, reelWidth, itemPositions))
  }, [currentIndex, isSpinning, reelWidth, itemPositions])

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
    if (isSpinning || !reelWidth || itemPositions.length === 0) return

    setIsSpinning(true)
    setSelectedExercise(null)
    setSelectedIndex(null)

    const loops = MIN_LOOPS + Math.floor(Math.random() * (MAX_LOOPS - MIN_LOOPS + 1))
    const exerciseIndex = pickExerciseIndex()
    
    // Calculate distance to target to ensure we land exactly on the item
    const currentRelativeIndex = currentIndex % EXERCISES.length
    const distanceToTarget = (exerciseIndex - currentRelativeIndex + EXERCISES.length) % EXERCISES.length
    
    const targetIndex = currentIndex + loops * EXERCISES.length + distanceToTarget
    const targetOffset = getOffsetForIndex(targetIndex, reelWidth, itemPositions)

    setOffset(targetOffset)

    window.setTimeout(() => {
      // Snap to the nearest card center (prevents ever landing in the gap,
      // even if sizes changed during the spin).
      const metrics = measureReelMetrics(reelRef.current, trackRef.current)
      const latestReelWidth = metrics.reelWidth || reelWidth
      const latestItemPositions = metrics.itemPositions.length > 0 ? metrics.itemPositions : itemPositions

      // Keep state in sync with the DOM in case the user resized mid-spin.
      setReelWidth(latestReelWidth)
      setItemPositions(latestItemPositions)

      const latestIndex = getNearestIndexForOffset(
        targetOffset,
        latestReelWidth,
        latestItemPositions,
      )
      const maxIndex = trackItems.length - 1
      const snappedIndex = Math.max(0, Math.min(latestIndex, maxIndex))
      const snappedOffset = getOffsetForIndex(snappedIndex, latestReelWidth, latestItemPositions)

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
            {trackItems.map((exercise, index) => {
              // Calculate width based on probability
              const widthMultiplier = exercise.widthMultiplier
              const cardWidth = `calc(var(--card-width) * ${widthMultiplier})`
              
              return (
                <div
                  key={exercise.key}
                  className={`reel-item${index === selectedIndex ? ' selected' : ''}`}
                  style={{ 
                    backgroundColor: exercise.color,
                    width: cardWidth,
                    flex: `0 0 ${cardWidth}`,
                  }}
                >
                  {exercise.name}
                </div>
              )
            })}
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
        </div>

        {mathTab === 'sessions' && (
          <SessionsTab
            math={math}
            lengthCurvePoints={LENGTH_CURVE_POINTS}
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
      </section>
    </div>
  )
}

export default App
