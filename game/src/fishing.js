// Moonlit Catch: the fishing world. One night at a time: the boat, the hook,
// the fish, the jellyfish and the junk, the quota, the combo and the dawn timer.
// Pure state plus a step function; rendering lives in render.js.
import {
  VIEW, SURFACE_Y, WATER_FLOOR, BOAT_Y, NIGHT_SECONDS, NIGHTS,
  SPECIES, JUNK, HOOK, COMBO_MAX, COMBO_WINDOW_SECONDS,
} from './config.js';
import { createSeededRandom, pickRandom, rangeRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_NIGHT_CLEAR = 'night-clear';
export const SCREEN_WIN = 'win';
export const SCREEN_FAIL = 'fail';

export const HOOK_IDLE = 'idle';
export const HOOK_SINKING = 'sinking';
export const HOOK_REELING = 'reeling';

export function createNightState(seed, nightIndex) {
  const random = createSeededRandom(seed + nightIndex * 7919);
  const night = NIGHTS[nightIndex];
  const state = {
    seed,
    nightIndex,
    night,
    screen: SCREEN_TITLE,
    timeLeft: NIGHT_SECONDS,
    elapsed: 0,
    score: 0,
    nightScore: 0,
    quota: night.quota,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    catches: 0,
    fish: [],
    jellyfish: [],
    junk: [],
    boatX: VIEW.width / 2,
    hook: { x: VIEW.width / 2, y: SURFACE_Y, state: HOOK_IDLE, caught: null },
    banner: null,
    bannerTimer: 0,
    reelTicks: 0,
    dawnRung: false,
    best: 0,
  };
  spawnNightLife(state, random);
  return state;
}

function spawnNightLife(state, random) {
  const night = state.night;
  for (let i = 0; i < 16; i += 1) state.fish.push(spawnFish(state, random, true));
  for (let i = 0; i < night.jellyfish; i += 1) {
    state.jellyfish.push({
      x: rangeRandom(random, 60, VIEW.width - 60),
      y: rangeRandom(random, 380, 640),
      radius: rangeRandom(random, 16, 24),
      direction: random() < 0.5 ? -1 : 1,
      speed: rangeRandom(random, 12, 26),
      phase: random() * Math.PI * 2,
      pulse: 0,
    });
  }
  for (let i = 0; i < night.junk; i += 1) {
    const kind = pickRandom(random, JUNK);
    state.junk.push({
      id: kind.id, name: kind.name, penaltySeconds: kind.penaltySeconds,
      x: rangeRandom(random, 80, VIEW.width - 80),
      y: rangeRandom(random, 420, 650),
      direction: random() < 0.5 ? -1 : 1,
      speed: rangeRandom(random, 8, 18),
      bob: random() * Math.PI * 2,
    });
  }
}

function spawnFish(state, random, anywhere) {
  const species = pickRandom(random, SPECIES);
  const depth = rangeRandom(random, species.depth[0], species.depth[1]);
  const direction = random() < 0.5 ? -1 : 1;
  const speed = rangeRandom(random, species.speed[0], species.speed[1]) * state.night.fishSpeed;
  return {
    species,
    x: anywhere ? rangeRandom(random, 40, VIEW.width - 40) : (direction > 0 ? -60 : VIEW.width + 60),
    y: depth,
    direction,
    speed,
    wiggle: random() * Math.PI * 2,
    wiggleSpeed: rangeRandom(random, 2, 5),
  };
}

export function showBanner(state, text, subtext, tone) {
  state.banner = { text, subtext, tone: tone || 'good' };
  state.bannerTimer = 2.2;
}

export function castHook(state) {
  if (state.screen !== SCREEN_PLAY) return false;
  if (state.hook.state !== HOOK_IDLE) return false;
  state.hook.state = HOOK_SINKING;
  state.hook.y = SURFACE_Y + 4;
  state.hook.x = state.boatX;
  return true;
}

// Move the boat (and an idle hook) left/right; the hook steers while sinking.
export function steerHook(state, direction, dt) {
  const speed = HOOK.steerSpeed * dt;
  if (state.hook.state === HOOK_IDLE) {
    state.boatX = clamp(state.boatX + direction * speed, 50, VIEW.width - 50);
    state.hook.x = state.boatX;
  } else if (state.hook.state === HOOK_SINKING) {
    state.hook.x = clamp(state.hook.x + direction * speed, 30, VIEW.width - 30);
  }
}

export function moveBoatTo(state, x) {
  state.boatX = clamp(x, 50, VIEW.width - 50);
  if (state.hook.state === HOOK_IDLE) state.hook.x = state.boatX;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hookHits(hook, target, radius) {
  const dx = hook.x - target.x;
  const dy = hook.y - target.y;
  return dx * dx + dy * dy < (HOOK.radius + radius) * (HOOK.radius + radius);
}

function resolveCatch(state, fish, audio) {
  state.combo = Math.min(state.combo + 1, COMBO_MAX);
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.comboTimer = COMBO_WINDOW_SECONDS;
  const gained = fish.species.points * state.combo;
  state.score += gained;
  state.nightScore += gained;
  state.catches += 1;
  state.hook.caught = fish;
  state.hook.state = HOOK_REELING;
  audio.playCatchChime(state.combo);
  showBanner(
    state,
    `+${gained}  ${fish.species.name}`,
    state.combo > 1 ? `Combo x${state.combo} · ${state.catches} caught tonight` : `${state.catches} caught tonight`,
    'good',
  );
  if (state.nightScore >= state.quota) {
    state.screen = SCREEN_NIGHT_CLEAR;
    audio.playQuotaFanfare();
  }
}

function resolveJunk(state, item, audio) {
  state.timeLeft = Math.max(0, state.timeLeft - item.penaltySeconds);
  state.combo = 0;
  state.comboTimer = 0;
  state.hook.state = HOOK_REELING;
  state.hook.caught = null;
  audio.playJunkClunk();
  showBanner(state, `Snagged: ${item.name}`, `-${item.penaltySeconds}s · combo lost`, 'bad');
  state.junk = state.junk.filter((entry) => entry !== item);
}

function resolveSting(state, audio) {
  state.combo = 0;
  state.comboTimer = 0;
  state.hook.state = HOOK_IDLE;
  state.hook.y = SURFACE_Y;
  state.hook.x = state.boatX;
  state.hook.caught = null;
  audio.playSting();
  showBanner(state, 'Jellyfish sting!', 'Line cut · combo lost · cast again', 'bad');
}

// Advance the night by dt seconds. Returns 'dawn' the moment dawn arrives.
export function stepNight(state, dt, audio) {
  if (state.screen !== SCREEN_PLAY) return null;
  state.elapsed += dt;
  state.timeLeft -= dt;
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  if (state.bannerTimer > 0) state.bannerTimer -= dt;

  // Fish swim on, wrap at the edges, and respawn so the water never empties.
  for (const fish of state.fish) {
    fish.x += fish.direction * fish.speed * dt;
    fish.wiggle += fish.wiggleSpeed * dt;
    if (fish.x < -70 || fish.x > VIEW.width + 70) {
      const replacement = spawnFish(state, createSeededRandom((state.seed + state.catches * 31 + Math.floor(state.elapsed * 7)) >>> 0), false);
      Object.assign(fish, replacement);
    }
  }
  for (const jelly of state.jellyfish) {
    jelly.x += jelly.direction * jelly.speed * dt;
    jelly.pulse += dt * 3;
    if (jelly.x < 30 || jelly.x > VIEW.width - 30) jelly.direction *= -1;
  }
  for (const item of state.junk) {
    item.x += item.direction * item.speed * dt;
    item.bob += dt * 2;
    if (item.x < 40 || item.x > VIEW.width - 40) item.direction *= -1;
  }

  const hook = state.hook;
  if (hook.state === HOOK_SINKING) {
    hook.y += HOOK.sinkSpeed * dt;
    if (hook.y >= WATER_FLOOR) {
      hook.state = HOOK_REELING;
      hook.caught = null;
    }
    // Jellyfish sting first: they guard the deep water.
    for (const jelly of state.jellyfish) {
      if (hookHits(hook, jelly, jelly.radius)) {
        resolveSting(state, audio);
        return null;
      }
    }
    for (const item of state.junk) {
      if (hookHits(hook, item, 16)) {
        resolveJunk(state, item, audio);
        return null;
      }
    }
    for (const fish of state.fish) {
      if (hookHits(hook, fish, fish.species.size * 0.9)) {
        resolveCatch(state, fish, audio);
        state.fish = state.fish.filter((entry) => entry !== fish);
        const replacement = spawnFish(state, createSeededRandom((state.seed + state.catches * 101) >>> 0), false);
        state.fish.push(replacement);
        return null;
      }
    }
  } else if (hook.state === HOOK_REELING) {
    hook.y -= HOOK.reelSpeed * dt;
    state.reelTicks += dt;
    if (state.reelTicks > 0.22) {
      state.reelTicks = 0;
      audio.playReelTick();
    }
    if (hook.y <= SURFACE_Y) {
      hook.y = SURFACE_Y;
      hook.state = HOOK_IDLE;
      hook.x = state.boatX;
      hook.caught = null;
    }
  }

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    if (!state.dawnRung) {
      state.dawnRung = true;
      audio.playDawnBell();
    }
    state.screen = state.nightScore >= state.quota ? SCREEN_NIGHT_CLEAR : SCREEN_FAIL;
    return 'dawn';
  }
  return null;
}

export function startNextNight(state) {
  const nextIndex = state.nightIndex + 1;
  if (nextIndex >= NIGHTS.length) {
    state.screen = SCREEN_WIN;
    return state;
  }
  const next = createNightState(state.seed, nextIndex);
  next.score = state.score;
  next.best = state.best;
  next.screen = SCREEN_PLAY;
  return next;
}

export function finalWin(state) {
  state.screen = SCREEN_WIN;
}
