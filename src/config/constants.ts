// Wheel / reel constants
export const SPIN_DURATION_MS = 4000
export const CARD_WIDTH = 160
export const CARD_GAP = 16

// Rendering tens of thousands of cards causes a noticeable delay on refresh.
// Keep the track short and re-center after each spin to preserve the "infinite" feel.
export const TRACK_REPEATS = 12
export const CENTER_REPEAT = Math.floor(TRACK_REPEATS / 2)

export const MIN_LOOPS = 4
export const MAX_LOOPS = 7
export const WHEEL_SLOTS = 100

// Progress / UX constants
export const MAX_UNLOCKED_TABS = 5
