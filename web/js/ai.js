/*
 * Computer opponent. This is an original heuristic player (the game's own AI in the
 * SAISEG overlay was not ported). It follows the same decision points the turn
 * controller gives its AI: redraw, entrance, DP card, digivolve, attack, support.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./engine.js'));
  else root.DDCB_AI = factory(root.DDCB);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';

  function power(c, shift) {
    shift = shift || 0;
    return (c.hp >> shift) + (c.atk[0].power >> shift) + (c.atk[1].power >> shift) * 0.6 + (c.atk[2].power >> shift) * 0.4;
  }
  function entryValue(c) { return power(c, Math.max((c.level & 3) - 1, 0)); }

  // The two phase functions make one move each time they are resumed and hand back its
  // description, so that whoever shows the game can let a move finish before the next.

  // Preparation for the turn player: field a Digimon, redrawing first if only
  // penalised (level C / U) cards are in hand and the deck can afford it.
  function* prepSteps(G, p) {
    var P = G.players[p], redraws = 0;
    while (G.winner === null && !P.active) {
      var best = -1, bv = -1, i;
      for (i = 0; i < P.hand.length; i++) {
        if (!E.canEnter(G, p, i)) continue;
        var v = entryValue(E.card(P.hand[i]));
        if (v > bv) { bv = v; best = i; }
      }
      if (best < 0) break;
      var c = E.card(P.hand[best]);
      if (c.level >= 2 && redraws < 2 && P.deck.length >= 12 && E.canChangeAll(G, p)) {
        redraws++;
        E.changeAll(G, p);
        yield P.name + ' changes all cards.';
        continue;
      }
      E.enter(G, p, best);
      yield P.name + ' sends out ' + c.name + (c.level >= 2 ? ' (weakened: level ' + E.LEVEL[c.level] + ' entrance).' : '.');
      if (E.armorOption(G, p) >= 0) {
        E.armorDigivolve(G, p);
        yield c.name + ' armor digivolves to ' + E.top(P).name + '.';
      }
    }
  }
  function prep(G, p) { return Array.from(prepSteps(G, p)); }

  function evoValue(G, p, mv) {
    var P = G.players[p], cur = E.top(P);
    var have = P.active.hp + P.active.base[0] + P.active.base[1] * 0.6 + P.active.base[2] * 0.4;
    if (mv.target < 0) {
      var o = E.card(P.hand[mv.opt]);
      if (o.dtype === E.DIGIVOLVE.DE_ARMOR) return -1;
      // Digi-devolve doubles the lower form's HP: worth it when badly hurt
      var prev = E.card(P.active.stack[P.active.stack.length - 2]);
      return prev.hp * 2 - P.active.hp > cur.hp * 0.6 ? 150 : -1;
    }
    var gain = power(E.card(P.hand[mv.target])) - have;
    if (mv.kind === 'option') gain -= 120; // spends an extra card
    return gain;
  }
  function bestEvo(G, p) {
    var mvs = E.evoMoves(G, p), best = null, bv = 0;
    for (var i = 0; i < mvs.length; i++) {
      var v = evoValue(G, p, mvs[i]);
      if (v > bv) { bv = v; best = mvs[i]; }
    }
    return best;
  }

  function keepValue(G, p, c) {
    var P = G.players[p], cur = E.top(P);
    var lv = cur.level === 0 ? 1 : cur.level;
    if (c.spec === P.active.spec && c.level === lv + 1) return 100;
    if (c.spec === P.active.spec && c.level === lv + 2) return 60;
    if (c.level === 0) return P.active.hp < cur.hp * 0.4 ? 70 : 30;
    return 10;
  }

  function describeEvo(P, mv) {
    var parts = [];
    if (mv.opt >= 0) parts.push('uses ' + E.card(P.hand[mv.opt]).name);
    if (mv.target >= 0) parts.push('digivolves to ' + E.card(P.hand[mv.target]).name);
    return P.name + ' ' + parts.join(' and ') + '.';
  }

  // Digivolve Phase in the controller's order: DP card, option card, digivolution.
  function* digivolveSteps(G, p) {
    var P = G.players[p], i, msg;
    if (!P.active) return;
    var mv = bestEvo(G, p);
    if (!mv) {
      var done = false;
      for (i = 0; i < P.hand.length && !done; i++) { // does one DP card unlock a digivolution?
        if (!E.canAddDP(G, p, i)) continue;
        var H = E.clone(G);
        E.addDP(H, p, i);
        if (bestEvo(H, p)) {
          msg = P.name + ' sends ' + E.card(P.hand[i]).name + ' to the DP Slot.';
          E.addDP(G, p, i);
          yield msg;
          done = true;
        }
      }
      if (!done && E.dpTotal(P) < 60) { // otherwise rack up a card that is of little use
        var pick = -1, pv = 1e9;
        for (i = 0; i < P.hand.length; i++) {
          if (!E.canAddDP(G, p, i)) continue;
          var c = E.card(P.hand[i]);
          var v = keepValue(G, p, c) - c.pp * 0.5;
          if (v < pv) { pv = v; pick = i; }
        }
        if (pick >= 0 && pv <= 25) {
          msg = P.name + ' sends ' + E.card(P.hand[pick]).name + ' to the DP Slot.';
          E.addDP(G, p, pick);
          yield msg;
        }
      }
    }
    var guard = 0;
    while ((mv = bestEvo(G, p)) && guard++ < 4) {
      msg = describeEvo(P, mv);
      E.digivolve(G, p, mv);
      yield msg;
    }
  }
  function digivolvePhase(G, p) { return Array.from(digivolveSteps(G, p)); }

  function evaluate(G0, G1, p) {
    var o = p ^ 1, a0 = G0.players[p], b0 = G0.players[o], a1 = G1.players[p], b1 = G1.players[o];
    var s = 0;
    var won = a1.wins - a0.wins, lost = b1.wins - b0.wins;
    if (won) s += a1.wins >= E.WINS_NEEDED ? 20000 : 2600;
    if (lost) s -= b1.wins >= E.WINS_NEEDED ? 20000 : (a1.active ? 1700 : 2600);
    var myHp0 = a0.active ? a0.active.hp : 0, opHp0 = b0.active ? b0.active.hp : 0;
    var myHp1 = a1.active ? a1.active.hp : 0, opHp1 = b1.active ? b1.active.hp : 0;
    if (!won) s += opHp0 - opHp1;
    if (!lost) s -= myHp0 - myHp1;
    s += 35 * ((a1.hand.length - a0.hand.length) - (b1.hand.length - b0.hand.length));
    s += 60 * ((a1.dp.length - a0.dp.length) - (b1.dp.length - b0.dp.length));
    s += 12 * ((a1.deck.length - a0.deck.length) - (b1.deck.length - b0.deck.length));
    return s;
  }

  function foeWeights(G, o) {
    var c = E.top(G.players[o]), base = G.players[o].active.base, w = [], t = 0;
    for (var k = 0; k < 3; k++) { w[k] = base[k] + 150 + (k === 2 && c.xfx ? 250 : 0); t += w[k]; }
    return w.map(function (x) { return x / t; });
  }

  function expected(G, p, attack, support) {
    var o = p ^ 1, w = foeWeights(G, o), total = 0;
    for (var b = 0; b < 3; b++) {
      var H = E.clone(G), atk = [];
      if (support !== undefined) E.setSupport(H, p, support);
      atk[p] = attack; atk[o] = b;
      E.resolveBattle(H, atk, null);
      total += evaluate(G, H, p) * w[b];
    }
    return total;
  }

  function noise(skill) { return (Math.random() - 0.5) * (40 + (1 - (skill == null ? 0.8 : skill)) * 900); }

  // Attacks are chosen by both players before any support card is played.
  function chooseAttack(G, p, skill) {
    var best = 0, bv = -1e9;
    for (var a = 0; a < 3; a++) {
      var v = expected(G, p, a) + noise(skill);
      if (v > bv) { bv = v; best = a; }
    }
    return best;
  }

  // Support choice for player p, who has already picked `attack`. When p is the turn
  // player the opponent's support is already committed in G and is taken into account.
  function chooseSupport(G, p, attack, skill) {
    var opts = E.supportOptions(G, p), cand = [-1].concat(opts.hand);
    var best = -1, bv = -1e9;
    for (var i = 0; i < cand.length; i++) {
      var v = expected(G, p, attack, cand[i]) + noise(skill);
      if (v > bv) { bv = v; best = cand[i]; }
    }
    return best;
  }

  return { prep: prep, prepSteps: prepSteps, digivolvePhase: digivolvePhase, digivolveSteps: digivolveSteps, chooseAttack: chooseAttack, chooseSupport: chooseSupport };
});
