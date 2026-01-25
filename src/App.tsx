import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { SessionsTab } from './SessionsTab'
import { ExercisesTab } from './ExercisesTab'
import { GameTab } from './GameTab'
import { RulesTab } from './RulesTab'
import { SimulationTab } from './SimulationTab'
import { useRouletteSound } from './useRouletteSound'
import { type Exercise, type ExplanationKey, RARITY_CONFIG } from './types'
import { calculateMathStats, pickExerciseIndex } from './workoutMath'

const EXERCISES: Exercise[] = [
  // Common - Cardio exercises (white)
  { name: '10 mins run', color: RARITY_CONFIG.common.color, rarity: 'common', duration: 10, isExitCondition: false },
  { name: '10 mins row (cardio)', color: RARITY_CONFIG.common.color, rarity: 'common', duration: 10, isExitCondition: false },
  { name: '10 mins cycle', color: RARITY_CONFIG.common.color, rarity: 'common', duration: 10, isExitCondition: false },
  // Rare - Other exercises (blue)
  { name: '1 min battle ropes', color: RARITY_CONFIG.rare.color, rarity: 'rare', duration: 1, isExitCondition: false },
  { name: '1 min pushups', color: RARITY_CONFIG.rare.color, rarity: 'rare', duration: 1, isExitCondition: false },
  { name: '1 min plank', color: RARITY_CONFIG.rare.color, rarity: 'rare', duration: 1, isExitCondition: false },
  // Epic - Strength exercises (purple)
  { name: '10 mins squats', color: RARITY_CONFIG.epic.color, rarity: 'epic', duration: 10, isExitCondition: false },
  { name: '10 mins bench press', color: RARITY_CONFIG.epic.color, rarity: 'epic', duration: 10, isExitCondition: false },
  { name: '10 mins rows (strength)', color: RARITY_CONFIG.epic.color, rarity: 'epic', duration: 10, isExitCondition: false },
  // Legendary - Shawarma (red)
  { name: 'shawarma', color: RARITY_CONFIG.legendary.color, rarity: 'legendary', duration: 0, isExitCondition: true },
  // Godly - Shawarma + Beer (gold)
  { name: 'Shawarma + Beer', color: RARITY_CONFIG.godly.color, rarity: 'godly', duration: 0, isExitCondition: true },
]

