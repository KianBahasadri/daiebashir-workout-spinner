import React from 'react'
import type { Explanation, MathStats, MathFormula } from './types'
import { Frac, Sup, Sub, Var, Num, Op } from './mathComponents'

export const MATH_EXPLANATIONS: Record<string, Explanation> = {
  exitProbability: {
    title: 'Exit Probability',
    content: `This is the chance of landing on any exercise marked as an exit condition (like Shawarma) on any given spin. Calculated as the sum of probabilities of all exit exercises.`,
    formula: (math: MathStats): MathFormula => ({
      general: (
        <>
          <Var>p</Var> <Op>=</Op> Σ <Var>P</Var>(<Var>e</Var><Sub>exit</Sub>)
        </>
      ),
      substituted: (
        <>
          <Var>p</Var> <Op>=</Op> <Num>{math.exitProbability.toFixed(3)}</Num>
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
    content: `The expected number of exercises you'll complete before hitting an exit condition. This follows a geometric distribution where we expect (1-p)/p non-exit spins before the workout ends.`,
    formula: (math: MathStats): MathFormula => ({
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
    content: `The weighted average duration of non-exit exercises. Since rarity tiers have different probabilities, we weight each tier's average duration by its probability relative to the total non-exit probability.`,
    formula: (math: MathStats): MathFormula => ({
      general: (
        <>
          <Var>D̄</Var> <Op>=</Op> <Frac num={<>Σ (<Var>P</Var><Sub>r</Sub> <Op>×</Op> <Var>D</Var><Sub>r</Sub>)</>} den={<><Var>P</Var><Sub>non-exit</Sub></>} />
        </>
      ),
      substituted: (
        <>
          <Var>D̄</Var> <Op>=</Op> <Frac num={<Num>{(math.expectedDurationPerSpin * (1 - math.exitProbability)).toFixed(3)}</Num>} den={<Num>{(1 - math.exitProbability).toFixed(3)}</Num>} />
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
    content: `Average workout time is the average number of exercises multiplied by the average duration per exercise.`,
    formula: (math: MathStats): MathFormula => ({
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
    content: `The expected number of complete workouts until one ends specifically with the legendary <span class="shawarma-text">shawarma</span>. Since every workout ends with exactly one exit condition, this is 1 / P(shawarma | exit).`,
    formula: (math: MathStats): MathFormula => ({
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
    formula: (math: MathStats): MathFormula => ({
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
    formula: (math: MathStats): MathFormula => ({
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
    content: `Exercises are grouped by rarity tiers with fixed probabilities per spin. Expected hits per workout = P(rarity) / P(exit).`,
    formula: (math: MathStats): MathFormula => {
      const sampleGroup = math.groupedByRarity[0]
      return {
        general: (
          <>
            <Var>hits</Var> <Op>=</Op> <Frac num={<><Var>P</Var><Sub>rarity</Sub></>} den={<Var>p</Var>} />
          </>
        ),
        substituted: (
          <>
            <Var>hits</Var> <Op>=</Op> <Frac num={<Num>{sampleGroup ? sampleGroup.groupProbability.toFixed(3) : 'N/A'}</Num>} den={<Num>{math.exitProbability.toFixed(3)}</Num>} />
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
    content: `The expected number of complete workout sessions before landing on this exercise tier at least once.`,
    formula: (math: MathStats): MathFormula => {
      const sampleGroup = math.groupedByRarity[0]
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
