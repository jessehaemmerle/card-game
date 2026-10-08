// Hilfsfunktionen: deterministischer Zufall, Formatierung, IDs.
(function (L) {
  'use strict';

  // Seed-String -> 32-bit Zahl
  L.hashSeed = function (str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };

  L.randomSeed = function () {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };

  // mulberry32 – der Zustand liegt im Spielstand (state.rng), damit Speichern/Laden deterministisch bleibt.
  L.rand = function (state) {
    let t = (state.rng = (state.rng + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  L.randInt = (state, n) => Math.floor(L.rand(state) * n);
  L.pick = (state, arr) => arr[L.randInt(state, arr.length)];
  L.shuffle = function (state, arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = L.randInt(state, i + 1);
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  // entries: [[wert, gewicht], ...]
  L.weighted = function (state, entries) {
    const total = entries.reduce((a, e) => a + e[1], 0);
    let r = L.rand(state) * total;
    for (const e of entries) {
      if ((r -= e[1]) < 0) return e[0];
    }
    return entries[entries.length - 1][0];
  };

  L.uid = (state) => 'u' + (state.nextUid++);

  L.fmt = function (n) {
    if (!isFinite(n)) return '∞';
    n = Math.floor(n);
    if (Math.abs(n) >= 1e11) return n.toExponential(3).replace('e+', 'e');
    return n.toLocaleString('de-DE');
  };
  L.fmtNum = function (n) {
    if (!isFinite(n)) return '∞';
    if (Math.abs(n) >= 1e11) return n.toExponential(3).replace('e+', 'e');
    return (Math.round(n * 100) / 100).toLocaleString('de-DE');
  };
  // Auf 2 signifikante Stellen runden (für Blinden-Ziele im Endlosmodus)
  L.round2 = function (n) {
    const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1));
    return Math.round(n / p) * p;
  };
})(globalThis.LUN = globalThis.LUN || {});
