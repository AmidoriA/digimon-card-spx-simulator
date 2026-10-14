/*
 * Card battle rules engine.
 *
 * Everything here is a port of routines traced in the game code (addresses noted per
 * function): the turn controller state machine at 0x80034260 in SLUS_013.28 and the
 * KAWSEG battle overlay (effect interpreter, support ordering, x-effects, attack
 * resolution, digivolve legality, KO handling). See README.md for the rule summary.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./data/cards.js'));
  else root.DDCB = factory(root.DDCB_DATA);
})(typeof self !== 'undefined' ? self : this, function (DATA) {
  'use strict';

  var CARDS = DATA.cards;
  var HAND_MAX = 4, DP_MAX = 8, DP_CAP = 90, STAT_CAP = 9990, WINS_NEEDED = 3;
  var SPEC = ['Fire', 'Ice', 'Nature', 'Darkness', 'Rare'];
  var LEVEL = ['R', 'A', 'C', 'U'];
  var ATK = ['○', '△', '✕'];
  // x-effect names, in the order of the name table at 0x8006e4bc
  var XFX = ['None', '1st Attack', ATK[0] + ' to 0', ATK[1] + ' to 0', ATK[2] + ' to 0',
    ATK[0] + ' Counter', ATK[1] + ' Counter', ATK[2] + ' Counter', 'Crash', 'Eat-up HP', 'Jamming',
    'Fire Foe x3', 'Ice Foe x3', 'Nature Foe x3', 'Darkness Foe x3', 'Rare Foe x3'];
  // activation tier per x-effect (byte table at 0x8006e4fc)
  var XFX_PRIO = [0, 2, 1, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1, 1, 1, 1];
  var DIGIVOLVE = { SPECIAL: 0, WARP: 1, SPEED: 2, MUTANT: 3, DEVOLVE: 4, DOWNLOAD: 5, ARMOR_CRUSH: 6, DE_ARMOR: 7 };
  // Partner Rookies (table at 0x8006e518) and their armor forms (0x8006e520, 3 per partner).
  // A deck's armor byte (1..3) selects which form its partner can armor digivolve into.
  var PARTNERS = [175, 182, 190, 184, 183, 187];
  var ARMORS = [[172, 185, 173], [179, 188, 0], [189, 176, 0], [181, 178, 0], [180, 174, 0], [186, 177, 0]];

  function card(id) { return CARDS[id]; }
  function floor10(v) { return Math.floor(v / 10) * 10; }

  // ---------------------------------------------------------------- rng
  function makeRng(seed) {
    var s = (seed >>> 0) || 0x9e3779b9;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------------------------------------------------------------- state
  function newPlayer(name, deck, rng) {
    return {
      name: name,
      deck: shuffle(deck.cards.slice(), rng), // top of deck = end of array
      hand: [], offline: [], dp: [],
      armor: deck.armor || 0,
      // active: { stack: [ids, bottom first], armor: armor card id or -1, hp, spec, base: [3 powers], abn }
      active: null,
      wins: 0,
      dpUsed: false, evoStarted: false, evoEnded: false,
      sup: null,          // committed support for this battle: { id, deck: bool }
      b: null             // per-battle scratch, see beginBattle()
    };
  }

  // opts: { names: [a, b], decks: [{cards, armor}, {cards, armor}], first, seed | rng }
  function newGame(opts) {
    var rng = opts.rng || makeRng(opts.seed || (Date.now() & 0xffffffff));
    return {
      rng: rng,
      players: [newPlayer(opts.names[0], opts.decks[0], rng), newPlayer(opts.names[1], opts.decks[1], rng)],
      tp: opts.first != null ? opts.first : (rng() < 0.5 ? 0 : 1), // turn player = first attacker
      turn: 0, tmp: 0, winner: null, winReason: ''
    };
  }

  function clone(G) {
    var H = JSON.parse(JSON.stringify(G, function (k, v) { return k === 'rng' ? undefined : v; }));
    H.rng = Math.random;
    return H;
  }

  function top(P) {
    if (!P.active) return null;
    return card(P.active.armor >= 0 ? P.active.armor : P.active.stack[P.active.stack.length - 1]);
  }
  function dpTotal(P) {
    var t = 0;
    for (var i = 0; i < P.dp.length; i++) t += card(P.dp[i]).pp;
    return Math.min(t, DP_CAP); // 0x8004110c caps the sum at 90
  }
  function handHasDigimon(P) { // 0x80040570
    for (var i = 0; i < P.hand.length; i++) if (card(P.hand[i]).type === 'digimon') return true;
    return false;
  }

  function draw(G, p, n, ev) { // 0x801ec570, one card per call in the original
    var P = G.players[p], got = 0;
    while (got < n && P.deck.length && P.hand.length < HAND_MAX) { P.hand.push(P.deck.pop()); got++; }
    if (ev && got) ev.push({ t: 'draw', p: p, n: got });
    return got;
  }

  // 0x8004080c: HP and attack powers come from the card, shifted right by the entrance
  // penalty (level C entered directly: halved, level U: quartered) and cut to tens. The
  // routine reads the penalty from the Digimon in play, not from the card it is given.
  function entryShift(A) { return Math.max(A.abn - 1, 0); }
  function setStats(P, c, shift) {
    var A = P.active;
    A.spec = c.spec;
    A.hp = floor10(c.hp >> shift);
    A.base = c.atk.map(function (a) { return floor10(a.power >> shift); });
  }

  function lose(G, p, reason) { G.winner = p ^ 1; G.winReason = reason; }

  // ---------------------------------------------------------------- preparation (states 1-0xa)
  // State 3: a turn player with no Digimon in play and no Digimon card in hand must
  // redraw; with an empty Online deck they lose.
  function settle(G, ev) {
    var p = G.tp, P = G.players[p];
    while (G.winner === null && !P.active && !handHasDigimon(P)) {
      if (!P.deck.length) { lose(G, p, 'nocards'); if (ev) ev.push({ t: 'nocards', p: p }); break; }
      changeAllRaw(G, p);
      if (ev) ev.push({ t: 'forced', p: p });
    }
  }
  function changeAllRaw(G, p) { // 0x801ecc58
    var P = G.players[p];
    while (P.hand.length) P.offline.push(P.hand.pop());
    draw(G, p, HAND_MAX);
  }

  // Start the turn player's turn: only they draw (state 2).
  function beginTurn(G, ev) {
    var P = G.players[G.tp];
    G.turn++;
    P.dpUsed = false; P.evoStarted = false; P.evoEnded = false;
    G.players[0].sup = null; G.players[1].sup = null;
    G.players[0].b = null; G.players[1].b = null;
    draw(G, G.tp, HAND_MAX, ev);
    settle(G, ev);
  }

  function canChangeAll(G, p) { return p === G.tp && G.players[p].deck.length > 0; }
  function changeAll(G, p, ev) {
    if (!canChangeAll(G, p)) return false;
    changeAllRaw(G, p);
    settle(G, ev);
    return true;
  }

  // Digimon Entrance (states 8/9): any Digimon card may enter, at a price for C and U.
  function canEnter(G, p, hi) {
    var P = G.players[p], c = card(P.hand[hi]);
    return p === G.tp && !P.active && !!c && c.type === 'digimon';
  }
  function enter(G, p, hi) {
    if (!canEnter(G, p, hi)) return false;
    var P = G.players[p], id = P.hand.splice(hi, 1)[0], c = card(id);
    P.active = { stack: [id], armor: -1, hp: 0, spec: 0, base: [0, 0, 0], abn: c.level & 3 }; // 0x801ea558
    setStats(P, c, entryShift(P.active));
    return true;
  }
  // "Digi-Egg Power-Up": the armor form available to the Digimon that just entered, or -1.
  function armorOption(G, p) {
    var P = G.players[p];
    if (!P.active || P.active.armor >= 0 || P.active.stack.length !== 1 || !P.armor) return -1;
    var k = PARTNERS.indexOf(P.active.stack[0]);
    if (k < 0) return -1;
    return ARMORS[k][P.armor - 1] || -1;
  }
  function armorDigivolve(G, p) { // 0x80040a48
    var id = armorOption(G, p);
    if (id < 0) return false;
    G.players[p].active.armor = id;
    setStats(G.players[p], card(id), 0);
    return true;
  }
  function revertArmor(P) { // 0x80040d88 with the partner's base card
    P.active.armor = -1;
    setStats(P, card(P.active.stack[P.active.stack.length - 1]), 0);
  }

  // ---------------------------------------------------------------- digivolve phase (states 0xb-0x16)
  // Order is fixed by the controller: one card to the DP Slot, then a digivolve option
  // card, then normal digivolution. Using an option card ends the phase.
  function canAddDP(G, p, hi) {
    var P = G.players[p], c = card(P.hand[hi]);
    return p === G.tp && !!P.active && !P.dpUsed && !P.evoStarted && !!c && c.type === 'digimon' && P.dp.length < DP_MAX;
  }
  function addDP(G, p, hi) {
    if (!canAddDP(G, p, hi)) return false;
    var P = G.players[p];
    P.dp.push(P.hand.splice(hi, 1)[0]);
    P.dpUsed = true;
    return true;
  }

  // Legality check, port of 0x801e9f5c. optId = digivolve option card id or -1.
  function evoLegal(P, targetId, optId) {
    var cur = top(P);
    if (!cur) return false;
    var s1 = cur.level, spec = P.active.spec, dp = dpTotal(P);
    var t = targetId >= 0 ? card(targetId) : null;
    if (t && t.type !== 'digimon') return false;
    if (optId < 0) {
      if (!t || s1 === 1) return false;
      if (s1 === 0) s1 = 1;
      return t.spec === spec && t.level === s1 + 1 && dp >= t.dp;
    }
    var o = card(optId);
    if (o.type !== 'digivolve') return false;
    switch (o.dtype) {
      case DIGIVOLVE.SPECIAL:
        if (!t || s1 === 1) return false;
        if (s1 === 0) s1 = 1;
        return t.level === s1 + 1 && dp + 20 >= t.dp;
      case DIGIVOLVE.WARP:
        return !!t && s1 === 0 && t.spec === spec && t.level === 3 && dp >= t.dp;
      case DIGIVOLVE.SPEED: // "not possible in abnormal states": needs a Digimon that entered as R
        if (!t || s1 === 1) return false;
        if (s1 === 0) s1 = 1;
        return P.active.abn === 0 && t.spec === spec && t.level === s1 + 1;
      case DIGIVOLVE.MUTANT:
        return !!t && t.level === s1 && dp >= t.dp;
      case DIGIVOLVE.DEVOLVE:
        return !t && s1 !== 1 && P.active.stack.length >= 2;
      case DIGIVOLVE.DOWNLOAD:
        return !!t;
      case DIGIVOLVE.ARMOR_CRUSH:
        return !!t && s1 === 1 && t.level >= 2 && t.spec === spec && dp >= t.dp;
      case DIGIVOLVE.DE_ARMOR:
        return !t && s1 === 1 && P.active.armor >= 0;
    }
    return false;
  }

  // Digivolve moves open to the turn player right now.
  function evoMoves(G, p) {
    var P = G.players[p], out = [];
    if (p !== G.tp || !P.active || P.evoEnded) return out;
    var h = P.hand, i, j;
    if (!P.evoStarted) {
      for (j = 0; j < h.length; j++) {
        var o = card(h[j]);
        if (o.type !== 'digivolve') continue;
        if (o.dtype === DIGIVOLVE.DEVOLVE || o.dtype === DIGIVOLVE.DE_ARMOR) {
          if (evoLegal(P, -1, h[j])) out.push({ kind: 'option', target: -1, opt: j });
          continue;
        }
        for (i = 0; i < h.length; i++) {
          if (i === j || card(h[i]).type !== 'digimon') continue;
          if (evoLegal(P, h[i], h[j])) out.push({ kind: 'option', target: i, opt: j });
        }
      }
    }
    for (i = 0; i < h.length; i++) {
      if (card(h[i]).type === 'digimon' && evoLegal(P, h[i], -1)) out.push({ kind: 'normal', target: i, opt: -1 });
    }
    return out;
  }

  // A digivolve option card that can do nothing as things stand (0x801ea374: no card in the
  // hand is a legal target for it, or there is nothing to devolve) may still be used. State
  // 0xF asks "This Digivolve Option has no Effect. Do you still want to use it?", and state
  // 0x10 then sends it Offline and goes on to normal digivolution. -> hand indices
  function wasteMoves(G, p) {
    var P = G.players[p], out = [];
    if (p !== G.tp || !P.active || P.evoEnded || P.evoStarted) return out;
    var mv = evoMoves(G, p);
    P.hand.forEach(function (id, j) {
      if (card(id).type === 'digivolve' && !mv.some(function (m) { return m.kind === 'option' && m.opt === j; })) out.push(j);
    });
    return out;
  }
  function wasteOption(G, p, hi) {
    if (wasteMoves(G, p).indexOf(hi) < 0) return false;
    var P = G.players[p];
    P.offline.push(P.hand.splice(hi, 1)[0]);
    P.evoStarted = true; // no second option card, no DP card; normal digivolution is still open
    return true;
  }

  function discardDP(P) { while (P.dp.length) P.offline.push(P.dp.pop()); } // 0x801ece24

  // States 0x10, 0x12, 0x13/0x15.
  function digivolve(G, p, mv) {
    var P = G.players[p];
    if (p !== G.tp || !P.active || P.evoEnded) return false;
    if (mv.kind === 'option' && P.evoStarted) return false;
    var tid = mv.target >= 0 ? P.hand[mv.target] : -1;
    var oid = mv.opt >= 0 ? P.hand[mv.opt] : -1;
    if (!evoLegal(P, tid, oid)) return false;
    [mv.target, mv.opt].filter(function (x) { return x >= 0; }).sort(function (a, b) { return b - a; })
      .forEach(function (x) { P.hand.splice(x, 1); });
    var A = P.active, st = A.stack, dtype = oid >= 0 ? card(oid).dtype : -1;
    if (oid >= 0) P.offline.push(oid);
    // The option cards that change the Digimon clear the entrance penalty before the new
    // stats are set (Digi-devolve at 0x80035f90; state 0x12 at 0x80036788, 0x800368f0 and
    // 0x80036a18). Normal digivolution (states 0x13 and 0x15) goes straight to 0x801ec7c0
    // and De-Armor to 0x80040d88: both leave it. A level C that entered at half strength
    // digivolves into a level U at half strength.
    if (oid >= 0 && dtype !== DIGIVOLVE.DE_ARMOR) A.abn = 0;
    if (dtype === DIGIVOLVE.DEVOLVE) {
      P.offline.push(st.pop());
      setStats(P, card(st[st.length - 1]), 0);
      A.hp = Math.min(A.hp * 2, STAT_CAP); // "HP double when successful"
    } else if (dtype === DIGIVOLVE.DE_ARMOR) {
      revertArmor(P);
    } else {
      if (dtype === DIGIVOLVE.MUTANT) { A.armor = -1; P.offline.push(st.pop()); }
      if (dtype === DIGIVOLVE.DOWNLOAD || dtype === DIGIVOLVE.ARMOR_CRUSH) {
        A.armor = -1;
        while (st.length) P.offline.push(st.pop());
      }
      st.push(tid);
      setStats(P, card(tid), entryShift(A));
      // Speed and Download leave the DP Slot alone; every other digivolution empties it
      if (dtype !== DIGIVOLVE.SPEED && dtype !== DIGIVOLVE.DOWNLOAD) discardDP(P);
    }
    P.evoStarted = true;
    if (oid >= 0) P.evoEnded = true;
    return true;
  }

  // ---------------------------------------------------------------- effect interpreter
  // 0x801e9abc
  function calc(a, mode, b) {
    var v;
    switch (mode) {
      case 0: v = a + b; return v > STAT_CAP ? STAT_CAP : v;
      case 1: v = a - b; return v < 0 ? 0 : v;
      case 2: v = a * b; return v > STAT_CAP ? STAT_CAP : v;
      case 3:
        if (a === 0 || b === 0) return 0;
        v = Math.trunc(a / b); if (v < 10) v = 10;
        return Math.trunc(v / 10) * 10;
    }
    return 0;
  }
  // 0x801e9bac
  function cmp(a, op, b) {
    switch (op) {
      case 0: return a < b;
      case 1: return a <= b;
      case 2: return a > b;
      case 3: return a >= b;
      case 4: return a !== b;
      case 5: return a === b;
    }
    return false;
  }
  // 0x801e7dd4
  function getVar(G, s, o, v, imm, idx) {
    var S = G.players[s], O = G.players[o];
    switch (v) {
      case 0x00: return imm;
      case 0x01: return S.active ? S.active.spec : 0;
      case 0x02: return O.active ? O.active.spec : 0;
      case 0x03: return S.active ? S.active.hp : 0;
      case 0x04: return O.active ? O.active.hp : 0;
      case 0x05: case 0x07: case 0x09: return S.b.atk[(v - 5) >> 1];
      case 0x06: case 0x08: case 0x0a: return O.b.atk[(v - 6) >> 1];
      case 0x0b: return S.b.atk[idx];
      case 0x0c: return O.b.atk[idx];
      case 0x0d: return top(S) ? top(S).level : 0;
      case 0x0e: return top(O) ? top(O).level : 0;
      case 0x11: return S.b.choice;
      case 0x12: return O.b.choice;
      case 0x14: return G.tp !== s ? 1 : 0;
      case 0x15: return S.hand.length;
      case 0x16: return O.hand.length;
      case 0x17: return S.dp.length;
      case 0x18: return O.dp.length;
      case 0x19: return S.offline.length === 0 ? 1 : 0;
      case 0x1a: return G.tmp;
      case 0x1b: return S.deck.length;
      case 0x1c: return O.deck.length;
    }
    // Not the game's: variables for the custom cards (tools/custom_cards.json). 0x40-0x44 the
    // number of cards of Specialty v - 0x40 in the own DP Slot, 0x48-0x4c in the opponent's.
    if (v >= 0x40 && v <= 0x44) return dpOfSpec(S, v - 0x40);
    if (v >= 0x48 && v <= 0x4c) return dpOfSpec(O, v - 0x48);
    // Project effect variable: GrapLeomon's requested zero-power support checks the
    // selected attack, after earlier supports, rather than always checking Circle.
    if (v === 0x50) return S.b ? S.b.atk[S.b.choice] : 0;
    return 0;
  }
  function dpOfSpec(P, spec) {
    return P.dp.filter(function (id) { return card(id).spec === spec; }).length;
  }

  function snap(G) {
    return G.players.map(function (P) {
      return {
        hp: P.active ? P.active.hp : 0, spec: P.active ? P.active.spec : 0,
        atk: P.b ? P.b.atk.slice() : (P.active ? P.active.base.slice() : [0, 0, 0]), choice: P.b ? P.b.choice : 0,
        hand: P.hand.slice(), deck: P.deck.length, dp: P.dp.slice(), offline: P.offline.length, wins: P.wins,
        top: P.active ? top(P).id : -1
      };
    });
  }
  function emit(G, ev, e) { if (ev) { e.s = snap(G); ev.push(e); } }

  function discardRandomHand(G, p, n) {
    var P = G.players[p], k = 0;
    n = Math.min(n, P.hand.length);
    while (k < n) { P.offline.push(P.hand.splice(Math.floor(G.rng() * P.hand.length), 1)[0]); k++; }
    return k;
  }
  function millDeck(P, n) { var k = 0; while (k < n && P.deck.length) { P.offline.push(P.deck.pop()); k++; } return k; }
  function dropDP(P, n) { var k = 0; while (k < n && P.dp.length) { P.offline.push(P.dp.pop()); k++; } return k; }

  // 0x801e81dc
  function exec(G, s, o, op, value, idx, ev) {
    var S = G.players[s], O = G.players[o], k;
    switch (op) {
      case 0x00: if (S.active) S.active.spec = value % 5; emit(G, ev, { t: 'spec', p: s }); break;
      case 0x01: if (O.active) O.active.spec = value % 5; emit(G, ev, { t: 'spec', p: o }); break;
      case 0x02: if (S.active) S.active.hp = value; emit(G, ev, { t: 'hp', p: s }); break;
      case 0x03: if (O.active) O.active.hp = value; emit(G, ev, { t: 'hp', p: o }); break;
      case 0x04: case 0x06: case 0x08: S.b.atk[(op - 4) >> 1] = value; emit(G, ev, { t: 'atk', p: s }); break;
      case 0x05: case 0x07: case 0x09: O.b.atk[(op - 5) >> 1] = value; emit(G, ev, { t: 'atk', p: o }); break;
      case 0x0a: S.b.atk[idx] = value; if (idx === 2) emit(G, ev, { t: 'atk', p: s }); break;
      case 0x0b: O.b.atk[idx] = value; if (idx === 2) emit(G, ev, { t: 'atk', p: o }); break;
      case 0x10: S.b.choice = value & 3; emit(G, ev, { t: 'choice', p: s }); break;
      case 0x11: O.b.choice = value & 3; emit(G, ev, { t: 'choice', p: o }); break;
      case 0x19: G.tmp = value; break;
      case 0x1a: k = discardRandomHand(G, s, value); if (k) emit(G, ev, { t: 'discard', p: s, from: 'hand', n: k }); break;
      case 0x1b: k = discardRandomHand(G, o, value); if (k) emit(G, ev, { t: 'discard', p: o, from: 'hand', n: k }); break;
      case 0x1e: k = 0; while (k < value && S.hand.length) { S.deck.push(S.hand.pop()); k++; } if (k) emit(G, ev, { t: 'return', p: s, n: k }); break;
      case 0x1f: k = 0; while (k < value && O.hand.length) { O.deck.push(O.hand.pop()); k++; } if (k) emit(G, ev, { t: 'return', p: o, n: k }); break;
      case 0x20: k = millDeck(S, value); if (k) emit(G, ev, { t: 'discard', p: s, from: 'deck', n: k }); break;
      case 0x21: k = millDeck(O, value); if (k) emit(G, ev, { t: 'discard', p: o, from: 'deck', n: k }); break;
      case 0x22: k = 0; while (k < value && S.offline.length) { S.deck.push(S.offline.pop()); k++; } if (k) emit(G, ev, { t: 'recycle', p: s, n: k }); break;
      case 0x23: k = 0; while (k < value && O.offline.length) { O.deck.push(O.offline.pop()); k++; } if (k) emit(G, ev, { t: 'recycle', p: o, n: k }); break;
      case 0x24: k = dropDP(S, value); if (k) emit(G, ev, { t: 'discard', p: s, from: 'dp', n: k }); break;
      case 0x25: k = dropDP(O, value); if (k) emit(G, ev, { t: 'discard', p: o, from: 'dp', n: k }); break;
      case 0x2a: shuffle(S.deck, G.rng); emit(G, ev, { t: 'shuffle', p: s }); break;
      case 0x2b: shuffle(O.deck, G.rng); emit(G, ev, { t: 'shuffle', p: o }); break;
      case 0x2c: O.b.voidDigi = true; emit(G, ev, { t: 'void', p: o, all: false }); break;
      case 0x2d: O.b.voidDigi = true; O.b.voidOpt = true; emit(G, ev, { t: 'void', p: o, all: true }); break;
      case 0x2e: // 0x800402cc: first partner Rookie found in the Online deck
        if (S.deck.length && S.hand.length < HAND_MAX) {
          for (k = S.deck.length - 1; k >= 0; k--) {
            if (PARTNERS.indexOf(S.deck[k]) >= 0) {
              S.hand.push(S.deck.splice(k, 1)[0]);
              emit(G, ev, { t: 'draw', p: s, n: 1 });
              break;
            }
          }
        }
        break;
      case 0x2f: O.b.choice = (O.b.choice + 1) % 3; emit(G, ev, { t: 'choice', p: o }); break;
      case 0x30: S.b.revive = true; S.b.reviveHp = value; emit(G, ev, { t: 'flag', p: s, flag: 'revive' }); break;
      case 0x31: k = draw(G, s, value); if (k) emit(G, ev, { t: 'draw', p: s, n: k }); break;
      case 0x32: k = draw(G, o, value); if (k) emit(G, ev, { t: 'draw', p: o, n: k }); break;
      case 0x33: S.b.eatup = true; emit(G, ev, { t: 'flag', p: s, flag: 'eatup' }); break;
      case 0x34: S.b.counter = true; O.b.counter = false; emit(G, ev, { t: 'flag', p: s, flag: 'counter' }); break;
      case 0x35: S.b.first = true; emit(G, ev, { t: 'flag', p: s, flag: 'first' }); break;
      case 0x36: // Project effect: one shared random Specialty for both active Digimon.
        k = Math.floor(G.rng() * SPEC.length);
        if (S.active) S.active.spec = k;
        if (O.active) O.active.spec = k;
        emit(G, ev, { t: 'spec', p: s });
        emit(G, ev, { t: 'spec', p: o });
        break;
    }
  }

  // 0x801e9c1c - returns false when a condition fails
  function runEffect(G, s, o, c, ev) {
    var i, k, x;
    for (i = 0; i < c.conds.length; i++) {
      var cd = c.conds[i], v = [];
      for (k = 0; k < 6; k++) v.push(getVar(G, s, o, cd.v[k], cd.i[k], 0));
      var lhs = calc(calc(v[0], cd.m[0], v[1]), cd.m[1], v[2]);
      var rhs = calc(calc(v[3], cd.m[2], v[4]), cd.m[3], v[5]);
      if (!cmp(lhs, cd.op, rhs)) return false;
    }
    for (i = 0; i < c.acts.length; i++) {
      var a = c.acts[i];
      if (a.op === 0x0a || a.op === 0x0b) {
        var vals = [];
        for (k = 0; k < 3; k++) {
          x = [];
          for (var n = 0; n < 3; n++) x.push(getVar(G, s, o, a.v[k], a.i[k], n));
          vals.push(x);
        }
        for (k = 0; k < 3; k++) exec(G, s, o, a.op, calc(calc(vals[2][k], a.m2, vals[1][k]), a.m1, vals[0][k]), k, ev);
      } else {
        x = [];
        for (k = 0; k < 3; k++) x.push(getVar(G, s, o, a.v[k], a.i[k], 0));
        exec(G, s, o, a.op, calc(calc(x[2], a.m2, x[1]), a.m1, x[0]), 0, ev);
      }
    }
    return true;
  }

  // 0x801e9700 - x-attack special effect of the active Digimon
  function runXfx(G, s, o, fx, ev) {
    var S = G.players[s], O = G.players[o];
    if (fx === 1) S.b.first = true;
    else if (fx >= 2 && fx <= 4) O.b.atk[fx - 2] = 0;
    else if (fx >= 5 && fx <= 7) { if (O.b.choice === fx - 5) { S.b.counter = true; O.b.counter = false; } else return false; }
    else if (fx === 8) S.b.crash = true;
    else if (fx === 9) S.b.eatup = true;
    else if (fx === 10) O.b.voidDigi = true;
    else if (fx >= 11) {
      if (O.active && O.active.spec === fx - 11) S.b.atk[2] = Math.min(S.b.atk[2] * 3, STAT_CAP);
      else return false;
    } else return false;
    return true;
  }

  // ---------------------------------------------------------------- battle (states 0x17-0x25)
  // The opponent has to have a Digimon in play for a Battle Phase to happen (state 0x17).
  function battleOn(G) { return !!G.players[G.tp].active && !!G.players[G.tp ^ 1].active; }

  // Support choice: hand index, 'deck' (unseen top card of the Online deck) or -1 for none.
  // The controller asks the non-turn player first (state 0x1a), then the turn player (0x1d).
  function supportOptions(G, p) {
    var P = G.players[p], out = [];
    for (var i = 0; i < P.hand.length; i++) if (card(P.hand[i]).type !== 'digivolve') out.push(i);
    return { hand: out, deck: P.deck.length > 0 };
  }
  function setSupport(G, p, choice) {
    var P = G.players[p];
    P.sup = null;
    if (choice === 'deck') { if (P.deck.length) P.sup = { id: P.deck.pop(), deck: true }; }
    else if (choice >= 0 && choice < P.hand.length && card(P.hand[choice]).type !== 'digivolve') {
      P.sup = { id: P.hand.splice(choice, 1)[0], deck: false };
    }
    return P.sup;
  }

  function beginBattle(G, attacks) {
    for (var p = 0; p < 2; p++) {
      var P = G.players[p];
      P.b = {
        atk: P.active ? P.active.base.slice() : [0, 0, 0],
        choice: attacks[p], support: P.sup ? P.sup.id : -1,
        first: false, counter: false, voidDigi: false, voidOpt: false,
        crash: false, eatup: false, revive: false, reviveHp: 0
      };
    }
  }

  // Support / x-effect activation followed by the attack exchange (0x801e6aa4).
  // attacks = [attack of player 0, attack of player 1]; supports were set with setSupport().
  function resolveBattle(G, attacks, ev) {
    var f = G.tp, order = [f, f ^ 1], p, i;
    beginBattle(G, attacks);
    var P0 = G.players[0], P1 = G.players[1];
    emit(G, ev, { t: 'reveal', support: [P0.b.support, P1.b.support] });
    // entries 0,1 option supports; 2,3 Digimon supports; 4,5 x-effects (turn player first)
    var ent = [null, null, null, null, null, null];
    for (i = 0; i < 2; i++) {
      p = order[i];
      var sid = G.players[p].b.support;
      if (sid >= 0) {
        var sc = card(sid);
        if (sc.type === 'digimon') ent[2 + i] = { prio: sc.prio, card: sc };
        else if (sc.type === 'option') ent[i] = { prio: sc.prio, card: sc };
      }
      var fx = top(G.players[p]).xfx;
      ent[4 + i] = { prio: XFX_PRIO[fx], fx: fx };
    }
    for (var tier = 3; tier >= 1; tier--) {
      for (i = 0; i < 6; i++) {
        var e = ent[i];
        if (!e || e.prio !== tier) continue;
        p = order[i % 2];
        var B = G.players[p].b;
        if (i < 4) {
          if (i < 2 ? B.voidOpt : B.voidDigi) { emit(G, ev, { t: 'support', p: p, card: e.card.id, ok: false, voided: true }); continue; }
          var mark = ev ? ev.length : 0;
          emit(G, ev, { t: 'support', p: p, card: e.card.id, ok: true });
          if (!runEffect(G, p, p ^ 1, e.card, ev) && ev) { ev[mark].ok = false; }
        } else if (B.choice === 2) {
          var ok = runXfx(G, p, p ^ 1, e.fx, null);
          emit(G, ev, { t: 'xfx', p: p, fx: e.fx, ok: ok });
        }
      }
    }
    if (ev) { // supports whose tier is 0 ("None") are only turned face up afterwards
      for (i = 0; i < 2; i++) {
        p = order[i];
        var s0 = G.players[p].b.support, en = ent[i] || ent[2 + i];
        if (s0 >= 0 && (!en || en.prio === 0)) emit(G, ev, { t: 'support', p: p, card: s0, ok: false, none: true });
      }
    }
    // ---- attack order
    var a = order[0], b = order[1], t;
    var A = G.players[a], Bp = G.players[b];
    if (Bp.b.first) {
      if (!A.b.first) { t = a; a = b; b = t; } else { A.b.first = false; Bp.b.first = false; }
    }
    A = G.players[a]; Bp = G.players[b];
    if (A.b.counter) {
      if (!Bp.b.counter) { A.b.first = false; t = a; a = b; b = t; }
      else { A.b.atk = [0, 0, 0]; Bp.b.atk = [0, 0, 0]; }
    }
    A = G.players[a]; Bp = G.players[b];
    emit(G, ev, { t: 'order', first: a });
    if (Bp.b.counter) {
      Bp.b.atk[Bp.b.choice] = A.b.atk[A.b.choice];
      A.b.atk = [0, 0, 0];
      emit(G, ev, { t: 'counter', p: b });
    }
    if (A.b.crash) {
      if (Bp.b.counter) Bp.b.atk[Bp.b.choice] = A.active.hp; else A.b.atk[2] = A.active.hp;
      A.active.hp = 10;
      emit(G, ev, { t: 'crash', p: a });
    }
    strike(G, a, b, ev);
    if (Bp.active.hp > 0) {
      if (Bp.b.crash) {
        if (!Bp.b.counter) Bp.b.atk[2] = Bp.active.hp;
        if (Bp.b.atk[2] !== 0) Bp.active.hp = 10;
        emit(G, ev, { t: 'crash', p: b });
      }
      strike(G, b, a, ev);
    }
    return afterBattle(G, ev);
  }

  function strike(G, a, d, ev) {
    var A = G.players[a], D = G.players[d];
    var dmg = A.b.atk[A.b.choice], heal = 0;
    if (A.b.eatup) {
      heal = Math.min(dmg, D.active.hp);
      A.active.hp = Math.min(A.active.hp + heal, STAT_CAP);
    }
    D.active.hp = Math.max(D.active.hp - dmg, 0);
    emit(G, ev, { t: 'attack', p: a, attack: A.b.choice, dmg: dmg, heal: heal });
  }

  // 0x801ecf0c: KO of player p's Digimon. Returns true when a KO was scored.
  function knockOut(G, p, ev) {
    var P = G.players[p], O = G.players[p ^ 1];
    if (!P.active || P.active.hp !== 0) return false;
    if (P.b && P.b.revive && O.wins !== 2) { // no revival from the KO that decides the match
      P.active.hp = P.b.reviveHp;
      O.wins++;
      emit(G, ev, { t: 'ko', p: p, how: 'revive' });
    } else {
      // An armor Digimon is first shown dropping back to its Rookie (0x80048150 finds it,
      // effect script 0x1e, 0x80040d88 resets the display); then the same loop as for any
      // other Digimon sends every card in play Offline (0x801ec608).
      var armor = P.active.armor >= 0, rookie = P.active.stack[0];
      while (P.active.stack.length) P.offline.push(P.active.stack.pop());
      P.active = null;
      O.wins++;
      emit(G, ev, armor ? { t: 'ko', p: p, how: 'armor', rookie: rookie } : { t: 'ko', p: p, how: 'out' });
    }
    // state 0x24
    if (O.wins >= WINS_NEEDED) { G.winner = p ^ 1; G.winReason = 'KO'; }
    else if (!P.active && !handHasDigimon(P) && !P.deck.length) { G.winner = p ^ 1; G.winReason = 'nodigimon'; }
    return true;
  }

  function afterBattle(G, ev) {
    // state 0x23 checks the turn player first and the opponent only if that was no KO
    if (!knockOut(G, G.tp, ev)) knockOut(G, G.tp ^ 1, ev);
    return ev;
  }

  // State 0x25: used supports go Offline and the turn passes.
  function endTurn(G) {
    for (var p = 0; p < 2; p++) {
      var P = G.players[p];
      if (P.sup) { P.offline.push(P.sup.id); P.sup = null; }
      P.b = null;
    }
    if (G.winner === null) G.tp ^= 1;
  }

  return {
    DATA: DATA, CARDS: CARDS, card: card, SPEC: SPEC, LEVEL: LEVEL, ATK: ATK, XFX: XFX, DIGIVOLVE: DIGIVOLVE,
    PARTNERS: PARTNERS, ARMORS: ARMORS,
    HAND_MAX: HAND_MAX, DP_MAX: DP_MAX, WINS_NEEDED: WINS_NEEDED,
    makeRng: makeRng, newGame: newGame, clone: clone, top: top, dpTotal: dpTotal, snap: snap, handHasDigimon: handHasDigimon,
    beginTurn: beginTurn, canChangeAll: canChangeAll, changeAll: changeAll,
    canEnter: canEnter, enter: enter, entryShift: entryShift, armorOption: armorOption, armorDigivolve: armorDigivolve,
    canAddDP: canAddDP, addDP: addDP, evoMoves: evoMoves, evoLegal: evoLegal, digivolve: digivolve, wasteMoves: wasteMoves, wasteOption: wasteOption,
    battleOn: battleOn, supportOptions: supportOptions, setSupport: setSupport,
    resolveBattle: resolveBattle, endTurn: endTurn,
    calc: calc, cmp: cmp
  };
});
