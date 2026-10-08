// Verbrauchskarten: Arkana (verändern Karten), Sternbilder (leveln Pokerhände), Mondsteine (Twist).
// Booster-Packs für den Shop.
(function (L) {
  'use strict';
  const D = L.data;
  const C = (L.cons = { arkana: {}, stern: {}, mond: {} });
  const G = () => L.game;

  C.KIND_NAME = { arkana: 'Arkana', stern: 'Sternbild', mond: 'Mondstein' };

  // ---------- Arkana ----------
  const ark = (o) => { o.kind = 'arkana'; o.cost = 3; C.arkana[o.id] = o; };
  const enhance = (id, name, enh, max) => ark({
    id, name, min: 1, max,
    desc: `Verwandelt ${max === 1 ? '1 ausgewählte Karte' : 'bis zu ' + max + ' ausgewählte Karten'} in ${
      enh === 'silver' ? 'Mondsilber' : max === 1 ? 'eine ' + D.ENH[enh].name : D.ENH[enh].name + 'n'} (${D.ENH[enh].desc})`,
    use: (s, cards) => { cards.forEach((c) => (c.enh = enh)); },
  });
  enhance('magier', 'Der Magier', 'mult', 2);
  enhance('hierophant', 'Der Hierophant', 'bonus', 2);
  enhance('liebenden', 'Die Liebenden', 'wild', 1);
  enhance('wagen', 'Der Wagen', 'steel', 1);
  enhance('gerechtigkeit', 'Die Gerechtigkeit', 'glass', 1);
  enhance('teufel', 'Der Teufel', 'gold', 1);
  enhance('turm', 'Der Turm', 'stone', 1);
  enhance('mond', 'Der Mond', 'silver', 2);

  const suitChange = (id, name, suit) => ark({
    id, name, min: 1, max: 3,
    desc: `Bis zu 3 ausgewählte Karten werden zu ${D.SUIT_NAME[suit]} ${D.SUIT_SYM[suit]}`,
    use: (s, cards) => { cards.forEach((c) => (c.suit = suit)); },
  });
  suitChange('welt', 'Die Welt', 'S');
  suitChange('sonne', 'Die Sonne', 'H');
  suitChange('herrscherin', 'Die Herrscherin', 'C');
  suitChange('stern', 'Der Stern', 'D');

  ark({ id: 'kraft', name: 'Die Kraft', min: 1, max: 2,
    desc: 'Erhöht den Rang von bis zu 2 ausgewählten Karten um 1 (Ass wird zur 2)',
    use: (s, cards) => { cards.forEach((c) => (c.rank = c.rank === 14 ? 2 : c.rank + 1)); } });
  ark({ id: 'gehaengte', name: 'Der Gehängte', min: 1, max: 2,
    desc: 'Zerstört bis zu 2 ausgewählte Karten dauerhaft',
    use: (s, cards) => { cards.forEach((c) => G().destroyCard(s, c.uid)); } });
  ark({ id: 'tod', name: 'Der Tod', min: 2, max: 2,
    desc: 'Wähle genau 2 Karten: Die linke wird zu einer Kopie der rechten',
    use: (s, cards) => { const [a, b] = cards; a.rank = b.rank; a.suit = b.suit; a.enh = b.enh; } });
  ark({ id: 'eremit', name: 'Der Eremit', 
    desc: 'Verdoppelt dein Geld (max. +$20)',
    use: (s) => { const g = Math.max(0, Math.min(20, s.money)); s.money += g; return `+$${g}`; } });
  ark({ id: 'hohepriesterin', name: 'Die Hohepriesterin', 
    desc: 'Erzeugt bis zu 2 zufällige Sternbild-Karten (Platz im Vorrat nötig)',
    canUse: (s) => s.consumables.length < s.consSlots || 'Dein Vorrat ist voll. Verkaufe oder benutze zuerst eine Karte.',
    use: (s) => {
      let n = 0;
      while (n < 2 && s.consumables.length < s.consSlots) { G().addConsumable(s, 'stern', G().randomConsId(s, 'stern')); n++; }
      return `${n} Sternbild${n === 1 ? '' : 'er'} erhalten`;
    } });
  ark({ id: 'gericht', name: 'Das Gericht', 
    desc: 'Erzeugt einen zufälligen Joker (freier Joker-Platz nötig)',
    canUse: (s) => s.jokers.length < s.jokerSlots || 'Alle Joker-Plätze sind belegt. Verkaufe zuerst einen Joker.',
    use: (s) => { const j = G().addJoker(s, G().randomJokerId(s)); return `${L.jokers[j.id].name} erhalten`; } });
  ark({ id: 'rad', name: 'Rad des Schicksals', 
    desc: '1 zu 3 Chance: Ein zufälliger Joker ohne Edition erhält Folie, Holo oder Polychrom',
    canUse: (s) => s.jokers.some((j) => !j.edition) || 'Kein Joker ohne Edition',
    use: (s) => {
      if (L.rand(s) >= 1 / 3) return 'Leider nichts…';
      const j = L.pick(s, s.jokers.filter((x) => !x.edition));
      j.edition = L.weighted(s, [['foil', 50], ['holo', 35], ['poly', 15]]);
      return `${L.jokers[j.id].name} wird ${D.EDITIONS[j.edition].name}!`;
    } });

  // ---------- Sternbilder (leveln Pokerhände) ----------
  const STERNE = {
    high: 'Polaris', pair: 'Zwillinge', twopair: 'Fische', three: 'Dreieck',
    straight: 'Pfeil', flush: 'Wassermann', fullhouse: 'Großer Wagen', four: 'Kreuz des Südens',
    straightflush: 'Orion', five: 'Plejaden', flushhouse: 'Kassiopeia', flushfive: 'Andromeda',
  };
  Object.entries(STERNE).forEach(([hand, name]) => {
    C.stern[hand] = {
      id: hand, kind: 'stern', name, cost: 3, hand,
      desc: `${D.HANDS[hand].name} +1 Level (+${D.HANDS[hand].lc} Chips, +${D.HANDS[hand].lm} Mult)`,
      use: (s) => { G().levelUp(s, hand, 1); return `${D.HANDS[hand].name} → Level ${s.handLevels[hand].level}`; },
    };
  });

  // ---------- Mondsteine (Twist) ----------
  const mond = (o) => { o.kind = 'mond'; o.cost = o.cost || 3; C.mond[o.id] = o; };
  mond({ id: 'mondstein', name: 'Mondstein', weight: 4,
    desc: 'Mondkraft +1 (beleuchtete Karten geben dauerhaft +1 Mult mehr)',
    use: (s) => { s.mondkraft += 1; return `Mondkraft: ${s.mondkraft}`; } });
  mond({ id: 'gezeitenstein', name: 'Gezeitenstein', weight: 3,
    desc: 'Der Mond zieht sofort eine Phase weiter',
    use: (s) => { G().advanceMoon(s, 1); return D.MOON[s.moon].name; } });
  mond({ id: 'ebbstein', name: 'Ebbstein', weight: 3,
    desc: 'Der Mond geht eine Phase zurück',
    use: (s) => { s.moon = (s.moon + D.MOON.length - 1) % D.MOON.length; return D.MOON[s.moon].name; } });
  mond({ id: 'vollmondstein', name: 'Vollmondstein', weight: 1, cost: 4,
    desc: 'Der Mond wird sofort zum Vollmond',
    use: (s) => { if (s.moon !== D.FULL_MOON) { s.moon = D.FULL_MOON - 1; G().advanceMoon(s, 1); } return 'Vollmond!'; } });

  // ---------- Booster-Packs ----------
  C.PACKS = {
    arkana: { name: 'Arkana-Pack', cost: 4, choices: 3, desc: 'Wähle 1 von 3 Arkana-Karten' },
    stern:  { name: 'Sternen-Pack', cost: 4, choices: 3, desc: 'Wähle 1 von 3 Sternbildern. Es wird sofort angewendet' },
    karten: { name: 'Karten-Pack', cost: 4, choices: 3, desc: 'Wähle 1 von 3 Spielkarten für dein Deck' },
    joker:  { name: 'Joker-Pack', cost: 6, choices: 2, desc: 'Wähle 1 von 2 Jokern' },
    mond:   { name: 'Mond-Pack', cost: 4, choices: 3, desc: 'Wähle 1 von 3 Mondsteinen' },
  };

  C.get = (item) => C[item.kind][item.id];
})(globalThis.LUN = globalThis.LUN || {});
