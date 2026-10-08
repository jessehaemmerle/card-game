// Kleine synthetische Soundeffekte über WebAudio – keine Audiodateien nötig.
(function (L) {
  'use strict';
  const A = (L.audio = { enabled: true });
  let ctx = null;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, delay, slideTo) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  A.play = function (name, step) {
    if (!A.enabled) return;
    try {
      const p = Math.pow(1.06, Math.min(step || 0, 24));
      switch (name) {
        case 'select': tone(520, 0.06, 'triangle', 0.08); break;
        case 'deselect': tone(380, 0.06, 'triangle', 0.06); break;
        case 'chips': tone(330 * p, 0.12, 'triangle', 0.1); break;
        case 'mult': tone(440 * p, 0.14, 'square', 0.06); break;
        case 'moon': tone(660 * p, 0.25, 'sine', 0.1); tone(990 * p, 0.25, 'sine', 0.05, 0.03); break;
        case 'xmult': tone(220 * p, 0.25, 'sawtooth', 0.07, 0, 440 * p); break;
        case 'money': tone(1200, 0.07, 'square', 0.05); tone(1600, 0.1, 'square', 0.05, 0.06); break;
        case 'debuff': tone(160, 0.2, 'sawtooth', 0.06, 0, 90); break;
        case 'info': tone(700, 0.08, 'triangle', 0.06); break;
        case 'play': tone(260, 0.08, 'triangle', 0.08); tone(390, 0.1, 'triangle', 0.08, 0.06); break;
        case 'discard': tone(300, 0.12, 'triangle', 0.07, 0, 180); break;
        case 'total': tone(523, 0.15, 'triangle', 0.1); tone(659, 0.15, 'triangle', 0.1, 0.08); tone(784, 0.3, 'triangle', 0.1, 0.16); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, i * 0.1)); break;
        case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'sine', 0.1, i * 0.15)); break;
        case 'buy': tone(880, 0.06, 'square', 0.05); tone(1320, 0.12, 'square', 0.05, 0.05); break;
        case 'error': tone(150, 0.15, 'square', 0.05); break;
        case 'use': tone(600, 0.2, 'sine', 0.08, 0, 1200); break;
        default: break;
      }
    } catch (e) { /* Audio ist optional */ }
  };
})(globalThis.LUN = globalThis.LUN || {});
