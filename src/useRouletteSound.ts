import { useCallback, useEffect, useRef } from 'react'

const TICK_DURATION_S = 0.03
const MASTER_GAIN = 2

export function useRouletteSound() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const tickNoiseBufferRef = useRef<AudioBuffer | null>(null)

  // Initialize audio context on first user interaction.
  // Also attempts to resume audio immediately (needed on many browsers).
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextCtor =
        window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextCtor) return null
      audioContextRef.current = new AudioContextCtor()
    }

    const audioContext = audioContextRef.current

    if (audioContext && audioContext.state === 'suspended') {
      // Best-effort; must be called from a user gesture to reliably work.
      void audioContext.resume()
    }

    if (audioContext && !masterGainRef.current) {
      const masterGain = audioContext.createGain()
      masterGain.gain.setValueAtTime(MASTER_GAIN, audioContext.currentTime)
      masterGain.connect(audioContext.destination)
      masterGainRef.current = masterGain
    }

    if (audioContext && !tickNoiseBufferRef.current) {
      const length = Math.max(1, Math.floor(audioContext.sampleRate * TICK_DURATION_S))
      const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1
      }
      tickNoiseBufferRef.current = buffer
    }

    return audioContext
  }, [])

  const playTick = useCallback((delayS = 0) => {
    const audioContext = initAudioContext()
    const masterGain = masterGainRef.current
    const noiseBuffer = tickNoiseBufferRef.current

    if (!audioContext || !masterGain || !noiseBuffer) return

    const now = audioContext.currentTime + delayS

    const source = audioContext.createBufferSource()
    source.buffer = noiseBuffer

    const filter = audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(3200 + Math.random() * 400, now)
    filter.Q.setValueAtTime(18, now)

    const gain = audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(1, now + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(masterGain)

    source.start(now)
    source.stop(now + TICK_DURATION_S)

    source.onended = () => {
      try {
        source.disconnect()
        filter.disconnect()
        gain.disconnect()
      } catch {
        // ignore
      }
    }
  }, [initAudioContext])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (masterGainRef.current) {
        try {
          masterGainRef.current.disconnect()
        } catch {
          // ignore
        }
        masterGainRef.current = null
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close()
      }
      audioContextRef.current = null
      tickNoiseBufferRef.current = null
    }
  }, [])

  return {
    initAudioContext,
    playTick,
  }
}