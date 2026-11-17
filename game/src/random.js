// Moonlit Catch: a tiny seeded random generator (mulberry32) so every night,
// and every screenshot scene, can be replayed exactly from one seed number.
export function createSeededRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRandom(random, list) {
  return list[Math.floor(random() * list.length)];
}

export function rangeRandom(random, min, max) {
  return min + random() * (max - min);
}
