import { type Exercise, RARITY_CONFIG } from '../types'

export const EXERCISES: Exercise[] = [
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
