// Spot checks of the rules engine against behaviour traced in the game code.
// Usage: node tools/selftest.js
const path = require('path');
const assert = require('assert');
const E = require(path.join(__dirname, '..', 'web', 'js', 'engine.js'));
const AI = require(path.join(__dirname, '..', 'web', 'js', 'ai.js'));

const byName = (n) => { const c = E.CARDS.find((x) => x.name === n); assert(c, 'no card ' + n); return c.id; };
const C = (n) => E.card(byName(n));
const filler = byName('Agumon');

// Fixed position: each side gets an active Digimon (entered as-is, full stats), a hand and a DP slot.
function setup(a, b, opts) {
  opts = opts || {};
  const G = E.newGame({
    names: ['A', 'B'], seed: 7, first: opts.first || 0,
    decks: [{ cards: Array(30).fill(filler), armor: a.armor || 0 }, { cards: Array(30).fill(filler), armor: b.armor || 0 }]
  });
  [a, b].forEach((s, p) => {
    const P = G.players[p];
    if (s.mon) {
      const c = C(s.mon);
      P.active = { stack: [c.id], armor: -1, hp: s.hp || c.hp, spec: c.spec, base: c.atk.map((x) => x.power), abn: 0 };
    }
    P.hand = (s.hand || []).map(byName);
    P.dp = (s.dp || []).map(byName);
    if (s.deck) P.deck = s.deck.map(byName);
    if (s.wins) P.wins = s.wins;
  });
  return G;
}
// a/b: { attack, support } with support = hand index, 'deck' or -1
function fight(G, a, b) {
  const t = G.tp, ch = [a, b];
  E.setSupport(G, t ^ 1, ch[t ^ 1].support);
  E.setSupport(G, t, ch[t].support);
  const ev = E.resolveBattle(G, [a.attack, b.attack], []);
  return { ev, hp: G.players.map((P) => (P.active ? P.active.hp : 0)), atk: ev.filter((e) => e.t === 'attack') };
}
const none = (attack) => ({ attack, support: -1 });
let n = 0;
function test(name, fn) { fn(); n++; console.log('ok  ' + name); }

// ------------------------------------------------------------------ turn structure
test('turn start: only the turn player draws; no battle while the opponent has no Digimon', () => {
  const G = E.newGame({ names: ['A', 'B'], seed: 3, first: 0, decks: [{ cards: Array(30).fill(filler) }, { cards: Array(30).fill(filler) }] });
  E.beginTurn(G);
  assert.strictEqual(G.players[0].hand.length, 4);
  assert.strictEqual(G.players[1].hand.length, 0);
  assert(E.enter(G, 0, 0));
  assert.strictEqual(E.battleOn(G), false);
  E.endTurn(G);
  assert.strictEqual(G.tp, 1);
  E.beginTurn(G);
  assert.strictEqual(G.players[1].hand.length, 4);
  assert.strictEqual(G.players[0].hand.length, 3, 'the other player does not refill');
});

test('no Digimon card in hand: forced redraw, and a loss once the Online deck is empty', () => {
  let G = setup({ hand: [], deck: ['Agumon', 'Attack Chip', 'Attack Chip', 'Attack Chip', 'Attack Chip'] }, { mon: 'Gabumon' });
  const ev = [];
  E.beginTurn(G, ev);
  assert(ev.some((e) => e.t === 'forced'));
  assert.strictEqual(G.winner, null);
  assert(E.handHasDigimon(G.players[0]));
  G = setup({ hand: [], deck: ['Attack Chip', 'Attack Chip'] }, { mon: 'Gabumon' });
  E.beginTurn(G);
  assert.strictEqual(G.winner, 1);
  assert.strictEqual(G.winReason, 'nocards');
});

