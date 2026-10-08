// Prozeduraler Funk-Soundtrack: Bass und Schlagzeug, im Disco-Fieber dazu Wah-Gitarre und Streicher.
// Ein Vorausplaner legt die Noten mit der Uhr des AudioContext fest. Das Tempo steigt, je näher
// die Runde dem Ziel kommt. Ohne Ton läuft eine stille Uhr weiter, damit die Taktanimationen bleiben.
(function (L) {
  'use strict';
  const M = (L.music = {});
  const LOOKAHEAD = 0.12; // Sekunden, die im Voraus geplant werden
  const TICK = 25; // ms zwischen zwei Planungsdurchläufen
  const STEPS = 32; // zwei Takte in Sechzehnteln

  let timer = 0;
  let audible = false;
  let c = null;
  let bus = null;
  let nextTime = 0;
  let stepIdx = 0;
  let bpm = 104;
  let target = 104;
  let fever = false;
  const listeners = new Set();

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const now = () => (audible ? c.currentTime : performance.now() / 1000);

  // Basslinie in e-Moll-Pentatonik: Schritt -> [MIDI-Note, Länge in Sechzehnteln]
  const BASS = new Map([[0, [40, 2]], [3, [40, 1]], [6, [52, 1]], [8, [43, 2]], [10, [45, 1]], [11, [47, 1]], [14, [50, 1]],
    [16, [40, 2]], [19, [40, 1]], [22, [50, 1]], [24, [47, 1]], [26, [45, 2]], [28, [43, 1]], [30, [40, 1]], [31, [43, 1]]]);
  const CHORDS = [[52, 55, 59, 62, 66], [57, 61, 64, 66, 67]]; // Em9, A13
  const STABS = [2, 6, 7, 10, 14]; // Wah-Anschläge auf den Offbeats

  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function kick(t) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    env(g, t, 0.9, 0.003, 0.28);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.32);
  }

  function noiseHit(t, type, freq, peak, decay, q) {
    const s = c.createBufferSource();
    s.buffer = L.audio.noiseBuffer(c);
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    const g = c.createGain();
    env(g, t, peak, 0.002, decay);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + decay + 0.02);
  }

  function snare(t) {
    noiseHit(t, 'bandpass', 1800, 0.5, 0.16, 0.8);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(190, t);
    env(g, t, 0.25, 0.002, 0.08);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.1);
  }

  const hat = (t, open) => noiseHit(t, 'highpass', 7500, open ? 0.16 : 0.11, open ? 0.22 : 0.035);

  function bass(t, note, len, sd) {
    const dur = len * sd * 0.9;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(midi(note), t);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 7;
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(260, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45, t + 0.005);
    g.gain.setValueAtTime(0.45, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // Wah-Gitarre: ein Akkord durch einen Bandpass, der auf- und zugeht
  function wah(t, chord, sd) {
    const dur = sd * 0.9;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 6;
    f.frequency.setValueAtTime(450, t);
    f.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.5);
    f.frequency.exponentialRampToValueAtTime(700, t + dur);
    const g = c.createGain();
    env(g, t, 0.2, 0.004, dur);
    f.connect(g).connect(bus);
    chord.forEach((n) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midi(n);
      o.detune.value = Math.random() * 10 - 5;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.03);
    });
  }

  // Disco-Streicher: weicher Akkord über einen ganzen Takt
  function strings(t, chord, dur) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1700;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.25);
    g.gain.setValueAtTime(0.05, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g).connect(bus);
    chord.slice(1).forEach((n) => [-7, 7].forEach((det) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midi(n + 12);
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.05);
    }));
  }

  function playStep(i, t, sd) {
    const bar = i < 16 ? 0 : 1;
    const s = i % 16;
    if (fever) {
      // Disco: Bassdrum auf jedem Schlag, offene Hi-Hat dazwischen, Oktavbass
      if (s % 4 === 0) kick(t);
      if (s === 4 || s === 12) snare(t);
      if (s % 4 === 2) hat(t, true);
      else if (s % 2 === 1) hat(t, false);
      if (s % 2 === 0) bass(t, (bar ? 45 : 40) + (s % 4 === 2 ? 12 : 0), 2, sd);
      if (STABS.includes(s)) wah(t, CHORDS[bar], sd);
      if (s === 0) strings(t, CHORDS[bar], sd * 16);
    } else {
      // Funk: synkopierte Bassdrum, Backbeat, Achtel-Hi-Hat
      if (s === 0 || s === 7 || s === 10) kick(t);
      if (s === 4 || s === 12) snare(t);
      if (s % 2 === 0) hat(t, s === 14);
      const b = BASS.get(i);
      if (b) bass(t, b[0], b[1], sd);
    }
  }

  function emit(beat, at) {
    const delay = Math.max(0, (at - now()) * 1000);
    setTimeout(() => listeners.forEach((fn) => fn(beat)), delay);
  }

  function schedule() {
    const t0 = now();
    if (nextTime < t0 - 0.25) nextTime = t0 + 0.03; // zu weit hinterher: überspringen statt nachholen
    while (nextTime < t0 + LOOKAHEAD) {
      bpm += (target - bpm) * 0.08;
      const sd = 60 / bpm / 4;
      const t = nextTime + (stepIdx % 2 ? sd * 0.12 : 0); // ein wenig Swing
      if (audible) {
        try { playStep(stepIdx, t, sd); } catch (e) { /* Audio ist optional */ }
      }
      if (stepIdx % 4 === 0) emit(stepIdx / 4, t);
      nextTime += sd;
      stepIdx = (stepIdx + 1) % STEPS;
    }
  }

  function stop() {
    clearInterval(timer);
    timer = 0;
    if (bus && c) {
      bus.gain.setTargetAtTime(0, c.currentTime, 0.04);
      const old = bus;
      setTimeout(() => old.disconnect(), 400);
    }
    bus = null;
  }

  // o: { on, audible, progress (0–1), fever }
  M.update = function (o) {
    const p = Math.max(0, Math.min(1, o.progress || 0));
    fever = !!o.fever;
    target = 104 + 28 * p + (fever ? 8 : 0);
    if (!o.on || document.hidden) { stop(); return; }
    const wantAudible = !!o.audible && !!L.audio.ctx();
    if (timer && wantAudible === audible) {
      if (bus) bus.gain.setTargetAtTime(fever ? 0.2 : 0.13, c.currentTime, 0.3);
      return;
    }
    stop();
    audible = wantAudible;
    if (audible) {
      c = L.audio.ctx();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      bus = c.createGain();
      bus.gain.value = fever ? 0.2 : 0.13;
      bus.connect(comp).connect(c.destination);
    }
    bpm = target;
    nextTime = now() + 0.05;
    stepIdx = 0;
    timer = setInterval(schedule, TICK);
  };

  M.onBeat = (fn) => listeners.add(fn);
  M.playing = () => !!timer;
  M.bpm = () => bpm;
})(globalThis.LUN = globalThis.LUN || {});