const SPIN_DURATION_MS = 4000
const CARD_WIDTH = 160
const CARD_GAP = 16
// Rendering tens of thousands of cards causes a noticeable delay on refresh.
// Keep the track short and re-center after each spin to preserve the "infinite" feel.
const TRACK_REPEATS = 12
const CENTER_REPEAT = Math.floor(TRACK_REPEATS / 2)
const MIN_LOOPS = 4
const MAX_LOOPS = 7
const WHEEL_SLOTS = 100

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const buildWeightedWheelSlots = (exercises: Exercise[]) => {
  if (exercises.length === 0) return []

  const byRarity: Record<string, Exercise[]> = {}
  for (const exercise of exercises) {
    if (!byRarity[exercise.rarity]) {
      byRarity[exercise.rarity] = []
    }
    byRarity[exercise.rarity].push(exercise)
  }

  const plans = exercises.map((exercise) => {
    const tierSize = byRarity[exercise.rarity]?.length ?? 1
    const perItemProbability = RARITY_CONFIG[exercise.rarity].probability / tierSize
    const rawCopies = perItemProbability * WHEEL_SLOTS
    const copies = Math.floor(rawCopies)
    return { exercise, copies, remainder: rawCopies - copies }
  })

  let used = plans.reduce((sum, plan) => sum + plan.copies, 0)
  let remaining = WHEEL_SLOTS - used

  if (remaining > 0) {
    plans
      .slice()
      .sort((a, b) => b.remainder - a.remainder)
      .slice(0, remaining)
      .forEach((plan) => {
        plan.copies += 1
      })
  }

  const wheel: Exercise[] = []
  let left = plans.reduce((sum, plan) => sum + plan.copies, 0)

  while (left > 0) {
    for (const plan of plans) {
      if (plan.copies <= 0) continue
      wheel.push(plan.exercise)
      plan.copies -= 1
      left -= 1
      if (left === 0) break
    }
  }

  return wheel.length > 0 ? wheel : exercises
}

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
  const [shuffledExercises] = useState<Exercise[]>(() => shuffleArray(EXERCISES))
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activePopup, setActivePopup] = useState<ExplanationKey | null>(null)
  const [mathTab, setMathTab] = useState<'sessions' | 'exercises' | 'game' | 'rules' | 'simulation'>('game')
  const [unlockedTabsCount, setUnlockedTabsCount] = useState<number>(() => {
    const saved = localStorage.getItem('unlockedTabsCount')
    return saved ? parseInt(saved, 10) : 0
  })
  const [currentIndex, setCurrentIndex] = useState(() => CENTER_REPEAT * WHEEL_SLOTS)
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

  // Update localStorage when unlockedTabsCount changes
  useEffect(() => {
    localStorage.setItem('unlockedTabsCount', unlockedTabsCount.toString())
  }, [unlockedTabsCount])

  const wheelSlots = useMemo(() => buildWeightedWheelSlots(shuffledExercises), [shuffledExercises])

  const trackItems = useMemo(() => {
    const items: Array<{ name: string; color: string; key: string; rarity: string }> = []
    for (let repeat = 0; repeat < TRACK_REPEATS; repeat += 1) {
      for (let i = 0; i < wheelSlots.length; i += 1) {
        const exercise = wheelSlots[i]
        items.push({
          name: exercise.name,
          color: exercise.color,
          rarity: exercise.rarity,
          key: `${repeat}-${i}-${exercise.name}`,
        })
      }
    }
    return items
  }, [wheelSlots])

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

  const math = useMemo(() => calculateMathStats(shuffledExercises), [shuffledExercises])

  const spin = () => {
    if (isSpinning || !reelWidth || shuffledExercises.length === 0 || wheelSlots.length === 0) return

    // Initialize audio context within the user gesture so tick sounds can play during the animation.
    initAudioContext()

    setIsSpinning(true)
    setSelectedExercise(null)
    setSelectedIndex(null)

    const loops = MIN_LOOPS + Math.floor(Math.random() * (MAX_LOOPS - MIN_LOOPS + 1))
    const exerciseIndex = pickExerciseIndex(shuffledExercises)
    const pickedName = shuffledExercises[exerciseIndex]?.name

    const candidateSlots: number[] = []
    for (let i = 0; i < wheelSlots.length; i += 1) {
      if (wheelSlots[i].name === pickedName) candidateSlots.push(i)
    }

    const slotIndex =
      candidateSlots.length > 0
        ? candidateSlots[Math.floor(Math.random() * candidateSlots.length)]
        : Math.floor(Math.random() * wheelSlots.length)

    // Calculate distance to target to ensure we land exactly on the slot
    const baseSteps = loops * shuffledExercises.length
    const baseIndex = currentIndex + baseSteps
    const baseRelativeIndex = baseIndex % wheelSlots.length
    const alignSteps = (slotIndex - baseRelativeIndex + wheelSlots.length) % wheelSlots.length

    const targetIndex = baseIndex + alignSteps
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
      const slotCount = wheelSlots.length
      if (slotCount === 0) {
        setIsSpinning(false)
        return
      }

      // Re-center to keep the track short (prevents index drift over many spins).
      const snappedSlotIndex = snappedIndex % slotCount
      const normalizedIndex = CENTER_REPEAT * slotCount + snappedSlotIndex
      const normalizedOffset = getOffsetForIndex(normalizedIndex, latestReelWidth, latestCardWidth, latestStride)

      setOffset(normalizedOffset)
      setSelectedExercise(wheelSlots[snappedSlotIndex].name)
      setCurrentIndex(normalizedIndex)
      setSelectedIndex(normalizedIndex)
      // Increase max unlocked tabs to 5
      setUnlockedTabsCount((prev) => Math.min(prev + 1, 5))
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
                className={`reel-item${index === selectedIndex ? ' selected' : ''} ${exercise.rarity === 'legendary' ? 'legendary-tier' : ''} ${exercise.rarity === 'godly' ? 'godly-tier' : ''}`}
                style={{ backgroundColor: (exercise.rarity === 'legendary' || exercise.rarity === 'godly') ? undefined : exercise.color }}
              >
                <div className="exercise-name-label">{exercise.name}</div>
                <div className="rarity-label">
                  {RARITY_CONFIG[exercise.rarity as keyof typeof RARITY_CONFIG].name}
                </div>
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

      {unlockedTabsCount > 0 && (
        <section className="math" aria-label="Math and odds" onClick={() => setActivePopup(null)}>
          <div className="math-tabs">
            {unlockedTabsCount >= 1 && (
              <button
                className={`math-tab${mathTab === 'game' ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setMathTab('game'); }}
                type="button"
              >
                Game
              </button>
            )}
            {unlockedTabsCount >= 2 && (
              <button
                className={`math-tab${mathTab === 'rules' ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setMathTab('rules'); }}
                type="button"
              >
                Rules
              </button>
            )}
            {unlockedTabsCount >= 3 && (
              <button
                className={`math-tab${mathTab === 'exercises' ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setMathTab('exercises'); }}
                type="button"
              >
                Exercises
              </button>
            )}
            {unlockedTabsCount >= 4 && (
              <button
                className={`math-tab${mathTab === 'sessions' ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setMathTab('sessions'); }}
                type="button"
              >
                Sessions
              </button>
            )}
            {unlockedTabsCount >= 5 && (
              <button
                className={`math-tab${mathTab === 'simulation' ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setMathTab('simulation'); }}
                type="button"
              >
                Simulation
              </button>
            )}
          </div>

          {unlockedTabsCount >= 1 && mathTab === 'game' && (
            <GameTab />
          )}

          {unlockedTabsCount >= 2 && mathTab === 'rules' && (
            <RulesTab />
          )}

          {unlockedTabsCount >= 3 && mathTab === 'exercises' && (
            <ExercisesTab
              math={math}
              activePopup={activePopup}
              setActivePopup={setActivePopup}
            />
          )}

          {unlockedTabsCount >= 4 && mathTab === 'sessions' && (
            <SessionsTab
              math={math}
              activePopup={activePopup}
              setActivePopup={setActivePopup}
            />
          )}

          {unlockedTabsCount >= 5 && mathTab === 'simulation' && (
            <SimulationTab 
              exercises={shuffledExercises}
              math={math}
              activePopup={activePopup}
              setActivePopup={setActivePopup}
            />
          )}
        </section>
      )}
    </div>
  )
}

export default App
