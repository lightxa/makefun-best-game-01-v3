// Moonlit Catch: all canvas drawing. One clear job: turn a night state into
// a readable scene — moonlit sky, dark blue water, glowing fish, the boat and
// its line, the HUD, and every menu screen.
import { VIEW, SURFACE_Y, WATER_FLOOR, NIGHT_SECONDS, BOAT_Y } from './config.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_NIGHT_CLEAR, SCREEN_WIN, SCREEN_FAIL,
} from './fishing.js';

export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_NIGHT_CLEAR, SCREEN_WIN, SCREEN_FAIL };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, SURFACE_Y);
  sky.addColorStop(0, '#050914');
  sky.addColorStop(0.7, '#0b1e3a');
  sky.addColorStop(1, '#123a5e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, SURFACE_Y);
  // Stars, fixed positions from a tiny hash so they never twinkle out of place.
  ctx.fillStyle = '#dfeaff';
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 173.3) % VIEW.width;
    const y = (i * 97.7) % 110;
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.7 + i));
    ctx.globalAlpha = 0.35 + 0.55 * twinkle;
    ctx.fillRect(x, y, i % 7 === 0 ? 3 : 2, i % 7 === 0 ? 3 : 2);
  }
  ctx.globalAlpha = 1;
  // The moon and its path of light on the water.
  const moonX = 1060;
  const moonY = 62;
  const glow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
  glow.addColorStop(0, 'rgba(255, 244, 200, 0.9)');
  glow.addColorStop(0.35, 'rgba(255, 244, 200, 0.25)');
  glow.addColorStop(1, 'rgba(255, 244, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(moonX - 95, moonY - 95, 190, 190);
  ctx.fillStyle = '#fff6cf';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(214, 196, 140, 0.55)';
  ctx.beginPath();
  ctx.arc(moonX - 12, moonY - 6, 7, 0, Math.PI * 2);
  ctx.arc(moonX + 9, moonY + 11, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 244, 200, 0.16)';
  for (let i = 0; i < 7; i += 1) {
    const w = 130 - i * 14;
    ctx.fillRect(moonX - w / 2, SURFACE_Y + 4 + i * 9, w, 3);
  }
}

