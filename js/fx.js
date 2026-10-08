// Übertriebene Effekte: Partikel (Konfetti, Sterne, Münzen), Bildschirmwackeln, Blitz,
// Riesentext, Regenbogen-Wischblende, Disco-Kugel, Feuerwerk, Lavalampe.
// Alles schaltet sich ab, wenn "Effekte: ruhig" gewählt ist oder das System weniger Bewegung wünscht.
(function (L) {
  'use strict';
  const FX = (L.fx = { calm: false });
  const COLORS = ['#f2b52b', '#f08b1f', '#e05a1a', '#a83a18', '#f4e6c8', '#187172', '#a2b13a'];
  const MAX_PARTS = 900;
  let cv = null;
  let ctx = null;
  let dpr = 1;
  let parts = [];
  let raf = 0;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  };
  // Kleines Element mit Klasse und optionalen Kindern erzeugen
  const make = (tag, cls, children) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    (children || []).forEach((c) => el.appendChild(c));
    return el;
  };
  const many = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

  FX.active = () => !FX.calm;

  function ensureCanvas() {
    if (cv) return;
    cv = make('canvas');
    cv.id = 'fx-canvas';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(window.innerWidth * dpr);
    cv.height = Math.round(window.innerHeight * dpr);
  }

  function starPath(c, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (Math.PI * i) / 5 - Math.PI / 2;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
  }

  function draw(p) {
    const t = Math.max(0, p.age) / p.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t * t);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    const s = p.size;
    switch (p.shape) {
      case 'rect': ctx.scale(1, Math.cos(p.age * 0.25 + p.seed)); ctx.fillRect(-s / 2, -s / 4, s, s / 2); break;
      case 'circle': ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); break;
      case 'ring': ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, s * (0.4 + t * 2.4), 0, Math.PI * 2); ctx.stroke(); break;
      case 'star': starPath(ctx, s / 2); ctx.fill(); break;
      case 'coin':
        ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a2215'; ctx.font = `${Math.round(s * 0.7)}px Righteous, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1); break;
      case 'text':
        ctx.font = `${Math.round(s)}px Shrikhand, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.text, 0, 0); break;
      default: break;
    }
    ctx.restore();
  }

  function step() {
    raf = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const keep = [];
    for (const p of parts) {
      p.age++;
      if (p.age >= p.life) continue;
      if (p.age < 0) { keep.push(p); continue; }
      if (p.home) {
        // Münzen fliegen im Bogen zu ihrem Ziel
        const k = p.age / p.life;
        const e = k * k * (3 - 2 * k);
        p.x = p.sx + (p.tx - p.sx) * e;
        p.y = p.sy + (p.ty - p.sy) * e - Math.sin(k * Math.PI) * p.arc;
      } else {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.g;
        p.x += p.vx;
        p.y += p.vy;
      }
      p.rot += p.vr;
      draw(p);
      keep.push(p);
    }
    parts = keep;
    if (parts.length) raf = requestAnimationFrame(step);
  }

  function add(list) {
    if (!FX.active() || !list.length) return;
    ensureCanvas();
    parts.push(...list);
    if (parts.length > MAX_PARTS) parts.splice(0, parts.length - MAX_PARTS);
    if (!raf) raf = requestAnimationFrame(step);
  }

  // Explosion an einer Stelle
  FX.burst = function (x, y, o) {
    o = o || {};
    add(many(o.n || 24, () => {
      const a = o.spread ? rnd(-o.spread, o.spread) - Math.PI / 2 : rnd(0, Math.PI * 2);
      const sp = (o.speed || 7) * rnd(0.35, 1.1);
      return {
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0),
        g: o.gravity != null ? o.gravity : 0.28, drag: o.drag || 0.975,
        life: Math.round((o.life || 70) * rnd(0.7, 1.2)), age: 0,
        size: (o.size || 9) * rnd(0.6, 1.3), rot: rnd(0, 6), vr: rnd(-0.3, 0.3), seed: rnd(0, 6),
        color: o.colors ? pick(o.colors) : pick(COLORS),
        shape: o.shapes ? pick(o.shapes) : pick(['rect', 'rect', 'circle', 'star']),
        text: o.text ? pick([].concat(o.text)) : '',
      };
    }));
  };
  FX.burstAt = function (el, o) {
    if (!el) return;
    const c = center(el);
    FX.burst(c.x, c.y, o);
  };
  FX.ring = function (el, color) {
    if (!el) return;
    const c = center(el);
    add([{ x: c.x, y: c.y, vx: 0, vy: 0, g: 0, drag: 1, life: 28, age: 0, size: Math.max(c.w, c.h) * 0.5, rot: 0, vr: 0, seed: 0, color: color || '#f2b52b', shape: 'ring' }]);
  };

  // Konfettiregen von oben
  FX.rain = function (n) {
    add(many(n || 160, () => ({
      x: rnd(0, window.innerWidth), y: rnd(-window.innerHeight * 0.6, -10), vx: rnd(-1.5, 1.5), vy: rnd(1, 4),
      g: 0.06, drag: 0.995, life: Math.round(rnd(140, 220)), age: 0, size: rnd(8, 14), rot: rnd(0, 6), vr: rnd(-0.2, 0.2),
      seed: rnd(0, 6), color: pick(COLORS), shape: pick(['rect', 'rect', 'star', 'circle']),
    })));
  };

  // Münzen fliegen von einem Element zu einem anderen
  FX.coins = function (fromEl, toEl, n) {
    if (!fromEl || !toEl) return;
    const a = center(fromEl);
    const b = center(toEl);
    add(many(Math.min(14, n || 5), (i) => ({
      home: true, sx: a.x + rnd(-20, 20), sy: a.y + rnd(-10, 10), tx: b.x, ty: b.y, arc: rnd(60, 160),
      x: a.x, y: a.y, life: Math.round(rnd(38, 60)), age: -i * 4, size: rnd(16, 22), rot: 0, vr: rnd(-0.1, 0.1),
      color: '#f2b52b', shape: 'coin',
    })));
  };

  // Feuerwerk an zufälligen Stellen
  FX.fireworks = function (count, spanMs) {
    if (!FX.active()) return;
    const n = count || 6;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        FX.burst(rnd(window.innerWidth * 0.15, window.innerWidth * 0.85), rnd(window.innerHeight * 0.12, window.innerHeight * 0.5),
          { n: 46, speed: 9, gravity: 0.12, life: 80, shapes: ['star', 'circle'], colors: [pick(COLORS), pick(COLORS)] });
      }, (i * (spanMs || 1400)) / n);
    }
  };

  // Bildschirm wackeln (Stärke 1–3)
  FX.shake = function (level) {
    if (!FX.active()) return;
    const el = document.getElementById('app');
    if (!el) return;
    el.style.setProperty('--shake', Math.min(3, level || 1));
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  };

  // Farbblitz über den ganzen Bildschirm
  FX.flash = function (color) {
    if (!FX.active()) return;
    const f = make('div', 'fx-flash');
    f.style.background = color || '#f2b52b';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 600);
  };

  // Riesentext mitten auf dem Bildschirm; fliegt auf Wunsch zu einem Ziel
  FX.bigText = function (text, o) {
    o = o || {};
    if (!FX.active()) return Promise.resolve();
    const el = make('div', 'fx-big ' + (o.cls || ''));
    el.textContent = text;
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    return new Promise((res) => {
      setTimeout(() => {
        if (o.to && document.body.contains(o.to)) {
          const t = center(o.to);
          el.classList.add('fly');
          el.style.left = t.x + 'px';
          el.style.top = t.y + 'px';
          setTimeout(() => { el.remove(); res(); }, 460);
        } else {
          el.classList.add('out');
          setTimeout(() => { el.remove(); res(); }, 350);
        }
      }, o.hold || 900);
    });
  };

  // Regenbogen-Wischblende: deckt den Bildschirm ab, ruft "middle" auf, gibt ihn wieder frei
  FX.wipe = function (middle) {
    if (!FX.active()) { middle(); return Promise.resolve(); }
    const w = make('div', 'fx-wipe', many(5, () => make('i')));
    w.setAttribute('aria-hidden', 'true');
    document.body.appendChild(w);
    return new Promise((res) => {
      setTimeout(() => {
        middle();
        w.classList.add('out');
        setTimeout(() => { w.remove(); res(); }, 560);
      }, 440);
    });
  };

  // Die Disco-Kugel senkt sich und wirft bunte Lichtpunkte
  FX.disco = function (ms) {
    if (!FX.active() || document.querySelector('.fx-disco')) return;
    const spots = make('div', 'fx-spots', many(26, () => {
      const s = make('i');
      s.style.left = rnd(0, 100).toFixed(1) + '%';
      s.style.top = rnd(0, 100).toFixed(1) + '%';
      s.style.background = pick(COLORS);
      s.style.animationDelay = rnd(-2, 0).toFixed(2) + 's';
      return s;
    }));
    const ball = make('div', 'fx-ball-wrap', [make('div', 'fx-string'), make('div', 'fx-ball')]);
    const d = make('div', 'fx-disco', [spots, ball]);
    d.setAttribute('aria-hidden', 'true');
    document.body.appendChild(d);
    setTimeout(() => d.classList.add('out'), (ms || 2200) - 500);
    setTimeout(() => d.remove(), ms || 2200);
  };

  // Lavalampen-Blasen im Hintergrund
  FX.lava = function () {
    if (document.querySelector('.fx-lava')) return;
    const l = make('div', 'fx-lava', many(6, () => make('i')));
    l.setAttribute('aria-hidden', 'true');
    document.body.prepend(l);
  };
})(globalThis.LUN = globalThis.LUN || {});
