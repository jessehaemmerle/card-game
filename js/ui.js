// Darstellung, Eingaben, Animationen und Speicherstand.
// Hinweis: Alle per innerHTML eingefügten Texte stammen aus den statischen Spieldaten;
// Namen werden zusätzlich mit esc() maskiert, der Seed ist auf [A-Z0-9] beschränkt.
(function (L) {
  'use strict';
  const D = L.data;
  const C = L.cons;
  const G = L.game;
  const A = L.art;
  const UI = (L.ui = {});

  const SAVE_KEY = 'lunaris_save_v1';
  const PROFILE_KEY = 'lunaris_profile_v1';
  const SETTINGS_KEY = 'lunaris_settings_v1';

  let S = null; // aktueller Spielstand
  let busy = false; // läuft gerade eine Animation?
  let selJoker = null;
  let selCons = null;
  let modal = null;
  let modalReturn = null; // Element, das nach dem Schließen den Fokus zurückbekommt
  let playView = null; // Karten auf dem Tisch während der Wertung
  let lastMoon = null; // für die Animation der Mondbahn
  let titleDeck = 'nacht';
  let settings = { speed: 1, sound: true };
  const tips = new Map();
  let tipSeq = 0;

  const $ = (q, el) => (el || document).querySelector(q);
  const $$ = (q, el) => Array.from((el || document).querySelectorAll(q));
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const fmt = L.fmt;
  const tip = (html) => { const id = 't' + tipSeq++; tips.set(id, html); return id; };
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms / settings.speed));
  const sfx = (name, step) => L.audio.play(name, step);
  const setHTML = (el, html) => { if (el) el.innerHTML = html; };
  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Speicher ----------
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
    set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* privat/voll */ } },
    del(key) { try { localStorage.removeItem(key); } catch (e) { /* egal */ } },
  };
  function loadSave() {
    const s = store.get(SAVE_KEY);
    return s && s.version === 1 && s.phase !== 'gameover' ? s : null;
  }
  function save() {
    if (!S) return;
    if (S.phase === 'gameover') store.del(SAVE_KEY);
    else store.set(SAVE_KEY, S);
  }
  function profile() {
    return Object.assign({ runs: 0, wins: 0, bestAnte: 0, bestHand: 0 }, store.get(PROFILE_KEY) || {});
  }
  function recordEnd(won) {
    if (!S || S.recorded) return;
    S.recorded = true;
    const p = profile();
    if (won) p.wins++;
    p.bestAnte = Math.max(p.bestAnte, S.ante);
    p.bestHand = Math.max(p.bestHand, S.stats.bestHand);
    store.set(PROFILE_KEY, p);
  }

  // ---------- Bausteine ----------
  function cardName(c) {
    if (c.enh === 'stone') return 'Steinkarte';
    return `${D.RANK_NAME[c.rank]} ${D.SUIT_NAME[c.suit]}${c.enh ? ', ' + D.ENH[c.enh].name : ''}`;
  }

  function cardTip(c, o) {
    if (c.enh === 'stone') return `<div class="tt-title">Steinkarte</div><div class="tt-body">${D.ENH.stone.desc}</div>`;
    const chips = L.cardChips(c) + (c.enh === 'bonus' ? 30 : 0);
    let h = `<div class="tt-title">${D.RANK_NAME[c.rank]} <span class="ink-${c.suit}">${D.SUIT_SYM[c.suit]}</span></div>`;
    h += `<div class="tt-body">+${chips} Chips</div>`;
    if (c.enh) h += `<div class="tt-note"><b>${D.ENH[c.enh].name}.</b> ${D.ENH[c.enh].desc}</div>`;
    if (o && o.lit) h += `<div class="tt-note tt-lit">Beleuchtet: +${S.mondkraft * (c.enh === 'silver' ? 2 : 1)} Mult</div>`;
    if (o && o.debuff) h += '<div class="tt-note tt-bad">Geschwächt: zählt in dieser Runde nicht</div>';
    return h;
  }

  // Spielkarte. Mit o.act wird sie ein Button (Handkarten), sonst ein reines Bild.
  function cardHTML(c, o) {
    o = o || {};
    const tag = o.act ? 'button' : 'div';
    const btn = o.act ? ` type="button" data-act="${o.act}" aria-pressed="${o.selected ? 'true' : 'false'}"` : '';
    if (o.faceDown) {
      return `<${tag} class="card back ${o.cls || ''} ${o.selected ? 'selected' : ''}" data-uid="${esc(c.uid)}"${btn} aria-label="Verdeckte Karte"><span class="back-in"></span></${tag}>`;
    }
    const stone = c.enh === 'stone';
    const rk = D.RANK_LABEL[c.rank];
    const sy = D.SUIT_SYM[c.suit];
    const cls = ['card', stone ? 'stone' : 'ink-' + c.suit, c.enh ? 'enh-' + c.enh : '', o.selected ? 'selected' : '',
      o.lit ? 'lit' : '', o.debuff ? 'debuff' : '', o.cls || ''].join(' ');
    let center;
    if (stone) center = '';
    else if (L.isFace(c)) center = `<span class="court">${rk}</span>`;
    else center = `<span class="pip">${sy}</span>`;
    const corners = stone ? '' : `<span class="corner tl">${rk}<i>${sy}</i></span><span class="corner br">${rk}<i>${sy}</i></span>`;
    const enh = c.enh && !stone ? `<span class="enh-tag">${D.ENH[c.enh].short}</span>` : '';
    const label = cardName(c) + (o.lit ? ', beleuchtet' : '') + (o.debuff ? ', geschwächt' : '');
    return `<${tag} class="${cls}" data-uid="${esc(c.uid)}" data-tip="${tip(cardTip(c, o))}" aria-label="${esc(label)}"${btn}>${corners}${center}${enh}</${tag}>`;
  }

  function jokerTip(j, owned) {
    const d = L.jokers[j.id];
    let h = `<div class="tt-title">${esc(d.name)}</div><div class="tt-sub r${d.rarity}">${D.RARITY[d.rarity]}${j.edition ? ', ' + D.EDITIONS[j.edition].name : ''}</div>`;
    h += `<div class="tt-body">${esc(d.desc(S, owned ? j : null))}</div>`;
    if (j.edition) h += `<div class="tt-note"><b>${D.EDITIONS[j.edition].name}:</b> ${D.EDITIONS[j.edition].desc}</div>`;
    if (owned) h += `<div class="tt-note tt-money">Verkaufswert $${L.jokerSellValue(j)}</div>`;
    return h;
  }

  function jokerHTML(j, o) {
    o = o || {};
    const d = L.jokers[j.id];
    const tag = o.act ? 'button' : 'div';
    const btn = o.act ? ` type="button" data-act="${o.act}" aria-expanded="${o.selected ? 'true' : 'false'}"` : '';
    const ed = j.edition ? `<span class="ed-tag">${D.EDITIONS[j.edition].name}</span>` : '';
    return `<${tag} class="joker r${d.rarity} ${j.edition ? 'ed-' + j.edition : ''} ${o.selected ? 'selected' : ''}" data-uid="${esc(j.uid || '')}" data-tip="${tip(jokerTip(j, o.owned))}" aria-label="Joker ${esc(d.name)}"${btn}>
      <span class="plate-art">${A.joker(j.id)}</span><span class="plate-name">${esc(d.name)}</span>${ed}</${tag}>`;
  }

  function consTip(item, owned) {
    const d = C.get(item);
    let h = `<div class="tt-title">${esc(d.name)}</div><div class="tt-sub">${C.KIND_NAME[item.kind]}</div><div class="tt-body">${esc(d.desc)}</div>`;
    if (item.kind === 'stern') h += `<div class="tt-note">${D.HANDS[d.hand].name} ist derzeit auf Level ${S.handLevels[d.hand].level}</div>`;
    if (owned) h += `<div class="tt-note tt-money">Verkaufswert $${G.consSellValue(item)}</div>`;
    return h;
  }

  function consArt(item) {
    if (item.kind === 'arkana') {
      const no = A.ARKANA_NO[item.id] || '';
      return `<span class="numeral ${no.length > 3 ? 'long' : ''}">${no}</span>`;
    }
    if (item.kind === 'stern') return A.stern(item.id);
    return A.mond(item.id);
  }

  function consHTML(item, o) {
    o = o || {};
    const d = C.get(item);
    const tag = o.act ? 'button' : 'div';
    const btn = o.act ? ` type="button" data-act="${o.act}" aria-expanded="${o.selected ? 'true' : 'false'}"` : '';
    return `<${tag} class="cons k-${item.kind} ${o.selected ? 'selected' : ''}" data-uid="${esc(item.uid || '')}" data-tip="${tip(consTip(item, o.owned))}" aria-label="${C.KIND_NAME[item.kind]} ${esc(d.name)}"${btn}>
      <span class="plate-art">${consArt(item)}</span><span class="plate-name">${esc(d.name)}</span></${tag}>`;
  }

  function packHTML(id) {
    const p = C.PACKS[id];
    return `<div class="pack p-${id}" data-tip="${tip(`<div class="tt-title">${p.name}</div><div class="tt-body">${p.desc}</div>`)}">
      <span class="plate-art">${A.pack(id)}</span><span class="plate-name">${p.name}</span></div>`;
  }

  // ---------- Mondbahn (das Herzstück) ----------
  function moonTrackHTML() {
    const info = L.lightInfo(S);
    const ph = D.MOON[S.moon];
    const next = D.MOON[(S.moon + 1) % D.MOON.length];
    const moons = D.MOON.map((m, i) => {
      const now = i === S.moon;
      const suit = m.suit === '*' ? 'alle' : D.SUIT_SYM[m.suit];
      return `<li class="mt-moon ${now ? 'now' : ''} ${info.none ? 'dark' : ''}" style="--i:${i}">
        ${A.moon(m.frac, now ? 66 : 40)}
        <span class="mt-suit ${m.suit === '*' ? 'all' : 'ink-' + m.suit}">${suit}</span>
        <span class="sr-only">${m.name}${now ? ' (jetzt)' : ''}</span>
      </li>`;
    }).join('');
    let caption;
    if (info.none) caption = `<b>${ph.name}</b>, aber kein Mondlicht in dieser Runde.`;
    else if (info.all) caption = `<b>Vollmond.</b> Alle Farben leuchten: jede gezählte Karte gibt +${S.mondkraft} Mult.`;
    else {
      const names = [...info.suits].map((s) => `${D.SUIT_NAME[s]} <span class="ink-${s}">${D.SUIT_SYM[s]}</span>`).join(' und ');
      caption = `<b>${ph.name}.</b> ${names} leuchtet: jede gezählte Karte dieser Farbe gibt +${S.mondkraft} Mult.`;
    }
    const nextTxt = next.suit === '*' ? 'Vollmond, alle Farben' : `${next.name}, ${D.SUIT_NAME[next.suit]}`;
    return `<section class="moon-track" aria-label="Mondzyklus">
      <ol class="mt-row" style="--now:${S.moon}">${moons}<li class="mt-marker" aria-hidden="true" style="--i:${S.moon}"></li></ol>
      <p class="mt-caption">${caption} <span class="mt-next">Nach der nächsten Hand: ${nextTxt}.</span></p>
    </section>`;
  }

  // ---------- Titelbildschirm ----------
  function deckBack(id) {
    return `<span class="card back deck-${id}"><span class="back-in"></span></span>`;
  }

  function titleHTML() {
    const has = !!loadSave();
    const p = profile();
    const decks = Object.entries(D.DECKS).map(([id, d]) =>
      `<button type="button" class="deck-opt ${titleDeck === id ? 'sel' : ''}" data-act="pick-deck" data-id="${id}" aria-pressed="${titleDeck === id}">
        ${deckBack(id)}<span class="d-name">${d.name}</span></button>`).join('');
    const phases = D.MOON.map((m) => A.moon(m.frac, 54)).join('');
    const record = p.runs
      ? `Bisher ${p.runs} ${p.runs === 1 ? 'Lauf' : 'Läufe'} und ${p.wins} ${p.wins === 1 ? 'Sieg' : 'Siege'}. Beste Ante: ${p.bestAnte}, beste Hand: ${fmt(p.bestHand)} Punkte.`
      : 'Noch kein Lauf gespielt.';
    return `<div class="title-screen">
      <div class="title-phases" aria-hidden="true">${phases}</div>
      <div class="title-grid">
        <div class="title-main">
          <h1 class="logo">Lunaris</h1>
          <p class="lede">Spiele Pokerhände gegen steigende Punktziele. Mit jeder Hand wandert der Mond eine Phase weiter und lässt eine andere Farbe leuchten.</p>
          <div class="title-btns">
            ${has ? '<button type="button" class="btn btn-primary big" data-act="continue">Lauf fortsetzen</button>' : ''}
            <button type="button" class="btn ${has ? 'btn-quiet' : 'btn-primary'} big" data-act="new-run">Neuer Lauf</button>
            <button type="button" class="btn btn-quiet big" data-act="help">Anleitung</button>
          </div>
          <p class="record">${record}</p>
        </div>
        <div class="title-decks">
          <h2 class="title-h2">Deck</h2>
          <div class="decks">${decks}</div>
          <p class="deck-desc" id="deck-desc">${D.DECKS[titleDeck].desc}</p>
          <label class="seed-row" for="seed-input">Seed <input id="seed-input" maxlength="12" placeholder="zufällig" autocomplete="off" spellcheck="false"></label>
        </div>
      </div>
    </div>`;
  }

  // ---------- Seitenleiste (Ephemeriden-Tabelle) ----------
  function previewInfo() {
    if (!S || !S.round || S.phase !== 'round' || busy) return null;
    return G.previewHand(S);
  }

  function sideHTML() {
    const r = S.round;
    let blind;
    if (r && (S.phase === 'round' || S.phase === 'cashout' || S.phase === 'gameover')) {
      const boss = L.activeBoss(S);
      const art = boss ? A.boss(r.bossId) : A.blind(r.blindIndex);
      blind = `<div class="led-blind ${boss ? 'boss' : ''}">
        <span class="sigil">${art}</span>
        <div><h2 class="led-title">${esc(r.name)}</h2>
        ${boss ? `<p class="led-rule">${esc(boss.desc)}${r.lockedType ? `. Erlaubt ist nur noch ${D.HANDS[r.lockedType].name}.` : ''}</p>` : ''}</div>
      </div>
      <dl class="ledger">
        <div><dt>Ziel</dt><dd class="v-target">${fmt(r.target)}</dd></div>
        <div><dt>Belohnung</dt><dd class="v-money">$${r.reward}</dd></div>
      </dl>`;
    } else {
      const label = S.phase === 'shop' ? 'Shop' : S.phase === 'victory' ? 'Gewonnen' : `Ante ${S.ante}`;
      blind = `<div class="led-blind"><div><h2 class="led-title">${label}</h2></div></div>`;
    }
    const p = previewInfo();
    const inRound = r && (S.phase === 'round' || S.phase === 'cashout' || S.phase === 'gameover');
    const pct = inRound ? Math.min(100, (r.score / r.target) * 100) : 0;
    const roundNo = S.stats.roundsWon + (S.phase === 'round' || S.phase === 'blind' ? 1 : 0);
    const scoring = inRound ? `<div class="led-score">
        <span class="led-label">Punkte</span>
        <span class="led-big" id="round-score">${fmt(r.score)}</span>
        <span class="led-bar"><span style="width:${pct}%"></span></span>
      </div>
      <div class="hand-panel" id="hand-panel" aria-live="polite">
        <div class="hp-name" id="hp-name">${p ? `${D.HANDS[p.type].name} <small>Level ${p.level}</small>` : '<span class="hp-empty">Keine Karten gewählt</span>'}</div>
        <div class="hp-cm"><span class="hp-chips" id="hp-chips">${p ? fmt(p.chips) : 0}</span><span class="hp-x" aria-label="mal">×</span><span class="hp-mult" id="hp-mult">${p ? L.fmtNum(p.mult) : 0}</span></div>
      </div>` : '';
    return `<aside class="side" aria-label="Rundeninfo">
      <div class="side-logo">Lunaris</div>
      ${blind}
      ${scoring}
      <dl class="ledger">
        <div><dt>Hände</dt><dd>${r ? r.handsLeft : '–'}</dd></div>
        <div><dt>Abwürfe</dt><dd>${r ? r.discardsLeft : '–'}</dd></div>
        <div><dt>Geld</dt><dd class="v-money">$${S.money}</dd></div>
        <div><dt>Mondkraft</dt><dd class="v-moon">+${S.mondkraft}</dd></div>
        <div><dt>Ante</dt><dd>${S.ante} <small>von ${D.FINAL_ANTE}</small></dd></div>
        <div><dt>Runde</dt><dd>${roundNo}</dd></div>
      </dl>
      <div class="side-btns">
        <button type="button" class="btn btn-quiet btn-small" data-act="show-hands">Pokerhände</button>
        <button type="button" class="btn btn-quiet btn-small" data-act="show-deck">Deck</button>
        <button type="button" class="btn btn-quiet btn-small" data-act="show-settings">Optionen</button>
      </div>
    </aside>`;
  }

  // ---------- Obere Leiste: Joker & Verbrauch ----------
  function topHTML() {
    const jk = S.jokers.map((j, i) => {
      const sel = selJoker === j.uid;
      const menu = sel && !busy ? `<div class="item-menu">
          <button type="button" class="btn btn-quiet btn-tiny" data-act="move-joker" data-uid="${esc(j.uid)}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Nach links schieben">‹</button>
          <button type="button" class="btn btn-danger btn-tiny" data-act="sell-joker" data-uid="${esc(j.uid)}">Für $${L.jokerSellValue(j)} verkaufen</button>
          <button type="button" class="btn btn-quiet btn-tiny" data-act="move-joker" data-uid="${esc(j.uid)}" data-dir="1" ${i === S.jokers.length - 1 ? 'disabled' : ''} aria-label="Nach rechts schieben">›</button>
        </div>` : '';
      return `<div class="slot">${jokerHTML(j, { act: 'joker', owned: true, selected: sel })}${menu}</div>`;
    });
    for (let k = S.jokers.length; k < S.jokerSlots; k++) jk.push('<div class="slot"><div class="slot-empty"></div></div>');
    const cs = S.consumables.map((c) => {
      const sel = selCons === c.uid;
      let menu = '';
      if (sel && !busy) {
        const block = G.consumableBlock(S, c);
        menu = `<div class="item-menu">
          <button type="button" class="btn btn-primary btn-tiny ${block ? 'blocked' : ''}" data-act="use-cons" data-uid="${esc(c.uid)}" ${block ? `data-block="${esc(block)}" aria-disabled="true"` : ''}>Benutzen</button>
          <button type="button" class="btn btn-danger btn-tiny" data-act="sell-cons" data-uid="${esc(c.uid)}">Für $${G.consSellValue(c)} verkaufen</button>
        </div>`;
      }
      return `<div class="slot">${consHTML(c, { act: 'cons', owned: true, selected: sel })}${menu}</div>`;
    });
    for (let k = S.consumables.length; k < S.consSlots; k++) cs.push('<div class="slot"><div class="slot-empty"></div></div>');
    return `<div class="top-row">
      <section class="tray jokers-tray" aria-label="Joker"><h3 class="tray-label">Joker <span>${S.jokers.length} von ${S.jokerSlots}</span></h3><div class="tray-items">${jk.join('')}</div></section>
      <section class="tray cons-tray" aria-label="Verbrauchskarten"><h3 class="tray-label">Vorrat <span>${S.consumables.length} von ${S.consSlots}</span></h3><div class="tray-items">${cs.join('')}</div></section>
    </div>`;
  }

  // ---------- Mitte je nach Phase ----------
  function blindSelectHTML() {
    const cards = [0, 1, 2].map((i) => {
      const info = G.blindInfo(S, i);
      const st = S.blindStates[i];
      const rid = i < 2 ? S.skipRewards[i] : null;
      const R = rid ? D.SKIP_REWARDS[rid] : null;
      const stamp = st === 'done' ? '<span class="stamp">Besiegt</span>' : st === 'skipped' ? '<span class="stamp">Übersprungen</span>' : '';
      const art = info.isBoss ? A.boss(S.bossId) : A.blind(i);
      return `<article class="ticket ${st} ${info.isBoss ? 'boss' : ''}">
        ${stamp}
        <span class="sigil big">${art}</span>
        <h3 class="ticket-name">${esc(info.name)}</h3>
        <p class="ticket-rule">${info.isBoss ? esc(info.boss.desc) : 'Keine Sonderregel'}</p>
        <dl class="ledger">
          <div><dt>Ziel</dt><dd class="v-target">${fmt(info.target)}</dd></div>
          <div><dt>Belohnung</dt><dd class="v-money">$${info.reward}</dd></div>
        </dl>
        ${st === 'current' ? '<button type="button" class="btn btn-primary" data-act="select-blind">Blinde spielen</button>' : ''}
        ${st === 'current' && R ? `<div class="skip-box"><button type="button" class="btn btn-quiet btn-small" data-act="skip-blind">Überspringen</button>
            <p class="skip-reward">Dafür: ${R.name}. ${R.desc}.</p></div>` : ''}
      </article>`;
    }).join('');
    return `<div class="blind-select">
      <h2 class="screen-title">Ante ${S.ante}${S.endless ? ', Endlosmodus' : ''}</h2>
      <div class="tickets">${cards}</div>
    </div>`;
  }

  function roundHTML() {
    const r = S.round;
    const info = L.lightInfo(S);
    const cardOpts = (c) => {
      const deb = L.isDebuffed(S, c);
      return { lit: !deb && L.isLit(S, c, info), debuff: deb };
    };
    const play = playView ? playView.uids.filter((u) => S.cards[u]).map((u) => cardHTML(S.cards[u], Object.assign(cardOpts(S.cards[u]), { cls: playView.scoring.has(u) ? 'scoring' : 'nonscoring' }))).join('') : '';
    const n = r.hand.length;
    const ov = n <= 6 ? 0.08 : n <= 8 ? -0.04 : n <= 10 ? -0.22 : -0.38;
    const hand = r.hand.map((u) => {
      const c = S.cards[u];
      return cardHTML(c, Object.assign(cardOpts(c), { act: 'card', selected: r.selected.includes(u), faceDown: r.faceDown.includes(u) }));
    }).join('');
    const canPlay = !busy && r.selected.length > 0 && r.handsLeft > 0;
    const canDisc = !busy && r.selected.length > 0 && r.discardsLeft > 0;
    const remaining = Math.max(0, r.target - r.score);
    return `<div class="play-zone">
        <div class="play-area" id="play-area">${play || (busy ? '' : `<p class="play-hint">Noch ${fmt(remaining)} Punkte bis zum Ziel. Wähle bis zu 5 Karten.</p>`)}</div>
      </div>
      <div class="hand-zone">
        <div class="hand" id="hand" role="group" aria-label="Deine Hand" tabindex="-1" style="--ov:${ov}">${hand}</div>
        <div class="controls">
          <button type="button" class="btn btn-primary btn-play" data-act="play" ${canPlay ? '' : 'disabled'}>Hand spielen</button>
          <div class="sort-box" role="group" aria-label="Hand sortieren">
            <button type="button" class="btn btn-quiet btn-tiny ${S.sortMode === 'rank' ? 'on' : ''}" data-act="sort" data-mode="rank" aria-pressed="${S.sortMode === 'rank'}">Nach Rang</button>
            <button type="button" class="btn btn-quiet btn-tiny ${S.sortMode === 'suit' ? 'on' : ''}" data-act="sort" data-mode="suit" aria-pressed="${S.sortMode === 'suit'}">Nach Farbe</button>
          </div>
          <button type="button" class="btn btn-danger btn-discard" data-act="discard" ${canDisc ? '' : 'disabled'}>Abwerfen</button>
        </div>
        <button type="button" class="deck-pile" data-act="show-deck" aria-label="Deck ansehen, ${r.draw.length} von ${G.deckSize(S)} Karten übrig">${deckBack(S.deckId)}<span>${r.draw.length} von ${G.deckSize(S)}</span></button>
      </div>`;
  }

  function cashoutHTML() {
    const co = S.cashout;
    const lines = co.lines.map((l) => `<li><span>${esc(l.label)}</span><b>$${l.value}</b></li>`).join('');
    return `<div class="receipt">
      <h2>Blinde besiegt</h2>
      <p class="receipt-score">${fmt(co.score)} von ${fmt(co.target)} Punkten</p>
      <ul class="receipt-lines">${lines}</ul>
      <p class="receipt-total"><span>Summe</span><b>$${co.total}</b></p>
      <button type="button" class="btn btn-buy big" data-act="cashout">$${co.total} einkassieren</button>
    </div>`;
  }

  function shopItemHTML(item) {
    if (item.kind === 'joker') return jokerHTML({ id: item.id, edition: item.edition, data: L.jokers[item.id].data() });
    return consHTML(item);
  }

  function shopHTML() {
    if (S.pack) return packOpenHTML();
    const sh = S.shop;
    const slot = (inner, price, act, i, sold, soldTxt, verb) => `<div class="shop-slot ${sold ? 'sold' : ''}">
        ${sold ? `<div class="sold-mark">${soldTxt}</div>` : inner}
        ${sold ? '' : `<button type="button" class="btn btn-buy btn-small" data-act="${act}" data-idx="${i}" ${S.money < price ? 'disabled' : ''}>${verb} <span class="price">$${price}</span></button>`}
      </div>`;
    const items = sh.items.map((it, i) => slot(it.sold ? '' : shopItemHTML(it), it.price, 'buy', i, it.sold, 'Gekauft', 'Kaufen')).join('');
    const packs = sh.packs.map((p, i) => slot(p.sold ? '' : packHTML(p.id), p.price, 'buy-pack', i, p.sold, 'Geöffnet', 'Öffnen')).join('');
    return `<div class="shop">
      <div class="shop-head">
        <h2 class="screen-title">Shop</h2>
        <div class="shop-btns">
          <button type="button" class="btn btn-quiet" data-act="reroll" ${S.money < sh.rerollCost ? 'disabled' : ''}>Neu würfeln ($${sh.rerollCost})</button>
          <button type="button" class="btn btn-primary" data-act="leave-shop">Zur nächsten Blinde</button>
        </div>
      </div>
      <div class="shop-body">
        <section class="shop-group" aria-label="Karten"><div class="shop-items">${items}</div></section>
        <section class="shop-group" aria-label="Booster-Packs"><div class="shop-items">${packs}</div></section>
      </div>
      <p class="hint">Die Reihenfolge der Joker zählt. Wähle einen Joker aus, um ihn zu verschieben oder zu verkaufen.</p>
    </div>`;
  }

  function packOpenHTML() {
    const pk = S.pack;
    const def = C.PACKS[pk.id];
    const ch = pk.choices.map((c, i) => {
      let el;
      if (c.kind === 'card') el = cardHTML(Object.assign({ uid: 'pc' + i }, c.card), { lit: L.isLit(S, c.card) });
      else if (c.kind === 'joker') el = jokerHTML({ id: c.id, edition: c.edition, data: L.jokers[c.id].data() });
      else el = consHTML(c);
      return `<div class="pack-choice">${el}<button type="button" class="btn btn-primary btn-small" data-act="pack-pick" data-idx="${i}">Nehmen</button></div>`;
    }).join('');
    return `<div class="pack-open">
      <h2 class="screen-title">${def.name}</h2>
      <p class="hint">${def.desc}.</p>
      <div class="pack-choices">${ch}</div>
      <button type="button" class="btn btn-quiet" data-act="pack-skip">Nichts nehmen</button>
    </div>`;
  }

  function endOverlayHTML() {
    if (S.phase === 'gameover') {
      const r = S.round;
      return `<div class="overlay"><div class="end-box lose" role="dialog" aria-modal="true" aria-labelledby="end-title">
        <h2 id="end-title">Lauf beendet</h2>
        <p>${r ? `${esc(r.name)} hat dich in Ante ${S.ante} gestoppt: ${fmt(r.score)} von ${fmt(r.target)} Punkten.` : ''}</p>
        ${statsHTML()}
        <div class="end-btns"><button type="button" class="btn btn-primary big" data-act="new-run-same">Neuer Lauf</button><button type="button" class="btn btn-quiet" data-act="menu">Zum Hauptmenü</button></div>
      </div></div>`;
    }
    if (S.phase === 'victory') {
      return `<div class="overlay"><div class="end-box win" role="dialog" aria-modal="true" aria-labelledby="end-title">
        <div class="end-moon">${A.moon(1, 96)}</div>
        <h2 id="end-title">Gewonnen</h2>
        <p>Du hast die Boss-Blinde der Ante ${D.FINAL_ANTE} besiegt.</p>
        ${statsHTML()}
        <div class="end-btns"><button type="button" class="btn btn-primary big" data-act="endless">Endlos weiterspielen</button><button type="button" class="btn btn-quiet" data-act="new-run-same">Neuer Lauf</button><button type="button" class="btn btn-quiet" data-act="menu">Zum Hauptmenü</button></div>
      </div></div>`;
    }
    return '';
  }

  function statsHTML() {
    const st = S.stats;
    return `<dl class="ledger end-stats">
      <div><dt>Beste Hand</dt><dd>${fmt(st.bestHand)}${st.bestHandType ? ` <small>${D.HANDS[st.bestHandType].name}</small>` : ''}</dd></div>
      <div><dt>Gespielte Hände</dt><dd>${st.handsPlayed}</dd></div>
      <div><dt>Besiegte Blinden</dt><dd>${st.roundsWon}</dd></div>
      <div><dt>Deck</dt><dd>${D.DECKS[S.deckId].name}</dd></div>
      <div><dt>Seed</dt><dd>${esc(S.seed)}</dd></div>
    </dl>`;
  }

  function centerHTML() {
    switch (S.phase) {
      case 'blind': return blindSelectHTML();
      case 'round': case 'gameover': return roundHTML();
      case 'cashout': return cashoutHTML();
      case 'shop': return shopHTML();
      default: return '';
    }
  }

  // ---------- Modals ----------
  function modalHTML() {
    if (!modal) return '';
    let title = '';
    let body = '';
    if (modal === 'help') { title = 'Anleitung'; body = helpHTML(); }
    if (modal === 'hands' && S) {
      title = 'Pokerhände';
      body = `<table class="hands-table"><thead><tr><th>Hand</th><th>Level</th><th>Chips × Mult</th><th>Gespielt</th></tr></thead><tbody>${D.HAND_ORDER.map((h) => {
        const b = L.handBase(S, h);
        const lv = S.handLevels[h];
        if (D.HANDS[h].secret && !lv.played && lv.level === 1) return '<tr class="dim"><td>Noch unentdeckt</td><td></td><td></td><td></td></tr>';
        return `<tr><td>${D.HANDS[h].name}</td><td>${b.level}</td><td><span class="v-chips">${b.chips}</span> × <span class="v-mult">${b.mult}</span></td><td>${lv.played}</td></tr>`;
      }).join('')}</tbody></table>`;
    }
    if (modal === 'deck' && S) {
      title = `Deck mit ${G.deckSize(S)} Karten`;
      const inDraw = S.round ? new Set(S.round.draw) : null;
      const all = Object.values(S.cards);
      const mini = (c) => cardHTML(c, { cls: 'mini' + (inDraw && !inDraw.has(c.uid) ? ' gone' : '') });
      const rows = D.SUITS.map((s) => {
        const cs = all.filter((c) => c.suit === s && c.enh !== 'stone').sort((a, b) => b.rank - a.rank);
        if (!cs.length) return '';
        const left = inDraw ? cs.filter((c) => inDraw.has(c.uid)).length : cs.length;
        return `<div class="deck-row"><div class="dr-label"><span class="ink-${s}">${D.SUIT_SYM[s]}</span> ${D.SUIT_NAME[s]}<small>${inDraw ? `${left} von ${cs.length} übrig` : `${cs.length} Karten`}</small></div><div class="dr-cards">${cs.map(mini).join('')}</div></div>`;
      }).join('');
      const stones = all.filter((c) => c.enh === 'stone');
      body = (S.round ? '<p class="hint">Blasse Karten hast du in dieser Runde schon gezogen.</p>' : '') + rows +
        (stones.length ? `<div class="deck-row"><div class="dr-label">Stein</div><div class="dr-cards">${stones.map(mini).join('')}</div></div>` : '');
    }
    if (modal === 'settings') {
      title = 'Optionen';
      body = `<div class="opt-row"><span>Spieltempo</span><div role="group" aria-label="Spieltempo">${[1, 2, 3, 4].map((v) => `<button type="button" class="btn btn-quiet btn-tiny ${settings.speed === v ? 'on' : ''}" data-act="speed" data-v="${v}" aria-pressed="${settings.speed === v}">${v}×</button>`).join('')}</div></div>
        <div class="opt-row"><span>Sound</span><button type="button" class="btn btn-quiet btn-tiny ${settings.sound ? 'on' : ''}" data-act="toggle-sound" aria-pressed="${settings.sound}">${settings.sound ? 'An' : 'Aus'}</button></div>
        ${S ? `<div class="opt-row"><span>Seed dieses Laufs</span><code>${esc(S.seed)}</code></div>
        <div class="opt-row"><span>Tastatur</span><span class="keys">1 bis 9 wählt Karten, Enter spielt, D wirft ab, S sortiert um, Esc schließt.</span></div>
        <div class="opt-btns"><button type="button" class="btn btn-quiet btn-small" data-act="help">Anleitung</button><button type="button" class="btn btn-quiet btn-small" data-act="menu">Zum Hauptmenü (Lauf bleibt gespeichert)</button><button type="button" class="btn btn-danger btn-small" data-act="abandon">Lauf aufgeben</button></div>` : ''}`;
    }
    return `<div class="modal-back" data-act="close-modal"><div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-act="noop">
      <div class="modal-head"><h2 id="modal-title">${title}</h2><button type="button" class="btn btn-quiet btn-tiny" data-act="close-modal" aria-label="Schließen">Schließen</button></div>
      <div class="modal-body">${body}</div></div></div>`;
  }

  function helpHTML() {
    return `<div class="help">
      <h3>Ziel</h3>
      <p>Jede Ante hat drei Blinden: eine kleine, eine große und einen Boss mit Sonderregel. Erreiche in jeder Blinde das Punktziel. Wer die Boss-Blinde der Ante ${D.FINAL_ANTE} besiegt, gewinnt.</p>
      <h3>Punkte</h3>
      <p>Wähle bis zu 5 Karten und spiele sie. Die Punkte sind Chips mal Mult. Die Pokerhand liefert die Grundwerte, jede gezählte Karte addiert ihre Chips (Ass 11, Bildkarten 10). Joker, Kartenverbesserungen und Mondlicht erhöhen die Werte. Pro Runde hast du nur wenige Hände und Abwürfe.</p>
      <h3>Der Mondzyklus</h3>
      <p>Der Mond durchläuft fünf Phasen: Neumond ♠, Sichelmond ♥, Halbmond ♣, Buckelmond ♦ und Vollmond. Nach jeder gespielten Hand rückt er eine Phase weiter, auch über Runden hinweg.</p>
      <p>Die Farbe der aktuellen Phase leuchtet. Jede gezählte Karte dieser Farbe gibt zusätzlich so viel Mult, wie deine Mondkraft beträgt (zu Beginn +2). Bei Vollmond leuchten alle Farben. Leuchtende Handkarten haben einen hellgelben Rand.</p>
      <p>Hebe deine stärkste Hand für den Vollmond auf. Mit Mondsteinen verschiebst du den Mond, Mondsilber-Karten leuchten immer, und Joker wie der Werwolf leben vom Zyklus. Manche Bosse löschen das Mondlicht oder verlangen es.</p>
      <h3>Shop</h3>
      <p>Nach jeder Blinde bekommst du Geld, dazu $1 Zinsen pro $5 Erspartem (höchstens $5). Im Shop gibt es Joker (höchstens 5, ihre Reihenfolge zählt), Arkana zum Verändern von Karten (erst Handkarten wählen, dann benutzen), Sternbilder zum Leveln von Pokerhänden und Mondsteine.</p>
      <h3>Überspringen</h3>
      <p>Kleine und große Blinden kannst du überspringen. Du bekommst die angezeigte Belohnung, verzichtest aber auf Geld und Shop.</p>
    </div>`;
  }

  // ---------- Rendern ----------
  UI.render = function () {
    tips.clear();
    tipSeq = 0;
    hideTip();
    const hadModal = !!$('#modal .modal-box');
    if (!S) {
      setHTML($('#app'), titleHTML());
    } else {
      const skip = S.phase === 'round' ? '<a class="skip-link" href="#hand" data-act="skip-hand">Zu deinen Karten springen</a>' : '';
      setHTML($('#app'), `${skip}<div class="run phase-${S.phase} ${busy ? 'busy' : ''}">${sideHTML()}<div class="board">${topHTML()}${moonTrackHTML()}<div class="center">${centerHTML()}</div></div></div>${endOverlayHTML()}`);
      animateMoon();
    }
    setHTML($('#modal'), modalHTML());
    if (modal && !hadModal) { const b = $('#modal [data-act="close-modal"].btn'); if (b) b.focus(); }
    if (!modal && hadModal && modalReturn) { const el = $(modalReturn); if (el) el.focus(); modalReturn = null; }
    flushNotices();
    if (!busy) save();
  };

  // Die Markierung gleitet von der alten zur neuen Mondphase.
  function animateMoon() {
    const marker = $('.mt-marker');
    if (!marker) return;
    if (lastMoon !== null && lastMoon !== S.moon && !reducedMotion()) {
      marker.style.transition = 'none';
      marker.style.setProperty('--i', lastMoon);
      void marker.offsetWidth;
      marker.style.transition = '';
      marker.style.setProperty('--i', S.moon);
      const now = $('.mt-moon.now');
      if (now) bump(now, 'arrive');
    }
    lastMoon = S.moon;
  }

  function flushNotices() {
    if (!S) return;
    while (S.notices.length) toast(S.notices.shift());
  }

  function updateHandUI() {
    const p = previewInfo();
    setHTML($('#hp-name'), p ? `${D.HANDS[p.type].name} <small>Level ${p.level}</small>` : '<span class="hp-empty">Keine Karten gewählt</span>');
    $('#hp-chips').textContent = p ? fmt(p.chips) : 0;
    $('#hp-mult').textContent = p ? L.fmtNum(p.mult) : 0;
    const r = S.round;
    const bp = $('[data-act="play"]');
    const bd = $('[data-act="discard"]');
    if (bp) bp.disabled = !(r.selected.length && r.handsLeft > 0);
    if (bd) bd.disabled = !(r.selected.length && r.discardsLeft > 0);
  }

  // ---------- Effekte ----------
  function toast(text, cls) {
    const box = $('#toast');
    const t = document.createElement('div');
    t.className = 'toast-item ' + (cls || '');
    t.textContent = text;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2400);
    setTimeout(() => t.remove(), 2800);
  }

  function popup(el, text, cls) {
    const r = el.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'popup pop-' + cls;
    p.textContent = text;
    p.style.left = r.left + r.width / 2 + 'px';
    p.style.top = r.top + 'px';
    p.style.animationDuration = 900 / settings.speed + 'ms';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900 / settings.speed + 100);
  }

  function bump(el, cls) {
    cls = cls || 'bump';
    el.classList.remove(cls);
    void el.offsetWidth; // Animation neu starten
    el.classList.add(cls);
  }

  function countUp(el, from, to, ms) {
    return new Promise((res) => {
      const t0 = performance.now();
      const dur = ms / settings.speed;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
        else res();
      };
      requestAnimationFrame(step);
    });
  }

  function eventEl(e) {
    if (e.kind === 'card') return $(`#play-area .card[data-uid="${e.ref}"]`);
    if (e.kind === 'held') return $(`#hand .card[data-uid="${e.ref}"]`);
    if (e.kind === 'joker') return $(`.jokers-tray .joker[data-uid="${e.ref}"]`);
    return null;
  }

  function announce(text) {
    const live = $('#sr-live');
    if (live) live.textContent = text;
  }

  // ---------- Spielzüge ----------
  async function doPlay() {
    if (busy || !S || S.phase !== 'round') return;
    const err = G.playError(S);
    if (err) { toast(err, 'bad'); sfx('error'); return; }
    const res = G.beginPlay(S);
    busy = true;
    selJoker = selCons = null;
    playView = { uids: res.played.map((c) => c.uid), scoring: new Set(res.scoring.map((c) => c.uid)) };
    UI.render();
    sfx('play');
    setHTML($('#hp-name'), `${D.HANDS[res.type].name} <small>Level ${res.level}</small>`);
    $('#hp-chips').textContent = fmt(res.baseChips);
    $('#hp-mult').textContent = L.fmtNum(res.baseMult);
    await sleep(450);
    $$('#play-area .card.scoring').forEach((el) => el.classList.add('up'));
    await sleep(250);

    let step = 0;
    for (const e of res.events) {
      const el = eventEl(e);
      if (el) { bump(el); popup(el, e.text, e.cls); }
      if (e.jref) { const je = $(`.jokers-tray .joker[data-uid="${e.jref}"]`); if (je) bump(je); }
      const ch = $('#hp-chips');
      const mu = $('#hp-mult');
      if (ch.textContent !== fmt(e.chips)) { ch.textContent = fmt(e.chips); bump(ch); }
      if (mu.textContent !== L.fmtNum(e.mult)) { mu.textContent = L.fmtNum(e.mult); bump(mu); }
      sfx(e.cls, step++);
      await sleep(e.cls === 'xmult' ? 420 : e.cls === 'moon' ? 340 : 260);
    }
    await sleep(200);

    const hp = $('#hand-panel');
    const before = S.round.score;
    setHTML($('#hp-name'), `<span class="total">${fmt(res.total)}</span> <small>Punkte</small>`);
    hp.classList.add('scored');
    if (before + res.total >= S.round.target) hp.classList.add('enough');
    announce(`${D.HANDS[res.type].name}: ${fmt(res.total)} Punkte`);
    sfx('total');
    await countUp($('#round-score'), before, before + res.total, 600);
    const bar = $('.led-bar > span');
    if (bar) bar.style.width = Math.min(100, ((before + res.total) / S.round.target) * 100) + '%';
    await sleep(450);

    const out = G.resolvePlay(S, res);
    playView = null;
    busy = false;
    if (out.won) sfx('win');
    if (out.lost) { sfx('lose'); recordEnd(false); }
    UI.render();
    const focusEl = $('[data-act="cashout"]') || $('.end-box .btn') || $('#hand .card');
    if (focusEl && document.activeElement === document.body) focusEl.focus({ preventScroll: true });
  }

  async function doDiscard() {
    if (busy || !S || S.phase !== 'round') return;
    const r = S.round;
    if (!r.selected.length) return;
    if (r.discardsLeft <= 0) { toast('Keine Abwürfe mehr in dieser Runde.', 'bad'); sfx('error'); return; }
    busy = true;
    r.selected.forEach((u) => { const el = $(`#hand .card[data-uid="${u}"]`); if (el) el.classList.add('discarding'); });
    sfx('discard');
    await sleep(240);
    busy = false;
    const n = r.selected.length;
    const err = G.discard(S);
    if (err) toast(err, 'bad');
    else announce(`${n} ${n === 1 ? 'Karte' : 'Karten'} abgeworfen`);
    UI.render();
  }

  function newRun(deckId, seed) {
    S = G.newRun(deckId, seed);
    lastMoon = null;
    const p = profile();
    p.runs++;
    store.set(PROFILE_KEY, p);
    modal = null;
    UI.render();
  }

  // ---------- Aktionen ----------
  const actions = {
    'new-run'() {
      const input = $('#seed-input');
      const seed = input ? input.value.trim() : '';
      if (loadSave() && !window.confirm('Neuen Lauf starten? Dein gespeicherter Lauf wird dabei überschrieben.')) return;
      newRun(titleDeck, seed);
    },
    'new-run-same'() { newRun(S ? S.deckId : titleDeck); },
    continue() {
      modal = null;
      lastMoon = null;
      try {
        S = loadSave();
        UI.render();
      } catch (e) {
        // beschädigter oder veralteter Spielstand
        store.del(SAVE_KEY);
        S = null;
        UI.render();
        toast('Der Spielstand ließ sich nicht laden und wurde verworfen.', 'bad');
      }
    },
    'pick-deck'(el) {
      titleDeck = el.dataset.id;
      $$('.deck-opt').forEach((d) => {
        d.classList.toggle('sel', d.dataset.id === titleDeck);
        d.setAttribute('aria-pressed', d.dataset.id === titleDeck);
      });
      $('#deck-desc').textContent = D.DECKS[titleDeck].desc;
    },
    help() { modal = 'help'; UI.render(); },
    'skip-hand'(el, ev) {
      ev.preventDefault();
      const first = $('#hand .card');
      if (first) first.focus();
    },
    'select-blind'() { G.selectBlind(S); sfx('play'); UI.render(); },
    'skip-blind'() { G.skipBlind(S); sfx('buy'); UI.render(); },
    card(el) {
      if (busy) return;
      hideTip();
      const uid = el.dataset.uid;
      const was = S.round.selected.includes(uid);
      if (!G.toggleSelect(S, uid)) { toast('Du kannst höchstens 5 Karten wählen.', 'bad'); sfx('error'); return; }
      sfx(was ? 'deselect' : 'select');
      if (selCons) { UI.render(); const again = $(`#hand .card[data-uid="${uid}"]`); if (again) again.focus(); return; }
      el.classList.toggle('selected', !was);
      el.setAttribute('aria-pressed', String(!was));
      updateHandUI();
    },
    play() { doPlay(); },
    discard() { doDiscard(); },
    sort(el) { if (busy) return; G.setSort(S, el.dataset.mode); UI.render(); },
    joker(el) {
      if (busy) return;
      const u = el.dataset.uid;
      selJoker = selJoker === u ? null : u;
      selCons = null;
      UI.render();
      const again = $(`.jokers-tray .joker[data-uid="${u}"]`);
      if (again) again.focus();
    },
    'sell-joker'(el) {
      if (busy) return;
      G.sellJoker(S, el.dataset.uid);
      selJoker = null;
      sfx('money');
      UI.render();
    },
    'move-joker'(el) {
      if (busy) return;
      const u = el.dataset.uid;
      const dir = el.dataset.dir;
      G.moveJoker(S, u, +dir);
      UI.render();
      const again = $(`.item-menu [data-act="move-joker"][data-dir="${dir}"]`);
      if (again && !again.disabled) again.focus();
    },
    cons(el) {
      if (busy) return;
      const u = el.dataset.uid;
      selCons = selCons === u ? null : u;
      selJoker = null;
      UI.render();
      const again = $(`.cons-tray .cons[data-uid="${u}"]`);
      if (again) again.focus();
    },
    'use-cons'(el) {
      if (busy) return;
      const r = G.useConsumable(S, el.dataset.uid);
      if (r.error) { toast(r.error, 'bad'); sfx('error'); return; }
      selCons = null;
      sfx('use');
      toast(r.msg);
      UI.render();
    },
    'sell-cons'(el) {
      if (busy) return;
      G.sellConsumable(S, el.dataset.uid);
      selCons = null;
      sfx('money');
      UI.render();
    },
    buy(el) {
      const err = G.buyItem(S, +el.dataset.idx);
      if (err) { toast(err, 'bad'); sfx('error'); return; }
      sfx('buy');
      UI.render();
    },
    'buy-pack'(el) {
      const err = G.buyPack(S, +el.dataset.idx);
      if (err) { toast(err, 'bad'); sfx('error'); return; }
      sfx('buy');
      UI.render();
      const first = $('.pack-choice .btn');
      if (first) first.focus();
    },
    'pack-pick'(el) {
      const r = G.pickFromPack(S, +el.dataset.idx);
      if (r.error) { toast(r.error, 'bad'); sfx('error'); return; }
      toast(r.msg);
      sfx('use');
      UI.render();
    },
    'pack-skip'() { G.skipPack(S); UI.render(); },
    reroll() {
      const err = G.reroll(S);
      if (err) { toast(err, 'bad'); sfx('error'); return; }
      sfx('buy');
      UI.render();
    },
    'leave-shop'() { G.leaveShop(S); selJoker = selCons = null; UI.render(); },
    cashout() {
      G.cashOut(S);
      sfx('money');
      if (S.phase === 'victory') { recordEnd(true); sfx('win'); }
      UI.render();
    },
    endless() { G.continueEndless(S); UI.render(); },
    menu() { if (S && S.phase !== 'gameover') save(); S = null; modal = null; UI.render(); },
    abandon() {
      if (!window.confirm('Lauf aufgeben? Er zählt dann als verloren.')) return;
      recordEnd(false);
      store.del(SAVE_KEY);
      S = null;
      modal = null;
      UI.render();
    },
    'show-hands'() { modalReturn = '[data-act="show-hands"]'; modal = 'hands'; UI.render(); },
    'show-deck'() { modalReturn = '[data-act="show-deck"]'; modal = 'deck'; UI.render(); },
    'show-settings'() { modalReturn = '[data-act="show-settings"]'; modal = 'settings'; UI.render(); },
    'close-modal'() { modal = null; UI.render(); },
    speed(el) { settings.speed = +el.dataset.v; store.set(SETTINGS_KEY, settings); UI.render(); },
    'toggle-sound'() { settings.sound = !settings.sound; L.audio.enabled = settings.sound; store.set(SETTINGS_KEY, settings); UI.render(); },
  };

  function onClick(ev) {
    const el = ev.target.closest('[data-act]');
    if (!el) {
      if ((selJoker || selCons) && S && !busy) { selJoker = selCons = null; UI.render(); }
      return;
    }
    if (el.disabled) return;
    const act = el.dataset.act;
    if (act === 'noop') return; // Klick ins Modal-Innere schließt es nicht
    if (act === 'use-cons' && el.dataset.block) { toast(el.dataset.block, 'bad'); sfx('error'); return; }
    const fn = actions[act];
    if (fn) fn(el, ev);
  }

  function onKey(ev) {
    if (ev.target && ev.target.tagName === 'INPUT') return;
    if (ev.key === 'Escape') {
      if (modal) { modal = null; UI.render(); } else if (selJoker || selCons) { selJoker = selCons = null; UI.render(); }
      return;
    }
    if (modal && ev.key === 'Tab') {
      // Fokus im Dialog halten
      const f = $$('#modal button');
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      return;
    }
    if (!S || modal || busy || S.phase !== 'round') return;
    const r = S.round;
    if (/^[1-9]$/.test(ev.key)) {
      const uid = r.hand[+ev.key - 1];
      const el = uid && $(`#hand .card[data-uid="${uid}"]`);
      if (el) actions.card(el);
    } else if (ev.key === 'Enter') {
      // Auf anderen Buttons gilt Enter als Klick; auf Handkarten und sonst spielt es die Hand.
      const control = ev.target && ev.target.closest && ev.target.closest('button, a, input');
      if (control && !control.closest('#hand')) return;
      ev.preventDefault();
      doPlay();
    }
    else if (ev.key === 'd' || ev.key === 'D') doDiscard();
    else if (ev.key === 's' || ev.key === 'S') { G.setSort(S, S.sortMode === 'rank' ? 'suit' : 'rank'); UI.render(); }
  }

  // ---------- Tooltips (Maus und Tastaturfokus) ----------
  let tipEl = null;
  function hideTip() {
    const t = $('#tooltip');
    if (t) t.classList.remove('show');
    tipEl = null;
  }
  function showTipFor(el) {
    if (el === tipEl) return;
    if (!el) { hideTip(); return; }
    const html = tips.get(el.dataset.tip);
    if (!html) { hideTip(); return; }
    tipEl = el;
    const t = $('#tooltip');
    setHTML(t, html);
    t.classList.add('show');
    const r = el.getBoundingClientRect();
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2;
    x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
    let y = r.top - th - 10;
    if (y < 8) y = r.bottom + 10;
    if (y + th > window.innerHeight - 8) y = Math.max(8, window.innerHeight - th - 8);
    t.style.left = x + 'px';
    t.style.top = y + 'px';
  }
  const onOver = (ev) => showTipFor(ev.target.closest('[data-tip]'));
  const onFocus = (ev) => showTipFor(ev.target.closest && ev.target.closest('[data-tip]'));

  UI.init = function () {
    settings = Object.assign(settings, store.get(SETTINGS_KEY) || {});
    L.audio.enabled = settings.sound;
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('focusin', onFocus);
    window.addEventListener('scroll', hideTip, true);
    window.addEventListener('resize', hideTip);
    UI.render();
  };

  // Für Tests/Debugging in der Konsole
  UI.state = () => S;
})(globalThis.LUN = globalThis.LUN || {});
