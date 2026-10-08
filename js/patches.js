// Aufnäher: Erfolge, die als gestickte Abzeichen auf der Jeansjacke landen.
(function (L) {
  'use strict';
  const D = L.data;
  const P = (L.patches = {});

  const svg = (inner) => `<svg class="patch-art" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const fill = 'fill="currentColor" stroke="none"';
  const MOTIF = {
    cards: svg(`<rect x="22" y="26" width="30" height="44" rx="5" transform="rotate(-12 37 48)"/><rect x="46" y="26" width="30" height="44" rx="5" transform="rotate(10 61 48)"/>`),
    moon: svg(`<circle cx="50" cy="50" r="28" ${fill}/>`),
    flush: svg(`<path d="M50 78C20 56 20 30 36 28C44 27 50 34 50 40C50 34 56 27 64 28C80 30 80 56 50 78Z" ${fill}/>`),
    road: svg(`<path d="M38 84L46 16M62 84L54 16"/><path d="M50 26V34M50 46V56M50 68V78" stroke-width="5"/>`),
    shark: svg(`<path d="M18 66H82"/><path d="M30 66C40 50 48 30 58 22C58 40 62 54 72 66Z" ${fill}/>`),
    ball: svg(`<circle cx="50" cy="54" r="26"/><path d="M24 54H76M50 28V80M30 38H70M30 70H70M50 12V28"/>`),
    bolt: svg(`<path d="M56 14L28 56H48L42 86L72 42H52Z" ${fill}/>`),
    clock: svg(`<path d="M34 18H66M34 82H66M38 18C38 40 62 44 62 50C62 56 38 60 38 82M62 18C62 40 38 44 38 50C38 56 62 60 62 82"/>`),
    rocket: svg(`<path d="M50 14C64 26 66 46 60 66H40C34 46 36 26 50 14Z"/><circle cx="50" cy="40" r="6"/><path d="M40 60L30 74L40 70M60 60L70 74L60 70M44 74L50 88L56 74"/>`),
    crown: svg(`<path d="M20 70L16 32L36 50L50 24L64 50L84 32L80 70Z" ${fill}/>`),
    dollar: svg(`<path d="M64 32C60 26 54 24 48 24C38 24 32 30 34 38C36 46 64 46 66 58C68 68 60 76 50 76C42 76 36 72 34 66M50 14V86"/>`),
    house: svg(`<path d="M20 50L50 22L80 50V80H20Z"/><path d="M42 80V60H58V80"/>`),
    half: svg(`<path d="M50 22A28 28 0 0 1 50 78Z" ${fill}/><circle cx="50" cy="50" r="28"/>`),
    flag: svg(`<path d="M18 82A40 18 0 0 1 82 82"/><path d="M42 72V20"/><path d="M42 22H74L66 33L74 44H42" ${fill}/>`),
    paw: svg(`<ellipse cx="50" cy="62" rx="16" ry="13" ${fill}/><circle cx="28" cy="44" r="7" ${fill}/><circle cx="40" cy="30" r="7" ${fill}/><circle cx="60" cy="30" r="7" ${fill}/><circle cx="72" cy="44" r="7" ${fill}/>`),
    shards: svg(`<path d="M26 24L44 30L36 52Z" ${fill}/><path d="M56 22L76 32L62 46Z" ${fill}/><path d="M30 64L52 56L48 82Z" ${fill}/><path d="M60 58L78 66L66 80Z" ${fill}/>`),
  };

  // shape: round, shield, oval; color: Grundfarbe des Stoffs
  P.LIST = [
    { id: 'ersteHand', name: 'Erste Hand', hint: 'Spiele deine erste Hand.', shape: 'round', color: 'mustard', motif: 'cards' },
    { id: 'vollmond', name: 'Vollmond-Kind', hint: 'Spiele eine Hand bei Vollmond.', shape: 'round', color: 'teal', motif: 'moon' },
    { id: 'flush', name: 'Flush-Fan', hint: 'Spiele einen Flush.', shape: 'shield', color: 'orange', motif: 'flush' },
    { id: 'strasse', name: 'Straßenkind', hint: 'Spiele eine Straße.', shape: 'oval', color: 'avocado', motif: 'road' },
    { id: 'kartenhai', name: 'Kartenhai', hint: 'Spiele ein Full House oder etwas Besseres.', shape: 'shield', color: 'teal', motif: 'shark' },
    { id: 'saturday', name: 'Saturday Night', hint: 'Erziele 10.000 Punkte mit einer einzigen Hand.', shape: 'round', color: 'brown', motif: 'ball' },
    { id: 'irre', name: 'Irre!', hint: 'Erziele mit einer Hand das Dreifache des Ziels.', shape: 'oval', color: 'mustard', motif: 'bolt' },
    { id: 'zeitlupe', name: 'Zeitlupe', hint: 'Knacke das Ziel mit der letzten Hand der Runde.', shape: 'round', color: 'orange', motif: 'clock' },
    { id: 'fieber', name: 'Disco-Fieber', hint: 'Fülle das Groove-O-Meter.', shape: 'shield', color: 'brown', motif: 'ball' },
    { id: 'mondlandung', name: 'Mondlandung', hint: 'Benutze einen Mondstein.', shape: 'oval', color: 'teal', motif: 'rocket' },
    { id: 'boss', name: 'Boss-Bezwinger', hint: 'Besiege eine Boss-Blinde.', shape: 'shield', color: 'mustard', motif: 'crown' },
    { id: 'sparfuchs', name: 'Sparfuchs', hint: 'Spare $25 an.', shape: 'round', color: 'avocado', motif: 'dollar' },
    { id: 'vollesHaus', name: 'Volles Haus', hint: 'Belege alle Joker-Plätze.', shape: 'shield', color: 'orange', motif: 'house' },
    { id: 'halbzeit', name: 'Halbzeit', hint: 'Erreiche Ante 4.', shape: 'round', color: 'brown', motif: 'half' },
    { id: 'sieg', name: 'Der Mond gehört dir', hint: 'Gewinne einen Lauf.', shape: 'oval', color: 'mustard', motif: 'flag' },
    { id: 'werwolf', name: 'Werwolf-Rudel', hint: 'Spiele mit dem Werwolf eine Hand bei Vollmond.', shape: 'round', color: 'orange', motif: 'paw' },
    { id: 'scherben', name: 'Scherben bringen Glück', hint: 'Lass eine Glaskarte zerbrechen.', shape: 'oval', color: 'avocado', motif: 'shards' },
  ];
  P.byId = Object.fromEntries(P.LIST.map((p) => [p.id, p]));
  P.motif = (p) => MOTIF[p.motif] || '';

  const FLUSHES = ['flush', 'straightflush', 'flushhouse', 'flushfive'];
  const STRAIGHTS = ['straight', 'straightflush'];
  const BIG = ['fullhouse', 'four', 'straightflush', 'five', 'flushhouse', 'flushfive'];

  // Welche Aufnäher sind nach einem Ereignis verdient? ev: 'hand' | 'moonstone' | 'state'
  P.check = function (s, ev, d) {
    const got = [];
    const on = (id, cond) => { if (cond) got.push(id); };
    if (ev === 'hand') {
      const r = d.res;
      const full = r.phase === D.FULL_MOON && !r.light.none;
      on('ersteHand', true);
      on('vollmond', full);
      on('flush', FLUSHES.includes(r.type));
      on('strasse', STRAIGHTS.includes(r.type));
      on('kartenhai', BIG.includes(r.type));
      on('saturday', r.total >= 10000);
      on('irre', r.total >= 3 * d.target);
      on('zeitlupe', d.won && r.isLast);
      on('fieber', d.feverStart);
      on('boss', d.won && d.boss);
      on('werwolf', full && s.jokers.some((j) => j.id === 'werwolf'));
      on('scherben', r.broken.length > 0);
    }
    if (ev === 'moonstone') on('mondlandung', true);
    on('sparfuchs', s.money >= 25);
    on('vollesHaus', s.jokers.length >= s.jokerSlots);
    on('halbzeit', s.ante >= 4);
    on('sieg', s.phase === 'victory');
    return got;
  };
})(globalThis.LUN = globalThis.LUN || {});
