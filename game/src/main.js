// Moonlit Catch: the entry point. Wires the canvas, the input, the audio and
// the fishing world together, runs the fixed-step loop, and renders shot
// scenes deterministically when ?shot= is present.
import { VIEW, BEST_KEY } from './config.js';
import { createNightAudio } from './audio.js';
import { createFishingInput } from './input.js';
import { drawScene } from './render.js';
import { buildShotScene } from './shots.js';
import {
  createNightState, stepNight, castHook, steerHook, moveBoatTo,
  startNextNight, finalWin,
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_NIGHT_CLEAR, SCREEN_WIN, SCREEN_FAIL,
} from './fishing.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');
const audio = createNightAudio();
const params = new URLSearchParams(window.location.search);
const shotScene = params.get('shot');
const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}

function loadBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) || '0', 10) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch (error) {
    // Storage may be unavailable; the game plays on regardless.
  }
}

fitCanvas();
window.addEventListener('resize', fitCanvas);

// Screenshot mode: render one deterministic scene and stop.
if (shotScene) {
  const { state, time } = buildShotScene(shotScene, seed);
  state.best = loadBest();
  drawScene(ctx, state, time);
  window.__shotReady = true;
} else {
  let state = createNightState(seed, 0);
  state.best = loadBest();
  // Read-only handle for automated play-testing (never used by the game itself).
  window.__moonlit = { getState: () => state };

  function announce(text) {
    if (statusLine) statusLine.textContent = text;
  }

  function beginNight() {
    state.screen = SCREEN_PLAY;
    audio.unlockAudio();
    audio.playSplash();
    announce(`${state.night.label}. Quota ${state.quota} points before dawn.`);
  }

  function restartGame() {
    state = createNightState((Date.now() % 100000) + 1, 0);
    state.best = loadBest();
    beginNight();
  }

  const input = createFishingInput(canvas, {
    onCast: () => {
      audio.unlockAudio();
      if (state.screen === SCREEN_PLAY) {
        if (castHook(state)) audio.playSplash();
      }
    },
    onConfirm: () => {
      audio.unlockAudio();
      if (state.screen === SCREEN_TITLE) beginNight();
      else if (state.screen === SCREEN_NIGHT_CLEAR) {
        if (state.nightIndex + 1 >= 3) {
          finalWin(state);
        } else {
          state = startNextNight(state);
          state.best = loadBest();
          announce(`${state.night.label}. Quota ${state.quota} points before dawn.`);
        }
      } else if (state.screen === SCREEN_WIN || state.screen === SCREEN_FAIL) {
        restartGame();
      }
    },
    onPause: () => {
      if (state.screen === SCREEN_PLAY) {
        state.screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (state.screen === SCREEN_PAUSED) {
        state.screen = SCREEN_PLAY;
        announce('Back to fishing.');
      }
    },
    onRestart: () => {
      if (state.screen !== SCREEN_TITLE) restartGame();
    },
    onMute: () => {
      const muted = audio.toggleMuted();
      announce(muted ? 'Sound muted.' : 'Sound on.');
    },
    onClick: (x, y) => {
      audio.unlockAudio();
      if (state.screen === SCREEN_TITLE) beginNight();
      else if (state.screen === SCREEN_NIGHT_CLEAR) {
        if (state.nightIndex + 1 >= 3) finalWin(state);
        else {
          state = startNextNight(state);
          state.best = loadBest();
        }
      } else if (state.screen === SCREEN_WIN || state.screen === SCREEN_FAIL) {
        restartGame();
      } else if (state.screen === SCREEN_PLAY) {
        moveBoatTo(state, x);
        if (castHook(state)) audio.playSplash();
      }
    },
  });

  let lastTime = performance.now();
  let frameCount = 0;
  let visualTime = 0;

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    frameCount += 1;
    visualTime += dt;
    if (state.screen === SCREEN_PLAY) {
      const direction = input.steerDirection();
      if (direction !== 0) steerHook(state, direction, dt);
      const mouseTarget = input.mouseSteerTarget();
      if (mouseTarget !== null && state.hook.state === 'idle') moveBoatTo(state, mouseTarget);
      const result = stepNight(state, dt, audio);
      if (result === 'dawn') {
        if (state.screen === SCREEN_FAIL && state.score > state.best) {
          saveBest(state.score);
          state.best = state.score;
        }
        if (state.screen === SCREEN_WIN) saveBest(state.score);
        announce(state.screen === SCREEN_FAIL
          ? `Dawn breaks. Quota ${state.nightScore} of ${state.quota}. Press R to try again.`
          : 'Quota met. Press Enter for the next night.');
      }
      // Quota met mid-cast: the world already switched screens; save the best.
      if (state.screen === SCREEN_NIGHT_CLEAR && state.score > state.best) {
        saveBest(state.score);
        state.best = state.score;
      }
    }
    // The clock for the visuals is its own steady clock, never the wall.
    drawScene(ctx, state, visualTime);
    requestAnimationFrame(frame);
  }

  drawScene(ctx, state, 0);
  announce('Moonlit Catch. Press Enter or click to begin the night.');
  requestAnimationFrame(frame);
}
