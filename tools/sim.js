// Headless AI-vs-AI soak test for the rules engine. Usage: node tools/sim.js [games] [--strict-ai]
const path = require('path');
const E = require(path.join(__dirname, '..', 'web', 'js', 'engine.js'));
const AI = require(path.join(__dirname, '..', 'web', 'js', 'ai.js'));

const games = parseInt(process.argv[2] || '200', 10);
const strictAI = process.argv.includes('--strict-ai');
// AI noise and cloned hypothetical states also use Math.random, independently of G.rng.
// Seed that stream so a failing soak can be reproduced without changing live gameplay.
Math.random = E.makeRng(1000);
const decks = E.DATA.decks;
const stats = { wins: [0, 0], reasons: {}, turns: 0, maxTurns: 0, battles: 0, noBattle: 0, support: 0, voided: 0, failed: 0, xfx: 0, ko: {}, armor: 0, timeouts: 0, staleExplorations: 0 };

function check(G) {
  for (const P of G.players) {
    const n = P.deck.length + P.hand.length + P.offline.length + P.dp.length + (P.active ? P.active.stack.length : 0) + (P.sup ? 1 : 0);
    if (n !== 30) throw new Error('card count ' + n + ' for ' + P.name + ' on turn ' + G.turn);
    if (P.hand.length > E.HAND_MAX || P.dp.length > E.DP_MAX) throw new Error('zone overflow');
    if (P.active && (!Number.isInteger(P.active.hp) || P.active.hp < 0 || P.active.hp > 9990)) throw new Error('bad hp ' + P.active.hp);
  }
}

for (let g = 0; g < games; g++) {
  const d0 = decks[(g * 7) % decks.length], d1 = decks[(g * 13 + 5) % decks.length];
  const G = E.newGame({ names: ['A:' + d0.name, 'B:' + d1.name], decks: [d0, d1], seed: 1000 + g });
  let guard = 0, unchanged = 0, lastPosition = '';
  while (G.winner === null && guard++ < 400) {
    E.beginTurn(G);
    if (G.winner !== null) break;
    const t = G.tp, o = t ^ 1;
    AI.prep(G, t);
    if (G.winner !== null) break;
    if (!G.players[t].active) throw new Error('turn player has no Digimon after preparation');
    if (G.players[t].active.armor >= 0) stats.armor++;
    AI.digivolvePhase(G, t);
    check(G);
    if (E.battleOn(G)) {
      stats.battles++;
      const position = JSON.stringify(G.players.map(P => [P.deck, P.hand, P.offline, P.dp, P.active, P.wins]));
      unchanged = position === lastPosition ? unchanged + 1 : 0;
      lastPosition = position;
      const atk = [AI.chooseAttack(G, 0, 0.9), AI.chooseAttack(G, 1, 0.9)];
      // Original MegaSeadramon mirrors can both prefer their zero-power Circle Counter
      // forever. This soak exercises another legal attack after 20 identical positions;
      // the engine and the live AI are unchanged, and interventions remain visible.
      if (!strictAI && unchanged >= 20) { atk[0] = stats.staleExplorations % 3; stats.staleExplorations++; }
      E.setSupport(G, o, AI.chooseSupport(G, o, atk[o], 0.9));
      E.setSupport(G, t, AI.chooseSupport(G, t, atk[t], 0.9));
      const ev = E.resolveBattle(G, atk, []);
      for (const e of ev) {
        if (e.t === 'support' && !e.none) { stats.support++; if (e.voided) stats.voided++; else if (!e.ok) stats.failed++; }
        if (e.t === 'xfx' && e.ok) stats.xfx++;
        if (e.t === 'ko') stats.ko[e.how] = (stats.ko[e.how] || 0) + 1;
      }
    } else stats.noBattle++;
    check(G);
    E.endTurn(G);
  }
  if (G.winner === null) {
    stats.timeouts++;
    console.error('timeout: ' + JSON.stringify({ game: g, seed: 1000+g, decks: [d0.name,d1.name], players: G.players }));
  }
  else stats.wins[G.winner]++;
  stats.reasons[G.winReason] = (stats.reasons[G.winReason] || 0) + 1;
  stats.turns += G.turn; stats.maxTurns = Math.max(stats.maxTurns, G.turn);
}
stats.avgTurns = +(stats.turns / games).toFixed(1);
console.log(JSON.stringify(stats));
if (stats.timeouts) process.exitCode = 1;
