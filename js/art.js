// Linienzeichnungen im Stil alter Sternatlanten (SVG, 100×100) – ersetzt Emoji-Icons.
(function (L) {
  'use strict';
  const A = (L.art = {});
  const SUIT = { S: '♠', H: '♥', C: '♣', D: '♦' };

  const svg = (inner, cls) =>
    `<svg class="art ${cls || ''}" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const fillC = 'fill="currentColor" stroke="none"';

  // Gemeinsame SVG-Muster: Rasterpunkte für die dunkle Mondseite (Risodruck)
  A.DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <pattern id="raster" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <rect width="7" height="7" style="fill:var(--table-ink)"/><circle cx="3.5" cy="3.5" r="1.6" style="fill:var(--orange);fill-opacity:.35"/>
    </pattern></defs></svg>`;

  // ---------- Mond ----------
  // p: beleuchteter Anteil (0 = Neumond, 1 = Vollmond), zunehmend von rechts
  A.moonShape = function (p, cx, cy, r) {
    let lit = '';
    if (p >= 1) lit = `<circle cx="${cx}" cy="${cy}" r="${r}" class="m-lit"/>`;
    else if (p > 0) {
      const rx = (Math.abs(1 - 2 * p) * r).toFixed(2);
      lit = `<path class="m-lit" d="M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${rx} ${r} 0 0 ${p < 0.5 ? 0 : 1} ${cx} ${cy - r} Z"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" class="m-dark"/>${lit}<circle cx="${cx}" cy="${cy}" r="${r}" class="m-rim"/>`;
  };
  A.moon = (p, size, cls) =>
    `<svg class="moon ${cls || ''}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${A.moonShape(p, 50, 50, 44)}</svg>`;

  // ---------- Grundformen ----------
  const star = (cx, cy, n, ro, ri, rot) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? ri : ro;
      const a = (Math.PI * i) / n - Math.PI / 2 + (rot || 0);
      d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
    }
    return `<path d="${d}Z"/>`;
  };
  const sparkle = (x, y, r) => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" ${fillC}/>`;
  const card = (rot, cx) => `<rect x="${(cx || 50) - 12}" y="28" width="24" height="34" rx="3" class="art-fill" transform="rotate(${rot} 50 86)"/>`;
  const cards = (n) => {
    let s = '';
    for (let i = 0; i < n; i++) s += card((i - (n - 1) / 2) * 15);
    return s;
  };
  const crescent = (cx, cy, r, flip) => {
    const k = flip ? -1 : 1;
    return `<path d="M${cx} ${cy - r}A${r} ${r} 0 1 ${flip ? 1 : 0} ${cx} ${cy + r}A${r * 0.62} ${r} 0 1 ${flip ? 0 : 1} ${cx} ${cy - r}Z" ${fillC} transform="translate(${k * r * 0.2} 0)"/>`;
  };
  const wave = (y) => `<path d="M12 ${y}q9.5 -9 19 0t19 0t19 0t19 0"/>`;
  const moonIn = (p, cx, cy, r) => A.moonShape(p, cx, cy, r);

  // Hash -> deterministischer Zufall für Sternbilder
  const rng = (seed) => {
    let s = L.hashSeed(seed);
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), s | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  A.constellation = function (seed) {
    const r = rng(seed);
    const n = 5 + Math.floor(r() * 3);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.8;
      const d = 14 + r() * 26;
      pts.push([50 + Math.cos(a) * d, 50 + Math.sin(a) * d]);
    }
    let path = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
    const branch = pts[Math.floor(r() * n)];
    const s = pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i % 3 === 0 ? 4 : 2.6}" ${fillC}/>`).join('');
    return `<path d="${path}" stroke-width="1.4" stroke-dasharray="0.1 3.4"/><path d="${path}" stroke-width="1"/><path d="M${branch[0].toFixed(1)} ${branch[1].toFixed(1)}L50 50" stroke-width="1"/>${s}<circle cx="50" cy="50" r="2" ${fillC}/>`;
  };

  // ---------- Motive ----------
  const M = {
    suit: (s) => `<circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="33" stroke-width="1"/><text x="50" y="67" text-anchor="middle" font-size="48" ${fillC}>${SUIT[s]}</text>`,
    jester: () => `<path d="M24 72C24 46 14 34 8 48M76 72C76 46 86 34 92 48M40 72C38 42 50 20 64 26"/><path d="M24 72C30 56 44 54 50 72C56 54 70 56 76 72"/><path d="M20 76H80" stroke-width="5"/><circle cx="8" cy="52" r="5" ${fillC}/><circle cx="92" cy="52" r="5" ${fillC}/><circle cx="66" cy="29" r="5" ${fillC}/>`,
    cards2: () => cards(2),
    cards3: () => cards(3),
    cards4: () => cards(4),
    cards5: () => cards(5),
    trident: () => `<path d="M50 88V24M30 22V40Q30 52 50 52Q70 52 70 40V22M50 14L44 26H56Z"/><path d="M30 22l-4 6M30 22l4 6M70 22l-4 6M70 22l4 6"/>`,
    steps: () => `<path d="M14 80H86"/><path d="M18 80V68H32V56H46V44H60V32H74V20H86"/>`,
    arch: () => `<path d="M10 72H90"/><path d="M14 72Q50 14 86 72"/><path d="M30 72V50M42 72V40M58 72V40M70 72V50"/>${wave(84)}`,
    owl: () => `<path d="M26 34L30 18L42 30M74 34L70 18L58 30"/><path d="M26 34Q20 80 50 86Q80 80 74 34Q50 22 26 34Z"/><circle cx="38" cy="46" r="10"/><circle cx="62" cy="46" r="10"/><circle cx="38" cy="46" r="4" ${fillC}/><circle cx="62" cy="46" r="4" ${fillC}/><path d="M46 58L50 66L54 58Z" ${fillC}/>`,
    coin: () => `<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="25" stroke-width="1.2"/><text x="50" y="62" text-anchor="middle" font-size="34" ${fillC}>$</text>`,
    orbit: () => `<ellipse cx="50" cy="50" rx="40" ry="16" transform="rotate(-18 50 50)"/><ellipse cx="50" cy="50" rx="40" ry="16" transform="rotate(42 50 50)" stroke-width="1.2"/><circle cx="50" cy="50" r="6" ${fillC}/><circle cx="14" cy="60" r="4" ${fillC}/><circle cx="84" cy="36" r="4" ${fillC}/><circle cx="70" cy="80" r="4" ${fillC}/>`,
    stack: () => `<rect x="24" y="34" width="34" height="46" rx="3" class="art-fill"/><rect x="33" y="27" width="34" height="46" rx="3" class="art-fill"/><rect x="42" y="20" width="34" height="46" rx="3" class="art-fill"/><path d="M49 32H69M49 40H69M49 48H62"/>`,
    flag: () => `<path d="M30 14V88"/><path d="M30 18L80 32L30 48Z" ${fillC}/><path d="M22 88H40"/>`,
    dots: () => `<circle cx="20" cy="74" r="5"/><circle cx="38" cy="64" r="7"/><circle cx="58" cy="52" r="9"/><circle cx="80" cy="38" r="11" ${fillC}/><path d="M12 84H90" stroke-width="1.2"/>`,
    crown: () => `<path d="M18 72L22 32L37 52L50 24L63 52L78 32L82 72Z"/><path d="M18 80H82"/><circle cx="50" cy="60" r="4" ${fillC}/>`,
    ebb: () => `${wave(44)}${wave(58)}<path d="M12 72H88" stroke-dasharray="2 5"/>${crescent(50, 24, 10)}`,
    spark: () => `${sparkle(30, 34, 10)}${sparkle(66, 28, 6)}${sparkle(58, 64, 13)}${sparkle(24, 72, 5)}${sparkle(82, 56, 4)}`,
    comet: () => `<circle cx="70" cy="30" r="10" ${fillC}/><path d="M62 38L16 84M58 30L20 60M70 42L44 82" stroke-width="1.6"/>`,
    mountain: () => `<path d="M8 82L40 26L60 58L70 44L92 82Z"/><path d="M30 44L36 48L40 40L45 49L50 44" stroke-width="1.6"/><circle cx="74" cy="72" r="4" ${fillC}/><circle cx="84" cy="64" r="3" ${fillC}/>`,
    paper: () => `<g transform="rotate(-8 50 50)"><rect x="24" y="16" width="52" height="68" rx="2" class="art-fill"/><path d="M32 30H68M32 40H68M32 50H60M32 60H68M32 70H52" stroke-width="1.6"/></g>`,
    howl: () => `${moonIn(1, 50, 38, 24)}<path d="M8 86L20 70L28 76L40 58L50 70L58 62L70 74L80 66L92 78" stroke-width="2.6"/>`,
    eye: () => `<path d="M10 50Q50 12 90 50Q50 88 10 50Z"/>${moonIn(1, 50, 50, 15)}`,
    anchor: () => `<circle cx="50" cy="18" r="6"/><path d="M50 24V84M34 36H66M22 62Q24 84 50 84Q76 84 78 62"/><path d="M16 66L22 60L28 66M72 66L78 60L84 66"/>`,
    polar: () => `${star(50, 50, 4, 38, 8)}${star(50, 50, 4, 22, 6, Math.PI / 4)}`,
    jar: () => `<path d="M36 18H64M40 18V28Q22 40 26 62Q30 84 50 84Q70 84 74 62Q78 40 60 28V18"/>${moonIn(0.25, 50, 58, 12)}`,
    hourglass: () => `<path d="M26 16H74M26 84H74M32 16Q32 40 50 50Q68 40 68 16M32 84Q32 60 50 50Q68 60 68 84"/><path d="M38 80Q50 64 62 80Z" ${fillC}/>`,
    compass: () => `<circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="30" stroke-width="1"/>${star(50, 50, 4, 30, 7)}<path d="M50 50L50 20L43 47Z" ${fillC}/>`,
    orb: () => `<circle cx="50" cy="42" r="26"/><path d="M28 84L36 68H64L72 84Z"/>${sparkle(42, 36, 7)}${sparkle(58, 48, 4)}`,
    plus: () => `${card(-10, 44)}${card(6, 44)}<path d="M70 30V54M58 42H82" stroke-width="4"/>`,
    echo: () => `<circle cx="24" cy="50" r="6" ${fillC}/><path d="M38 34Q48 50 38 66M50 24Q66 50 50 76M62 14Q84 50 62 86"/>`,
    mooncoin: () => `<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="25" stroke-width="1.2"/>${crescent(50, 50, 15)}`,
    frame: () => `<rect x="22" y="16" width="56" height="68"/><rect x="31" y="25" width="38" height="50" stroke-dasharray="3 5" stroke-width="1.4"/>`,
    chart: () => `<circle cx="50" cy="50" r="38"/><path d="M12 50H88M50 12V88" stroke-width="1"/><ellipse cx="50" cy="50" rx="18" ry="38" stroke-width="1"/>${star(64, 34, 5, 7, 3)}${star(34, 64, 5, 5, 2)}`,
    fog: () => `${moonIn(0.75, 50, 40, 24)}<path d="M14 58H58M30 68H86M18 78H70" stroke-width="3"/>`,
    mirror: () => `${crescent(34, 50, 20)}${crescent(66, 50, 20, true)}<path d="M50 12V88" stroke-dasharray="3 5" stroke-width="1.4"/>`,
    lake: () => `${moonIn(1, 50, 30, 14)}<path d="M8 54H92"/><circle cx="50" cy="74" r="14" stroke-dasharray="3 4" stroke-width="1.4"/><path d="M22 64H38M62 82H80M18 86H32" stroke-width="1.4"/>`,
    mask: () => `<path d="M14 36Q50 24 86 36Q84 66 60 70Q50 60 40 70Q16 66 14 36Z"/><path d="M28 44Q36 38 44 46Q36 52 28 44ZM56 46Q64 38 72 44Q64 52 56 46Z" ${fillC}/>`,
    king: () => `<path d="M28 42L31 18L41 30L50 14L59 30L69 18L72 42Z"/>${moonIn(0.5, 50, 66, 18)}`,
    // Bosse
    bricks: () => `<rect x="14" y="20" width="72" height="60"/><path d="M14 40H86M14 60H86M38 20V40M62 20V40M26 40V60M50 40V60M74 40V60M38 60V80M62 60V80" stroke-width="1.6"/>`,
    needle: () => `<path d="M24 82L74 20"/><ellipse cx="70" cy="25" rx="3" ry="7" transform="rotate(39 70 25)"/><path d="M74 20Q90 40 70 56Q50 72 70 88" stroke-width="1.4"/>`,
    sun: () => `<circle cx="50" cy="50" r="18"/><path d="M50 14V24M50 76V86M14 50H24M76 50H86M25 25L32 32M68 68L75 75M25 75L32 68M68 32L75 25"/><path d="M40 50L46 44L50 52L56 46" stroke-width="1.6"/>`,
    mouth: () => `<path d="M14 50Q32 30 50 42Q68 30 86 50Q68 74 50 74Q32 74 14 50Z"/><path d="M14 50Q50 60 86 50"/>`,
    clamp: () => `<path d="M30 16H18V84H30M70 16H82V84H70"/><path d="M18 50H82" stroke-dasharray="4 4"/>`,
    tooth: () => `<path d="M26 22Q38 12 50 22Q62 12 74 22Q84 40 70 58L64 86Q58 88 56 72Q50 60 44 72Q42 88 36 86L30 58Q16 40 26 22Z"/>`,
    hook: () => `<path d="M50 10V60Q50 82 32 82Q16 82 16 64"/><path d="M16 64L10 72M16 64L24 70"/><circle cx="50" cy="10" r="4" ${fillC}/>`,
    yoke: () => `<path d="M10 40Q50 20 90 40"/><path d="M26 34V60Q26 72 36 72M74 34V60Q74 72 64 72"/>`,
    chain: () => `<rect x="10" y="38" width="34" height="24" rx="12"/><rect x="33" y="38" width="34" height="24" rx="12" transform="rotate(0)"/><rect x="56" y="38" width="34" height="24" rx="12"/>`,
    bite: () => `<path class="m-lit" d="M70 22A34 34 0 1 0 74 72A18 18 0 0 1 70 22Z" stroke="currentColor"/><path d="M70 22l4 8l4 -4M74 72l6 -6l2 6" stroke-width="1.6"/>`,
    dark: () => `<circle cx="50" cy="50" r="34" ${fillC}/><circle cx="50" cy="50" r="40" stroke-dasharray="2 6"/>`,
    spiral: () => `<path d="M50 50m0 -4a4 4 0 1 1 -4 4a10 10 0 0 1 10 -10a16 16 0 0 1 16 16a22 22 0 0 1 -22 22a28 28 0 0 1 -28 -28a34 34 0 0 1 34 -34"/>`,
    frost: () => `<path d="M50 12V88M17 31L83 69M17 69L83 31"/><path d="M42 18L50 26L58 18M42 82L50 74L58 82M18 42L28 44L24 34M82 58L72 56L76 66M18 58L28 56L24 66M82 42L72 44L76 34" stroke-width="1.6"/>`,
    blood: () => `<circle cx="50" cy="50" r="34" class="art-blood"/><circle cx="50" cy="50" r="40" stroke-width="1.2"/>`,
    blacksun: () => `<circle cx="50" cy="50" r="24" ${fillC}/><path d="M50 10V20M50 80V90M10 50H20M80 50H90M22 22L29 29M71 71L78 78M22 78L29 71M71 29L78 22" stroke-width="3"/>`,
    smallBlind: () => `<circle cx="50" cy="50" r="18" ${fillC}/><circle cx="50" cy="50" r="30" stroke-width="1.2"/>`,
    bigBlind: () => `<circle cx="50" cy="50" r="28" ${fillC}/><circle cx="50" cy="50" r="38" stroke-width="1.2"/>`,
  };

  const JOKER = {
    narr: 'jester', rabenfeder: 'suit:S', rosenknospe: 'suit:H', eichelhaeher: 'suit:C', glitzerstein: 'suit:D',
    zwillingsnarr: 'cards2', doppeldecker: 'cards4', dreizack: 'trident', wegweiser: 'steps', farbtopf: 'cards5',
    brueckenbauer: 'arch', nachteule: 'owl', sparschwein: 'coin', jongleur: 'orbit', kartenzaehler: 'stack',
    wimpel: 'flag', kleinerriese: 'dots', hofnarr: 'crown', ebbe: 'ebb', gluehwuermchen: 'spark',
    sternschnuppe: 'comet', lawine: 'mountain', altpapier: 'paper',
    werwolf: 'howl', mondsuechtig: 'eye', gezeitenwaechter: 'anchor', polarstern: 'polar', mondsammler: 'jar',
    letztestunde: 'hourglass', kompass: 'compass', wahrsagerin: 'orb', taschendieb: 'plus', echo: 'echo',
    mondgold: 'mooncoin', leererrahmen: 'frame', himmelskarte: 'chart', mondschatten: 'fog',
    doppelgaenger: 'mirror', spiegelsee: 'lake', schattenspieler: 'mask', mondkoenig: 'king',
  };
  const BOSS = {
    rabe: 'suit:S', rose: 'suit:H', eiche: 'suit:C', kristall: 'suit:D', wand: 'bricks', nadel: 'needle',
    duerre: 'sun', auge: 'eye', mund: 'mouth', klammer: 'clamp', zahn: 'tooth', haken: 'hook', maske: 'mask',
    joch: 'yoke', zwang: 'chain', mondfresser: 'bite', finsternis: 'dark', sturm: 'spiral', starre: 'frost',
    blutmond: 'blood', schwarzesonne: 'blacksun',
  };

  function motif(key) {
    const [name, arg] = key.split(':');
    return M[name] ? M[name](arg) : M.jester();
  }

  A.joker = (id) => svg(motif(JOKER[id] || 'jester'));
  A.boss = (id) => svg(motif(BOSS[id] || 'dark'));
  A.blind = (idx) => svg(motif(idx === 0 ? 'smallBlind' : 'bigBlind'));
  A.stern = (hand) => svg(A.constellation('stern-' + hand));
  A.mond = (id) => {
    if (id === 'mondstein') return svg(`${moonIn(1, 50, 50, 26)}<circle cx="50" cy="50" r="36" stroke-dasharray="1 6" stroke-width="3"/>`);
    if (id === 'gezeitenstein') return svg(`${moonIn(0.5, 42, 50, 22)}<path d="M70 34Q86 50 70 66M64 62L70 66L74 58"/>`);
    if (id === 'ebbstein') return svg(`${moonIn(0.5, 58, 50, 22)}<path d="M30 34Q14 50 30 66M36 62L30 66L26 58"/>`);
    return svg(`${moonIn(1, 50, 50, 24)}<path d="M50 12V20M50 80V88M12 50H20M80 50H88M23 23L29 29M71 71L77 77M23 77L29 71M71 29L77 23" stroke-width="1.6"/>`);
  };
  const PACK = { arkana: 'orb', stern: null, karten: 'cards3', joker: 'jester', mond: null };
  A.pack = (id) => {
    let inner;
    if (id === 'stern') inner = A.constellation('pack-stern');
    else if (id === 'mond') inner = moonIn(0.75, 50, 50, 24);
    else inner = motif(PACK[id]);
    return svg(inner);
  };

  // Psychedelische Spirale für den Hintergrund des Spielfelds: verdrehte Arme in den Streifenfarben
  A.spiral = function () {
    const n = 10;
    const R = 100;
    const twist = 4.6;
    const edge = (a0, rev) => {
      const pts = [];
      for (let i = 0; i <= 32; i++) {
        const r = (i / 32) * R;
        const th = a0 + (r / R) * twist;
        pts.push((r * Math.cos(th)).toFixed(1) + ' ' + (r * Math.sin(th)).toFixed(1));
      }
      return rev ? pts.reverse() : pts;
    };
    let arms = '';
    for (let k = 0; k < n; k += 2) {
      const a0 = (k / n) * Math.PI * 2;
      const a1 = ((k + 1) / n) * Math.PI * 2;
      arms += `<path class="s${k / 2 + 1}" d="M${edge(a0).concat(edge(a1, true)).join('L')}Z"/>`;
    }
    return `<svg class="spiral" viewBox="-100 -100 200 200" aria-hidden="true">${arms}</svg>`;
  };

  // Mondfähre mit Fahne für die Mondlandung (60×60)
  A.lander = () => `<svg class="lander-art" viewBox="0 0 60 64" aria-hidden="true">
    <path class="lm-leg" d="M19 37L7 55M41 37L53 55M23 41L13 52M37 41L47 52"/>
    <ellipse class="lm-pad" cx="7" cy="56" rx="4" ry="1.6"/><ellipse class="lm-pad" cx="53" cy="56" rx="4" ry="1.6"/>
    <path class="lm-nozzle" d="M26 42H34L36 48H24Z"/>
    <path class="lm-gold" d="M15 30H45L47 36L45 42H15L13 36Z"/>
    <path class="lm-foil" d="M15 34H45M21 30V42M39 30V42"/>
    <path class="lm-cab" d="M19 30L17 21L23 13H37L43 21L41 30Z"/>
    <path class="lm-win" d="M24 18L28 18L26 23ZM32 18L36 18L34 23Z"/>
    <path class="lm-ant" d="M37 13L41 6M38.5 5.5A3 3 0 0 0 43.5 6.5"/>
    <g class="lm-flag"><path class="lm-pole" d="M50 55V36"/><path class="lm-cloth" d="M50 36H60V43H50Z"/><path class="lm-stripe" d="M50 38.3H60M50 40.6H60"/></g>
  </svg>`;

  // Tarot-Nummern der großen Arkana (echte Reihenfolge)
  A.ARKANA_NO = {
    magier: 'I', hohepriesterin: 'II', herrscherin: 'III', hierophant: 'V', liebenden: 'VI', wagen: 'VII',
    kraft: 'VIII', eremit: 'IX', rad: 'X', gerechtigkeit: 'XI', gehaengte: 'XII', tod: 'XIII', teufel: 'XV',
    turm: 'XVI', stern: 'XVII', mond: 'XVIII', sonne: 'XIX', gericht: 'XX', welt: 'XXI',
  };
})(globalThis.LUN = globalThis.LUN || {});
