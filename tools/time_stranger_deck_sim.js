// Directed, reproducible theme AI coverage beyond the standard 200-match soak.
// Usage: node tools/time_stranger_deck_sim.js
const assert=require('assert');
const path=require('path');
const E=require(path.join(__dirname,'..','web','js','engine.js'));
const AI=require(path.join(__dirname,'..','web','js','ai.js'));
const {verify,checkState,plan}=require('./time_stranger_deck_test.js');
const installedCount=15;
const originalRandom=Math.random;
verify(installedCount);
const originals=E.DATA.decks.slice(0,159);
// One mixed deck for each Specialty: at least two Specialties, with the selected one dominant.
const opponents=Array.from({length:5},(_,spec)=>originals.filter(d=>{
  const mons=d.cards.map(E.card).filter(c=>c.type==='digimon');
  const counts=Array.from({length:5},(_,s)=>mons.filter(c=>c.spec===s).length);
  return new Set(mons.map(c=>c.spec)).size>=2 && counts[spec]>=8 && counts[spec]===Math.max(...counts);
}).sort((a,b)=>b.cards.filter(id=>E.card(id).level===3).length-a.cards.filter(id=>E.card(id).level===3).length || a.id-b.id)[0]);
opponents.forEach((d,s)=>assert(d,'mixed opponent for Specialty '+s));
const result={games:0,timeouts:0,maxTurns:0,battles:0,evolutions:0,opponents:opponents.map(d=>({id:d.id,name:d.name})),decks:[]};
for(const [index,row] of plan.decks.slice(0,installedCount).entries()) {
  const own=E.DATA.decks.find(d=>d.name===row.name),seen=new Set();
  const record={name:own.name,games:0,wins:0,ultimateActive:0,ultimateEvolved:0,ultimateMatches:0,ultimateEvolvedMatches:0};
  const ultimate=E.CARDS.find(c=>c.name===row.ultimate).id;
  for(const [oi,foe] of [originals[row.base.id],...opponents].entries()) for(let seat=0;seat<2;seat++) for(let repeat=0;repeat<2;repeat++) {
    const decks=seat?[foe,own]:[own,foe];
    const seed=Math.imul(1+index*24+oi*4+seat*2+repeat,0x9e3779b1)>>>0;
    // Deck shuffles use G.rng; AI noise and cloned support evaluations use Math.random.
    Math.random=E.makeRng(seed ^ 0x53534433);
    const G=E.newGame({names:decks.map(d=>d.name),decks,seed,first:repeat});
    let guard=0,featuredInMatch=false,evolvedInMatch=false;
    while(G.winner===null && guard++<400) {
      E.beginTurn(G); checkState(G,decks);
      if(G.winner!==null) break;
      const t=G.tp,o=t^1;
      AI.prep(G,t); checkState(G,decks);
      if(G.winner!==null) break;
      assert(G.players[t].active,'prepared player has Digimon');
      const before=E.top(G.players[t]).id;
      AI.digivolvePhase(G,t); checkState(G,decks);
      const after=E.top(G.players[t]).id;
      if(before!==after) {result.evolutions++; if(t===seat && after===ultimate){record.ultimateEvolved++;evolvedInMatch=true;}}
      const active=E.top(G.players[seat]);
      if(active) {seen.add(active.id); if(active.id===ultimate){record.ultimateActive++;featuredInMatch=true;}}
      if(E.battleOn(G)) {
        result.battles++;
        const atk=[AI.chooseAttack(G,0,0.9),AI.chooseAttack(G,1,0.9)];
        E.setSupport(G,o,AI.chooseSupport(G,o,atk[o],0.9));
        E.setSupport(G,t,AI.chooseSupport(G,t,atk[t],0.9));
        checkState(G,decks); E.resolveBattle(G,atk,[]); checkState(G,decks);
      }
      E.endTurn(G);
    }
    if(G.winner===null)result.timeouts++;
    else if(G.winner===seat)record.wins++;
    result.maxTurns=Math.max(result.maxTurns,G.turn); result.games++; record.games++;
    if(featuredInMatch)record.ultimateMatches++;
    if(evolvedInMatch)record.ultimateEvolvedMatches++;
  }
  record.featuredAppeared=seen.has(ultimate);
  result.decks.push(record);
}
Math.random=originalRandom;
console.log(JSON.stringify(result,null,2));
assert.strictEqual(result.games,installedCount*24); assert.strictEqual(result.timeouts,0,'directed matches finish');
result.decks.forEach(record=>{assert(record.featuredAppeared,record.name+': featured Ultimate naturally appears');assert(record.ultimateEvolved>0,record.name+': AI naturally evolves to featured Ultimate');});
