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
  totalWeight: number
  exitWeight: number
  nonExitWeight: number
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

// Helper components for math notation
export const Frac = ({ num, den }: { num: ReactNode; den: ReactNode }) => (
  <span className="math-frac">
    <span className="math-frac-num">{num}</span>
    <span className="math-frac-den">{den}</span>
  </span>
)

export const Sup = ({ children }: { children: ReactNode }) => (
  <sup className="math-sup">{children}</sup>
)

export const Sub = ({ children }: { children: ReactNode }) => (
  <sub className="math-sub">{children}</sub>
)

export const Var = ({ children }: { children: ReactNode }) => (
  <span className="math-var">{children}</span>
)

export const Num = ({ children }: { children: ReactNode }) => (
  <span className="math-num">{children}</span>
)

export const Op = ({ children }: { children: ReactNode }) => (
  <span className="math-op">{children}</span>
)

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

export const MATH_EXPLANATIONS: Record<string, Explanation> = {
  exitProbability: {
    title: 'Exit Probability',
    content: `This is the chance of landing on any exit condition each spin. Based on the Legendary (red) and Godly (gold) rarity tier probabilities.`,
    formula: (math) => ({
      general: (
        <>
          <Var>p</Var> <Op>=</Op> <Frac num={<><Var>W</Var><Sub>exit</Sub></>} den={<><Var>W</Var><Sub>total</Sub></>} />
        </>
      ),
      substituted: (
        <>
          <Var>p</Var> <Op>=</Op> <Frac num={<Num>{math.exitWeight.toFixed(2)}</Num>} den={<Num>{math.totalWeight.toFixed(2)}</Num>} />
        </>
      ),
      result: (
        <>
          <Op>=</Op> <Num>{(math.exitProbability * 100).toFixed(1)}%</Num>
        </>
      ),
    }),
  },
  avgExercises: {
    title: 'Average Exercises Before Exit',
    content: `The expected number of exercises you'll complete before hitting an exit condition (like shawarma or Shawarma + Beer). This follows a geometric distribution where we expect (1-p)/p non-exit spins before hitting an exit.`,
    formula: (math) => ({
      general: (
        <>
          <Var>E</Var>[exercises] <Op>=</Op> <Frac num={<><Num>1</Num> <Op>−</Op> <Var>p</Var></>} den={<Var>p</Var>} />
        </>
      ),
      substituted: (
        <>
          <Var>E</Var>[exercises] <Op>=</Op> <Frac num={<><Num>1</Num> <Op>−</Op> <Num>{math.exitProbability.toFixed(3)}</Num></>} den={<Num>{math.exitProbability.toFixed(3)}</Num>} />
        </>
      ),
      result: (
        <>
          <Op>=</Op> <Num>{Number.isFinite(math.expectedExercisesBeforeEnd) ? math.expectedExercisesBeforeEnd.toFixed(2) : '∞'}</Num>
        </>
      ),
    }),
  },
  avgDuration: {
    title: 'Average Duration Per Exercise',
    content: `The weighted average duration of non-exit exercises. Each exercise's duration is weighted by its probability of being selected given you didn't hit an exit.`,
    formula: (math) => ({
      general: (
        <>
          <Var>D̄</Var> <Op>=</Op> <Frac num={<>Σ<Sub>i: non-exit</Sub> (<Var>w</Var><Sub>i</Sub> <Op>×</Op> <Var>d</Var><Sub>i</Sub>)</>} den={<><Var>W</Var><Sub>non-exit</Sub></>} />
        </>
      ),
      substituted: (
        <>
          <Var>D̄</Var> <Op>=</Op> <Frac num={<Num>{(math.expectedDurationPerSpin * math.nonExitWeight).toFixed(1)}</Num>} den={<Num>{math.nonExitWeight.toFixed(2)}</Num>} />
        </>
      ),
      result: (
        <>
          <Op>=</Op> <Num>{math.expectedDurationPerSpin.toFixed(1)} min</Num>
        </>
      ),
    }),
  },
  totalDuration: {
    title: 'Average Workout Duration Before Exit',
    content: `Average workout time before hitting an exit condition (like shawarma or Shawarma + Beer) is the average number of exercises multiplied by the average duration per exercise.`,
    formula: (math) => ({
      general: (
        <>
          <Var>T</Var> <Op>=</Op> <Var>E</Var>[exercises] <Op>×</Op> <Var>D̄</Var>
        </>
      ),
      substituted: (
        <>
          <Var>T</Var> <Op>=</Op> <Num>{Number.isFinite(math.expectedExercisesBeforeEnd) ? math.expectedExercisesBeforeEnd.toFixed(2) : '∞'}</Num> <Op>×</Op> <Num>{math.expectedDurationPerSpin.toFixed(1)}</Num>
        </>
      ),
      result: (
        <>
          <Op>=</Op> <Num>{Number.isFinite(math.expectedTotalDuration) ? `${math.expectedTotalDuration.toFixed(1)} min` : '∞'}</Num>
        </>
      ),
    }),
  },
  shawarma: {
    title: 'Workouts Until Shawarma',
    content: `The expected number of complete workouts until one ends specifically with the legendary <span class="shawarma-text">shawarma</span> (not including the Godly Shawarma + Beer). Since every workout ends with an exit condition, this is 1 / P(shawarma | exit).`,
    formula: (math) => ({
      general: (
        <>
          <Var>E</Var>[workouts] <Op>=</Op> <Frac num={<><Var>P</Var>(<Var>exit</Var>)</>} den={<><Var>P</Var>(<Var>shawarma</Var>)</>} />
        </>
      ),
      substituted: (
        <>
          <Var>E</Var>[workouts] <Op>=</Op> <Frac num={<Num>{math.exitProbability.toFixed(3)}</Num>} den={<Num>{math.shawarmaWeight.toFixed(3)}</Num>} />
        </>
      ),
      result: (
        <>
          <Op>=</Op> <Num>{Number.isFinite(math.expectedWorkoutsUntilShawarma) ? math.expectedWorkoutsUntilShawarma.toFixed(1) : '∞'}</Num> workouts
        </>
      ),
    }),
  },
  lengthCurve: {
    title: 'Workout Length Curve',
    content: `This shows the geometric distribution of workout length. The probability of ending on exactly spin k follows an exponential decay.`,
    formula: (math) => ({
      general: (
        <>
          <Var>P</Var>(L = k) <Op>=</Op> (1 − <Var>p</Var>)<Sup><Var>k</Var>−1</Sup> <Op>×</Op> <Var>p</Var>
        </>
      ),
      substituted: (
        <>
          <Var>P</Var>(L = 5) <Op>=</Op> (1 − <Num>{math.exitProbability.toFixed(3)}</Num>)<Sup>4</Sup> <Op>×</Op> <Num>{math.exitProbability.toFixed(3)}</Num>
        </>
      ),
      result: (
        <>
          <Op>=</Op> <Num>{(Math.pow(1 - math.exitProbability, 4) * math.exitProbability * 100).toFixed(1)}%</Num>
        </>
      ),
    }),
  },
  cdf: {
    title: 'Cumulative Probability',
    content: `P(L ≤ n) is the probability your workout ends within n spins. This tells you "what's the chance I'm done by spin n?"`,
    formula: (math) => ({
      general: (
        <>
          <Var>P</Var>(L ≤ n) <Op>=</Op> 1 − (1 − <Var>p</Var>)<Sup><Var>n</Var></Sup>
        </>
      ),
      substituted: (
        <>
          <Var>P</Var>(L ≤ 10) <Op>=</Op> 1 − (1 − <Num>{math.exitProbability.toFixed(3)}</Num>)<Sup>10</Sup>
        </>
      ),
      result: (
        <>
          <Op>=</Op> <Num>{(math.chanceEndWithin(10) * 100).toFixed(1)}%</Num>
        </>
      ),
    }),
  },
  rarity: {
    title: 'Rarity System',
    content: `Exercises are grouped by rarity tiers with fixed probabilities: Common (50%), Rare (30%), Epic (15%), Legendary (4%), Godly (1%). Expected hits = avg exercises × probability per exercise.`,
    formula: (math) => {
      const sampleGroup = math.groupedByRarity.find(g => !g.hasExitConditions) || math.groupedByRarity[0]
      return {
        general: (
          <>
            <Var>hits</Var> <Op>=</Op> <Var>E</Var>[exercises] <Op>×</Op> <Var>p</Var><Sub>rarity</Sub>
          </>
        ),
        substituted: (
          <>
            <Var>hits</Var> <Op>=</Op> <Num>{Number.isFinite(math.expectedExercisesBeforeEnd) ? math.expectedExercisesBeforeEnd.toFixed(2) : '∞'}</Num> <Op>×</Op> <Num>{sampleGroup ? formatPercent(sampleGroup.perItemProbability) : 'N/A'}</Num>
          </>
        ),
        result: (
          <>
            <Op>=</Op> <Num>{sampleGroup ? (Number.isFinite(sampleGroup.expectedHitsPerWorkout) ? sampleGroup.expectedHitsPerWorkout.toFixed(2) : '∞') : 'N/A'}</Num> per workout
          </>
        ),
      }
    },
  },
  workoutsUntilHit: {
    title: 'Workouts Until Hit',
    content: `The expected number of complete workout sessions before landing on this exercise at least once.`,
    formula: (math) => {
      const sampleGroup = math.groupedByRarity.find(g => !g.hasExitConditions) || math.groupedByRarity[0]
      const hitsPerWorkout = sampleGroup?.expectedHitsPerWorkout ?? 0
      return {
        general: (
          <>
            <Var>workouts</Var> <Op>=</Op> <Frac num={<Num>1</Num>} den={<><Var>hits</Var><Sub>per workout</Sub></>} />
          </>
        ),
        substituted: (
          <>
            <Var>workouts</Var> <Op>=</Op> <Frac num={<Num>1</Num>} den={<Num>{Number.isFinite(hitsPerWorkout) ? hitsPerWorkout.toFixed(2) : '∞'}</Num>} />
          </>
        ),
        result: (
          <>
            <Op>=</Op> <Num>{hitsPerWorkout > 0 ? (1 / hitsPerWorkout).toFixed(1) : '∞'}</Num>
          </>
        ),
      }
    },
  },
}

export type ExplanationKey = keyof typeof MATH_EXPLANATIONS

export const formatPercent = (probability: number) => {
  if (!Number.isFinite(probability) || probability <= 0) return '0%'
  const pct = probability * 100
  if (pct >= 10) return `${pct.toFixed(1)}%`
  if (pct >= 1) return `${pct.toFixed(2)}%`
  return `${pct.toFixed(3)}%`
}
