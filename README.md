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

## Ethics & Philosophy

**This is NOT a gambling site.** Workout Spinner is a fitness application that deliberately applies gambling psychology principles to encourage exercise and physical activity.

### The Ethical Framework

Traditional gambling exploits psychological mechanisms (variable ratio reinforcement, rarity systems, anticipation mechanics) to encourage monetary spending, which raises serious ethical concerns. Workout Spinner intentionally misuses these same psychological principles—but with a crucial difference: **instead of extracting money, it encourages healthy behavior**.

**Key Ethical Distinctions:**

- **100% Free**: There is no monetary component whatsoever. No purchases, no microtransactions, no paid advantages. You cannot spend money even if you wanted to.
- **Positive Outcome**: The "addictive" behavior being encouraged is exercise—objectively beneficial for physical and mental health.
- **Transparent Design**: The probability mathematics are openly displayed and explained in the app. Users can see exactly how the randomization works.
- **No Exploitation**: Since there's no financial component, being psychologically manipulative to increase engagement means users exercise more, not lose money.

### The Goal

The explicit goal of this application is to be **maximally engaging and psychologically compelling** to motivate people to work out. We leverage the same dopamine-triggering mechanics that make slot machines and loot boxes engaging—rarity tiers, anticipation, variable rewards—but redirect that engagement toward fitness instead of gambling.

In this context, making the app "addictive" is not only ethical but desirable. If someone becomes "addicted" to spinning for workouts, the result is improved health and fitness, not financial harm.

**Bottom Line**: This app gamifies exercise by borrowing psychological techniques from gambling, but it's free, transparent, and designed to improve your health—not empty your wallet.

## Project Analysis & Roadmap

### Functionality Overview

This application is a **stochastic workout generator** built with **React, TypeScript, and Vite**. It gamifies exercise by treating a workout session like a series of "loot box" openings or slot machine spins.

**The Core Loop: Spin → RNG → Rarity → Accumulation**

1. **The Spin**: User clicks a button to spin the roulette-style wheel
2. **RNG Logic**: The app selects an exercise based on a weighted probability table defined in `src/types.tsx`:
   - First, a rarity tier is selected based on fixed probabilities (Common 50%, Rare 35%, Epic 10%, Legendary 4%, Godly 1%)
   - Then, a random exercise is chosen from that tier
3. **Rarity System**: Exercises are categorized into tiers with specific drop rates:
   - **Common (50%)**: Low intensity cardio (e.g., 10 mins run)
   - **Rare (35%)**: Moderate intensity bodyweight (e.g., 1 min plank)
   - **Epic (10%)**: Strength training (e.g., bench press)
   - **Legendary (4%)**: "Shawarma" (Exit Condition)
   - **Godly (1%)**: "Shawarma + Beer" (Exit Condition)
4. **Accumulation**: If a non-exit exercise is rolled, it is added to the "To Do" list. The user must keep spinning and accumulating exercises until they hit an **Exit Condition** (Legendary or Godly)

The app takes a **math-first approach** with rigorous probability modeling:
- Geometric distributions for workout length prediction
- Cumulative distribution functions (CDFs) for probability curves
- Weighted averages for duration calculations
- Expected value computations for "workouts until shawarma"

**Math Transparency**: A dedicated tab (`SessionsTab.tsx`) calculates and displays the expected value (EV) of the workout, such as "Average exercises before Shawarma" and "Likelihood the game ends on spin X," utilizing geometric distributions. All mathematical formulas are not just calculated but also **displayed and explained** in the UI, making the probability mechanics transparent to users.

### Strengths & Weaknesses

**Strengths:**
- ✅ **Solid Engineering**: TypeScript throughout, clean component architecture, proper separation of concerns
- ✅ **Math Transparency**: Comprehensive probability calculations with visual explanations
- ✅ **Audio Feedback**: Custom Web Audio API implementation (`useRouletteSound.ts`) for procedural roulette tick sounds - far more responsive and performant than playing static MP3 files
- ✅ **Rarity System**: Well-balanced tier probabilities that create anticipation
- ✅ **Visual Polish**: Smooth animations, color-coded rarity tiers, responsive design
- ✅ **Zero-Friction UI**: No login, no setup wizard, and no complex configuration - you open the app and click "Spin"
- ✅ **Deployment**: Production-ready with Cloudflare Pages integration

**Weaknesses:**
- ❌ **No Persistence**: Sessions aren't saved; refreshing loses all progress. No usage of `localStorage` or database calls anywhere in the codebase
- ❌ **Hardcoded Configuration**: Exercises are hardcoded in `App.tsx` - changing exercises requires editing source code and redeploying
- ❌ **Limited Visual Feedback**: High-tier spins lack extra visual impact - difference between Common and Godly is just text and background color
- ❌ **No Progress Tracking**: Can't see historical workout data or streaks
- ❌ **Single Audio Texture**: While the tick sound is good, it's the only sound - no auditory distinction between landing on Common vs Godly
- ❌ **Static Engagement**: After the initial novelty, no progression system

### Engagement Strategy (The Dopamine Strategy)

The key to long-term engagement is implementing **Variable Ratio Reinforcement**—the same psychological principle behind slot machines and loot boxes. Here's the roadmap:

#### 1. Visual "Juice" & Celebration
Currently, the difference between a Common and Godly pull is just text and background color. You need to make the rare events feel massive.

**Problem**: Landing a Legendary or Godly exercise feels the same as Common ones  
**Solution**: Escalating visual feedback
- **Epic (10%)**: Subtle glow effect around the card
- **Legendary (4%)**: Confetti burst + screen shake
- **Godly (1%)**: Full-screen confetti + intense shake + color flash

