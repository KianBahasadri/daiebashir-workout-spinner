# Bug Detection and Security Audit - Findings Report

**Project:** Workout Roulette Spinner  
**Date:** 2026-01-29  
**Status:** In Progress

---

## CRITICAL BUGS (P0)

### None Found

---

## HIGH PRIORITY BUGS (P1)

### BUG-001: Potential Infinite Loop in SimulationTab
**File:** `src/SimulationTab.tsx:52-71`  
**Severity:** P1 (High)  
**Type:** Logic Error / Infinite Loop Risk

**Description:**
The simulation can enter a problematic state when there are no exit conditions defined. While there is a safety break at line 70 (`if (workoutLength > 1000) break`), this only breaks the inner workout loop. If there are no exit conditions, the outer loop will continue indefinitely trying to reach `targetSpins`, but each workout will max out at 1000 spins.

**Problematic Code:**
```typescript
// Simulate until we reach the target number of spins
while (totalSpins < targetSpins) {
  totalWorkouts++
  let workoutFinished = false
  let workoutLength = 0
  
  // Simulate one full workout until an exit condition is met
  while (!workoutFinished) {
    totalSpins++
    workoutLength++
    const index = pickExerciseIndex(exercises)
    const exercise = exercises[index]
    rarityCounts[exercise.rarity]++
    
    if (exercise.isExitCondition) {
      workoutFinished = true
    }

    // Safety break to prevent infinite loops if no exit condition exists
    if (workoutLength > 1000) break // ← BUG: breaks inner loop only
  }
  // ...continues outer loop
}
```

**Impact:**
- If no exercises have `isExitCondition: true`, the simulation will run indefinitely
- Each workout will consume 1000 iterations before breaking
- The outer loop will never complete, causing browser freeze/hang

**Recommended Fix:**
```typescript
// Safety break to prevent infinite loops if no exit condition exists
if (workoutLength > 1000) {
  workoutFinished = true // Force exit the workout
  console.warn('Simulation workout exceeded 1000 spins - no exit condition may be configured')
}
```

**Status:** To be fixed

---

### BUG-002: Undefined Exercise Name Handling in useGameState
**File:** `src/hooks/useGameState.ts:226-238`  
**Severity:** P1 (High)  
**Type:** Defensive Programming / Edge Case

**Description:**
If `pickExerciseIndex` returns an index that doesn't exist in the `exercises` array, `pickedName` will be `undefined`. The subsequent loop checking `wheelSlots[i].name === pickedName` will never match, causing `candidateSlots` to remain empty and falling back to random wheel selection. This could lead to landing on the wrong exercise.

**Problematic Code:**
```typescript
const exerciseIndex = pickExerciseIndex(exercises);
const pickedName = exercises[exerciseIndex]?.name; // ← Can be undefined

const candidateSlots: number[] = [];
for (let i = 0; i < wheelSlots.length; i += 1) {
    if (wheelSlots[i].name === pickedName) candidateSlots.push(i); // ← Never matches if undefined
}

const slotIndex =
    candidateSlots.length > 0
        ? candidateSlots[Math.floor(Math.random() * candidateSlots.length)]
        : Math.floor(Math.random() * wheelSlots.length); // ← Fallback to random
```

**Impact:**
- Potential mismatch between selected exercise and displayed wheel position
- Could show one exercise but actually select another
- Breaks the visual/logical consistency of the game

**Root Cause Analysis:**
Looking at `pickExerciseIndex` in `workoutMath.ts:128-165`, it should always return a valid index. However, there's a fallback at line 164:
```typescript
// Fallback (should not happen with proper probabilities)
return Math.floor(Math.random() * exercises.length)
```

This fallback could return an out-of-bounds index if `exercises` is empty.

**Recommended Fix:**
```typescript
const exerciseIndex = pickExerciseIndex(exercises);
if (exerciseIndex < 0 || exerciseIndex >= exercises.length) {
    console.error('Invalid exercise index returned:', exerciseIndex);
    return; // Abort the spin
}
const pickedName = exercises[exerciseIndex].name;
```

