import { geometricCdf, spinsForCdf } from './mathUtils'
import { type Exercise, type MathStats, RARITY_CONFIG } from './types.tsx'

const LENGTH_CURVE_TARGET_CDF = 0.95

export function calculateMathStats(exercises: Exercise[]): MathStats {
  // Calculate probabilities based on rarity
  const exitExercises = exercises.filter((exercise) => exercise.isExitCondition)
  const exitProbability = exitExercises.reduce((sum, exercise) => sum + RARITY_CONFIG[exercise.rarity].probability, 0)

  // Calculate total weight (for backward compatibility with existing math)
  const totalWeight = exercises.length // Simplified - each exercise has equal "weight" now
  const exitWeight = exitProbability * totalWeight // Weighted representation of exit probability

  // Calculate shawarma-specific stats (Legendary tier only)
  const shawarmaExercise = exercises.find((exercise) => exercise.rarity === 'legendary')
  const shawarmaWeight = shawarmaExercise ? RARITY_CONFIG.legendary.probability : 0
  const shawarmaGivenExit = exitProbability > 0 ? shawarmaWeight / exitProbability : 0 // Probability of shawarma given exit
  const expectedWorkoutsUntilShawarma = shawarmaGivenExit > 0 ? 1 / shawarmaGivenExit : Number.POSITIVE_INFINITY // Workouts until specific legendary shawarma hit

  const usesUniformFallback = false // We now have defined probabilities

  const expectedSpinsUntilEnd = exitProbability > 0 ? 1 / exitProbability : Number.POSITIVE_INFINITY
  const expectedExercisesBeforeEnd = exitProbability > 0 ? (1 - exitProbability) / exitProbability : Number.POSITIVE_INFINITY

  // Calculate expected duration per non-exit spin
  const nonExitExercises = exercises.filter((exercise) => !exercise.isExitCondition)

  // Calculate weighted duration based on rarity probabilities
  let totalDurationWeight = 0
  let weightedDurationSum = 0

  const exercisesByRarity = nonExitExercises.reduce((acc, exercise) => {
    if (!acc[exercise.rarity]) {
      acc[exercise.rarity] = []
    }
    acc[exercise.rarity].push(exercise)
    return acc
  }, {} as Record<string, Exercise[]>)

  for (const rarity of Object.keys(RARITY_CONFIG) as (keyof typeof RARITY_CONFIG)[]) {
    const exercisesInTier = exercisesByRarity[rarity] || []
    if (exercisesInTier.length > 0) {
      const tierProbability = RARITY_CONFIG[rarity].probability
      const avgDurationInTier = exercisesInTier.reduce((sum, ex) => sum + ex.duration, 0) / exercisesInTier.length
      weightedDurationSum += tierProbability * avgDurationInTier
      totalDurationWeight += tierProbability
    }
  }

  const expectedDurationPerSpin = totalDurationWeight > 0 ? weightedDurationSum / totalDurationWeight : 0
  const nonExitWeight = nonExitExercises.length // For backward compatibility

  // Expected total workout duration = expected exercises before shawarma × expected duration per exercise
  const expectedTotalDuration = Number.isFinite(expectedExercisesBeforeEnd)
    ? expectedExercisesBeforeEnd * expectedDurationPerSpin
    : Number.POSITIVE_INFINITY

  const cdf = (spins: number) => geometricCdf(exitProbability, spins)

  // Group by rarity instead of weight
  const rarityGroupsMap = new Map<string, Exercise[]>()
  for (const exercise of exercises) {
    const group = rarityGroupsMap.get(exercise.rarity)
    if (group) group.push(exercise)
    else rarityGroupsMap.set(exercise.rarity, [exercise])
  }

  const groupedByRarity = Array.from(rarityGroupsMap.entries())
    .map(([rarityKey, exercisesInGroup]) => {
      const rarity = rarityKey as keyof typeof RARITY_CONFIG
      const rarityProbability = RARITY_CONFIG[rarity].probability
      const perItemProbability = exercisesInGroup.length > 0 ? rarityProbability / exercisesInGroup.length : 0
      const groupProbability = rarityProbability

      // Check if this group contains exit conditions
      const hasExitConditions = exercisesInGroup.some((e) => e.isExitCondition)

      // Expected hits per workout:
      // - For exit conditions: P(ending with this exit) = rarityProbability (applies per exit tier)
      // - For regular exercises: expectedExercisesBeforeEnd × perItemProbability
      const expectedHitsPerWorkout = hasExitConditions
        ? rarityProbability
        : Number.isFinite(expectedExercisesBeforeEnd)
          ? expectedExercisesBeforeEnd * perItemProbability
          : Number.POSITIVE_INFINITY

      return {
        rarity,
        exercises: exercisesInGroup,
        perItemProbability,
        groupProbability,
        expectedHitsPerWorkout,
        hasExitConditions,
      }
    })
    .sort((a, b) => {
      // Sort by rarity order: common, rare, epic, legendary, godly
      const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3, godly: 4 }
      return rarityOrder[a.rarity] - rarityOrder[b.rarity]
    })

  const k95 = spinsForCdf(exitProbability, LENGTH_CURVE_TARGET_CDF)
  const lengthCurvePoints = Number.isFinite(k95) ? k95 : 20

  const lengthCurve = Array.from({ length: lengthCurvePoints }, (_, i) => {
    const spins = i + 1
    const probabilityEndOnSpin =
      exitProbability > 0 ? Math.pow(1 - exitProbability, spins - 1) * exitProbability : 0
    const cumulativeProbability = cdf(spins)
    // Expected duration if workout ends on this spin (spins - 1 exercises completed before exit)
    const durationAtSpin = (spins - 1) * expectedDurationPerSpin
    return { spins, probabilityEndOnSpin, cumulativeProbability, durationAtSpin }
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
    groupedByRarity,
    lengthCurve,
  }
}

export function pickExerciseIndex(exercises: Exercise[]): number {
  // Group exercises by rarity
  const exercisesByRarity = exercises.reduce(
    (acc, exercise) => {
      if (!acc[exercise.rarity]) {
        acc[exercise.rarity] = []
      }
      acc[exercise.rarity].push(exercise)
      return acc
    },
    {} as Record<string, Exercise[]>,
  )

  // Calculate cumulative probabilities for each rarity tier
  const roll = Math.random()
  let cumulativeProbability = 0

  // Check each rarity tier in order: common, rare, epic, legendary, godly
  const rarityOrder: (keyof typeof RARITY_CONFIG)[] = ['common', 'rare', 'epic', 'legendary', 'godly']

  for (const rarity of rarityOrder) {
    if (exercisesByRarity[rarity]) {
      const rarityProbability = RARITY_CONFIG[rarity].probability
      cumulativeProbability += rarityProbability

      if (roll < cumulativeProbability) {
        // Select a random exercise from this rarity tier
        const exercisesInTier = exercisesByRarity[rarity]
        const randomIndexInTier = Math.floor(Math.random() * exercisesInTier.length)
        const selectedExercise = exercisesInTier[randomIndexInTier]
        return exercises.findIndex((ex) => ex === selectedExercise)
      }
    }
  }

  // Fallback (should not happen with proper probabilities)
  return Math.floor(Math.random() * exercises.length)
}