test('entrance: any level may enter; C is halved, U quartered (cut to tens)', () => {
  const G = setup({ hand: ['Greymon', 'WarGreymon', 'Agumon'] }, { mon: 'Gabumon' });
  const g = C('Greymon'), w = C('WarGreymon');
  let H = E.clone(G); E.enter(H, 0, 0);
  assert.strictEqual(H.players[0].active.hp, Math.floor((g.hp >> 1) / 10) * 10);
  assert.deepStrictEqual(H.players[0].active.base, g.atk.map((a) => Math.floor((a.power >> 1) / 10) * 10));
  H = E.clone(G); E.enter(H, 0, 1);
  assert.strictEqual(H.players[0].active.hp, Math.floor((w.hp >> 2) / 10) * 10);
  H = E.clone(G); E.enter(H, 0, 2);
  assert.strictEqual(H.players[0].active.hp, C('Agumon').hp);
  assert.strictEqual(E.canEnter(G, 1, 0), false, 'only the turn player');
});

test('armor: the partner Rookie of an armor deck powers up on entrance; a KO sends the Rookie Offline', () => {
  const G = setup({ hand: ['Veemon'], armor: 2 }, { mon: 'Imperialdramon' });
  E.enter(G, 0, 0);
  assert.strictEqual(E.card(E.armorOption(G, 0)).name, 'Raidramon');
  assert(E.armorDigivolve(G, 0));
  assert.strictEqual(E.top(G.players[0]).name, 'Raidramon');
  assert.strictEqual(G.players[0].active.hp, C('Raidramon').hp);
  const r = fight(G, none(0), none(0));
  const ko = r.ev.find((e) => e.t === 'ko');
  assert.strictEqual(ko.how, 'armor');
  assert.strictEqual(E.card(ko.rookie).name, 'Veemon');
  assert.strictEqual(G.players[0].active, null, 'nothing stays in play');
  assert.deepStrictEqual(G.players[0].offline.map((id) => E.card(id).name), ['Veemon']);
  assert.strictEqual(G.players[1].wins, 1);
});

test('a digivolve option card with no effect can still be used and is lost (0x801ea374, state 0x10)', () => {
  const G = setup({ mon: 'Agumon', hand: ['Greymon', 'Agumon', 'Digi-devolve', 'Speed Digivolve'] }, { mon: 'Gabumon' });
  assert.deepStrictEqual(E.wasteMoves(G, 0), [2], 'nothing to devolve; Speed Digivolve has a target');
  assert.strictEqual(E.wasteOption(G, 0, 3), false, 'a card that has an effect cannot be thrown away');
  assert(E.wasteOption(G, 0, 2));
  const P = G.players[0];
  assert.strictEqual(P.hand.length, 3);
  assert.strictEqual(E.card(P.offline[P.offline.length - 1]).name, 'Digi-devolve');
  assert.strictEqual(E.evoMoves(G, 0).some((m) => m.kind === 'option'), false, 'no second option card');
  assert.strictEqual(E.wasteMoves(G, 0).length, 0);
  assert.strictEqual(E.canAddDP(G, 0, 1), false);
});

test('the opponent names a move before it makes it, so its effect can play first', () => {
  const G = setup({ mon: 'Agumon', hand: ['Greymon'], dp: ['Agumon', 'Agumon'] }, { mon: 'Gabumon' });
  const steps = AI.digivolveSteps(G, 0);
  let it = steps.next();
  assert(/digivolves to Greymon/.test(it.value), String(it.value));
  assert.strictEqual(E.top(G.players[0]).name, 'Agumon', 'not yet');
  it = steps.next();
  assert.strictEqual(E.top(G.players[0]).name, 'Greymon');
  assert(it.done);
});

