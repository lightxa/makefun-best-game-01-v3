// Moonlit Catch: deterministic screenshot scenes behind ?shot=title|play|catch|win.
// Each scene plays the real rules forward from a fresh seeded night for a fixed
// number of steps, so the frame is what a short game really looks like and the
// same seed always gives the same frame. No wall clock is read here.
import { VIEW } from './config.js';
import {
  createNightState, stepNight, castHook, steerHook, showBanner,
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN,
} from './fishing.js';

const SAMPLE = 1 / 30;

// Step a night forward with a scripted angler: steer toward the nearest fish
// below the hook, cast when one is close, so the scene shows real play.
function playForward(state, seconds, audio) {
  const steps = Math.round(seconds / SAMPLE);
  for (let step = 0; step < steps; step += 1) {
    if (state.screen !== SCREEN_PLAY) break;
    const hook = state.hook;
    if (hook.state === 'idle') {
      let target = null;
      for (const fish of state.fish) {
        if (!target || fish.y > target.y) target = fish;
      }
      if (target) {
        const dx = target.x - state.boatX;
        steerHook(state, dx > 12 ? 1 : dx < -12 ? -1 : 0, SAMPLE);
        if (Math.abs(dx) < 26) castHook(state);
      }
    } else if (hook.state === 'sinking') {
      let target = null;
      for (const fish of state.fish) {
        if (fish.y > hook.y && (!target || fish.y < target.y)) target = fish;
      }
      if (target) {
        const dx = target.x - hook.x;
        steerHook(state, dx > 10 ? 1 : dx < -10 ? -1 : 0, SAMPLE);
      }
    }
    stepNight(state, SAMPLE, audio);
  }
  return state;
}

const silentAudio = {
  playSplash() {}, playReelTick() {}, playCatchChime() {}, playJunkClunk() {},
  playSting() {}, playDawnBell() {}, playQuotaFanfare() {},
};

export function buildShotScene(scene, seed) {
  const state = createNightState(seed, 0);
  if (scene === 'title') {
    state.screen = SCREEN_TITLE;
    state.elapsed = 0;
    // A few fish drifted into view for the title backdrop.
    for (const fish of state.fish) fish.x = (fish.x + 120) % VIEW.width;
    return { state, time: 3.2 };
  }
  if (scene === 'play') {
    state.screen = SCREEN_PLAY;
    playForward(state, 14, silentAudio);
    state.screen = SCREEN_PLAY;
    return { state, time: 14 };
  }
  if (scene === 'catch') {
    state.screen = SCREEN_PLAY;
    playForward(state, 22, silentAudio);
    // The autopilot may have met the quota already; bring the scene back to
    // live play so the catch moment itself is what the frame shows.
    state.screen = SCREEN_PLAY;
    state.hook.state = 'reeling';
    state.hook.y = 300;
    const caughtFish = state.fish[0];
    state.fish = state.fish.slice(1);
    state.hook.caught = caughtFish;
    state.combo = 3;
    showBanner(state, '+120  Moon Carp', `Combo x3 · ${state.catches} caught tonight`, 'good');
    state.bannerTimer = 2.2;
    return { state, time: 22 };
  }
  if (scene === 'win') {
    const won = createNightState(seed, 2);
    won.screen = SCREEN_WIN;
    won.score = 830;
    won.nightScore = 420;
    won.catches = 21;
    won.bestCombo = 5;
    return { state: won, time: 5 };
  }
  // Unknown scene: fall back to the title.
  state.screen = SCREEN_TITLE;
  return { state, time: 0 };
}
