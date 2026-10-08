// Spielablauf: Lauf, Blinden, Runden, Shop, Packs. Der gesamte Zustand ist JSON-serialisierbar.
(function (L) {
  'use strict';
  const D = L.data;
  const C = L.cons;
  const G = (L.game = {});

  // ---------- Lauf ----------
  G.newRun = function (deckId, seedStr) {
    deckId = D.DECKS[deckId] ? deckId : 'nacht';
    const seed = (seedStr || L.randomSeed()).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || L.randomSeed();
    const s = {
      version: 1,
      seed,
      rng: L.hashSeed(seed),
      nextUid: 1,
      deckId,
      ante: 1,
      blindIndex: 0,
      blindStates: ['current', 'upcoming', 'upcoming'],
      bossId: null,
      skipRewards: [],
      usedBosses: [],
      money: 4,
      baseHands: 4,
      baseDiscards: 3,
      baseHandSize: 8,
      jokerSlots: 5,
      consSlots: 2,
      moon: 0,
      mondkraft: 2,
      groove: 0,
      fever: 0,
      cards: {},
      jokers: [],
      consumables: [],
      handLevels: {},
      phase: 'blind',
      round: null,
      shop: null,
      pack: null,
      cashout: null,
      sortMode: 'rank',
      notices: [],
      endless: false,
      won: false,
      stats: { handsPlayed: 0, bestHand: 0, bestHandType: null, arkanaUsed: 0, roundsWon: 0, discards: 0, cardsPlayed: 0, moneyEarned: 0, fevers: 0 },
    };
    D.HAND_ORDER.forEach((h) => (s.handLevels[h] = { level: 1, played: 0 }));

    const suits = deckId === 'zwielicht' ? ['S', 'H', 'S', 'H'] : D.SUITS;
    suits.forEach((suit) => D.RANKS.forEach((rank) => G.addCard(s, { rank, suit, enh: null })));
    if (deckId === 'glut') s.baseDiscards += 1;
    if (deckId === 'gezeiten') s.baseHands += 1;
    if (deckId === 'gold') s.money += 10;
    if (deckId === 'silber') s.mondkraft += 2;

    G.newAnte(s);
    return s;
  };

  G.notice = (s, text) => s.notices.push(text);

  G.addCard = function (s, c) {
    const card = { uid: L.uid(s), rank: c.rank, suit: c.suit, enh: c.enh || null };
    s.cards[card.uid] = card;
    return card;
  };

  G.destroyCard = function (s, uid) {
    delete s.cards[uid];
    const r = s.round;
    if (!r) return;
    ['draw', 'hand', 'discard', 'play', 'selected', 'faceDown'].forEach((k) => (r[k] = r[k].filter((u) => u !== uid)));
  };

  G.deckSize = (s) => Object.keys(s.cards).length;

  // ---------- Ante & Blinden ----------
  G.anteBase = function (ante) {
    if (ante <= D.FINAL_ANTE) return D.BLIND_BASE[ante - 1];
    return L.round2(D.BLIND_BASE[D.FINAL_ANTE - 1] * Math.pow(1.8, ante - D.FINAL_ANTE));
  };

  G.newAnte = function (s) {
    const isFinal = s.ante % D.FINAL_ANTE === 0;
    let pool = Object.keys(D.BOSSES).filter((id) => {
      const b = D.BOSSES[id];
      return !!b.final === isFinal && (b.minAnte || 1) <= s.ante;
    });
    const fresh = pool.filter((id) => !s.usedBosses.includes(id));
    if (fresh.length) pool = fresh;
    s.bossId = L.pick(s, pool);
    s.usedBosses.push(s.bossId);
    const rewards = Object.keys(D.SKIP_REWARDS);
    s.skipRewards = [L.pick(s, rewards), L.pick(s, rewards)];
    s.blindStates = ['current', 'upcoming', 'upcoming'];
  };

  G.blindInfo = function (s, idx) {
    const base = G.anteBase(s.ante);
    if (idx < 2) {
      const b = D.BLINDS[idx];
      return { name: b.name, target: Math.floor(base * b.mult), reward: b.reward, isBoss: false, boss: null };
    }
    const boss = D.BOSSES[s.bossId];
    const mult = boss.targetMult != null ? boss.targetMult : 2;
    return { name: boss.name, target: Math.floor(base * mult), reward: boss.final ? 8 : D.BOSS_REWARD, isBoss: true, boss };
  };

  G.passive = function (s, key) {
    return s.jokers.reduce((a, j) => a + ((L.jokers[j.id].passive || {})[key] || 0), 0);
  };

  G.handSize = function (s) {
    const boss = L.activeBoss(s);
    return Math.max(1, s.baseHandSize + G.passive(s, 'handSize') + (boss && boss.handSize ? boss.handSize : 0));
  };

  G.selectBlind = function (s) {
    if (s.phase !== 'blind') return;
    const info = G.blindInfo(s, s.blindIndex);
    const boss = info.boss;
    let hands = s.baseHands + G.passive(s, 'hands');
    let discards = s.baseDiscards + G.passive(s, 'discards');
    if (boss && boss.hands != null) hands = boss.hands;
    if (boss && boss.discards != null) discards = boss.discards;
    s.round = {
      name: info.name,
      blindIndex: s.blindIndex,
      target: info.target,
      reward: info.reward,
      isBoss: info.isBoss,
      bossId: boss ? s.bossId : null,
      score: 0,
      handsLeft: hands,
      discardsLeft: discards,
      handsPlayed: 0,
      typesPlayed: [],
      lockedType: null,
      draw: L.shuffle(s, Object.keys(s.cards)),
      hand: [],
      discard: [],
      play: [],
      selected: [],
      faceDown: [],
    };
    if (boss && boss.startMoon != null) s.moon = boss.startMoon;
    s.phase = 'round';
    G.draw(s);
  };

  G.skipBlind = function (s) {
    if (s.phase !== 'blind' || s.blindIndex >= 2) return;
    const rid = s.skipRewards[s.blindIndex];
    G.applySkipReward(s, rid);
    s.blindStates[s.blindIndex] = 'skipped';
    G.nextBlind(s);
  };

  G.applySkipReward = function (s, rid) {
    const name = D.SKIP_REWARDS[rid].name;
    if (rid === 'gold') { s.money += 10; G.notice(s, `${name}: +$10`); }
    else if (rid === 'mondsegen') { s.mondkraft += 1; G.notice(s, `${name}: Mondkraft ${s.mondkraft}`); }
    else if (rid === 'geschenk') {
      if (s.jokers.length < s.jokerSlots) {
        const j = G.addJoker(s, G.randomJokerId(s, L.rand(s) < 0.8 ? 1 : 2));
        G.notice(s, `${name}: ${L.jokers[j.id].name}`);
      } else { s.money += 5; G.notice(s, `${name}: Kein Joker-Platz frei, dafür +$5`); }
    } else if (rid === 'sternregen') {
      const best = D.HAND_ORDER.slice().sort((a, b) => s.handLevels[b].played - s.handLevels[a].played || D.HAND_ORDER.indexOf(b) - D.HAND_ORDER.indexOf(a))[0];
      G.levelUp(s, best, 2);
      G.notice(s, `${name}: ${D.HANDS[best].name} → Level ${s.handLevels[best].level}`);
    } else if (rid === 'arkanum') {
      if (s.consumables.length < s.consSlots) {
        const id = G.randomConsId(s, 'arkana');
        G.addConsumable(s, 'arkana', id);
        G.notice(s, `${name}: ${C.arkana[id].name}`);
      } else G.notice(s, `${name}: Dein Vorrat ist voll, die Karte verfällt`);
    }
  };

  G.nextBlind = function (s) {
    s.blindIndex++;
    if (s.blindIndex > 2) {
      s.ante++;
      s.blindIndex = 0;
      G.newAnte(s);
    } else {
      s.blindStates[s.blindIndex] = 'current';
    }
    s.phase = 'blind';
  };

  // ---------- Runde ----------
  G.sortHand = function (s) {
    const r = s.round;
    const key = (u) => {
      const c = s.cards[u];
      if (c.enh === 'stone') return -1000;
      const so = 'SHCD'.indexOf(c.suit);
      return s.sortMode === 'suit' ? (4 - so) * 100 + c.rank : c.rank * 10 + (4 - so);
    };
    r.hand.sort((a, b) => key(b) - key(a));
  };

  G.draw = function (s) {
    const r = s.round;
    const boss = L.activeBoss(s);
    const size = G.handSize(s);
    while (r.hand.length < size && r.draw.length) {
      const u = r.draw.pop();
      r.hand.push(u);
      if (boss === D.BOSSES.maske && L.isFace(s.cards[u])) r.faceDown.push(u);
    }
    G.sortHand(s);
  };

  G.setSort = function (s, mode) {
    s.sortMode = mode;
    if (s.round) G.sortHand(s);
  };

  G.toggleSelect = function (s, uid) {
    const r = s.round;
    if (!r || s.phase !== 'round' || !r.hand.includes(uid)) return false;
    const i = r.selected.indexOf(uid);
    if (i >= 0) { r.selected.splice(i, 1); return true; }
    if (r.selected.length >= 5) return false;
    r.selected.push(uid);
    return true;
  };

  G.selectedCards = function (s) {
    const r = s.round;
    if (!r) return [];
    return r.hand.filter((u) => r.selected.includes(u)).map((u) => s.cards[u]);
  };

  G.previewHand = function (s) {
    const cards = G.selectedCards(s);
    if (!cards.length) return null;
    const ev = L.evaluateHand(cards);
    return Object.assign({ type: ev.type }, L.handBase(s, ev.type));
  };

  G.playError = function (s) {
    const r = s.round;
    if (!r || s.phase !== 'round') return 'Gerade nicht möglich';
    if (!r.selected.length) return 'Wähle zuerst Karten aus';
    if (r.handsLeft <= 0) return 'Keine Hände mehr';
    const boss = L.activeBoss(s);
    if (!boss) return null;
    const type = L.evaluateHand(G.selectedCards(s)).type;
    if (boss === D.BOSSES.zwang && r.selected.length !== 5) return 'Der Zwang: Es müssen genau 5 Karten gespielt werden';
    if (boss === D.BOSSES.auge && r.typesPlayed.includes(type)) return `Das Auge: ${D.HANDS[type].name} wurde bereits gespielt`;
    if (boss === D.BOSSES.mund && r.lockedType && r.lockedType !== type) return `Der Mund: Nur ${D.HANDS[r.lockedType].name} ist erlaubt`;
    return null;
  };

  // Phase 1: Karten auf den Tisch, Punkte berechnen (für die Animation)
  G.beginPlay = function (s) {
    const err = G.playError(s);
    if (err) return { error: err };
    const r = s.round;
    const uids = r.hand.filter((u) => r.selected.includes(u));
    r.hand = r.hand.filter((u) => !uids.includes(u));
    r.selected = [];
    r.faceDown = r.faceDown.filter((u) => !uids.includes(u));
    r.play = uids;
    const played = uids.map((u) => s.cards[u]);
    const held = r.hand.map((u) => s.cards[u]);
    const res = L.scoreHand(s, played, held);
    r.handsLeft--;
    return res;
  };

  // Phase 2: Ergebnis übernehmen, Mond weiter, nachziehen
  G.resolvePlay = function (s, res) {
    const r = s.round;
    const boss = L.activeBoss(s);
    r.score += res.total;
    s.money += res.money;
    s.handLevels[res.type].played++;
    s.stats.handsPlayed++;
    s.stats.cardsPlayed += res.played.length;
    if (res.total > s.stats.bestHand) { s.stats.bestHand = res.total; s.stats.bestHandType = res.type; }
    r.handsPlayed++;
    r.typesPlayed.push(res.type);
    if (boss === D.BOSSES.mund && !r.lockedType) r.lockedType = res.type;

    res.broken.forEach((c) => G.destroyCard(s, c.uid));
    r.discard.push(...r.play.filter((u) => s.cards[u]));
    r.play = [];

    if (boss === D.BOSSES.zahn) {
      s.money -= res.played.length;
      G.notice(s, `Der Zahn: −$${res.played.length}`);
    }

    G.advanceMoon(s, boss && boss.moonStep != null ? boss.moonStep : 1);
    const feverStart = G.updateGroove(s, res);

    if (r.score >= r.target) {
      G.endRound(s);
      return { won: true, feverStart };
    }
    if (r.handsLeft <= 0) {
      s.phase = 'gameover';
      return { lost: true, feverStart };
    }
    if (boss === D.BOSSES.haken && r.hand.length) {
      for (let i = 0; i < 2 && r.hand.length; i++) {
        const u = r.hand.splice(L.randInt(s, r.hand.length), 1)[0];
        r.discard.push(u);
        r.faceDown = r.faceDown.filter((x) => x !== u);
      }
      G.notice(s, 'Der Haken: 2 Karten abgeworfen');
    }
    G.draw(s);
    return { feverStart };
  };

  // Groove-O-Meter: liefert true, wenn gerade das Disco-Fieber ausbricht
  G.updateGroove = function (s, res) {
    if (res.feverUsed) {
      s.fever = Math.max(0, (s.fever || 0) - 1);
      return false;
    }
    const pts = D.groovePoints(res.total / s.round.target);
    s.groove = pts ? Math.min(D.GROOVE_MAX, (s.groove || 0) + pts) : 0;
    if (s.groove < D.GROOVE_MAX) return false;
    s.groove = 0;
    s.fever = D.FEVER_HANDS;
    s.stats.fevers = (s.stats.fevers || 0) + 1;
    return true;
  };

  G.discard = function (s) {
    const r = s.round;
    if (!r || s.phase !== 'round') return 'Gerade nicht möglich';
    if (!r.selected.length) return 'Wähle zuerst Karten zum Abwerfen aus';
    if (r.discardsLeft <= 0) return 'Keine Abwürfe mehr';
    const uids = r.hand.filter((u) => r.selected.includes(u));
    const cards = uids.map((u) => s.cards[u]);
    r.hand = r.hand.filter((u) => !uids.includes(u));
    r.faceDown = r.faceDown.filter((u) => !uids.includes(u));
    r.discard.push(...uids);
    r.selected = [];
    r.discardsLeft--;
    s.stats.discards++;
    s.jokers.forEach((j) => {
      const d = L.jokers[j.id];
      if (d.onDiscard) d.onDiscard(s, cards, j);
    });
    if (s.jokers.some((j) => L.jokers[j.id].moonOnDiscard)) G.advanceMoon(s, 1);
    G.draw(s);
    return null;
  };

  G.advanceMoon = function (s, steps) {
    for (let i = 0; i < steps; i++) {
      s.moon = (s.moon + 1) % D.MOON.length;
      L.forEachJoker(s, (def, inst, own) => {
        if (!def.onMoon) return;
        const m = def.onMoon(s, s.moon, inst);
        if (m) { s.money += m; G.notice(s, `${L.jokers[own.id].name}: +$${m}`); }
      });
    }
  };

  G.endRound = function (s) {
    const r = s.round;
    const lines = [{ label: `${r.name} besiegt`, value: r.reward }];
    if (r.handsLeft > 0) lines.push({ label: `Verbleibende Hände (${r.handsLeft} × $1)`, value: r.handsLeft });
    const gold = r.hand.filter((u) => s.cards[u].enh === 'gold' && !L.isDebuffed(s, s.cards[u])).length;
    if (gold) lines.push({ label: `Goldkarten in der Hand (${gold} × $3)`, value: gold * 3 });
    L.forEachJoker(s, (def, inst, own) => {
      if (!def.onRoundEnd) return;
      const m = def.onRoundEnd(s, inst);
      if (m) lines.push({ label: L.jokers[own.id].name, value: m });
    });
    const interest = Math.min(5, Math.floor(Math.max(0, s.money) / 5));
    if (interest) lines.push({ label: 'Zinsen ($1 pro $5, max. $5)', value: interest });
    s.cashout = { lines, total: lines.reduce((a, l) => a + l.value, 0), score: r.score, target: r.target };
    s.blindStates[s.blindIndex] = 'done';
    s.stats.roundsWon++;
    s.phase = 'cashout';
  };

  G.cashOut = function (s) {
    if (s.phase !== 'cashout') return;
    s.money += s.cashout.total;
    s.stats.moneyEarned += s.cashout.total;
    s.cashout = null;
    const wasBoss = s.round && s.round.isBoss;
    s.round = null;
    if (wasBoss && s.ante === D.FINAL_ANTE && !s.endless) {
      s.won = true;
      s.phase = 'victory';
      return;
    }
    G.openShop(s);
  };

  G.continueEndless = function (s) {
    s.endless = true;
    G.openShop(s);
  };

  // ---------- Joker & Verbrauchskarten ----------
  G.randomJokerId = function (s, rarity, exclude) {
    exclude = exclude || [];
    const owned = s.jokers.map((j) => j.id).concat(exclude);
    rarity = rarity || L.weighted(s, [[1, 70], [2, 25], [3, 5]]);
    for (let r = rarity; r >= 1; r--) {
      const pool = L.jokerList().filter((d) => d.rarity === r && !owned.includes(d.id));
      if (pool.length) return L.pick(s, pool).id;
    }
    return L.pick(s, L.jokerList()).id;
  };

  G.rollEdition = (s) => {
    const x = L.rand(s);
    return x < 0.012 ? 'poly' : x < 0.04 ? 'holo' : x < 0.08 ? 'foil' : null;
  };

  G.addJoker = function (s, id, edition) {
    const j = { uid: L.uid(s), id, edition: edition || null, data: L.jokers[id].data() };
    s.jokers.push(j);
    return j;
  };

  G.randomConsId = function (s, kind) {
    if (kind === 'stern') {
      const pool = Object.keys(C.stern).filter((h) => !D.HANDS[h].secret || s.handLevels[h].played > 0);
      return L.pick(s, pool);
    }
    if (kind === 'mond') return L.weighted(s, Object.values(C.mond).map((m) => [m.id, m.weight]));
    return L.pick(s, Object.keys(C[kind]));
  };

  G.addConsumable = function (s, kind, id) {
    const c = { uid: L.uid(s), kind, id };
    s.consumables.push(c);
    return c;
  };

  G.levelUp = function (s, hand, n) {
    s.handLevels[hand].level += n;
  };

  G.sellJoker = function (s, uid) {
    const i = s.jokers.findIndex((j) => j.uid === uid);
    if (i < 0) return;
    s.money += L.jokerSellValue(s.jokers[i]);
    s.jokers.splice(i, 1);
  };

  G.moveJoker = function (s, uid, dir) {
    const i = s.jokers.findIndex((j) => j.uid === uid);
    const k = i + dir;
    if (i < 0 || k < 0 || k >= s.jokers.length) return;
    const t = s.jokers[i]; s.jokers[i] = s.jokers[k]; s.jokers[k] = t;
  };

  G.consSellValue = (c) => Math.max(1, Math.floor(C.get(c).cost / 2));

  G.sellConsumable = function (s, uid) {
    const i = s.consumables.findIndex((c) => c.uid === uid);
    if (i < 0) return;
    s.money += G.consSellValue(s.consumables[i]);
    s.consumables.splice(i, 1);
  };

  // Gibt null zurück, wenn benutzbar, sonst einen Grund.
  G.consumableBlock = function (s, item) {
    const d = C.get(item);
    if (d.min) {
      if (s.phase !== 'round' || !s.round) return 'Nur während einer Runde mit ausgewählten Handkarten';
      const n = s.round.selected.length;
      if (n < d.min || n > d.max) return d.min === d.max ? `Wähle genau ${d.min} Karten aus` : `Wähle ${d.min}–${d.max} Karten aus`;
    }
    if (d.canUse) {
      // Der benutzte Gegenstand selbst gibt seinen Platz frei
      s.consumables = s.consumables.filter((c) => c !== item);
      const ok = d.canUse(s);
      s.consumables.push(item);
      if (ok !== true) return ok;
    }
    return null;
  };

  G.useConsumable = function (s, uid) {
    const item = s.consumables.find((c) => c.uid === uid);
    if (!item) return { error: 'Nicht gefunden' };
    const block = G.consumableBlock(s, item);
    if (block) return { error: block };
    const d = C.get(item);
    const cards = d.min ? G.selectedCards(s) : [];
    s.consumables = s.consumables.filter((c) => c !== item);
    const msg = d.use(s, cards);
    if (item.kind === 'arkana') s.stats.arkanaUsed++;
    if (s.round) {
      s.round.selected = [];
      G.sortHand(s);
    }
    return { msg: msg || d.name };
  };

  // ---------- Shop ----------
  G.openShop = function (s) {
    s.shop = { items: [G.shopItem(s, []), null], packs: [G.shopPack(s), G.shopPack(s)], rerollCost: 5 };
    s.shop.items[1] = G.shopItem(s, [s.shop.items[0]]);
    s.phase = 'shop';
  };

  G.shopItem = function (s, others) {
    const kind = L.weighted(s, [['joker', 60], ['arkana', 16], ['stern', 16], ['mond', 8]]);
    if (kind === 'joker') {
      const exclude = others.filter((o) => o && o.kind === 'joker').map((o) => o.id);
      const id = G.randomJokerId(s, null, exclude);
      const edition = G.rollEdition(s);
      const item = { kind, id, edition, sold: false };
      item.price = L.jokerCost(item);
      return item;
    }
    const id = G.randomConsId(s, kind);
    return { kind, id, price: C[kind][id].cost, sold: false };
  };

  G.shopPack = function (s) {
    const id = L.weighted(s, [['arkana', 26], ['stern', 26], ['karten', 20], ['joker', 14], ['mond', 14]]);
    return { id, price: C.PACKS[id].cost, sold: false };
  };

  G.reroll = function (s) {
    const sh = s.shop;
    if (!sh || s.pack) return 'Gerade nicht möglich';
    if (s.money < sh.rerollCost) return 'Nicht genug Geld';
    s.money -= sh.rerollCost;
    sh.rerollCost++;
    sh.items = [G.shopItem(s, [])];
    sh.items.push(G.shopItem(s, sh.items));
    return null;
  };

  G.buyItem = function (s, idx) {
    const item = s.shop && s.shop.items[idx];
    if (!item || item.sold || s.pack) return 'Gerade nicht möglich';
    if (s.money < item.price) return 'Nicht genug Geld';
    if (item.kind === 'joker') {
      if (s.jokers.length >= s.jokerSlots) return 'Alle Joker-Plätze sind belegt. Verkaufe zuerst einen Joker.';
      G.addJoker(s, item.id, item.edition);
    } else {
      if (s.consumables.length >= s.consSlots) return 'Dein Vorrat ist voll. Verkaufe oder benutze zuerst eine Karte.';
      G.addConsumable(s, item.kind, item.id);
    }
    s.money -= item.price;
    item.sold = true;
    return null;
  };

  G.randomPlayingCard = function (s) {
    const c = { rank: L.pick(s, D.RANKS), suit: L.pick(s, D.SUITS), enh: null };
    if (L.rand(s) < 0.4) c.enh = L.weighted(s, [['bonus', 5], ['mult', 5], ['wild', 3], ['glass', 2], ['steel', 2], ['gold', 2], ['stone', 2], ['silver', 3]]);
    return c;
  };

  G.buyPack = function (s, idx) {
    const p = s.shop && s.shop.packs[idx];
    if (!p || p.sold || s.pack) return 'Gerade nicht möglich';
    if (s.money < p.price) return 'Nicht genug Geld';
    s.money -= p.price;
    p.sold = true;
    const def = C.PACKS[p.id];
    const choices = [];
    for (let i = 0; i < def.choices; i++) {
      if (p.id === 'karten') choices.push({ kind: 'card', card: G.randomPlayingCard(s) });
      else if (p.id === 'joker') {
        const id = G.randomJokerId(s, null, choices.map((c) => c.id));
        choices.push({ kind: 'joker', id, edition: G.rollEdition(s) });
      } else {
        let id;
        let guard = 0;
        do { id = G.randomConsId(s, p.id); } while (choices.some((c) => c.id === id) && guard++ < 20);
        choices.push({ kind: p.id, id });
      }
    }
    s.pack = { id: p.id, choices };
    return null;
  };

  G.pickFromPack = function (s, idx) {
    const pk = s.pack;
    const ch = pk && pk.choices[idx];
    if (!ch) return { error: 'Gerade nicht möglich' };
    let msg;
    if (ch.kind === 'card') {
      G.addCard(s, ch.card);
      msg = 'Karte zum Deck hinzugefügt';
    } else if (ch.kind === 'joker') {
      if (s.jokers.length >= s.jokerSlots) return { error: 'Alle Joker-Plätze sind belegt. Verkaufe zuerst einen Joker.' };
      G.addJoker(s, ch.id, ch.edition);
      msg = `${L.jokers[ch.id].name} erhalten`;
    } else if (ch.kind === 'stern') {
      msg = C.stern[ch.id].use(s);
    } else {
      if (s.consumables.length >= s.consSlots) return { error: 'Dein Vorrat ist voll. Verkaufe oder benutze zuerst eine Karte.' };
      G.addConsumable(s, ch.kind, ch.id);
      msg = `${C[ch.kind][ch.id].name} erhalten`;
    }
    s.pack = null;
    return { msg };
  };

  G.skipPack = function (s) {
    s.pack = null;
  };

  G.leaveShop = function (s) {
    if (s.phase !== 'shop' || s.pack) return;
    s.shop = null;
    G.nextBlind(s);
  };
})(globalThis.LUN = globalThis.LUN || {});