test('the opponent sends a card to the DP Slot every turn, up to what the next stage can ask for', () => {
  const names = (ids) => ids.map((id) => E.card(id).name);
  let G = setup({ mon: 'Agumon', hand: ['Greymon', 'MetalGreymon', 'Biyomon', 'Biyomon'] }, { mon: 'Gabumon' });
  const P = G.players[0];
  AI.digivolvePhase(G, 0);
  assert.deepStrictEqual(names(P.dp), ['Biyomon'], 'the card of least use; Greymon (DP 40) is kept');
  assert.strictEqual(E.top(P).name, 'Agumon');
  P.dpUsed = false; // next turn
  const said = AI.digivolvePhase(G, 0);
  assert(/Biyomon to the DP Slot/.test(said[0]) && /digivolves to Greymon/.test(said[1]), said.join(' '));
  assert.strictEqual(E.top(P).name, 'Greymon', 'DP 40 reached: digivolves in the same phase');

  G = setup({ mon: 'Agumon', hand: ['Biyomon'], dp: ['Agumon', 'Agumon'], deck: ['Greymon', 'WarGreymon'] }, { mon: 'Gabumon' });
  AI.digivolvePhase(G, 0);
  assert.strictEqual(G.players[0].dp.length, 2, 'DP 40 is all a level C in this deck asks for');
  G = setup({ mon: 'Agumon', hand: ['Biyomon'], dp: ['Agumon'], deck: ['Greymon', 'WarGreymon'] }, { mon: 'Gabumon' });
  AI.digivolvePhase(G, 0);
  assert.strictEqual(G.players[0].dp.length, 2, 'DP 20 is short of it, with the level C still in the deck');

  G = setup({ mon: 'Agumon', hand: ['Greymon', 'Speed Digivolve', 'Biyomon'], deck: ['WarGreymon'] }, { mon: 'Gabumon' });
  AI.digivolvePhase(G, 0);
  assert.strictEqual(E.top(G.players[0]).name, 'Greymon');
  assert.deepStrictEqual(names(G.players[0].dp), ['Biyomon'], 'Speed keeps the DP Slot: the card is for WarGreymon');

  G = setup({ mon: 'Agumon', hand: ['Greymon', 'Biyomon'], dp: ['Agumon', 'Agumon'] }, { mon: 'Gabumon' });
  AI.digivolvePhase(G, 0);
  assert.strictEqual(G.players[0].hand.length, 1, 'no card for a DP Slot the digivolution is about to empty');
  G = setup({ mon: 'MetalGreymon', hand: ['Biyomon'] }, { mon: 'Gabumon' });
  AI.digivolvePhase(G, 0);
  assert.strictEqual(G.players[0].dp.length, 0, 'level U has no next stage');
});

test('digivolve phase: one DP card, before digivolving; an option card ends the phase', () => {
  const G = setup({ mon: 'Agumon', hand: ['Greymon', 'Agumon', 'Agumon', 'Speed Digivolve'] }, { mon: 'Gabumon' });
  assert(E.addDP(G, 0, 1));
  assert.strictEqual(E.canAddDP(G, 0, 1), false, 'second DP card refused');
  const mv = E.evoMoves(G, 0).find((m) => m.kind === 'option');
  assert(mv, 'Speed Digivolve usable');
  assert(E.digivolve(G, 0, mv));
  assert.strictEqual(E.top(G.players[0]).name, 'Greymon');
  assert.strictEqual(G.players[0].dp.length, 1, 'Speed keeps the DP Slot');
  assert.strictEqual(E.evoMoves(G, 0).length, 0);
  assert.strictEqual(E.canAddDP(G, 0, 0), false);
});

