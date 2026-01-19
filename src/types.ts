export type Exercise = {
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

export type WeightGroup = {
  weight: number
  exercises: Exercise[]
  perItemProbability: number
  groupProbability: number
  expectedHitsPerWorkout: number
  hasExitConditions: boolean
}

export type LengthCurvePoint = {
  spins: number
  probabilityEndOnSpin: number
  durationAtSpin: number
}

export type MathStats = {
  totalWeight: number
  usesUniformFallback: boolean
  exitProbability: number
  expectedSpinsUntilEnd: number
  expectedExercisesBeforeEnd: number
  expectedDurationPerSpin: number
  expectedTotalDuration: number
  exitExerciseCount: number
  shawarmaGivenExit: number
  expectedWorkoutsUntilShawarma: number
  chanceEndWithin: (spins: number) => number
  groupedByWeight: WeightGroup[]
  lengthCurve: LengthCurvePoint[]
}

export const MATH_EXPLANATIONS = {
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
    content: `Each exercise has a weight that determines how likely it is to be selected. Expected hits per workout = (avg exercises before end) × (weight ÷ total weight). Workouts until hit ≈ 1 ÷ (hits per workout) — how many sessions until you're likely to land on this exercise.`,
  },
} as const

export type ExplanationKey = keyof typeof MATH_EXPLANATIONS

export const formatPercent = (probability: number) => {
  if (!Number.isFinite(probability) || probability <= 0) return '0%'
  const pct = probability * 100
  if (pct >= 10) return `${pct.toFixed(1)}%`
  if (pct >= 1) return `${pct.toFixed(2)}%`
  return `${pct.toFixed(3)}%`
}
