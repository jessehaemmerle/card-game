// Handauswertung, Mondlicht und Punkteberechnung.
(function (L) {
  'use strict';
  const D = L.data;

  L.isFace = (c) => c.enh !== 'stone' && c.rank >= 11 && c.rank <= 13;
  L.hasSuit = (c, s) => c.enh !== 'stone' && (c.enh === 'wild' || c.suit === s);
  L.cardChips = (c) => (c.enh === 'stone' ? 50 : c.rank === 14 ? 11 : c.rank >= 11 ? 10 : c.rank);

  // ---------- Pokerhand erkennen ----------
  function findStraight(cards) {
    if (cards.length < 5) return false;
    const ranks = [...new Set(cards.map((c) => c.rank))].sort((a, b) => a - b);
    if (ranks.length !== 5) return false;
    if (ranks[4] - ranks[0] === 4) return true;
    return ranks.join(',') === '2,3,4,5,14'; // Ass als Eins
  }

  L.evaluateHand = function (cards) {
    const normal = cards.filter((c) => c.enh !== 'stone');
    const byRank = {};
    normal.forEach((c) => (byRank[c.rank] = byRank[c.rank] || []).push(c));
    const groups = Object.values(byRank).sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);
    const counts = groups.map((g) => g.length).concat([0, 0]);
    const isFlush = normal.length >= 5 && D.SUITS.some((s) => normal.every((c) => L.hasSuit(c, s)));
    const isStraight = findStraight(normal);

    let type;
    let scoring;
    if (counts[0] >= 5 && isFlush) { type = 'flushfive'; scoring = normal; }
    else if (counts[0] === 3 && counts[1] === 2 && isFlush) { type = 'flushhouse'; scoring = normal; }
    else if (counts[0] >= 5) { type = 'five'; scoring = normal; }
    else if (isStraight && isFlush) { type = 'straightflush'; scoring = normal; }
    else if (counts[0] === 4) { type = 'four'; scoring = groups[0]; }
    else if (counts[0] === 3 && counts[1] === 2) { type = 'fullhouse'; scoring = normal; }
    else if (isFlush) { type = 'flush'; scoring = normal; }
    else if (isStraight) { type = 'straight'; scoring = normal; }
    else if (counts[0] === 3) { type = 'three'; scoring = groups[0]; }
    else if (counts[0] === 2 && counts[1] === 2) { type = 'twopair'; scoring = groups[0].concat(groups[1]); }
    else if (counts[0] === 2) { type = 'pair'; scoring = groups[0]; }
    else {
      type = 'high';
      scoring = normal.length ? [normal.reduce((best, c) => (c.rank > best.rank ? c : best))] : [];
    }
    const set = new Set(scoring);
    // Steinkarten zählen immer mit; Reihenfolge wie gespielt
    const scoringOrdered = cards.filter((c) => set.has(c) || c.enh === 'stone');

    const contains = {
      pair: counts[0] >= 2,
      twopair: (counts[0] >= 2 && counts[1] >= 2) || counts[0] >= 4,
      three: counts[0] >= 3,
      straight: isStraight,
      flush: isFlush,
      four: counts[0] >= 4,
    };
    return { type, scoring: scoringOrdered, contains };
  };

  // ---------- Mondlicht ----------
  L.activeBoss = function (state) {
    const r = state.round;
    return r && r.bossId ? D.BOSSES[r.bossId] : null;
  };

  L.hasJoker = (state, id) => state.jokers.some((j) => j.id === id);

  L.lightInfo = function (state) {
    const boss = L.activeBoss(state);
    if (boss && boss.noLight) return { none: true, all: false, suits: new Set() };
    const suits = new Set();
    let all = false;
    const add = (p) => {
      const s = D.MOON[p].suit;
      if (s === '*') all = true;
      else suits.add(s);
    };
    add(state.moon);
    if (L.hasJoker(state, 'polarstern')) add((state.moon + 1) % D.MOON.length);
    return { none: false, all, suits };
  };

  L.isLit = function (state, c, info) {
    info = info || L.lightInfo(state);
    if (c.enh === 'stone') return false;
    if (c.enh === 'silver') return true;
    if (info.none) return false;
    if (info.all || c.enh === 'wild') return true;
    return info.suits.has(c.suit);
  };

  L.isDebuffed = function (state, c, ctx) {
    const boss = L.activeBoss(state);
    if (!boss || !boss.debuff) return false;
    ctx = ctx || { state, light: L.lightInfo(state) };
    return !!boss.debuff(c, ctx);
  };

  L.handBase = function (state, type) {
    const h = D.HANDS[type];
    const lvl = state.handLevels[type].level;
    return { chips: h.chips + h.lc * (lvl - 1), mult: h.mult + h.lm * (lvl - 1), level: lvl };
  };

  // Doppelgänger: liefert den Joker, dessen Fähigkeit tatsächlich ausgeführt wird.
  L.resolveJoker = function (state, idx) {
    let k = idx;
    let def = L.jokers[state.jokers[k].id];
    let guard = 0;
    while (def.copies && guard++ < 8) {
      k++;
      if (k >= state.jokers.length) return null;
      def = L.jokers[state.jokers[k].id];
    }
    return def.copies ? null : { def, inst: state.jokers[k] };
  };

  L.forEachJoker = function (state, fn) {
    state.jokers.forEach((j, i) => {
      const r = L.resolveJoker(state, i);
      if (r) fn(r.def, r.inst, j);
    });
  };

  // ---------- Punkteberechnung ----------
  // Liefert ein Ergebnisobjekt inkl. Ereignisliste für die Animation.
  L.scoreHand = function (state, played, held) {
    const ev = L.evaluateHand(played);
    const base = L.handBase(state, ev.type);
    const r = state.round;
    const ctx = {
      state,
      played,
      scoring: ev.scoring,
      held,
      type: ev.type,
      level: base.level,
      contains: ev.contains,
      phase: state.moon,
      light: L.lightInfo(state),
      boss: L.activeBoss(state),
      isLast: r.handsLeft === 1,
      isFirst: r.handsPlayed === 0,
      chips: base.chips,
      mult: base.mult,
      baseChips: base.chips,
      baseMult: base.mult,
      money: 0,
      events: [],
      broken: [],
      litCount: 0,
    };
    const debuffed = new Set(played.concat(held).filter((c) => L.isDebuffed(state, c, ctx)));
    ctx.isDebuffed = (c) => debuffed.has(c);
    ctx.lit = (c) => !debuffed.has(c) && L.isLit(state, c, ctx.light);
    ctx.litCount = ev.scoring.filter(ctx.lit).length;

    const push = (src, text, cls) => {
      ctx.events.push({ kind: src.kind, ref: src.ref, jref: src.jref || null, text, cls, chips: ctx.chips, mult: ctx.mult });
    };
    const apply = (e, src) => {
      if (!e) return;
      if (Array.isArray(e)) { e.forEach((x) => apply(x, src)); return; }
      if (e.chips) { ctx.chips += e.chips; push(src, '+' + L.fmt(e.chips), 'chips'); }
      if (e.mult) { ctx.mult += e.mult; push(src, (e.moon ? '☾ +' : '+') + L.fmtNum(e.mult) + ' Mult', e.moon ? 'moon' : 'mult'); }
      if (e.xmult && e.xmult !== 1) { ctx.mult *= e.xmult; push(src, '×' + L.fmtNum(e.xmult) + ' Mult', 'xmult'); }
      if (e.money) { ctx.money += e.money; push(src, (e.money > 0 ? '+$' : '−$') + Math.abs(e.money), 'money'); }
      if (e.msg) push(src, e.msg, e.cls || 'info');
    };
    ctx.apply = apply;

    // 1) "Vorher"-Effekte (wachsende Joker)
    state.jokers.forEach((j) => {
      const def = L.jokers[j.id];
      if (def.before) apply(def.before(ctx, j), { kind: 'joker', ref: j.uid });
    });

    // 2) Gezählte Karten von links nach rechts
    for (const c of ev.scoring) {
      const src = { kind: 'card', ref: c.uid };
      if (ctx.isDebuffed(c)) { push(src, 'Geschwächt', 'debuff'); continue; }
      let reps = 1;
      const retriggers = [];
      L.forEachJoker(state, (def, inst, own) => {
        if (!def.retrigger) return;
        const n = def.retrigger(ctx, c, inst) || 0;
        for (let i = 0; i < n; i++) retriggers.push(own.uid);
        reps += n;
      });
      for (let rep = 0; rep < reps; rep++) {
        if (rep > 0) push({ kind: 'card', ref: c.uid, jref: retriggers[rep - 1] }, 'Nochmal!', 'info');
        let chips = L.cardChips(c);
        if (c.enh === 'bonus') chips += 30;
        apply({ chips }, src);
        if (c.enh === 'mult') apply({ mult: 4 }, src);
        if (ctx.lit(c)) {
          const light = state.mondkraft * (c.enh === 'silver' ? 2 : 1);
          apply({ mult: light, moon: true }, src);
        }
        if (c.enh === 'glass') apply({ xmult: 2 }, src);
        L.forEachJoker(state, (def, inst, own) => {
          if (def.onScored) apply(def.onScored(ctx, c, inst), { kind: 'card', ref: c.uid, jref: own.uid });
        });
      }
    }

    // 3) Karten, die in der Hand bleiben
    for (const c of held) {
      if (ctx.isDebuffed(c)) continue;
      const src = { kind: 'held', ref: c.uid };
      if (c.enh === 'steel') apply({ xmult: 1.5 }, src);
      L.forEachJoker(state, (def, inst, own) => {
        if (def.onHeld) apply(def.onHeld(ctx, c, inst), { kind: 'held', ref: c.uid, jref: own.uid });
      });
    }

    // 4) Joker (inkl. Editionen) von links nach rechts
    state.jokers.forEach((j, i) => {
      const src = { kind: 'joker', ref: j.uid };
      if (j.edition === 'foil') apply({ chips: 50 }, src);
      if (j.edition === 'holo') apply({ mult: 10 }, src);
      const r2 = L.resolveJoker(state, i);
      if (r2 && r2.def.onHand) apply(r2.def.onHand(ctx, r2.inst), src);
      if (j.edition === 'poly') apply({ xmult: 1.5 }, src);
    });

    // 5) Disco-Fieber verdoppelt die Mult
    if (state.fever > 0) {
      ctx.feverUsed = true;
      ctx.mult *= D.FEVER_MULT;
      push({ kind: 'fever', ref: null }, `Disco-Fieber ×${D.FEVER_MULT}`, 'fever');
    }

    // 6) Glas zerbricht
    for (const c of ev.scoring) {
      if (c.enh === 'glass' && !ctx.isDebuffed(c) && L.rand(state) < 0.25) {
        ctx.broken.push(c);
        push({ kind: 'card', ref: c.uid }, 'Zerbrochen!', 'debuff');
      }
    }

    ctx.total = Math.floor(ctx.chips * ctx.mult);
    return ctx;
  };
})(globalThis.LUN = globalThis.LUN || {});
