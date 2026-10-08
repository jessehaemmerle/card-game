// Logiktests ohne Browser:  node tests/logic.test.js
'use strict';
const path = require('path');
['util', 'data', 'scoring', 'jokers', 'consumables', 'game', 'patches'].forEach((f) => require(path.join(__dirname, '..', 'js', f + '.js')));
const L = globalThis.LUN;
const G = L.game;
const assert = require('assert');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { console.error('✗ ' + name); throw e; }
}
const card = (rank, suit, enh) => ({ uid: 'c' + rank + suit + Math.random(), rank, suit, enh: enh || null });

// ---------- Handauswertung ----------
test('Paar', () => assert.strictEqual(L.evaluateHand([card(5, 'S'), card(5, 'H'), card(9, 'C')]).type, 'pair'));
test('Zwei Paare', () => assert.strictEqual(L.evaluateHand([card(5, 'S'), card(5, 'H'), card(9, 'C'), card(9, 'D'), card(2, 'S')]).type, 'twopair'));
test('Straße mit Ass unten', () => assert.strictEqual(L.evaluateHand([card(14, 'S'), card(2, 'H'), card(3, 'C'), card(4, 'D'), card(5, 'S')]).type, 'straight'));
test('Keine Straße um die Ecke', () => assert.strictEqual(L.evaluateHand([card(13, 'S'), card(14, 'H'), card(2, 'C'), card(3, 'D'), card(4, 'S')]).type, 'high'));
test('Flush mit Wildkarte', () => assert.strictEqual(L.evaluateHand([card(2, 'S'), card(7, 'S'), card(9, 'S'), card(11, 'S'), card(4, 'H', 'wild')]).type, 'flush'));
test('Full House', () => assert.strictEqual(L.evaluateHand([card(3, 'S'), card(3, 'H'), card(3, 'C'), card(8, 'D'), card(8, 'S')]).type, 'fullhouse'));
test('Straight Flush', () => assert.strictEqual(L.evaluateHand([card(9, 'H'), card(10, 'H'), card(11, 'H'), card(12, 'H'), card(13, 'H')]).type, 'straightflush'));
test('Flush Five', () => assert.strictEqual(L.evaluateHand([card(9, 'H'), card(9, 'H'), card(9, 'H'), card(9, 'H'), card(9, 'H')]).type, 'flushfive'));
test('Vierling zählt nur 4 Karten', () => {
  const e = L.evaluateHand([card(9, 'H'), card(9, 'S'), card(9, 'C'), card(9, 'D'), card(2, 'H')]);
  assert.strictEqual(e.type, 'four');
  assert.strictEqual(e.scoring.length, 4);
});
test('Steinkarte zählt immer', () => {
  const e = L.evaluateHand([card(9, 'H'), card(9, 'S'), card(4, 'C', 'stone')]);
  assert.strictEqual(e.type, 'pair');
  assert.strictEqual(e.scoring.length, 3);
});

