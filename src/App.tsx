import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const EXERCISES = [
  { name: '10 mins run', color: '#FF6B6B' },
  { name: '10 mins row', color: '#4ECDC4' },
  { name: '10 mins cycle', color: '#45B7D1' },
  { name: '1 min battle ropes', color: '#96CEB4' },
  { name: '15 pushups', color: '#FFEAA7' },
  { name: '1 min plank', color: '#DDA0DD' },
  { name: 'end workout', color: '#98D8C8' },
  { name: 'shawarama', color: '#F7DC6F' },
]

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
          ...exercise,
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

  const spin = () => {
    if (isSpinning || !reelWidth) return

    setIsSpinning(true)
    setSelectedExercise(null)
    setSelectedIndex(null)

    const loops = MIN_LOOPS + Math.floor(Math.random() * (MAX_LOOPS - MIN_LOOPS + 1))
    const exerciseIndex = Math.floor(Math.random() * EXERCISES.length)
    
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
    </div>
  )
}

export default App