test('digivolve legality (0x801e9f5c) and DP handling', () => {
  const G = setup({ mon: 'Agumon', hand: ['Greymon', 'Garurumon', 'MetalGreymon'], dp: ['Agumon'] }, { mon: 'Gabumon' });
  const P = G.players[0];
  assert.strictEqual(E.evoLegal(P, byName('Greymon'), -1), E.dpTotal(P) >= C('Greymon').dp);
  assert.strictEqual(E.evoLegal(P, byName('Garurumon'), -1), false, 'wrong Specialty');
  assert.strictEqual(E.evoLegal(P, byName('MetalGreymon'), -1), false, 'cannot skip a level');
  assert.strictEqual(E.evoLegal(P, byName('Greymon'), byName('Speed Digivolve')), true, 'Speed ignores DP');
  assert.strictEqual(E.evoLegal(P, byName('Garurumon'), byName('Download Digivolve')), true);
  P.active.abn = 2;
  assert.strictEqual(E.evoLegal(P, byName('Greymon'), byName('Speed Digivolve')), false, 'not in an abnormal state');
  P.active.abn = 0;
  P.dp = ['Agumon', 'Agumon', 'Agumon'].map(byName);
  const mv = E.evoMoves(G, 0).find((m) => m.kind === 'normal');
  assert(E.digivolve(G, 0, mv));
  assert.strictEqual(E.top(P).name, 'Greymon');
  assert.strictEqual(P.active.hp, C('Greymon').hp, 'full HP of the new card');
  assert.strictEqual(P.dp.length, 0, 'DP Slot emptied');
});

test('entrance penalty: kept by normal digivolution, cleared by an option card (0x8004080c, states 0x10-0x15)', () => {
  const dp = ['Agumon', 'Agumon', 'Agumon'];
  let G = setup({ hand: ['Greymon', 'WarGreymon'], dp }, { mon: 'Gabumon' });
  let P = G.players[0];
  assert(E.enter(G, 0, 0));
  assert.strictEqual(P.active.hp, 420, 'level C enters at half strength, cut to tens');
  assert(E.digivolve(G, 0, E.evoMoves(G, 0).find((m) => m.kind === 'normal')));
  assert.strictEqual(E.top(P).name, 'WarGreymon');
  assert.strictEqual(P.active.hp, 820, 'the level U it digivolves into is halved too');
  assert.deepStrictEqual(P.active.base, [450, 330, 190]);
  assert.strictEqual(P.active.abn, 2, 'still in the abnormal state');

  P.evoStarted = false; P.evoEnded = false; // next turn
  P.hand = [byName('Digi-devolve')];
  assert(E.digivolve(G, 0, E.evoMoves(G, 0)[0]));
  assert.strictEqual(P.active.hp, C('Greymon').hp * 2, 'Digi-devolve clears it: full HP, doubled');
  assert.deepStrictEqual(P.active.base, C('Greymon').atk.map((x) => x.power));
  assert.strictEqual(P.active.abn, 0);

  G = setup({ hand: ['Greymon', 'WarGreymon', 'Special Digivolve'], dp }, { mon: 'Gabumon' });
  P = G.players[0];
  assert(E.enter(G, 0, 0));
  assert(E.digivolve(G, 0, E.evoMoves(G, 0).find((m) => m.kind === 'option')));
  assert.strictEqual(E.top(P).name, 'WarGreymon');
  assert.strictEqual(P.active.hp, C('WarGreymon').hp, 'an option card clears it: full strength');
  assert.deepStrictEqual(P.active.base, C('WarGreymon').atk.map((x) => x.power));
  assert.strictEqual(P.active.abn, 0);
});

test('Digi-devolve: back one level with double HP', () => {
  const G = setup({ mon: 'Agumon', hand: ['Digi-devolve'] }, { mon: 'Gabumon' });
  G.players[0].active.stack.push(byName('Greymon'));
  const mv = E.evoMoves(G, 0)[0];
  assert(mv && mv.target === -1);
  E.digivolve(G, 0, mv);
  assert.strictEqual(E.top(G.players[0]).name, 'Agumon');
  assert.strictEqual(G.players[0].active.hp, C('Agumon').hp * 2);
});