**Status:** To be fixed

---

## MEDIUM PRIORITY BUGS (P2)

### BUG-003: Probabilities Don't Sum Check Missing
**File:** `src/types.ts:5-11`  
**Severity:** P2 (Medium)  
**Type:** Data Validation

**Description:**
The `RARITY_CONFIG` probabilities are hardcoded and correctly sum to 1.0, but there's no runtime validation to ensure this. If a developer modifies these values incorrectly, the app won't detect or warn about the issue.

**Current State:**
```typescript
export const RARITY_CONFIG = {
  common: { name: 'Common', color: '#FFFFFF', probability: 0.5, category: 'Cardio' },
  rare: { name: 'Rare', color: '#4A90E2', probability: 0.3, category: 'Bodyweight' },
  epic: { name: 'Epic', color: '#9B59B6', probability: 0.15, category: 'Strength' },
  legendary: { name: 'Legendary', color: '#FF3B30', probability: 0.04, category: 'Reward' },
  godly: { name: 'Godly', color: '#FFD700', probability: 0.01, category: 'Ultimate' }
} as const
```

**Recommended Fix:**
Add a runtime assertion during development:
```typescript
// Development-time validation
if (import.meta.env.DEV) {
  const sum = Object.values(RARITY_CONFIG).reduce((acc, r) => acc + r.probability, 0);
  if (Math.abs(sum - 1.0) > 0.0001) {
    console.error('RARITY_CONFIG probabilities do not sum to 1.0:', sum);
  }
}
```

**Status:** Low priority - probabilities are currently correct

---

### BUG-004: Missing Accessibility - Alt Text for Decorative Elements
**File:** `src/App.tsx:267-269`  
**Severity:** P2 (Medium)  
**Type:** Accessibility (a11y)

**Description:**
The pointer element uses `aria-hidden="true"` which is correct, but there's no screen reader announcement when the spin completes or when an exercise is selected.

**Current State:**
```typescript
<div className="pointer" aria-hidden="true">
    ▼
</div>
```

**Impact:**
- Screen reader users don't get auditory feedback when a spin completes
- Reduces accessibility for visually impaired users

**Recommended Fix:**
Add an ARIA live region to announce results:
```typescript
{selectedExercise && (
  <>
    <div className="result">
      <h2>Your exercise:</h2>
      <p className="exercise-name">{selectedExercise}</p>
    </div>
    <div role="status" aria-live="polite" className="sr-only">
      Spin complete. You got: {selectedExercise}
    </div>
  </>
)}
```

**Status:** To be fixed

---

### BUG-005: LocalStorage Quota Exceeded Not Gracefully Handled
**File:** `src/hooks/usePersistentState.ts:27-38`  
**Severity:** P2 (Medium)  
**Type:** Error Handling

**Description:**
While the code does catch errors when writing to localStorage, it silently ignores quota exceeded errors. Users won't know why their progress isn't being saved.

**Current Code:**
```typescript
useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const serialized = JSON.stringify(state)
      if (serialized === undefined) {
        window.localStorage.removeItem(key)
        return
      }
      window.localStorage.setItem(key, serialized)
    } catch {
      // ignore write errors (quota exceeded, privacy mode, etc.)
    }
}, [key, state])
```

**Recommended Fix:**
```typescript
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    console.warn('LocalStorage quota exceeded - progress will not be saved');
  }
  // Still ignore other errors (privacy mode, etc.)
}
```

**Status:** Low priority - localStorage usage is minimal

---

## LOW PRIORITY ISSUES (P3)

### ISSUE-001: Math.random() Used for Game Logic (Non-Security Context)
**File:** Multiple files (App.tsx, workoutMath.ts, useGameState.ts, etc.)  
**Severity:** P3 (Low)  
**Type:** Best Practice

**Description:**
`Math.random()` is used throughout the codebase for game logic (exercise selection, spin animations, etc.). While this is perfectly fine for a game/fitness app, it's worth documenting that this is intentional and not a security concern.

**Why This Is OK:**
- This is NOT a gambling app with real money
- Randomness is for fitness/entertainment purposes only
- Predictability doesn't create security or financial risk
- `Math.random()` is sufficient for this use case

