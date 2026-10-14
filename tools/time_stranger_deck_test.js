// Phase 3 regression contract. The frozen TS-301 plan is independent of the exporter input.
// Usage: node tools/time_stranger_deck_test.js
const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const E = require(path.join(__dirname, '..', 'web', 'js', 'engine.js'));
const AI = require(path.join(__dirname, '..', 'web', 'js', 'ai.js'));
const K = require(path.join(__dirname, '..', 'web', 'js', 'decks.js'));
const plan = require('./time_stranger_decks.json');
const input = require('./custom_cards.json');
const digest = records => crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');
const byName = name => { const c = E.CARDS.find(c => c.name === name); assert(c, name); return c; };
const copies = (cards, id) => cards.filter(c => c === id).length;

// Multiset conservation catches duplication/loss even when the total remains 30.
function inventory(P) {
  return [...P.deck, ...P.hand, ...P.offline, ...P.dp,
    ...(P.active ? P.active.stack : []), ...(P.sup ? [P.sup.id] : [])].sort((a,b) => a-b);
}
function checkState(G, decks) {
  G.players.forEach((P,p) => {
    assert.deepStrictEqual(inventory(P), decks[p].cards.slice().sort((a,b) => a-b), P.name + ': card conservation');
    assert(P.hand.length <= E.HAND_MAX && P.dp.length <= E.DP_MAX, P.name + ': zone capacity');
    if (P.active) {
      assert(Number.isInteger(P.active.hp) && P.active.hp >= 0 && P.active.hp <= 9990, P.name + ': HP bounds');
      assert(P.active.base.every(n => Number.isInteger(n) && n >= 0 && n <= 9990), P.name + ': attack bounds');
    }
  });
}

function verify(expectedCount = E.DATA.decks.length-160) {
  assert.strictEqual(plan.schemaVersion, 1);
  assert.strictEqual(plan.decks.length, 15, 'fifteen planned themed decks');
  assert([3,6,9,12,15].includes(expectedCount),'one complete Specialty per ticket');
  const installed=plan.decks.slice(0,expectedCount);
  assert.strictEqual(digest(E.CARDS.slice(0,301)), plan.baseline.cardsSha256, 'all disc card fields unchanged');
  assert.strictEqual(digest(E.DATA.decks.slice(0,159)), plan.baseline.decksSha256, 'all disc deck fields unchanged');
  assert.strictEqual(digest(E.CARDS.slice(301)), plan.baseline.existingCustomCardsSha256, 'existing custom card fields unchanged');
  assert.strictEqual(digest(E.DATA.decks.slice(159,160)), plan.baseline.existingCustomDecksSha256, 'existing custom deck unchanged');
  assert.strictEqual(E.CARDS.length,347);
  assert.strictEqual(digest(E.CARDS),plan.baseline.allCardsSha256,'all existing card fields unchanged');
  assert.strictEqual(digest(E.DATA.decks.slice(0,160)),plan.baseline.allDecksSha256,'all existing deck fields unchanged');
  assert.strictEqual(E.DATA.decks.length,160+expectedCount);
  assert.strictEqual(input.decks.length,1+expectedCount,'no missing or extra exporter deck records');
  const existingNames=new Set(E.DATA.decks.slice(0,160).map(d=>d.name));
  const newNames=E.DATA.decks.slice(160).map(d=>d.name);
  assert.strictEqual(new Set(newNames).size,expectedCount,'unique new deck names');
  newNames.forEach(name=>assert(!existingNames.has(name),'new deck name differs from every existing name'));
  assert.deepStrictEqual(E.DATA.decks.map(d => d.id), Array.from({length:160+expectedCount},(_,i)=>i));
  const expectedUltimates = Array.from({length:5},(_,s)=>[308+9*s,309+9*s,310+9*s]).flat();
  assert.deepStrictEqual(plan.decks.map(d=>byName(d.ultimate).id).sort((a,b)=>a-b), expectedUltimates);
  installed.forEach((row,i) => {
    const d = E.DATA.decks[160+i], base = E.DATA.decks[row.base.id];
    assert.strictEqual(base.name,row.base.name); assert.strictEqual(base.owner,row.base.owner);
    assert.notStrictEqual(d.owner,'Player',d.name + ': selectable as a computer opponent');
    assert.strictEqual(d.name,row.name); assert(d.name.length <= 18);
    assert.strictEqual(d.custom,base.id);
    // Compare every inherited field, including future metadata, rather than a partial field list.
    const inherited = {...d}; delete inherited.id; delete inherited.name; delete inherited.cards; delete inherited.custom;
    const original = {...base}; delete original.id; delete original.name; delete original.cards;
    assert.deepStrictEqual(inherited,original,d.name + ': inherited metadata');
    const spec = input.decks.find(x=>x.name===row.name);
    assert(spec,d.name + ': exporter specification');
    assert.deepStrictEqual(spec.base,{name:base.name,owner:base.owner});
    assert.deepStrictEqual(spec.replace,row.replace,d.name + ': specification matches approved plan');
    const replacements = new Map();
    row.exchanges.forEach(x => {
      assert.strictEqual(byName(x.from).id,x.fromId); assert.strictEqual(byName(x.to).id,x.toId);
      assert(x.fromId<301 && x.toId>=302 && x.toId<=346);
      assert.strictEqual(E.card(x.fromId).type,'digimon');
      assert.strictEqual(E.card(x.fromId).level,E.card(x.toId).level,d.name + ': exchange keeps level');
      assert.strictEqual(copies(base.cards,x.fromId),x.count,d.name + ': donor copy count');
      assert(x.count>0); assert(!replacements.has(x.fromId));
      replacements.set(x.fromId,x.toId);
      assert.strictEqual(row.replace[x.from],x.to);
    });
    assert.strictEqual(replacements.size,Object.keys(row.replace).length);
    assert.deepStrictEqual(d.cards,base.cards.map(id=>replacements.has(id)?replacements.get(id):id),d.name + ': exact ordered exchange');
    assert.deepStrictEqual(K.problems(d.cards),[],d.name + ': legal deck');
    assert.deepStrictEqual(d.cards.filter(id=>E.card(id).type!=='digimon'),base.cards.filter(id=>E.card(id).type!=='digimon'),d.name + ': options retained');
    const u=byName(row.ultimate), offset=(u.id-302)%9-6;
    const line=[u.id-6,u.id-3,u.id];
    assert(offset>=0 && offset<3);
    line.forEach(id=>assert(d.cards.includes(id),d.name + ': complete themed group ' + E.card(id).name));
    assert.deepStrictEqual([...new Set(d.cards.filter(id=>id>=302))].sort((a,b)=>a-b),line,d.name + ': only its themed group');
    verifyEvolution(d,line);
  });
  return {decks:expectedCount,evolutionSteps:expectedCount*2};
}