// ------------------------------------------------------------------ battle
test('calc: divide rounds down to tens, floors at 10, caps at 9990', () => {
  assert.strictEqual(E.calc(1230, 3, 2), 610);
  assert.strictEqual(E.calc(15, 3, 2), 10);
  assert.strictEqual(E.calc(0, 3, 2), 0);
  assert.strictEqual(E.calc(9000, 0, 5000), 9990);
  assert.strictEqual(E.calc(100, 1, 300), 0);
});

test('plain exchange: the turn player strikes first, the turn passes at end of turn', () => {
  const G = setup({ mon: 'Agumon' }, { mon: 'Gabumon' }, { first: 1 });
  const r = fight(G, none(0), none(1));
  assert.deepStrictEqual(r.atk.map((e) => e.p), [1, 0]);
  assert.strictEqual(r.atk[1].dmg, C('Agumon').atk[0].power);
  E.endTurn(G);
  assert.strictEqual(G.tp, 0);
});

test('Imperialdramon support: + (DP cards x100) to every attack', () => {
  const G = setup({ mon: 'Agumon', hand: ['Imperialdramon'], dp: ['Agumon', 'Agumon', 'Agumon'] }, { mon: 'Gabumon' });
  const r = fight(G, { attack: 1, support: 0 }, none(0));
  assert.strictEqual(r.atk[0].dmg, C('Agumon').atk[1].power + 300);
});

test('Metallic Banana: own HP halved (tens), opponent attack 0', () => {
  const G = setup({ mon: 'Paildramon', hand: ['Metallic Banana'] }, { mon: 'Gabumon' });
  const r = fight(G, { attack: 0, support: 0 }, none(0));
  assert.strictEqual(r.atk[1] ? r.atk[1].dmg : 0, 0);
  assert.strictEqual(r.hp[0], 610);
});

test('support from the top of the Online deck uses that card\'s own tier', () => {
  const G = setup({ mon: 'Agumon', deck: ['Attack Chip'] }, { mon: 'Gabumon' });
  const r = fight(G, { attack: 0, support: 'deck' }, none(0));
  assert.strictEqual(r.atk[0].dmg, C('Agumon').atk[0].power + 300);
  E.endTurn(G);
  assert.strictEqual(G.players[0].offline.length, 1);
});

test('counter: named attack misses, counter-er strikes second with that power', () => {
  const G = setup({ mon: 'Imperialdramon' }, { mon: 'WarGreymon' });
  const r = fight(G, none(2), none(0));
  assert.deepStrictEqual(r.atk.map((e) => [e.p, e.dmg]), [[1, 0], [0, C('WarGreymon').atk[0].power]]);
  const G2 = setup({ mon: 'Imperialdramon' }, { mon: 'WarGreymon' });
  const r2 = fight(G2, none(2), none(1));
  assert.deepStrictEqual([r2.atk[0].p, r2.atk[0].dmg], [0, 0], 'no trigger against another attack');
});

test('x3: triples x power only against the named Specialty', () => {
  const wg = C('WarGreymon');
  assert.strictEqual(E.XFX[wg.xfx], 'Ice Foe x3');
  assert.strictEqual(fight(setup({ mon: 'WarGreymon' }, { mon: 'Gabumon' }), none(2), none(0)).atk[0].dmg, wg.atk[2].power * 3);
  assert.strictEqual(fight(setup({ mon: 'WarGreymon' }, { mon: 'Agumon' }), none(2), none(0)).atk[0].dmg, wg.atk[2].power);
});

test('Crash / Eat-up / 1st Attack x-effects', () => {
  const crash = E.CARDS.find((c) => c.xfx === 8), eat = E.CARDS.find((c) => c.xfx === 9), fst = E.CARDS.find((c) => c.xfx === 1);
  let r = fight(setup({ mon: crash.name }, { mon: 'Imperialdramon' }), none(2), none(1));
  assert.strictEqual(r.atk[0].dmg, crash.hp, 'crash power = HP');
  assert.strictEqual(r.hp[0], Math.max(10 - r.atk[1].dmg, 0));
  r = fight(setup({ mon: eat.name, hp: 100 }, { mon: 'Imperialdramon' }), none(2), none(2));
  assert.strictEqual(r.atk[0].heal, eat.atk[2].power);
  r = fight(setup({ mon: 'Agumon' }, { mon: fst.name }), none(0), none(2));
  assert.strictEqual(r.atk[0].p, 1, '1st Attack overrides turn order');
});