function drawWater(ctx, time) {
  const water = ctx.createLinearGradient(0, SURFACE_Y, 0, VIEW.height);
  water.addColorStop(0, '#0e3a5c');
  water.addColorStop(0.35, '#0a2a4a');
  water.addColorStop(0.75, '#061a33');
  water.addColorStop(1, '#030d1f');
  ctx.fillStyle = water;
  ctx.fillRect(0, SURFACE_Y, VIEW.width, VIEW.height - SURFACE_Y);
  // Slow god-rays from the moon.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffeec2';
  for (let i = 0; i < 4; i += 1) {
    const x = 980 + i * 60 + Math.sin(time * 0.3 + i) * 12;
    ctx.beginPath();
    ctx.moveTo(x, SURFACE_Y);
    ctx.lineTo(x + 46, SURFACE_Y);
    ctx.lineTo(x + 130, VIEW.height);
    ctx.lineTo(x + 30, VIEW.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Surface shimmer.
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= VIEW.width; x += 16) {
    const y = SURFACE_Y + Math.sin(x * 0.05 + time * 2) * 2.5;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Depth bands, faintly labelled by the light that reaches them.
  ctx.fillStyle = 'rgba(190, 225, 255, 0.10)';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('SHALLOWS', 24, 200);
  ctx.fillText('TWILIGHT', 24, 420);
  ctx.fillText('THE DEEP', 24, 640);
}

function drawBoat(ctx, state, time) {
  const bob = Math.sin(time * 1.4) * 3;
  const x = state.boatX;
  const y = BOAT_Y + bob;
  ctx.save();
  ctx.translate(x, y);
  // Hull.
  ctx.fillStyle = '#5a3a22';
  ctx.beginPath();
  ctx.moveTo(-58, 0);
  ctx.lineTo(58, 0);
  ctx.lineTo(44, 20);
  ctx.lineTo(-44, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(-58, -2, 116, 5);
  // Mast, sail and the warm lamp that hangs over the water.
  ctx.strokeStyle = '#3d2716';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, -62);
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.lineTo(0, -8);
  ctx.lineTo(38, -8);
  ctx.closePath();
  ctx.fill();
  const lampGlow = ctx.createRadialGradient(52, -14, 2, 52, -14, 42);
  lampGlow.addColorStop(0, 'rgba(255, 214, 120, 0.85)');
  lampGlow.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = lampGlow;
  ctx.fillRect(10, -56, 84, 84);
  ctx.fillStyle = '#ffd678';
  ctx.beginPath();
  ctx.arc(52, -14, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6a2f';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, -21, 14, 14);
  // The angler, a small hooded silhouette.
  ctx.fillStyle = '#1d2b45';
  ctx.beginPath();
  ctx.arc(-18, -26, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-26, -18, 16, 18);
  ctx.restore();
}

function drawLineAndHook(ctx, state) {
  const hook = state.hook;
  ctx.strokeStyle = 'rgba(230, 240, 255, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(state.boatX + 52, BOAT_Y - 14);
  ctx.lineTo(hook.x, hook.y);
  ctx.stroke();
  // Hook.
  ctx.strokeStyle = '#d7dee8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hook.x, hook.y + 2, 7, Math.PI * 0.15, Math.PI * 1.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hook.x + 7, hook.y - 5);
  ctx.lineTo(hook.x + 7, hook.y + 4);
  ctx.stroke();
  // A caught fish dangles from the hook while it reels up.
  if (hook.caught) drawFish(ctx, hook.caught, hook.x, hook.y + 22, true);
}

function drawFish(ctx, fish, x, y, dangling) {
  const species = fish.species;
  const size = species.size;
  const wiggle = dangling ? 0.3 : Math.sin(fish.wiggle) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(wiggle * (dangling ? 1 : fish.direction));
  ctx.scale(fish.direction, 1);
  // Bioluminescent glow.
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 2.2);
  glow.addColorStop(0, species.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = glow;
  ctx.fillRect(-size * 2.2, -size * 2.2, size * 4.4, size * 4.4);
  ctx.globalAlpha = 1;
  // Body and tail.
  ctx.fillStyle = species.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.8, 0);
  ctx.lineTo(-size * 1.5, -size * 0.45);
  ctx.lineTo(-size * 1.5, size * 0.45);
  ctx.closePath();
  ctx.fill();
  // Glowing stripe and eye.
  ctx.fillStyle = species.glow;
  ctx.fillRect(-size * 0.5, -2, size, 4);
  ctx.fillStyle = '#06101f';
  ctx.beginPath();
  ctx.arc(size * 0.55, -size * 0.12, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawJellyfish(ctx, jelly) {
  const pulse = 1 + Math.sin(jelly.pulse) * 0.12;
  ctx.save();
  ctx.translate(jelly.x, jelly.y);
  ctx.scale(pulse, 1 / pulse);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, jelly.radius * 2);
  glow.addColorStop(0, 'rgba(255, 120, 200, 0.5)');
  glow.addColorStop(1, 'rgba(255, 120, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-jelly.radius * 2, -jelly.radius * 2, jelly.radius * 4, jelly.radius * 4);
  ctx.fillStyle = 'rgba(255, 150, 210, 0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, jelly.radius, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 170, 220, 0.7)';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * jelly.radius * 0.35, jelly.radius * 0.4);
    ctx.quadraticCurveTo(i * jelly.radius * 0.4 + 4, jelly.radius + 14, i * jelly.radius * 0.3, jelly.radius + 26);
    ctx.stroke();
  }
  ctx.restore();
}

function drawJunk(ctx, item) {
  ctx.save();
  ctx.translate(item.x, item.y + Math.sin(item.bob) * 3);
  ctx.rotate(Math.sin(item.bob * 0.7) * 0.15);
  ctx.fillStyle = '#6b5a43';
  if (item.id === 'boot') {
    ctx.fillRect(-14, -6, 22, 10);
    ctx.fillRect(-14, -14, 9, 18);
  } else {
    ctx.fillStyle = '#8a8f96';
    ctx.fillRect(-10, -8, 20, 16);
    ctx.fillStyle = '#5c6167';
    ctx.fillRect(-10, -8, 20, 4);
  }
  ctx.restore();
}

function drawHud(ctx, state) {
  const quotaProgress = Math.min(1, state.nightScore / state.quota);
  // Top bar.
  ctx.fillStyle = 'rgba(3, 10, 24, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, 46);
  ctx.fillStyle = '#eaf3ff';
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🌙 ${state.night.label}`, 18, 30);
  ctx.font = '600 17px system-ui, sans-serif';
  ctx.fillText(`SCORE  ${state.score}`, 330, 29);
  const comboText = state.combo > 1 ? `COMBO x${state.combo}` : 'COMBO x1';
  ctx.fillStyle = state.combo > 1 ? '#ffd678' : '#9fb6d4';
  ctx.fillText(comboText, 500, 29);
  // Quota bar.
  ctx.fillStyle = '#12283f';
  roundRect(ctx, 640, 12, 300, 22, 11);
  ctx.fill();
  ctx.fillStyle = quotaProgress >= 1 ? '#7dffd4' : '#4fc3f7';
  if (quotaProgress > 0) {
    roundRect(ctx, 640, 12, 300 * quotaProgress, 22, 11);
    ctx.fill();
  }
  ctx.fillStyle = '#eaf3ff';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(`QUOTA ${state.nightScore}/${state.quota}`, 950, 29);
  // Dawn timer: the sun creeps up as the night runs out.
  const dawnFraction = 1 - state.timeLeft / NIGHT_SECONDS;
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(1215, 34 - dawnFraction * 8, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eaf3ff';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'right';
  const seconds = Math.ceil(state.timeLeft);
  ctx.fillText(`DAWN ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, 1192, 29);
  ctx.textAlign = 'left';
  // Catch banner.
  if (state.banner && state.bannerTimer > 0) {
    const alpha = Math.min(1, state.bannerTimer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = state.banner.tone === 'bad' ? 'rgba(120, 20, 40, 0.85)' : 'rgba(6, 60, 50, 0.88)';
    const w = 460;
    roundRect(ctx, VIEW.width / 2 - w / 2, 96, w, 64, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner.text, VIEW.width / 2, 124);
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.fillStyle = '#d7e6f5';
    ctx.fillText(state.banner.subtext, VIEW.width / 2, 148);
    ctx.textAlign = 'left';
    ctx.restore();
  }
  // Bottom hint.
  ctx.fillStyle = 'rgba(220, 235, 255, 0.75)';
  ctx.font = '500 14px system-ui, sans-serif';
  ctx.fillText('← → steer · ↓ or click to cast · P pause · M mute · R restart', 18, VIEW.height - 14);
}

function drawPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(2, 8, 20, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const w = 640;
  const h = 120 + lines.length * 34;
  const x = VIEW.width / 2 - w / 2;
  const y = VIEW.height / 2 - h / 2;
  ctx.fillStyle = 'rgba(8, 24, 48, 0.94)';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, y + 62);
  ctx.fillStyle = '#eaf3ff';
  ctx.font = '500 19px system-ui, sans-serif';
  lines.forEach((line, index) => {
    ctx.fillText(line, VIEW.width / 2, y + 108 + index * 34);
  });
  ctx.textAlign = 'left';
}

export function drawScene(ctx, state, time) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawSky(ctx, time);
  drawWater(ctx, time);
  if (state.screen === SCREEN_TITLE) {
    // A quiet harbour behind the title: boat, lamp and a few fish.
    drawBoat(ctx, state, time);
    for (let i = 0; i < 5; i += 1) drawFish(ctx, state.fish[i], state.fish[i].x, state.fish[i].y, false);
    drawPanel(ctx, 'MOONLIT CATCH', [
      'Cast your line under the moon. Catch fish, build combos,',
      'mind the jellyfish — and meet the night\'s quota before dawn.',
      '',
      '← → steer · ↓ / click cast · P pause · R restart',
      'Press ENTER or click to begin the night',
    ], '#ffd678');
    return;
  }
  for (const fish of state.fish) drawFish(ctx, fish, fish.x, fish.y, false);
  for (const jelly of state.jellyfish) drawJellyfish(ctx, jelly);
  for (const item of state.junk) drawJunk(ctx, item);
  drawBoat(ctx, state, time);
  drawLineAndHook(ctx, state);
  if (state.screen === SCREEN_PLAY || state.screen === SCREEN_PAUSED) drawHud(ctx, state);
  if (state.screen === SCREEN_PAUSED) {
    drawPanel(ctx, 'PAUSED', ['The line waits. The fish do not.', '', 'Press P to keep fishing'], '#9fc3e8');
  } else if (state.screen === SCREEN_NIGHT_CLEAR) {
    drawPanel(ctx, 'QUOTA MET!', [
      `${state.night.label} — ${state.nightScore} points, ${state.catches} fish landed.`,
      state.nightIndex + 1 >= 3 ? 'That was the last night. The dawn is yours.' : 'A deeper night awaits, with faster fish and more jellyfish.',
      '',
      'Press ENTER for the next night',
    ], '#7dffd4');
  } else if (state.screen === SCREEN_WIN) {
    drawPanel(ctx, 'MASTER ANGLER!', [
      `Three nights, ${state.score} points, best combo x${state.bestCombo}.`,
      'Every quota met before dawn. The harbour sings your name.',
      '',
      'Press R to fish again · best score saved',
    ], '#ffd678');
  } else if (state.screen === SCREEN_FAIL) {
    drawPanel(ctx, 'DAWN BREAKS…', [
      `Quota ${state.nightScore}/${state.quota} — the fish slip away with the dark.`,
      `Score ${state.score} · ${state.catches} fish caught.`,
      '',
      'Press R to try the night again',
    ], '#ff9db1');
  }
}