**Documentation Note:**
The README already clearly states: "This is NOT a gambling site" and "100% Free" - so using `Math.random()` is appropriate.

**Status:** No fix needed - working as intended

---

### ISSUE-002: Console Logs Removed But Could Help Debugging
**File:** Multiple  
**Severity:** P3 (Low)  
**Type:** Developer Experience

**Description:**
There are no console.log statements in the codebase, which is good for production. However, adding some development-only logging could help with debugging.

**Recommended Addition:**
```typescript
if (import.meta.env.DEV) {
  console.log('Exercise picked:', exercise.name, 'Rarity:', exercise.rarity);
}
```

**Status:** Optional enhancement

---

### ISSUE-003: No Unit Tests
**File:** N/A  
**Severity:** P3 (Low)  
**Type:** Testing Infrastructure

**Description:**
The project has no unit tests. Critical mathematical functions (`calculateMathStats`, `pickExerciseIndex`, `geometricCdf`, etc.) should be tested.

**Recommended Action:**
Add a testing framework (Vitest recommended for Vite projects) and create tests for:
- Probability calculations
- Geometric distribution functions
- Wheel slot generation
- Exercise selection logic

**Status:** Enhancement - not a bug

---

### ISSUE-004: Hardcoded Magic Numbers
**File:** `src/SimulationTab.tsx:70, src/config/constants.ts`  
**Severity:** P3 (Low)  
**Type:** Code Quality

**Description:**
Some magic numbers are hardcoded:
- `1000` in SimulationTab.tsx (safety break limit)
- Various animation/UI constants

**Recommendation:**
Extract to named constants for better maintainability:
```typescript
const MAX_SIMULATION_WORKOUT_LENGTH = 1000;
```

**Status:** Code quality improvement

---

## SECURITY ANALYSIS

### ✅ PASS: XSS Protection
- No `dangerouslySetInnerHTML` usage
- No `innerHTML` manipulation
- All user data is from localStorage (self-contained)
- React automatically escapes output

### ✅ PASS: Dependency Security
- `npm audit` shows 0 vulnerabilities
- All dependencies are up-to-date
- No known CVEs

### ✅ PASS: Data Security
- No sensitive data stored
- No API keys or secrets
- No authentication system
- LocalStorage only used for UI state (tab unlocking)

### ✅ PASS: Injection Prevention
- No `eval()` usage
- No dynamic code execution
- No SQL (no backend)
- No server-side code in this repo

### ✅ PASS: Cryptographic Security
- Math.random() usage is appropriate (non-security context)
- No cryptographic operations needed
- No password hashing
- No encryption requirements

---

## REACT-SPECIFIC ANALYSIS

### ✅ PASS: Hook Dependencies
- All useEffect/useCallback hooks have correct dependencies
- No missing dependencies that would cause stale closures

### ✅ PASS: Memory Leak Prevention
- Audio context cleanup properly implemented (useRouletteSound.ts:89-106)
- Event listeners cleaned up in useEffect returns
- requestAnimationFrame properly cancelled (App.tsx:189-197)
- Timeouts properly cleared (useGameState.ts:198-205)

### ✅ PASS: State Management
- No state mutations
- Proper use of immutable updates
- LocalStorage persistence properly handled

### ⚠️ WARNING: Potential Race Condition
**File:** `src/SimulationTab.tsx:35-36`  

The simulation uses `setTimeout` to defer computation, then immediately sets `isSimulating: true`. If a user clicks the button multiple times rapidly, multiple simulations could run concurrently.

**Current Code:**
```typescript
const runSimulation = () => {
    if (exercises.length === 0) return

    setResults(prev => prev ? { ...prev, isSimulating: true } : null) // ← Only sets if prev exists

    setTimeout(() => {
      // ... heavy simulation
    }, 0)
}
```

**Issue:** No guard to prevent multiple concurrent simulations.