// ---------- Punkte & Mondlicht ----------
function freshRound(seed) {
  const s = G.newRun('nacht', seed || 'TEST');
  G.selectBlind(s);
  return s;
}
test('Basispunkte Paar ohne Mondlicht', () => {
  const s = freshRound();
  s.moon = 2; // Halbmond -> ♣ beleuchtet
  const res = L.scoreHand(s, [card(10, 'H'), card(10, 'S')], []);
  assert.strictEqual(res.total, (10 + 20) * 2);
});
test('Mondlicht gibt +Mondkraft Mult pro beleuchteter Karte', () => {
  const s = freshRound();
  s.moon = 1; // Sichelmond -> ♥
  const res = L.scoreHand(s, [card(10, 'H'), card(10, 'S')], []);
  assert.strictEqual(res.total, 30 * (2 + 2));
});
test('Vollmond beleuchtet alle Farben', () => {
  const s = freshRound();
  s.moon = 4;
  const res = L.scoreHand(s, [card(10, 'H'), card(10, 'S')], []);
  assert.strictEqual(res.total, 30 * (2 + 4));
});
test('Mondsilber: doppeltes Licht, auch in der Finsternis', () => {
  const s = freshRound();
  s.round.bossId = 'finsternis';
  s.moon = 4;
  const res = L.scoreHand(s, [card(10, 'H', 'silver'), card(10, 'S')], []);
  assert.strictEqual(res.total, 30 * (2 + 4));
});
test('Werwolf ×3 bei Vollmond', () => {
  const s = freshRound();
  s.moon = 4;
  G.addJoker(s, 'werwolf');
  const res = L.scoreHand(s, [card(10, 'H'), card(10, 'S')], []);
  assert.strictEqual(res.total, 30 * (2 + 4) * 3);
});
test('Doppelgänger kopiert rechten Nachbarn', () => {
  const s = freshRound();
  s.moon = 2;
  G.addJoker(s, 'doppelgaenger');
  G.addJoker(s, 'narr');
  const res = L.scoreHand(s, [card(10, 'H'), card(10, 'S')], []);
  assert.strictEqual(res.total, 30 * (2 + 8));
});
test('Mond zieht nach jeder Hand weiter', () => {
  const s = freshRound();
  const m = s.moon;
  s.round.selected = s.round.hand.slice(0, 1);
  const res = G.beginPlay(s);
  G.resolvePlay(s, res);
  assert.strictEqual(s.moon, (m + 1) % 5);
});

test('Groove-O-Meter füllt sich und Disco-Fieber verdoppelt die Mult', () => {
  const s = freshRound();
  s.moon = 2;
  s.groove = L.data.GROOVE_MAX - 1;
  const fake = { total: s.round.target, feverUsed: false };
  assert.strictEqual(G.updateGroove(s, fake), true);
  assert.strictEqual(s.fever, L.data.FEVER_HANDS);
  const res = L.scoreHand(s, [card(10, 'H'), card(10, 'S')], []);
  assert.strictEqual(res.total, 30 * 2 * L.data.FEVER_MULT);
  assert.ok(res.feverUsed);
  G.updateGroove(s, res);
  assert.strictEqual(s.fever, L.data.FEVER_HANDS - 1);
});
test('Schwache Hand bricht die Groove-Serie', () => {
  const s = freshRound();
  s.groove = 4;
  G.updateGroove(s, { total: 0, feverUsed: false });
  assert.strictEqual(s.groove, 0);
});

test('Aufnäher: Flush bei Vollmond bringt passende Abzeichen', () => {
  const s = freshRound();
  s.moon = L.data.FULL_MOON;
  const res = L.scoreHand(s, [card(2, 'H'), card(5, 'H'), card(7, 'H'), card(9, 'H'), card(12, 'H')], []);
  const got = L.patches.check(s, 'hand', { res, target: s.round.target, won: false, feverStart: false, boss: false });
  ['ersteHand', 'vollmond', 'flush'].forEach((id) => assert.ok(got.includes(id), id));
  assert.ok(!got.includes('strasse'));
  assert.ok(L.patches.LIST.every((p) => L.patches.motif(p)), 'jeder Aufnäher hat ein Motiv');
});

// ---------- Bot-Simulation: findet Laufzeitfehler & grobe Balance ----------
function bestPlay(s) {
  const hand = s.round.hand.map((u) => s.cards[u]);
  let best = null;
  const n = hand.length;
  // alle Teilmengen bis Größe 5 (bei 8–10 Karten machbar)
  for (let mask = 1; mask < 1 << n; mask++) {
    let bits = 0;
    for (let m = mask; m; m &= m - 1) bits++;
    if (bits > 5) continue;
    const cards = hand.filter((_, i) => mask & (1 << i));
    const ev = L.evaluateHand(cards);
    const b = L.handBase(s, ev.type);
    const score = (b.chips + ev.scoring.reduce((a, c) => a + L.cardChips(c), 0)) * (b.mult + ev.scoring.filter((c) => L.isLit(s, c)).length * s.mondkraft);
    if (!best || score > best.score) best = { score, uids: cards.map((c) => c.uid) };
  }
  return best;
}

