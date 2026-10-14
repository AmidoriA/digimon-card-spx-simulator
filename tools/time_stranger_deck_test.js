// Independent owner-requested deck contract, superseding the original donor swaps.
const assert=require('assert'),crypto=require('crypto'),path=require('path');
const E=require(path.join(__dirname,'..','web','js','engine.js'));
const AI=require(path.join(__dirname,'..','web','js','ai.js'));
const K=require(path.join(__dirname,'..','web','js','decks.js'));
const plan=require('./time_stranger_theme_decks.json'),legacy=require('./time_stranger_decks.json'),input=require('./custom_cards.json');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const byName=n=>{const c=E.CARDS.find(c=>c.name===n);assert(c,n);return c;};
const copies=(cards,id)=>cards.filter(n=>n===id).length;
const intended={WarGrowlmon:[0],SaviorHuckmon:[0,2],Flaremon:[0],MachGaogamon:[1],Crescemon:[1,4],Dragomon:[1],Taomon:[2,4],Rapidmon:[2],Lilamon:[2],MetalTyrannomon:[0,3],Cyberdramon:[3,4],Matadormon:[3],Wingdramon:[1,2,4],GrapLeomon:[2,4],Chirinmon:[4]};
function inventory(P){return [...P.deck,...P.hand,...P.offline,...P.dp,...(P.active?P.active.stack:[]),...(P.sup?[P.sup.id]:[])].sort((a,b)=>a-b);}
function checkState(G,decks){G.players.forEach((P,p)=>{assert.deepStrictEqual(inventory(P),decks[p].cards.slice().sort((a,b)=>a-b),P.name+': card conservation');assert(P.hand.length<=E.HAND_MAX&&P.dp.length<=E.DP_MAX,P.name+': capacity');if(P.active){assert(Number.isInteger(P.active.hp)&&P.active.hp>=0&&P.active.hp<=9990);assert(P.active.base.every(n=>Number.isInteger(n)&&n>=0&&n<=9990));}});}
function take(P,id){const i=P.deck.indexOf(id);assert(i>=0,'actual deck copy required: '+E.card(id).name);P.deck.splice(i,1);return id;}
function prepare(deck){const pair=[deck,E.DATA.decks[deck.custom]],G=E.newGame({names:pair.map(d=>d.name),decks:pair,seed:301,first:0}),P=G.players[0];P.active=null;P.deck=deck.cards.slice();P.hand=[];P.dp=[];P.offline=[];P.sup=null;return {G,P,pair};}
function verifyEvolution(deck,line){
  const {G,P,pair}=prepare(deck);P.hand=line.map(id=>take(P,id));assert(E.enter(G,0,0));assert.strictEqual(E.top(P).id,line[0]);
  for(const target of line.slice(1)){
    P.evoStarted=false;P.evoEnded=false;P.dpUsed=false;assert(!E.evoLegal(P,target,-1),deck.name+': actual DP required');
    const donors=P.deck.filter(id=>E.card(id).type==='digimon'&&E.card(id).pp>0).sort((a,b)=>E.card(b).pp-E.card(a).pp);
    while(E.dpTotal(P)<E.card(target).dp){const id=donors.shift();assert(id!=null,deck.name+': actual DP donors available');assert(P.dp.length<E.DP_MAX);P.dp.push(take(P,id));}
    assert(E.evoLegal(P,target,-1));const H=E.clone(G);AI.digivolvePhase(H,0);assert.strictEqual(E.top(H.players[0]).id,target,deck.name+': AI uses line');checkState(H,pair);
    const move=E.evoMoves(G,0).find(m=>m.kind==='normal'&&P.hand[m.target]===target);assert(move);assert(E.digivolve(G,0,move));assert.strictEqual(E.top(P).id,target);assert.strictEqual(P.active.spec,E.card(target).spec);assert.strictEqual(P.active.hp,E.card(target).hp);assert.deepStrictEqual(P.active.base,E.card(target).atk.map(a=>a.power));assert.strictEqual(P.dp.length,0);checkState(G,pair);
  }
  assert.deepStrictEqual(P.active.stack,line,deck.name+': complete R/C/U chain');
}
function verifyOptionPath(deck,row){
  const {G,P,pair}=prepare(deck),from=byName(row.from),to=byName(row.to),opt=byName(row.option);assert(deck.cards.includes(opt.id));assert.strictEqual(opt.type,'digivolve');
  const stack=[];
  if(from.level!==0){const rookie=P.deck.find(id=>E.card(id).type==='digimon'&&E.card(id).level===0&&E.card(id).spec===from.spec);assert(rookie!=null,deck.name+': prior same-Specialty Rookie');stack.push(take(P,rookie));}
  stack.push(take(P,from.id));P.active={stack,armor:-1,hp:from.hp,spec:from.spec,base:from.atk.map(a=>a.power),abn:0};P.hand=[take(P,to.id),take(P,opt.id)];P.dp=row.dpCards.map(n=>take(P,byName(n).id));
  assert.strictEqual(E.dpTotal(P),row.dp);assert.strictEqual(to.dp,row.requiredDp);checkState(G,pair);assert(E.evoLegal(P,to.id,opt.id),deck.name+': planned evolution is legal '+row.from+' / '+row.to);
  if(from.spec!==to.spec){assert(!E.evoLegal(P,to.id,-1),deck.name+': cross-Specialty requires the evolution option');assert([E.DIGIVOLVE.SPECIAL,E.DIGIVOLVE.MUTANT].includes(opt.dtype));}
  if(opt.dtype===E.DIGIVOLVE.SPEED){assert.strictEqual(from.spec,to.spec);const bad=E.clone(G);bad.players[0].active.abn=2;assert(!E.evoLegal(bad.players[0],to.id,opt.id),deck.name+': Speed rejects abnormal entrance');}
  if(opt.dtype===E.DIGIVOLVE.SPECIAL){assert.strictEqual(row.dp+20>=to.dp,true);const bad=E.clone(G);bad.players[0].dp=[];if(to.dp>20)assert(!E.evoLegal(bad.players[0],to.id,opt.id),deck.name+': Special still requires sufficient DP');}
  const move=E.evoMoves(G,0).find(m=>m.kind==='option'&&P.hand[m.target]===to.id&&P.hand[m.opt]===opt.id);assert(move);assert(E.digivolve(G,0,move));assert.strictEqual(E.top(P).id,to.id);assert.strictEqual(P.active.hp,to.hp);assert.strictEqual(P.active.spec,to.spec);assert(P.offline.includes(opt.id));assert.strictEqual(P.dp.length,opt.dtype===E.DIGIVOLVE.SPEED?row.dpCards.length:0);checkState(G,pair);
}
function verify(expectedCount=15){
  assert.strictEqual(expectedCount,15,'all redesigned decks ship together');assert.strictEqual(plan.schemaVersion,2);assert.strictEqual(plan.decks.length,15);
  assert.strictEqual(digest(E.CARDS.slice(0,301)),legacy.baseline.cardsSha256,'original 301 disc cards unchanged');assert.strictEqual(digest(E.DATA.decks.slice(0,159)),legacy.baseline.decksSha256,'original 159 disc decks unchanged');
  assert.strictEqual(digest(E.card(301)),'50734ed83ade27cd9e469f00152dc87f4a097d696e4261b17c67c13df06d4996','BlackWarGreymon unchanged');assert.strictEqual(digest(E.DATA.decks.slice(159,160)),legacy.baseline.existingCustomDecksSha256,'Black Fire Again unchanged');
  assert.strictEqual(E.CARDS.length,347);assert.strictEqual(E.DATA.decks.length,175);assert.strictEqual(input.decks.length,16);assert.deepStrictEqual(E.DATA.decks.map(d=>d.id),Array.from({length:175},(_,i)=>i));
  assert.deepStrictEqual(plan.bannedCardIds,[285,286,287,288,289,290,291,293]);const names=new Set();let optionPaths=0;
  assert.deepStrictEqual(plan.decks.map(d=>d.ultimate).sort(),Object.keys(intended).sort());
  for(const [i,row] of plan.decks.entries()){
    const d=E.DATA.decks[160+i],base=E.DATA.decks[row.base.id],spec=input.decks.find(x=>x.name===row.name);assert.strictEqual(row.id,160+i);assert.strictEqual(d.name,row.name);assert(!names.has(d.name));names.add(d.name);assert(d.name.length<=18);assert(!E.DATA.decks.slice(0,160).some(x=>x.name===d.name));
    assert.strictEqual(base.name,row.base.name);assert.strictEqual(base.owner,row.base.owner);assert.strictEqual(d.custom,base.id);assert.strictEqual(d.owner,row.ultimate);assert.strictEqual(row.owner,row.ultimate);assert.strictEqual(d.ownerCard,byName(row.ultimate).id);assert.strictEqual(d.ownerCard,row.ownerCard);assert(d.cards.includes(d.ownerCard));
    const inherited={...d},original={...base};for(const k of ['id','name','cards','custom','owner','ownerCard']){delete inherited[k];delete original[k];}assert.deepStrictEqual(inherited,original,d.name+': inherited display/AI metadata');
    assert(spec);assert.deepStrictEqual(spec.base,{name:base.name,owner:base.owner});assert.strictEqual(spec.owner,row.owner);assert.strictEqual(spec.ownerCard,row.ultimate);assert.deepStrictEqual(spec.cards,row.counts,d.name+': source agrees with independent card plan');assert(!spec.replace);
    assert.deepStrictEqual(d.cards,row.cards,d.name+': all 30 planned card slots');assert.strictEqual(d.cards.length,30);assert.deepStrictEqual(K.problems(d.cards),[]);const counts={};for(const id of d.cards){const c=E.card(id);assert(c);assert(!plan.bannedCardIds.includes(id),d.name+': banned '+c.name);counts[c.name]=(counts[c.name]||0)+1;assert(counts[c.name]<=4);if(c.id<302&&c.type!=='digivolve')assert(!c.conds.some(cd=>cd.v.includes(1)),d.name+': own Specialty gated donor '+c.name);}assert.deepStrictEqual(counts,row.counts);
    const mons=d.cards.map(E.card).filter(c=>c.type==='digimon'),specs=[...new Set(mons.map(c=>c.spec))].sort((a,b)=>a-b);assert.deepStrictEqual(specs,intended[row.ultimate],d.name+': requested Specialties');assert.deepStrictEqual(row.specialties.map(s=>E.SPEC.indexOf(s)).sort((a,b)=>a-b),specs);
    const line=row.line.map(n=>byName(n).id);assert.strictEqual(line[2],d.ownerCard);assert.deepStrictEqual(line.map(id=>E.card(id).level),[0,2,3]);line.forEach(id=>assert([3,4].includes(copies(d.cards,id)),d.name+': 3–4 copies '+E.card(id).name));assert.deepStrictEqual([...new Set(d.cards.filter(id=>id>=302))].sort((a,b)=>a-b),line.slice().sort((a,b)=>a-b));
    const ratio={R:mons.filter(c=>c.level===0).length,C:mons.filter(c=>c.level===2).length,U:mons.filter(c=>c.level===3).length,option:d.cards.length-mons.length};assert.deepStrictEqual(ratio,row.ratio);for(const [key,min,max] of [['R',8,10],['C',5,7],['U',3,6],['option',8,12]])assert(ratio[key]>=min&&ratio[key]<=max,d.name+': '+key+' ratio');
    const evo=d.cards.map(E.card).filter(c=>c.type==='digivolve');assert(evo.length>0,d.name+': evolution options');assert.deepStrictEqual([...new Set(evo.map(c=>c.id))].sort((a,b)=>a-b),row.evolution.options.map(o=>o.id).sort((a,b)=>a-b));row.evolution.options.forEach(o=>{assert.strictEqual(byName(o.name).id,o.id);assert.strictEqual(copies(d.cards,o.id),o.count);});if(specs.length>1)assert(row.evolution.paths.some(p=>byName(p.from).spec!==byName(p.to).spec),d.name+': a real cross-Specialty option path');
    verifyEvolution(d,line);row.evolution.paths.forEach(p=>{verifyOptionPath(d,p);optionPaths++;});
  }
  return {decks:15,evolutionSteps:30,optionPaths};
}
module.exports={verify,checkState,plan};
if(require.main===module)console.log('Time Stranger deck contract: '+JSON.stringify(verify()));
