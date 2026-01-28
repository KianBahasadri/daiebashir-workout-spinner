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

Traditional gambling exploits psychological mechanisms (variable ratio reinforcement, rarity systems, anticipation mechanics) to encourage monetary spending, which raises serious ethical concerns. Workout Spinner intentionally uses these same psychological principles—but with a crucial difference: **instead of extracting money, it encourages healthy behavior**.

**Key Ethical Distinctions:**

- **100% Free**: There is no monetary component whatsoever. No purchases, no microtransactions, no paid advantages. You cannot spend money even if you wanted to.
- **Positive Outcome**: The "addictive" behavior being encouraged is exercise—objectively beneficial for physical and mental health.
- **Transparent Design**: The probability mathematics are openly displayed and explained in the app. Users can see exactly how the randomization works.
- **No Exploitation**: Since there's no financial component, being psychologically manipulative to increase engagement means users exercise more, not lose money.

In this context, making the app "addictive" is not only ethical but desirable. If someone becomes "addicted" to spinning for workouts, the result is improved health and fitness, not financial harm.

## Project Analysis & Roadmap

### Functionality Overview

This application is a **stochastic workout generator**. It gamifies exercise by treating a workout session like a series of "loot box" openings or slot machine spins.

#### Mode 1: The Roulette (Current)
1. **The Spin**: User clicks a button to spin the roulette-style wheel
2. **RNG Logic**: The app selects an exercise based on a weighted probability table defined in `src/types.ts`:
   - First, a rarity tier is selected based on fixed probabilities (Common 50%, Rare 30%, Epic 15%, Legendary 4%, Godly 1%)
   - Then, a random exercise is chosen from that tier
3. **Rarity System**: Exercises are categorized into tiers with specific drop rates:
   - **Common (50%)**: Low intensity cardio (e.g., 10 mins run)
   - **Rare (30%)**: Moderate intensity bodyweight (e.g., 1 min plank)
   - **Epic (15%)**: Strength training (e.g., bench press)
   - **Legendary (4%)**: "Shawarma" (Exit Condition)
   - **Godly (1%)**: "Shawarma + Beer" (Exit Condition)

#### Mode 2: Snakes & Ladders (Planned)
A more deterministic alternative to the Roulette mode. Instead of a wheel, the user progresses through a Snakes & Ladders style board where the final square is **Shawarma**.

- **Game Loop**: On every turn, you roll a die and move forward. Every roll (every square you land on) triggers an exercise.
- **The Board**: Features snakes that send you back (more exercises) and ladders that skip you forward (closer to shawarma).
- **Progressive Probability**: Unlike the Roulette wheel where every spin has an independent chance of ending the session, this mode provides a clear sense of progress. Your chance of "winning" increases the further down the board you get, reducing the "eternal workout" frustration.

**Math Transparency**: A dedicated tab (`SessionsTab.tsx`) calculates and displays the expected value (EV) of the workout, such as "Average exercises before Shawarma" and "Likelihood the game ends on spin X," utilizing geometric distributions. All mathematical formulas are not just calculated but also **displayed and explained** in the UI, making the probability mechanics transparent to users.

**Weaknesses:**
- ❌ **Limited Persistence**: Only unlocked tabs are saved to `localStorage`. Sessions and progress aren’t saved—refreshing still clears your current run.
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
- **Epic (15%)**: Subtle glow effect around the card
- **Legendary (4%)**: Confetti burst + screen shake
- **Godly (1%)**: Full-screen confetti + intense shake + color flash

**Additional Enhancement - "Loot Box" Reveal**: Instead of showing the result immediately, show a glowing orb or a shaking box that takes 1-2 seconds to open. This builds anticipation (the highest dopamine spike actually occurs *before* the reward).

**Implementation**: Use libraries like `canvas-confetti` or `react-confetti`

#### 5. Social Proof (Even for One User)
**Shareable "Receipts"**: Generate a text summary or an image of the final workout list (e.g., *"I had to do 40 mins of squats before I unlocked my Shawarma"*). Even if you are the only user, being able to "see" the work you did creates satisfaction.

#### 6. The RHAM Framework (Responsible Healthy Adult Manipulation)
To further encourage engagement through the "Illusion of Control" and "Sunk Cost" fallacies:
- **Bulk Spin (3x Fast-Track)**: Let users spin 3 times at once. It feels like a 3x higher chance of landing on shawarma, but it's the same probability per spin while instantly creating a larger "Exercise Debt" that the user is more likely to commit to.
- **Exercise Marketplace (Trading Up/Down)**: Allow users to trade exercises. Trade a high-intensity "Epic" for two lower-intensity "Rares" (Trade Down) or sacrifice a "Common" to "Buy a Reroll" with a multiplier on the next result (Trade Up).
- **The "Near Miss"**: If the spin lands adjacent to a Legendary/Godly item, trigger a special animation and sound. Near misses trigger similar dopamine responses to wins.
- **Insurance (Pre-Commitment)**: Offer "Shawarma Insurance" (e.g., do 20 jumping jacks now) for a free re-roll if they land on a long cardio exercise later.
- **Daily Double (Happy Hour)**: Double Shawarma odds during a specific hour (e.g., 5-6 PM) to condition a consistent workout habit.
- **The Shawarma Fund (Financial Commitment)**: An optional mode where each spin "costs" $1 (virtual or via a linked savings app). This builds a "Shawarma Bank." When you hit the exit condition, the accumulated bank is what pays for your actual meal, turning the workout into a literal "earning" session for the reward.