test('void tiers: "support voided" stops Digimon supports but not option cards', () => {
  const voider = E.CARDS.find((c) => c.type === 'digimon' && c.conds.length === 0 && c.acts.length === 1 && c.acts[0].op === 0x2c);
  const base = C('Agumon').atk[0].power;
  let r = fight(setup({ mon: 'Agumon', hand: [voider.name] }, { mon: 'Agumon', hand: ['RealMetalGreymon'] }), { attack: 0, support: 0 }, { attack: 0, support: 0 });
  assert.strictEqual(r.atk[1].dmg, base, 'Digimon support voided');
  r = fight(setup({ mon: 'Agumon', hand: [voider.name] }, { mon: 'Agumon', hand: ['Attack Chip'] }), { attack: 0, support: 0 }, { attack: 0, support: 0 });
  assert.strictEqual(r.atk[1].dmg, base + 300, 'option card still works');
  r = fight(setup({ mon: 'Agumon', hand: ["Cherrymon's Mist"] }, { mon: 'Agumon', hand: ['Attack Chip'] }), { attack: 0, support: 0 }, { attack: 0, support: 0 });
  assert.strictEqual(r.atk[1].dmg, base, "Cherrymon's Mist voids options too");
});

test('revive: the KO still scores, but there is no revival from the deciding KO', () => {
  let G = setup({ mon: 'Agumon', hp: 10, hand: ['Phoenixmon'] }, { mon: 'Imperialdramon' });
  fight(G, { attack: 0, support: 0 }, none(0));
  assert.strictEqual(G.players[1].wins, 1);
  assert.strictEqual(G.players[0].active.hp, 500);
  G = setup({ mon: 'Agumon', hp: 10, hand: ['Phoenixmon'] }, { mon: 'Imperialdramon', wins: 2 });
  fight(G, { attack: 0, support: 0 }, none(0));
  assert.strictEqual(G.players[0].active, null);
  assert.strictEqual(G.winner, 1);
  assert.strictEqual(G.winReason, 'KO');
});

test('after a KO: no Digimon in play, none in hand and an empty deck ends the match', () => {
  const G = setup({ mon: 'Agumon', hp: 10, hand: ['Attack Chip'], deck: [] }, { mon: 'Imperialdramon' });
  fight(G, none(0), none(0));
  assert.strictEqual(G.winner, 1);
  assert.strictEqual(G.winReason, 'nodigimon');
});

test('custom cards follow the 301 cards of the game and leave them as they are', () => {
  assert.strictEqual(E.card(300).name, 'Digi-devolve');
  const own = E.CARDS.filter((c) => c.custom != null);
  assert.deepStrictEqual(own.map((c) => c.id), own.map((c, k) => 301 + k));
  own.forEach((c) => { assert.strictEqual(c.type, 'digimon'); assert.ok(E.card(c.custom).custom == null && c.custom < 191); });
  assert.strictEqual(E.CARDS.filter((c) => c.custom == null).length, 301);
});