**Additional Enhancement - "Loot Box" Reveal**: Instead of showing the result immediately, show a glowing orb or a shaking box that takes 1-2 seconds to open. This builds anticipation (the highest dopamine spike actually occurs *before* the reward).

**Implementation**: Use libraries like `canvas-confetti` or `react-confetti`

#### 2. Auditory Conditioning
Sound is critical for gambling psychology.

**Problem**: All spins sound the same  
**Solution**: Tiered sound effects
- **Common**: Standard wooden tick (current tick sound)
- **Rare**: Metallic ping
- **Epic**: Heavy thud or chord / subtle chime on land
- **Legendary**: Triumphant fanfare
- **Godly**: Orchestral hit + reverb tail / choir sample or high-pitched "ding" sequence (like a coin payout)

**The "Near Miss" Enhancement**: If the math determines the user *almost* got a Godly (e.g., they rolled a 0.98 and needed 0.99), play a sound that suggests they were close. This psychological trick keeps users engaged.

**Implementation**: Extend `useRouletteSound.ts` with `playLandingSound(rarity)` using pre-recorded samples or more complex synthesis. Modify the hook to support pitch-shifting or different waveforms for each tier.

#### 3. The "Sunk Cost" Hook (Persistence & Banking)
Since the workout only ends when they hit "Shawarma," users might get discouraged if the list gets too long (e.g., 2 hours of cardio accumulated).

**Problem**: No reason to keep coming back  
**Solution**: Exercise banking system with "Sunk Cost" mechanics
- **"Bank" Mechanic**: Allow users to "Bank" exercises. If they roll 5 runs, let them save 2 for tomorrow. This keeps them coming back to "pay off their debt"  
- Save completed workouts to `localStorage`  
- Track "banked" exercises for streak bonuses  
- **Session History**: Save the total number of "Shawarmas earned." A counter like **"Total Shawarmas Consumed: 14"** provides a sense of long-term progression  
- Show historical stats: total spins, rarest hit, current streak

**Implementation**: Add `useLocalStorage` hook, create `WorkoutHistory` type, persist on each spin. Use `localStorage` to wrap your `exercises` state in `App.tsx`.

#### 4. Progressive Disclosure
**Problem**: All features visible immediately  
**Solution**: Unlock mechanics
- Start with only Common/Rare exercises visible
- Unlock Epic after 5 workouts
- Unlock Legendary after hitting Epic 3 times
- Tease Godly tier but keep it mythical

#### 5. Social Proof (Even for One User)
**Shareable "Receipts"**: Generate a text summary or an image of the final workout list (e.g., *"I had to do 40 mins of squats before I unlocked my Shawarma"*). Even if you are the only user, being able to "see" the work you did creates satisfaction.

#### 6. The RHAM Framework (Responsible Healthy Adult Manipulation)
To further encourage engagement through the "Illusion of Control" and "Sunk Cost" fallacies:
- **Bulk Spin (3x Fast-Track)**: Let users spin 3 times at once. It feels like a 3x higher chance of landing on shawarma, but it's the same probability per spin while instantly creating a larger "Exercise Debt" that the user is more likely to commit to.
- **Exercise Marketplace (Trading Up/Down)**: Allow users to trade exercises. Trade a high-intensity "Epic" for two lower-intensity "Rares" (Trade Down) or sacrifice a "Common" to "Buy a Reroll" with a multiplier on the next result (Trade Up).
- **The "Near Miss"**: If the spin lands adjacent to a Legendary/Godly item, trigger a special animation and sound. Near misses trigger similar dopamine responses to wins.
- **Pity Timer (Pseudo-Randomness)**: Every time a user lands on a "Common" exercise, slightly increase the weight of the Shawarma tier for the next spin.
- **Insurance (Pre-Commitment)**: Offer "Shawarma Insurance" (e.g., do 20 jumping jacks now) for a free re-roll if they land on a long cardio exercise later.
- **Daily Double (Happy Hour)**: Double Shawarma odds during a specific hour (e.g., 5-6 PM) to condition a consistent workout habit.
- **The Shawarma Fund (Financial Commitment)**: An optional mode where each spin "costs" $1 (virtual or via a linked savings app). This builds a "Shawarma Bank." When you hit the exit condition, the accumulated bank is what pays for your actual meal, turning the workout into a literal "earning" session for the reward.

### Immediate Code Recommendations

**High Priority (Core Engagement):**
1. **Add Persistence:**
   Create a `useLocalStorage` hook to wrap your `exercises` state in `App.tsx`.
   ```typescript
   // Simple implementation idea
   const [history, setHistory] = useState(() => {
     const saved = localStorage.getItem('workout-history');
     return saved ? JSON.parse(saved) : [];
   });
   ```

2. **Deploy Confetti:**
   Install the library and trigger on high-tier spins:
   ```bash
   pnpm add canvas-confetti
   pnpm add -D @types/canvas-confetti
   ```
   
   Then trigger when `isExitCondition` is true:
   ```typescript
   import confetti from 'canvas-confetti';
   
   // Inside your spin logic
   if (selectedExercise.rarity === 'godly') {
     confetti({
       particleCount: 100,
       spread: 70,
       origin: { y: 0.6 }
     });
   }
   ```

3. **Visual Polish for Godly Tier:**
   In `App.tsx`, inside your render loop, add a conditional class for the `godly` rarity that enables an animation:
   ```css
   .godly-card {
     animation: shine 2s infinite;
     border: 2px solid gold;
     box-shadow: 0 0 15px gold;
   }
   @keyframes shine {
     0% { background-position: 0% 50%; }
     100% { background-position: 100% 50%; }
   }
   ```
   
   For Legendary+ items:
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