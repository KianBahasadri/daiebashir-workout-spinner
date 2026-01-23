import { useRef, useCallback, useEffect } from 'react'

const SPIN_DURATION_MS = 4000

export function useRouletteSound() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentSoundRef = useRef<{
    oscillator: OscillatorNode
    gainNode: GainNode
    filterNode: BiquadFilterNode
    startTime: number
  } | null>(null)

  // Initialize audio context on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Generate a roulette spinning sound that starts fast and slows down
  const playSpinSound = useCallback(() => {
    const audioContext = initAudioContext()
    if (!audioContext) return

    // Stop any existing sound
    stopSpinSound()

    const now = audioContext.currentTime

    // Create nodes
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    const filterNode = audioContext.createBiquadFilter()

    // Configure filter (low-pass to create spinning effect)
    filterNode.type = 'lowpass'
    filterNode.frequency.setValueAtTime(2000, now)
    filterNode.Q.setValueAtTime(1, now)

    // Configure oscillator (starting with higher frequency, slowing down)
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(800, now) // Start fast
    oscillator.frequency.exponentialRampToValueAtTime(200, now + SPIN_DURATION_MS / 1000) // Slow down

    // Configure gain (fade in and out)
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1) // Quick fade in
    gainNode.gain.setValueAtTime(0.3, now + (SPIN_DURATION_MS - 500) / 1000) // Hold
    gainNode.gain.linearRampToValueAtTime(0, now + SPIN_DURATION_MS / 1000) // Fade out

    // Configure filter frequency (also slow down effect)
    filterNode.frequency.setValueAtTime(2000, now)
    filterNode.frequency.exponentialRampToValueAtTime(300, now + SPIN_DURATION_MS / 1000)

    // Add some randomness with a second oscillator for texture
    const noiseOscillator = audioContext.createOscillator()
    const noiseGain = audioContext.createGain()
    const noiseFilter = audioContext.createBiquadFilter()

    noiseOscillator.type = 'square'
    noiseOscillator.frequency.setValueAtTime(100 + Math.random() * 50, now)
    noiseGain.gain.setValueAtTime(0.1, now)
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.setValueAtTime(1000, now)

    // Connect the audio graph
    oscillator.connect(filterNode)
    filterNode.connect(gainNode)
    gainNode.connect(audioContext.destination)

    noiseOscillator.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(audioContext.destination)

    // Store reference to stop later
    currentSoundRef.current = {
      oscillator,
      gainNode,
      filterNode,
      startTime: now
    }

    // Start the oscillators
    oscillator.start(now)
    noiseOscillator.start(now)

    // Auto-stop after duration
    setTimeout(() => {
      stopSpinSound()
    }, SPIN_DURATION_MS + 100)
  }, [initAudioContext])

  const stopSpinSound = useCallback(() => {
    if (currentSoundRef.current) {
      const { oscillator, gainNode } = currentSoundRef.current
      const audioContext = audioContextRef.current

      if (audioContext) {
        const now = audioContext.currentTime
        // Quick fade out
        gainNode.gain.cancelScheduledValues(now)
        gainNode.gain.setValueAtTime(gainNode.gain.value, now)
        gainNode.gain.linearRampToValueAtTime(0, now + 0.1)

        // Stop after fade
        setTimeout(() => {
          try {
            oscillator.stop()
          } catch (e) {
            // Already stopped
          }
        }, 150)
      }

      currentSoundRef.current = null
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpinSound()
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [stopSpinSound])

  return {
    playSpinSound,
    stopSpinSound,
    initAudioContext
  }
}