// Statische Spieldaten: Karten, Pokerhände, Mondphasen, Blinden, Bosse, Decks.
(function (L) {
  'use strict';
  const D = (L.data = {});

  D.SUITS = ['S', 'H', 'C', 'D'];
  D.SUIT_SYM = { S: '♠', H: '♥', C: '♣', D: '♦' };
  D.SUIT_NAME = { S: 'Pik', H: 'Herz', C: 'Kreuz', D: 'Karo' };
  D.RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  D.RANK_LABEL = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'B', 12: 'D', 13: 'K', 14: 'A' };
  D.RANK_NAME = { 2: 'Zwei', 3: 'Drei', 4: 'Vier', 5: 'Fünf', 6: 'Sechs', 7: 'Sieben', 8: 'Acht', 9: 'Neun', 10: 'Zehn', 11: 'Bube', 12: 'Dame', 13: 'König', 14: 'Ass' };
  D.FACE_ICON = { 11: '♞', 12: '♛', 13: '♚' };

  // Pokerhände: Basis-Chips/Mult und Zuwachs pro Level
  D.HANDS = {
    high:          { name: 'Höchste Karte',  chips: 5,   mult: 1,  lc: 10, lm: 1 },
    pair:          { name: 'Paar',           chips: 10,  mult: 2,  lc: 15, lm: 1 },
    twopair:       { name: 'Zwei Paare',     chips: 20,  mult: 2,  lc: 20, lm: 1 },
    three:         { name: 'Drilling',       chips: 30,  mult: 3,  lc: 20, lm: 2 },
    straight:      { name: 'Straße',         chips: 30,  mult: 4,  lc: 30, lm: 3 },
    flush:         { name: 'Flush',          chips: 35,  mult: 4,  lc: 15, lm: 2 },
    fullhouse:     { name: 'Full House',     chips: 40,  mult: 4,  lc: 25, lm: 2 },
    four:          { name: 'Vierling',       chips: 60,  mult: 7,  lc: 30, lm: 3 },
    straightflush: { name: 'Straight Flush', chips: 100, mult: 8,  lc: 40, lm: 4 },
    five:          { name: 'Fünfling',       chips: 120, mult: 12, lc: 35, lm: 3, secret: true },
    flushhouse:    { name: 'Flush House',    chips: 140, mult: 14, lc: 40, lm: 4, secret: true },
    flushfive:     { name: 'Flush Five',     chips: 160, mult: 16, lc: 50, lm: 3, secret: true },
  };
  // Von stark nach schwach (Anzeige-Reihenfolge)
  D.HAND_ORDER = ['flushfive', 'flushhouse', 'five', 'straightflush', 'four', 'fullhouse', 'flush', 'straight', 'three', 'twopair', 'pair', 'high'];

  // ---- Der Twist: Der Mondzyklus ----
  // Jede gespielte Hand lässt den Mond eine Phase weiterziehen.
  // Die Farbe der aktuellen Phase ist "beleuchtet": gezählte Karten dieser Farbe geben +Mondkraft Mult.
  D.MOON = [
    { name: 'Neumond',    suit: 'S', frac: 0 },
    { name: 'Sichelmond', suit: 'H', frac: 0.25 },
    { name: 'Halbmond',   suit: 'C', frac: 0.5 },
    { name: 'Buckelmond', suit: 'D', frac: 0.75 },
    { name: 'Vollmond',   suit: '*', frac: 1 },
  ];
  D.FULL_MOON = 4;
  D.NEW_MOON = 0;

  D.ENH = {
    bonus:  { name: 'Bonuskarte',  short: 'Bonus', desc: '+30 Chips' },
    mult:   { name: 'Multkarte',   short: 'Mult',  desc: '+4 Mult' },
    wild:   { name: 'Wildkarte',   short: 'Wild',  desc: 'Zählt als jede Farbe – und ist damit immer beleuchtet, solange der Mond scheint' },
    glass:  { name: 'Glaskarte',   short: 'Glas',  desc: '×2 Mult, 1 zu 4 Chance zu zerbrechen' },
    steel:  { name: 'Stahlkarte',  short: 'Stahl', desc: '×1,5 Mult, solange sie in der Hand bleibt' },
    gold:   { name: 'Goldkarte',   short: 'Gold',  desc: '$3, wenn sie am Rundenende in der Hand ist' },
    stone:  { name: 'Steinkarte',  short: 'Stein', desc: '+50 Chips, kein Rang und keine Farbe, zählt immer' },
    silver: { name: 'Mondsilber',  short: 'Silber', desc: 'Immer beleuchtet (sogar in der Finsternis) und erhält doppeltes Mondlicht' },
  };

  D.EDITIONS = {
    foil: { name: 'Folie',     desc: '+50 Chips',  cost: 2 },
    holo: { name: 'Holo',      desc: '+10 Mult',   cost: 3 },
    poly: { name: 'Polychrom', desc: '×1,5 Mult',  cost: 5 },
  };

  D.RARITY = { 1: 'Gewöhnlich', 2: 'Ungewöhnlich', 3: 'Selten' };

  D.BLIND_BASE = [300, 800, 2200, 5500, 12000, 22000, 38000, 55000];
  D.FINAL_ANTE = 8;
  D.BLINDS = [
    { name: 'Kleine Blinde', mult: 1,   reward: 3 },
    { name: 'Große Blinde',  mult: 1.5, reward: 4 },
  ];
  D.BOSS_REWARD = 5;

  // Boss-Blinden. debuff(card, ctx) markiert geschwächte Karten (zählen nicht).
  D.BOSSES = {
    rabe:     { name: 'Der Rabe',        desc: 'Alle ♠-Karten sind geschwächt', debuff: (c) => L.hasSuit(c, 'S') },
    rose:     { name: 'Die Rose',        desc: 'Alle ♥-Karten sind geschwächt', debuff: (c) => L.hasSuit(c, 'H') },
    eiche:    { name: 'Die Eiche',       desc: 'Alle ♣-Karten sind geschwächt', debuff: (c) => L.hasSuit(c, 'C') },
    kristall: { name: 'Der Kristall',    desc: 'Alle ♦-Karten sind geschwächt', debuff: (c) => L.hasSuit(c, 'D') },
    wand:     { name: 'Die Wand',        desc: 'Riesige Blinde (×4 statt ×2)', targetMult: 4 },
    nadel:    { name: 'Die Nadel',       desc: 'Nur 1 Hand – aber kleineres Ziel', targetMult: 1, hands: 1, minAnte: 2 },
    duerre:   { name: 'Die Dürre',       desc: 'Keine Abwürfe', discards: 0 },
    auge:     { name: 'Das Auge',        desc: 'Keine Pokerhand darf wiederholt werden', minAnte: 2 },
    mund:     { name: 'Der Mund',        desc: 'Nur eine Art Pokerhand ist erlaubt', minAnte: 2 },
    klammer:  { name: 'Die Klammer',     desc: 'Handgröße −1', handSize: -1 },
    zahn:     { name: 'Der Zahn',        desc: 'Verliere $1 pro gespielter Karte', minAnte: 3 },
    haken:    { name: 'Der Haken',       desc: 'Nach jeder Hand werden 2 zufällige Handkarten abgeworfen' },
    maske:    { name: 'Die Maske',       desc: 'Bildkarten werden verdeckt gezogen', minAnte: 2 },
    joch:     { name: 'Das Joch',        desc: 'Bildkarten sind geschwächt', debuff: (c) => L.isFace(c), minAnte: 2 },
    zwang:    { name: 'Der Zwang',       desc: 'Es müssen genau 5 Karten gespielt werden' },
    // Mond-Bosse (Twist)
    mondfresser: { name: 'Der Mondfresser', desc: 'Beleuchtete Karten sind geschwächt', debuff: (c, ctx) => L.isLit(ctx.state, c, ctx.light), minAnte: 2 },
    finsternis:  { name: 'Die Finsternis',  desc: 'Kein Mondlicht in dieser Runde (außer Mondsilber)', noLight: true },
    sturm:       { name: 'Der Gezeitensturm', desc: 'Der Mond springt 2 Phasen pro Hand', moonStep: 2 },
    starre:      { name: 'Die Starre',      desc: 'Der Mond wird zum Neumond und steht still', moonStep: 0, startMoon: 0 },
    // Finale Bosse (Ante 8, 16, ...)
    blutmond:     { name: 'Der Blutmond',      desc: 'Nur beleuchtete Karten zählen – alle anderen sind geschwächt', debuff: (c, ctx) => !L.isLit(ctx.state, c, ctx.light), final: true },
    schwarzesonne:{ name: 'Die Schwarze Sonne', desc: 'Kein Mondlicht und Riesige Blinde (×3)', noLight: true, targetMult: 3, final: true },
  };

  D.DECKS = {
    nacht:     { name: 'Nachtdeck',      desc: 'Das klassische Deck mit 52 Karten.' },
    glut:      { name: 'Glutdeck',       desc: '+1 Abwurf pro Runde.' },
    gezeiten:  { name: 'Gezeitendeck',   desc: '+1 Hand pro Runde.' },
    gold:      { name: 'Goldenes Deck',  desc: 'Start mit $14 statt $4.' },
    silber:    { name: 'Silberdeck',     desc: 'Mondkraft startet bei 4 statt 2.' },
    zwielicht: { name: 'Zwielichtdeck',  desc: 'Nur ♠ und ♥ – je 26 Karten.' },
  };

  // Belohnungen fürs Überspringen einer Blinde
  D.SKIP_REWARDS = {
    gold:      { name: 'Goldbeutel',    desc: 'Erhalte $10' },
    mondsegen: { name: 'Mondsegen',     desc: '+1 Mondkraft (dauerhaft)' },
    geschenk:  { name: 'Geschenk',      desc: 'Erhalte einen zufälligen Joker (sonst $5)' },
    sternregen:{ name: 'Sternenregen',  desc: 'Deine meistgespielte Pokerhand steigt um 2 Level' },
    arkanum:   { name: 'Arkanum',       desc: 'Erhalte eine zufällige Arkana-Karte (Platz nötig)' },
  };
})(globalThis.LUN = globalThis.LUN || {});