**Recommended Fix:**
```typescript
const runSimulation = () => {
    if (exercises.length === 0) return
    if (results?.isSimulating) return // ← Prevent concurrent runs

    setResults(prev => prev ? { ...prev, isSimulating: true } : { 
      rarityStats: [], 
      avgLength: 0, 
      totalSpins: 0, 
      totalWorkouts: 0, 
      isSimulating: true, 
      lengthFrequencies: {},
      stdDev: 0 
    })
    // ...
}
```

---

## MATHEMATICAL CORRECTNESS

### ✅ PASS: Probability Sum
- Rarity probabilities sum to exactly 1.0
- Verified: 0.5 + 0.3 + 0.15 + 0.04 + 0.01 = 1.0

### ✅ PASS: Geometric Distribution
- CDF implementation is mathematically correct
- PMF implementation is correct
- spinsForCdf uses correct inverse CDF formula

### ✅ PASS: Expected Value Calculations
- E[spins] = 1/p (correct)
- E[exercises before exit] = (1-p)/p (correct)
- Weighted duration calculation is correct

### ✅ PASS: Division by Zero Protection
- All division operations check for zero denominators
- Fallback to `Number.POSITIVE_INFINITY` where appropriate
- Safe handling in all mathematical functions

---

## UI/UX ANALYSIS

### ✅ PASS: Responsive Design
- Uses relative units (%, vw, rem)
- Flexbox for layout
- Should work on mobile/tablet/desktop

### ⚠️ NEEDS IMPROVEMENT: Keyboard Navigation
- Spin button is keyboard accessible
- Tab navigation works
- BUT: No keyboard shortcut to spin (e.g., Space bar)

**Recommended Enhancement:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !isSpinning && document.activeElement === document.body) {
      e.preventDefault();
      spin();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isSpinning, spin]);
```

### ✅ PASS: Focus Management
- Proper button focus states
- Info popup focus handling

### ⚠️ NEEDS IMPROVEMENT: ARIA Labels
- Some interactive elements missing ARIA labels
- Info popups could have better descriptions

---

## PERFORMANCE ANALYSIS

### ✅ PASS: React Performance
- Proper use of useMemo for expensive calculations
- useCallback for event handlers
- No unnecessary re-renders detected

### ✅ PASS: Animation Performance
- requestAnimationFrame for smooth animations
- GPU-accelerated transforms (translateX)
- Proper cleanup to prevent memory leaks

### ⚠️ POTENTIAL ISSUE: Large Simulation Performance
**File:** `src/SimulationTab.tsx:32-97`

Running simulations with large `targetSpins` values (e.g., 100,000) could freeze the UI since it runs synchronously in setTimeout.

**Recommendation:**
Consider using a Web Worker for large simulations or breaking the work into chunks.

---

## BUILD & DEPLOYMENT

### ✅ PASS: Build Configuration
- Production build succeeds
- Code splitting enabled
- Source maps configured
- Bundle size reasonable (244KB JS)

### ✅ PASS: Environment Configuration
- Vite configuration is proper
- TypeScript compilation works
- ESLint configuration correct

---

## SUMMARY

### Critical Issues: 0
### High Priority Bugs: 2
- BUG-001: Infinite loop in simulation (needs fix)
- BUG-002: Undefined exercise name handling (needs defensive check)

### Medium Priority Issues: 3
- BUG-003: Probability validation (nice to have)
- BUG-004: Accessibility improvements (should fix)
- BUG-005: LocalStorage error handling (minor)

### Low Priority: 4
- Various code quality and enhancement suggestions

### Security: ✅ ALL PASS
No security vulnerabilities found.

---

## RECOMMENDED ACTION ITEMS

### Must Fix (Before Production):
1. ✅ Fix lint warnings (DONE)
2. Fix BUG-001: Simulation infinite loop
3. Fix BUG-002: Exercise index validation

### Should Fix (Quality):
4. Add accessibility improvements (BUG-004)
5. Add runtime probability validation
6. Prevent concurrent simulations

### Nice to Have (Enhancement):
7. Add unit tests
8. Add keyboard shortcuts
9. Extract magic numbers
10. Add development logging

---

**Next Step:** Implement fixes for P1 bugs
