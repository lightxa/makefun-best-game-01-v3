// Moonlit Catch: every tunable number of the night-fishing game lives here,
// so the rules, the difficulty curve and the look can be tuned in one place.
export const VIEW = { width: 1280, height: 720 };
export const SURFACE_Y = 150;
export const WATER_FLOOR = 690;
export const BOAT_Y = 118;

// A night lasts this long in real seconds; dawn ends it.
export const NIGHT_SECONDS = 75;

// Quotas and difficulty per night. Night 3 is the last: clearing it wins the game.
export const NIGHTS = [
  { quota: 150, fishSpeed: 1.0, jellyfish: 2, junk: 2, label: 'Night 1 · Calm Water' },
  { quota: 260, fishSpeed: 1.3, jellyfish: 4, junk: 3, label: 'Night 2 · Restless Tide' },
  { quota: 420, fishSpeed: 1.65, jellyfish: 6, junk: 4, label: 'Night 3 · The Deep Hour' },
];

// Fish species, grouped by the depth band they swim in. Deeper fish pay more
// but live where the jellyfish drift, so every point is a small gamble.
export const SPECIES = [
  { id: 'minnow', name: 'Silver Minnow', points: 10, depth: [170, 320], speed: [26, 46], size: 15, glow: '#cfe8ff', body: '#9fc3e8' },
  { id: 'sardine', name: 'Moon Sardine', points: 15, depth: [200, 380], speed: [34, 58], size: 18, glow: '#ffe9a8', body: '#e8c96a' },
  { id: 'glowfin', name: 'Glowfin', points: 30, depth: [330, 480], speed: [30, 52], size: 22, glow: '#7dffd4', body: '#3ec9a7' },
  { id: 'mooncarp', name: 'Moon Carp', points: 40, depth: [360, 520], speed: [24, 42], size: 28, glow: '#ffb3d9', body: '#d97ba8' },
  { id: 'abyss-eel', name: 'Abyss Eel', points: 60, depth: [480, 620], speed: [44, 70], size: 34, glow: '#b78cff', body: '#8a5cf6' },
  { id: 'lanternfish', name: 'Lanternfish', points: 90, depth: [520, 660], speed: [36, 55], size: 26, glow: '#fff3b0', body: '#f2c94c' },
];

// Junk costs the angler time and breaks the combo; it never scores.
export const JUNK = [
  { id: 'boot', name: 'Old Boot', penaltySeconds: 3 },
  { id: 'tin-can', name: 'Tin Can', penaltySeconds: 2 },
];

export const HOOK = {
  sinkSpeed: 260,
  reelSpeed: 340,
  steerSpeed: 320,
  radius: 9,
};

// Combo: each catch without a miss raises the multiplier, capped at x5.
// A jellyfish sting or a piece of junk resets it to x1.
export const COMBO_MAX = 5;
export const COMBO_WINDOW_SECONDS = 6;

export const BEST_KEY = 'moonlit-catch-best';