function botRun(seed, deck) {
  const s = G.newRun(deck, seed);
  let steps = 0;
  while (steps++ < 5000) {
    s.notices = [];
    if (s.phase === 'blind') {
      G.selectBlind(s);
    } else if (s.phase === 'round') {
      // Verbrauchskarten ohne Ziel sofort nutzen
      for (const c of s.consumables.slice()) {
        const d = L.cons.get(c);
        if (!d.min && !G.consumableBlock(s, c)) G.useConsumable(s, c.uid);
        else if (d.min && s.round.hand.length >= d.min) {
          s.round.selected = s.round.hand.slice(0, d.min);
          G.useConsumable(s, c.uid);
          s.round.selected = [];
        }
      }
      const b = bestPlay(s);
      if (s.round.discardsLeft > 0 && b.score * s.round.handsLeft < s.round.target - s.round.score && s.round.draw.length) {
        s.round.selected = s.round.hand.filter((u) => !b.uids.includes(u)).slice(0, 5);
        if (s.round.selected.length) { G.discard(s); continue; }
      }
      s.round.selected = b.uids;
      if (G.playError(s)) {
        // Boss-Regeln (Zwang/Auge/Mund): einfach 5 bzw. irgendeine Karte probieren
        s.round.selected = s.round.hand.slice(0, Math.min(5, s.round.hand.length));
        if (G.playError(s)) s.round.selected = s.round.hand.slice(0, 1);
        if (G.playError(s)) { s.round.selected = s.round.hand.slice(0, 5); }
      }
      const res = G.beginPlay(s);
      if (res.error) { // gar nichts spielbar
        s.phase = 'gameover';
        break;
      }
      assert.ok(Number.isFinite(res.total), 'Punktzahl endlich');
      G.resolvePlay(s, res);
    } else if (s.phase === 'cashout') {
      G.cashOut(s);
    } else if (s.phase === 'shop') {
      for (let i = 0; i < 2; i++) G.buyItem(s, i);
      for (let i = 0; i < 2; i++) {
        if (!G.buyPack(s, i)) {
          const r = G.pickFromPack(s, 0);
          if (r.error) G.skipPack(s);
        }
      }
      if (s.money > 12) G.reroll(s), G.buyItem(s, 0);
      // gelegentlich verkaufen/umsortieren testen
      if (s.jokers.length >= 5 && L.rand(s) < 0.2) G.sellJoker(s, s.jokers[0].uid);
      if (s.jokers.length > 1) G.moveJoker(s, s.jokers[0].uid, 1);
      if (s.pack) G.skipPack(s);
      G.leaveShop(s);
    } else if (s.phase === 'victory') {
      return { ante: s.ante, won: true };
    } else if (s.phase === 'gameover') {
      return { ante: s.ante, won: false };
    }
    // Zustand muss immer serialisierbar bleiben
    JSON.parse(JSON.stringify(s));
  }
  return { ante: s.ante, won: false };
}

const decks = Object.keys(L.data.DECKS);
const results = [];
for (let i = 0; i < 300; i++) results.push(botRun('BOT' + i, decks[i % decks.length]));
const avg = results.reduce((a, r) => a + r.ante, 0) / results.length;
const wins = results.filter((r) => r.won).length;
const dist = {};
results.forEach((r) => (dist[r.ante] = (dist[r.ante] || 0) + 1));
console.log(`Bot: Ø Ante ${avg.toFixed(2)}, Siege ${wins}/${results.length}, Verteilung`, dist);
console.log(`✓ ${passed} Tests bestanden, ${results.length} simulierte Läufe ohne Fehler`);
