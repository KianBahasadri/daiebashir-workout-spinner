# Workout Spinner

A fun, gamified workout app that adds randomness to your exercise routine. Spin the wheel to get your next exercise, with shawarma as the ultimate reward! Includes detailed statistics about your workout probabilities and expected duration before hitting shawarma.

## Tech Stack
- React + TypeScript
- Vite + SWC
- Deployed on Cloudflare Pages

## Development

```bash
pnpm install    # install dependencies
pnpm dev        # run locally
pnpm run deploy # deploy to Cloudflare Pages
```

## Live Site
https://daiebashir-workout-spinner.pages.dev

## Project Analysis & Roadmap

### Functionality Overview

This app follows a compelling core loop: **Spin → RNG → Rarity → Accumulation**

1. **Spin**: User clicks to initiate the roulette-style spinner
2. **RNG**: A two-stage random selection occurs:
   - First, a rarity tier is selected based on fixed probabilities (Common 50%, Rare 35%, Epic 10%, Legendary 4%, Godly 1%)
   - Then, a random exercise is chosen from that tier
3. **Rarity**: Each exercise belongs to a tier that determines its probability and visual presentation
4. **Accumulation**: Exercises accumulate until an exit condition (Shawarma or Shawarma + Beer) is hit

The app takes a **math-first approach** with rigorous probability modeling:
- Geometric distributions for workout length prediction
- Cumulative distribution functions (CDFs) for probability curves
- Weighted averages for duration calculations
- Expected value computations for "workouts until shawarma"

All mathematical formulas are not just calculated but also **displayed and explained** in the UI, making the probability mechanics transparent to users.

### Strengths & Weaknesses

**Strengths:**
- ✅ **Solid Engineering**: TypeScript throughout, clean component architecture, proper separation of concerns
- ✅ **Math Transparency**: Comprehensive probability calculations with visual explanations
- ✅ **Audio Feedback**: Custom Web Audio API implementation for roulette tick sounds
- ✅ **Rarity System**: Well-balanced tier probabilities that create anticipation
- ✅ **Visual Polish**: Smooth animations, color-coded rarity tiers, responsive design
- ✅ **Deployment**: Production-ready with Cloudflare Pages integration

**Weaknesses:**
- ❌ **No Persistence**: Sessions aren't saved; refreshing loses all progress
- ❌ **Hardcoded Configuration**: Exercises are defined in code, not configurable
- ❌ **Limited Visual Feedback**: High-tier spins lack extra visual impact
- ❌ **No Progress Tracking**: Can't see historical workout data or streaks
- ❌ **Static Engagement**: After the initial novelty, no progression system

### Engagement Strategy (The Dopamine Strategy)

The key to long-term engagement is implementing **Variable Ratio Reinforcement**—the same psychological principle behind slot machines and loot boxes. Here's the roadmap:

#### 1. Visual Effects for High-Tier Spins
**Problem**: Landing a Legendary or Godly exercise feels the same as Common ones  
**Solution**: Escalating visual feedback
- **Epic (10%)**: Subtle glow effect around the card
- **Legendary (4%)**: Confetti burst + screen shake
- **Godly (1%)**: Full-screen confetti + intense shake + color flash

**Implementation**: Use libraries like `canvas-confetti` or `react-confetti`

#### 2. Auditory Conditioning
**Problem**: All spins sound the same  
**Solution**: Tiered sound effects
- **Common/Rare**: Current tick sound (white noise bandpass)
- **Epic**: Add a subtle chime on land
- **Legendary**: Triumphant fanfare
- **Godly**: Orchestral hit + reverb tail

**Implementation**: Extend `useRouletteSound.ts` with `playLandingSound(rarity)` using pre-recorded samples or more complex synthesis

#### 3. Persistence & Banking
**Problem**: No reason to keep coming back  
**Solution**: Exercise banking system
- Save completed workouts to `localStorage`
- Track "banked" exercises for streak bonuses
- Show historical stats: total spins, rarest hit, current streak

**Implementation**: Add `useLocalStorage` hook, create `WorkoutHistory` type, persist on each spin

#### 4. Progressive Disclosure
**Problem**: All features visible immediately  
**Solution**: Unlock mechanics
- Start with only Common/Rare exercises visible
- Unlock Epic after 5 workouts
- Unlock Legendary after hitting Epic 3 times
- Tease Godly tier but keep it mythical

### Immediate Code Recommendations

**High Priority (Core Engagement):**
1. Add `localStorage` persistence for workout sessions
   ```typescript
   // Add to App.tsx
   const [history, setHistory] = useLocalStorage<WorkoutSession[]>('workout-history', [])
   ```

2. Implement confetti for high-tier spins
   ```bash
   pnpm add canvas-confetti
   pnpm add -D @types/canvas-confetti
   ```

3. Add visual polish for Legendary+ items
   ```css
   .reel-item[data-rarity="legendary"] {
     animation: legendary-glow 1s ease-in-out;
     box-shadow: 0 0 20px var(--legendary-color);
   }
   ```

**Medium Priority (Retention):**
4. Create a `HistoryTab` component to show past workouts
5. Add streak counter and "days since last workout" display
6. Implement tiered sound effects in `useRouletteSound.ts`

**Low Priority (Polish):**
7. Add screen shake effect using CSS transforms
8. Create achievement badges (e.g., "Hit Godly tier 3 times")
9. Add social sharing for impressive workouts

**Technical Debt:**
10. Move `EXERCISES` array to a JSON config file
11. Add unit tests for probability functions in `workoutMath.ts`
12. Implement proper error boundaries for audio context failures

---

**Next Steps**: Start with persistence (`localStorage`) and confetti effects. These provide the highest ROI for user engagement with minimal code changes.
