import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { SessionsTab } from './SessionsTab'
import { ExercisesTab } from './ExercisesTab'
import { GameTab } from './GameTab'
import { RulesTab } from './RulesTab'
import { SimulationTab } from './SimulationTab'
import { useRouletteSound } from './useRouletteSound'
import { useGameState } from './hooks/useGameState'
import { CARD_GAP, CARD_WIDTH, EXERCISES, SPIN_DURATION_MS, WHEEL_SLOTS } from './config'
import { type Exercise, type ExplanationKey, RARITY_CONFIG } from './types'

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

  const used = plans.reduce((sum, plan) => sum + plan.copies, 0)
  const remaining = WHEEL_SLOTS - used

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
  const [activePopup, setActivePopup] = useState<ExplanationKey | null>(null)
  const [mathTab, setMathTab] = useState<'sessions' | 'exercises' | 'game' | 'rules' | 'simulation'>('game')
  const { initAudioContext, playTick } = useRouletteSound()
  const tickRafRef = useRef<number | null>(null)
  const lastTickIndexRef = useRef<number | null>(null)
  const lastTickAtMsRef = useRef(0)

  const wheelSlots = useMemo(() => buildWeightedWheelSlots(shuffledExercises), [shuffledExercises])
  const {
    unlockedTabsCount,
    isSpinning,
    selectedExercise,
    selectedIndex,
    reelRef,
    trackRef,
    offset,
    reelWidth,
    cardWidth,
    stride,
    trackItems,
    math,
    spin,
  } = useGameState({ exercises: shuffledExercises, wheelSlots, initAudioContext })

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
  }, [cardWidth, isSpinning, playTick, reelRef, reelWidth, stride, trackItems.length, trackRef])

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