test('custom decks follow the 159 decks of the game; Black Fire Again is Black Fire Heart with BlackWarGreymon', () => {
  const decks = E.DATA.decks, own = decks.filter((d) => d.custom != null);
  assert.strictEqual(decks.filter((d) => d.custom == null).length, 159);
  assert.deepStrictEqual(own.map((d) => d.id), own.map((d, k) => 159 + k));
  decks.forEach((d, k) => assert.strictEqual(d.id, k));
  const again = decks.find((d) => d.name === 'Black Fire Again'), heart = decks[again.custom];
  assert.deepStrictEqual([heart.name, heart.owner, again.owner], ['Black Fire Heart', 'BK WarGreymon', 'BK WarGreymon']);
  assert.ok(heart.cards.includes(byName('WarGreymon')) && !heart.cards.includes(byName('BlackWarGreymon')));
  assert.deepStrictEqual(again.cards, heart.cards.map((id) => (id === byName('WarGreymon') ? byName('BlackWarGreymon') : id)));
  assert.deepStrictEqual([again.rank, again.armor, again.bgm, again.bgm3d], [heart.rank, heart.armor, heart.bgm, heart.bgm3d]);
});

test('BlackWarGreymon (custom): +200 for each Darkness card in the own DP Slot; x3 against Nature', () => {
  const bw = C('BlackWarGreymon'), dark = E.CARDS.filter((c) => c.type === 'digimon' && c.spec === 3).map((c) => c.name);
  assert.deepStrictEqual([E.SPEC[bw.spec], E.LEVEL[bw.level], bw.dp, bw.pp], ['Fire', 'U', 60, 20]);
  // two Darkness cards and one Fire card in the own DP Slot, three Darkness cards in the opponent's
  const G = setup({ mon: 'Agumon', hand: ['BlackWarGreymon'], dp: [dark[0], 'Agumon', dark[1]] }, { mon: 'Gabumon', dp: dark.slice(0, 3) });
  const r = fight(G, { attack: 1, support: 0 }, none(0));
  assert.strictEqual(r.atk[0].dmg, C('Agumon').atk[1].power + 400);
  assert.strictEqual(fight(setup({ mon: 'Agumon', hand: ['BlackWarGreymon'] }, { mon: 'Gabumon' }), { attack: 0, support: 0 }, none(0)).atk[0].dmg, C('Agumon').atk[0].power);
  assert.strictEqual(E.XFX[bw.xfx], 'Nature Foe x3');
  assert.strictEqual(fight(setup({ mon: 'BlackWarGreymon' }, { mon: 'Patamon' }), none(2), none(0)).atk[0].dmg, bw.atk[2].power * 3);
  assert.strictEqual(fight(setup({ mon: 'BlackWarGreymon' }, { mon: 'Gabumon' }), none(2), none(0)).atk[0].dmg, bw.atk[2].power);
});

test('data quirk kept: comparison op 0xFF never passes (Aquilamon)', () => {
  const r = fight(setup({ mon: 'Agumon', hand: ['Aquilamon'] }, { mon: 'Gabumon' }), { attack: 1, support: 0 }, none(0));
  assert.strictEqual(r.ev.find((e) => e.t === 'support').ok, false);
});

test('music: a deck that names a board track names one for the 3D battle, and both are rendered (0x801f1aa8)', () => {
  const fs = require('fs'), web = path.join(__dirname, '..', 'web');
  const decks = require(path.join(web, 'js', 'data', 'cards.js')).decks;
  const text = fs.readFileSync(path.join(web, 'js', 'data', 'audio.js'), 'utf8');
  const bgm = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)).bgm;
  const pairs = new Set(['143,147', '144,148']);          // the free battle's: 0x8f / 0x93 + rand % 2
  decks.forEach((d) => {
    assert.strictEqual(!d.bgm, !d.bgm3d, d.name);
    if (d.bgm) pairs.add(d.bgm + ',' + d.bgm3d);
  });
  assert.deepStrictEqual([...pairs].sort(), ['143,147', '144,148', '46,37', '47,44']);
  [37, 44, 46, 47, 143, 144, 147, 148].forEach((id) => {
    assert.ok(bgm[id], 'no loop points for track ' + id);
    assert.ok(fs.existsSync(path.join(web, 'assets', 'audio', 'bgm', String(id).padStart(3, '0') + '.ogg')), 'no file for track ' + id);
  });
});

console.log(n + ' checks passed');