function verifyEvolution(deck,line) {
  const G=E.newGame({names:[deck.name,'Base'],decks:[deck,E.DATA.decks[deck.custom]],seed:301,first:0});
  const P=G.players[0];
  // A reachable prepared position, using only actual copies from this deck.
  P.deck=deck.cards.slice(); P.hand=line.slice();
  line.forEach(id=>P.deck.splice(P.deck.indexOf(id),1));
  assert(E.enter(G,0,0));
  assert.strictEqual(E.top(P).id,line[0]);
  for (const target of line.slice(1)) {
    P.evoStarted=false; P.evoEnded=false; P.dpUsed=false;
    assert(!E.evoLegal(P,target,-1),deck.name + ': DP required before evolution');
    const donors=P.deck.filter(id=>E.card(id).type==='digimon' && E.card(id).pp>0).sort((a,b)=>E.card(b).pp-E.card(a).pp);
    while (E.dpTotal(P)<E.card(target).dp) {
      const id=donors.shift(); assert(id!==undefined,deck.name + ': sufficient actual DP donors');
      assert(P.dp.length<E.DP_MAX);
      P.deck.splice(P.deck.indexOf(id),1); P.dp.push(id);
    }
    assert(E.evoLegal(P,target,-1));
    const H=E.clone(G);
    AI.digivolvePhase(H,0);
    assert.strictEqual(E.top(H.players[0]).id,target,deck.name + ': AI uses available themed evolution');
    checkState(H,[deck,E.DATA.decks[deck.custom]]);
    const move=E.evoMoves(G,0).find(m=>m.kind==='normal' && P.hand[m.target]===target);
    assert(move,deck.name + ': normal evolution offered'); assert(E.digivolve(G,0,move));
    assert.strictEqual(E.top(P).id,target);
    assert.strictEqual(P.active.spec,E.card(target).spec);
    assert.strictEqual(P.active.hp,E.card(target).hp,deck.name + ': full strength, no entrance penalty');
    assert.deepStrictEqual(P.active.base,E.card(target).atk.map(a=>a.power));
    assert.strictEqual(P.dp.length,0,deck.name + ': normal evolution consumes DP');
    checkState(G,[deck,E.DATA.decks[deck.custom]]);
  }
  assert.deepStrictEqual(P.active.stack,line,deck.name + ': Rookie/Champion/Ultimate progression');
}

module.exports={verify,checkState,plan};
if(require.main===module) console.log('Time Stranger deck contract: '+JSON.stringify(verify(process.argv.includes('--all')?15:undefined)));
