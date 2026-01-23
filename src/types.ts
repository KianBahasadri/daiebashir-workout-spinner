import type { ReactNode } from 'react'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'godly'

export const RARITY_CONFIG = {
  common: { name: 'Common', color: '#FFFFFF', probability: 0.5, category: 'Cardio' },
  rare: { name: 'Rare', color: '#4A90E2', probability: 0.3, category: 'Bodyweight' },
  epic: { name: 'Epic', color: '#9B59B6', probability: 0.15, category: 'Strength' },
  legendary: { name: 'Legendary', color: '#FF3B30', probability: 0.04, category: 'Reward' },
  godly: { name: 'Godly', color: '#FFD700', probability: 0.01, category: 'Ultimate' }
} as const

export type Exercise = {
  name: string
  color: string
  /** Rarity tier that determines probability */
  rarity: Rarity
  /** Duration of the exercise in minutes */
  duration: number
  /** Whether landing on this exercise ends the workout */
  isExitCondition: boolean
}

export type RarityGroup = {
  rarity: Rarity
  exercises: Exercise[]
  perItemProbability: number
  groupProbability: number
  expectedHitsPerWorkout: number
  hasExitConditions: boolean
}

export type LengthCurvePoint = {
  spins: number
  probabilityEndOnSpin: number
  cumulativeProbability: number
  durationAtSpin: number
}

export type MathStats = {
  usesUniformFallback: boolean
  exitProbability: number
  expectedSpinsUntilEnd: number
  expectedExercisesBeforeEnd: number
  expectedDurationPerSpin: number
  expectedTotalDuration: number
  exitExerciseCount: number
  shawarmaWeight: number
  shawarmaGivenExit: number
  expectedWorkoutsUntilShawarma: number
  chanceEndWithin: (spins: number) => number
  groupedByRarity: RarityGroup[]
  lengthCurve: LengthCurvePoint[]
}

export type MathFormula = {
  general: ReactNode
  substituted: ReactNode
  result: ReactNode
}

export type Explanation = {
  title: string
  content: string
  formula?: (math: MathStats) => MathFormula
}

export type ExplanationKey =
  | 'exitProbability'
  | 'avgExercises'
  | 'avgDuration'
  | 'totalDuration'
  | 'shawarma'
  | 'lengthCurve'
  | 'cdf'
  | 'rarity'
  | 'workoutsUntilHit'
