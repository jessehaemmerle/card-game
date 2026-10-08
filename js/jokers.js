// Joker-Definitionen. Hooks:
//   before(ctx, self)          – vor dem Zählen (z. B. wachsende Joker)
//   onScored(ctx, card, self)  – pro gezählter Karte
//   onHeld(ctx, card, self)    – pro Karte, die in der Hand bleibt
//   retrigger(ctx, card, self) – Anzahl zusätzlicher Auslösungen einer Karte
//   onHand(ctx, self)          – nach den Karten
//   onRoundEnd(state, self)    – Geld am Rundenende
//   onDiscard(state, cards, self), onMoon(state, phase, self)
//   passive: { hands, discards, handSize }
(function (L) {
  'use strict';
  const D = L.data;
  const J = (L.jokers = {});
  const def = (o) => {
    o.data = o.data || (() => ({}));
    J[o.id] = o;
  };
  const sym = D.SUIT_SYM;
  const isPhase = (ctx, p) => ctx.phase === p;

  // ---------- Gewöhnlich ----------
  def({ id: 'narr', name: 'Narr', rarity: 1, cost: 4,
    desc: () => '+4 Mult',
    onHand: () => ({ mult: 4 }) });

  [['rabenfeder', 'Rabenfeder', 'S'], ['rosenknospe', 'Rosenknospe', 'H'],
   ['eichelhaeher', 'Eichelhäher', 'C'], ['glitzerstein', 'Glitzerstein', 'D']]
    .forEach(([id, name, s]) => def({ id, name, rarity: 1, cost: 5,
      desc: () => `Gezählte ${sym[s]}-Karten geben +3 Mult`,
      onScored: (ctx, c) => (L.hasSuit(c, s) ? { mult: 3 } : null) }));

  def({ id: 'zwillingsnarr', name: 'Zwillingsnarr', rarity: 1, cost: 4,
    desc: () => '+8 Mult, wenn die Hand ein Paar enthält',
    onHand: (ctx) => (ctx.contains.pair ? { mult: 8 } : null) });
  def({ id: 'doppeldecker', name: 'Doppeldecker', rarity: 1, cost: 5,
    desc: () => '+10 Mult, wenn die Hand Zwei Paare enthält',
    onHand: (ctx) => (ctx.contains.twopair ? { mult: 10 } : null) });
  def({ id: 'dreizack', name: 'Dreizack', rarity: 1, cost: 5,
    desc: () => '+12 Mult, wenn die Hand einen Drilling enthält',
    onHand: (ctx) => (ctx.contains.three ? { mult: 12 } : null) });
  def({ id: 'wegweiser', name: 'Wegweiser', rarity: 1, cost: 5,
    desc: () => '+12 Mult, wenn die Hand eine Straße enthält',
    onHand: (ctx) => (ctx.contains.straight ? { mult: 12 } : null) });
  def({ id: 'farbtopf', name: 'Farbtopf', rarity: 1, cost: 5,
    desc: () => '+10 Mult, wenn die Hand einen Flush enthält',
    onHand: (ctx) => (ctx.contains.flush ? { mult: 10 } : null) });
  def({ id: 'brueckenbauer', name: 'Brückenbauer', rarity: 1, cost: 4,
    desc: () => '+100 Chips, wenn die Hand eine Straße enthält',
    onHand: (ctx) => (ctx.contains.straight ? { chips: 100 } : null) });
  def({ id: 'nachteule', name: 'Nachteule', rarity: 1, cost: 4,
    desc: () => '+80 Chips bei Neumond',
    onHand: (ctx) => (isPhase(ctx, D.NEW_MOON) ? { chips: 80 } : null) });
  def({ id: 'sparschwein', name: 'Sparschwein', rarity: 1, cost: 5,
    desc: () => 'Erhalte $4 am Ende jeder Runde',
    onRoundEnd: () => 4 });
  def({ id: 'jongleur', name: 'Jongleur', rarity: 1, cost: 5,
    desc: () => '+1 Abwurf pro Runde',
    passive: { discards: 1 } });
  def({ id: 'kartenzaehler', name: 'Kartenzähler', rarity: 1, cost: 5,
    desc: (s) => `+2 Chips pro Karte im Nachziehstapel${s && s.round ? ` (aktuell +${s.round.draw.length * 2})` : ''}`,
    onHand: (ctx) => ({ chips: ctx.state.round.draw.length * 2 }) });
  def({ id: 'wimpel', name: 'Wimpel', rarity: 1, cost: 5,
    desc: () => '+30 Chips pro verbleibendem Abwurf',
    onHand: (ctx) => (ctx.state.round.discardsLeft > 0 ? { chips: 30 * ctx.state.round.discardsLeft } : null) });
  def({ id: 'kleinerriese', name: 'Kleiner Riese', rarity: 1, cost: 5,
    desc: () => 'Gezählte 2er, 3er, 4er und 5er geben +4 Mult',
    onScored: (ctx, c) => (c.enh !== 'stone' && c.rank <= 5 ? { mult: 4 } : null) });
  def({ id: 'hofnarr', name: 'Hofnarr', rarity: 1, cost: 5,
    desc: () => 'Gezählte Bildkarten geben +30 Chips',
    onScored: (ctx, c) => (L.isFace(c) ? { chips: 30 } : null) });
  def({ id: 'ebbe', name: 'Ebbe', rarity: 1, cost: 5,
    desc: () => '+20 Mult, wenn höchstens 3 Karten gespielt werden',
    onHand: (ctx) => (ctx.played.length <= 3 ? { mult: 20 } : null) });
  def({ id: 'gluehwuermchen', name: 'Glühwürmchen', rarity: 1, cost: 5,
    desc: () => 'Beleuchtete gezählte Karten geben zusätzlich +20 Chips',
    onScored: (ctx, c) => (ctx.lit(c) ? { chips: 20 } : null) });
  def({ id: 'sternschnuppe', name: 'Sternschnuppe', rarity: 1, cost: 5,
    desc: () => 'Erhalte $3, wann immer der Mond zum Vollmond wird',
    onMoon: (s, phase) => (phase === D.FULL_MOON ? 3 : 0) });
  def({ id: 'lawine', name: 'Lawine', rarity: 1, cost: 5,
    data: () => ({ chips: 0 }),
    desc: (s, j) => `Erhält +8 Chips pro gespielter Hand (aktuell +${j ? j.data.chips : 0} Chips)`,
    before: (ctx, j) => { j.data.chips += 8; return { msg: 'Wächst!' }; },
    onHand: (ctx, j) => (j.data.chips ? { chips: j.data.chips } : null) });
  def({ id: 'altpapier', name: 'Altpapier', rarity: 1, cost: 5,
    data: () => ({ mult: 0 }),
    desc: (s, j) => `Erhält +2 Mult pro Abwurf (aktuell +${j ? j.data.mult : 0} Mult)`,
    onDiscard: (s, cards, j) => { j.data.mult += 2; },
    onHand: (ctx, j) => (j.data.mult ? { mult: j.data.mult } : null) });

  // ---------- Ungewöhnlich ----------
  def({ id: 'werwolf', name: 'Werwolf', rarity: 2, cost: 7,
    desc: () => '×3 Mult bei Vollmond',
    onHand: (ctx) => (isPhase(ctx, D.FULL_MOON) ? { xmult: 3 } : null) });
  def({ id: 'mondsuechtig', name: 'Mondsüchtiger', rarity: 2, cost: 6,
    desc: () => 'Beleuchtete Karten erhalten doppeltes Mondlicht',
    onScored: (ctx, c) => (ctx.lit(c) ? { mult: ctx.state.mondkraft * (c.enh === 'silver' ? 2 : 1), moon: true } : null) });
  def({ id: 'gezeitenwaechter', name: 'Gezeitenwächter', rarity: 2, cost: 5,
    desc: () => 'Abwürfe lassen den Mond ebenfalls eine Phase weiterziehen',
    moonOnDiscard: true });
  def({ id: 'polarstern', name: 'Polarstern', rarity: 2, cost: 7,
    desc: () => 'Die Farbe der nächsten Mondphase ist ebenfalls beleuchtet' });
  def({ id: 'mondsammler', name: 'Mondsammler', rarity: 2, cost: 6,
    data: () => ({ mult: 0 }),
    desc: (s, j) => `Erhält +4 Mult für jede Hand, die bei Vollmond gespielt wird (aktuell +${j ? j.data.mult : 0} Mult)`,
    before: (ctx, j) => { if (isPhase(ctx, D.FULL_MOON)) { j.data.mult += 4; return { msg: 'Wächst!' }; } return null; },
    onHand: (ctx, j) => (j.data.mult ? { mult: j.data.mult } : null) });
  def({ id: 'letztestunde', name: 'Letzte Stunde', rarity: 2, cost: 6,
    desc: () => '×2 Mult bei der letzten Hand der Runde',
    onHand: (ctx) => (ctx.isLast ? { xmult: 2 } : null) });
  def({ id: 'kompass', name: 'Kompass', rarity: 2, cost: 7,
    desc: () => '×3 Mult, wenn die gezählten Karten ♠, ♥, ♣ und ♦ enthalten',
    onHand: (ctx) => {
      const cards = ctx.scoring.filter((c) => c.enh !== 'stone');
      let wild = cards.filter((c) => c.enh === 'wild').length;
      const have = new Set(cards.filter((c) => c.enh !== 'wild').map((c) => c.suit));
      return have.size + wild >= 4 ? { xmult: 3 } : null;
    } });
  def({ id: 'wahrsagerin', name: 'Wahrsagerin', rarity: 2, cost: 6,
    desc: (s) => `+2 Mult pro benutzter Arkana-Karte in diesem Lauf (aktuell +${s ? s.stats.arkanaUsed * 2 : 0} Mult)`,
    onHand: (ctx) => (ctx.state.stats.arkanaUsed ? { mult: ctx.state.stats.arkanaUsed * 2 } : null) });
  def({ id: 'taschendieb', name: 'Taschendieb', rarity: 2, cost: 6,
    desc: () => '+1 Handgröße',
    passive: { handSize: 1 } });
  def({ id: 'echo', name: 'Echo', rarity: 2, cost: 6,
    desc: () => 'Die erste gezählte Karte wird 2-mal zusätzlich ausgelöst',
    retrigger: (ctx, c) => (ctx.scoring.find((x) => !ctx.isDebuffed(x)) === c ? 2 : 0) });
  def({ id: 'mondgold', name: 'Mondgold', rarity: 2, cost: 6,
    desc: () => 'Beleuchtete gezählte Karten: 1 zu 2 Chance auf $1',
    onScored: (ctx, c) => (ctx.lit(c) && L.rand(ctx.state) < 0.5 ? { money: 1 } : null) });
  def({ id: 'leererrahmen', name: 'Leerer Rahmen', rarity: 2, cost: 7,
    desc: (s) => `×1 Mult für jeden freien Joker-Platz, inkl. diesem${s ? ` (aktuell ×${s.jokerSlots - s.jokers.length + 1})` : ''}`,
    onHand: (ctx) => ({ xmult: ctx.state.jokerSlots - ctx.state.jokers.length + 1 }) });
  def({ id: 'himmelskarte', name: 'Himmelskarte', rarity: 2, cost: 6,
    desc: (s) => {
      const n = s ? Object.values(s.handLevels).reduce((a, h) => a + h.level - 1, 0) : 0;
      return `+2 Mult pro Level-Aufstieg aller Pokerhände (aktuell +${n * 2} Mult)`;
    },
    onHand: (ctx) => {
      const n = Object.values(ctx.state.handLevels).reduce((a, h) => a + h.level - 1, 0);
      return n ? { mult: n * 2 } : null;
    } });
  def({ id: 'mondschatten', name: 'Mondschatten', rarity: 2, cost: 6,
    desc: () => 'Jede beleuchtete Karte, die in der Hand bleibt, gibt +3 Mult',
    onHeld: (ctx, c) => (ctx.lit(c) ? { mult: 3 } : null) });

  // ---------- Selten ----------
  def({ id: 'doppelgaenger', name: 'Doppelgänger', rarity: 3, cost: 10, copies: true,
    desc: (s, j) => {
      if (!s || !j) return 'Kopiert die Fähigkeit des Jokers rechts daneben';
      const i = s.jokers.indexOf(j);
      const r = i >= 0 ? L.resolveJoker(s, i) : null;
      return 'Kopiert die Fähigkeit des Jokers rechts daneben' + (r ? ` (aktuell: ${r.def.name})` : ' (aktuell: nichts)');
    } });
  def({ id: 'spiegelsee', name: 'Spiegelsee', rarity: 3, cost: 9,
    desc: () => 'Beleuchtete gezählte Karten werden erneut ausgelöst',
    retrigger: (ctx, c) => (ctx.lit(c) ? 1 : 0) });
  def({ id: 'schattenspieler', name: 'Schattenspieler', rarity: 3, cost: 8,
    desc: () => 'Bei Neumond werden alle gezählten Karten erneut ausgelöst',
    retrigger: (ctx) => (isPhase(ctx, D.NEW_MOON) ? 1 : 0) });
  def({ id: 'mondkoenig', name: 'Mondkönig', rarity: 3, cost: 9,
    data: () => ({ x: 1 }),
    desc: (s, j) => `Erhält ×0,1 Mult für jede gezählte beleuchtete Karte (aktuell ×${L.fmtNum(j ? j.data.x : 1)} Mult)`,
    before: (ctx, j) => {
      if (!ctx.litCount) return null;
      j.data.x = Math.round((j.data.x + 0.1 * ctx.litCount) * 100) / 100;
      return { msg: 'Wächst!' };
    },
    onHand: (ctx, j) => ({ xmult: j.data.x }) });

  L.jokerList = () => Object.values(J);
  L.jokerCost = (j) => L.jokers[j.id].cost + (j.edition ? D.EDITIONS[j.edition].cost : 0);
  L.jokerSellValue = (j) => Math.max(1, Math.floor(L.jokerCost(j) / 2));
  L.jokerDesc = (state, j) => L.jokers[j.id].desc(state, j);
})(globalThis.LUN = globalThis.LUN || {});
