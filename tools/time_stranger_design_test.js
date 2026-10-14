// Owner-requested themes; handwritten outcome tables are independent of encoding.
const assert=require('assert'),path=require('path');
const E=require(path.join(__dirname,'..','web','js','engine.js'));
const AI=require(path.join(__dirname,'..','web','js','ai.js'));
const design=require('./time_stranger_theme_cards.json');
const byName=n=>{const c=E.CARDS.find(c=>c.name===n);assert(c,n);return c.id;};
const FILL=byName('Agumon'),NATURE=byName('Palmon'),NEUTRAL=byName('Gigadramon');
function fixture(id,patch={},activeId=NEUTRAL){
  const G=E.newGame({names:['Design','Opponent'],seed:7,first:1,decks:[{cards:Array(30).fill(FILL)},{cards:Array(30).fill(FILL)}]});
  G.players.forEach((P,p)=>{
    P.active={stack:[p?NEUTRAL:activeId],armor:-1,hp:p?900:600,spec:p?3:E.card(id).spec,base:p?[360,240,120]:[400,300,200],abn:0};
    P.hand=p?[]:[id];P.deck=Array(p?27:26).fill(FILL);P.dp=[NATURE,NATURE];P.offline=[FILL,FILL,FILL];
  });
  const P=G.players[0],O=G.players[1];
  for(const [key,who,field] of [['hp',P,'hp'],['foeHp',O,'hp'],['spec',P,'spec'],['foeSpec',O,'spec'],['ownAtk',P,'base'],['foeAtk',O,'base']])if(patch[key]!=null)who.active[field]=Array.isArray(patch[key])?patch[key].slice():patch[key];
  for(const [key,who,field,card] of [['dp',P,'dp',NATURE],['foeDp',O,'dp',NATURE],['deck',P,'deck',FILL],['foeDeck',O,'deck',FILL],['offline',P,'offline',FILL],['foeOffline',O,'offline',FILL]])if(patch[key]!=null)who[field]=Array(patch[key]).fill(card);
  if(patch.hand!=null)P.hand=[id,...Array(patch.hand).fill(FILL)];
  if(patch.noSupport)P.hand=[];else assert(E.setSupport(G,0,0));
  if(patch.foeSupport!=null){O.hand=[patch.foeSupport];assert(E.setSupport(G,1,0));}
  if(patch.first!=null)G.tp=patch.first;
  return G;
}
function resolve(G,patch={}){const events=E.resolveBattle(G,[patch.choice??0,patch.foeChoice??0],[]),order=events.find(e=>e.t==='order');assert(order);return {G,events,order,support:events.find(e=>e.t==='support'&&e.p===0)};}
function setup(id,patch={},activeId=NEUTRAL){return resolve(fixture(id,patch,activeId),patch);}
function state(r){const [s,o]=r.order.s;return {atk:s.atk,hp:s.hp,dp:s.dp.length,deck:s.deck,hand:s.hand.length,offline:s.offline,spec:s.spec,ownChoice:s.choice,foeAtk:o.atk,foeHp:o.hp,foeDp:o.dp.length,foeDeck:o.deck,foeHand:o.hand.length,foeOffline:o.offline,foeSpec:o.spec,foeChoice:o.choice,first:r.order.first};}
function baseline(id,p={}){return {atk:p.ownAtk??[400,300,200],hp:p.hp??600,dp:p.dp??2,deck:p.deck??26,hand:p.hand??0,offline:p.offline??3,spec:p.spec??E.card(id).spec,ownChoice:p.choice??0,foeAtk:p.foeAtk??[360,240,120],foeHp:p.foeHp??900,foeDp:p.foeDp??2,foeDeck:p.foeDeck??27,foeHand:0,foeOffline:p.foeOffline??3,foeSpec:p.foeSpec??3,foeChoice:p.foeChoice??0,first:p.first??1};}
function expectPass(row,patch,expected){
  const r=setup(row.id,patch),want={...baseline(row.id,patch),...expected},actual=state(r);
  assert(r.support?.ok&&!r.support.voided,row.name+': support should activate '+JSON.stringify(patch));
  for(const [field,value] of Object.entries(want)){
    if(['flag','void','counter','reviveHp'].includes(field))continue;
    assert(Object.hasOwn(actual,field),row.name+': unknown expected field '+field);
    assert.deepStrictEqual(actual[field],value,row.name+': '+field+' '+JSON.stringify(patch));
  }
  if(expected.flag)assert(r.events.some(e=>e.t==='flag'&&e.p===0&&e.flag===expected.flag),row.name+': '+expected.flag+' flag');
  if(expected.reviveHp!=null)assert.strictEqual(r.G.players[0].b.reviveHp,expected.reviveHp,row.name+': revival HP');
  if(expected.void)assert(r.events.some(e=>e.t==='void'&&e.p===1&&!e.all),row.name+': Digimon-only void');
  if(expected.counter){assert(r.events.some(e=>e.t==='counter'&&e.p===0),row.name+': actual counter');assert.strictEqual(r.events.find(e=>e.t==='attack'&&e.p===1).dmg,0);}
  return r;
}
// Traced game x-effect semantics, tested through the featured active Digimon.
function verifyCross(row){
  const fx=E.XFX.indexOf(row.xfx),c=E.card(row.id),base={noSupport:true,choice:2,ownAtk:[400,300,c.atk[2].power],hp:3000,foeHp:3000};
  const r=setup(row.id,{...base,foeChoice:fx>=5&&fx<=7?fx-5:0,foeSpec:fx>=11?fx-11:3},row.id),s=r.order.s,attack=r.events.find(e=>e.t==='attack'&&e.p===0);
  assert(attack,row.name+': actual cross attack');
  if(fx===0)assert(!r.events.some(e=>e.t==='xfx'&&e.p===0));
  if(fx===1)assert.strictEqual(r.order.first,0,row.name+': first attack');
  if(fx>=2&&fx<=4)assert.strictEqual(s[1].atk[fx-2],0,row.name+': zero foe power');
  if(fx>=5&&fx<=7){
    if([321,324,327].includes(row.id))assert.strictEqual(c.atk[2].power,0,row.name+': triangle counter native power');assert(r.events.some(e=>e.t==='counter'&&e.p===0));assert.strictEqual(attack.dmg,[360,240,120][fx-5]);
    const miss=setup(row.id,{...base,foeChoice:(fx-4)%3},row.id);assert(!miss.events.some(e=>e.t==='counter'&&e.p===0));assert.strictEqual(miss.events.find(e=>e.t==='attack'&&e.p===0).dmg,c.atk[2].power);
  }
  if(fx===8){assert(r.events.some(e=>e.t==='crash'&&e.p===0));assert.strictEqual(attack.dmg,2640,row.name+': crash spends HP remaining after enemy strike');}
  if(fx===9)assert.strictEqual(attack.heal,c.atk[2].power,row.name+': eat-up heals actual damage');
  if(fx===10){const j=setup(row.id,{...base,foeSupport:FILL},row.id);assert(j.events.some(e=>e.t==='support'&&e.p===1&&e.voided));}
  if(fx>=11){assert.strictEqual(attack.dmg,c.atk[2].power*3);const miss=setup(row.id,{...base,foeSpec:(fx-10)%5},row.id);assert.strictEqual(miss.events.find(e=>e.t==='attack'&&e.p===0).dmg,c.atk[2].power);}
}
function verify(){
  assert.strictEqual(design.cards.length,45);let scenarios=0;
  assert.deepStrictEqual(design.cards.map(r=>r.id).sort((a,b)=>a-b),Array.from({length:45},(_,i)=>302+i));
  for(const row of design.cards){
    const c=E.card(row.id),donor=E.card(c.custom);assert.strictEqual(c.name,row.name);assert.strictEqual(E.XFX[c.xfx],row.xfx,row.name+': intended cross');
    assert.deepStrictEqual({prio:c.prio,conds:c.conds,acts:c.acts,text:c.text},row.support,row.name+': exported support agrees with plan');
    assert.notDeepStrictEqual([c.hp,c.dp,c.pp,...c.atk.map(a=>a.power)],[donor.hp,donor.dp,donor.pp,...donor.atk.map(a=>a.power)],row.name+': not a stat clone');
    const peers=E.CARDS.filter(a=>a.custom==null&&a.type==='digimon'&&a.spec===c.spec&&a.level===c.level);
    for(const [label,value,values] of [['HP',c.hp,peers.map(a=>a.hp)],['DP',c.dp,peers.map(a=>a.dp)],['+P',c.pp,peers.map(a=>a.pp)],...c.atk.map((a,k)=>['power'+k,a.power,peers.map(b=>b.atk[k].power)])])assert(Number.isInteger(value)&&value>=Math.min(...values)&&value<=Math.max(...values),row.name+' '+label+' outside disc range');
    const q=row.expect.pass,patch=q.patch||{},expected=q.result||{},crossGate=row.expect.allSpecialties===false;
    assert.strictEqual(crossGate,[338,341,344].includes(row.id),row.name+': only Wing line has own cross-Specialty gate');
    if(!crossGate)assert(!c.conds.some(cd=>cd.v.includes(1)),row.name+': own active Specialty restriction');
    for(let spec=0;spec<5;spec++){if(crossGate&&spec===4)continue;expectPass(row,{...patch,spec},expected);scenarios++;}
    for(const fail of row.expect.fail||[]){const p={...patch,...fail},r=setup(row.id,p);assert.strictEqual(r.support?.ok,false,row.name+': failed gate '+JSON.stringify(fail));assert.deepStrictEqual(state(r),baseline(row.id,p),row.name+': failed gate has no cost or changes');scenarios++;}
    verifyCross(row);scenarios++;
  }
  for(const row of design.cards.filter(r=>r.expect.pass.result?.flag==='revive'))for(const wins of [0,2]){
    const patch={...(row.expect.pass.patch||{}),hp:100,foeHp:2000,foeAtk:[2000,0,0]},G=fixture(row.id,patch);G.players[1].wins=wins;const ev=resolve(G,patch).events;
    assert.strictEqual(G.players[1].wins,wins+1,row.name+': revive KO awards point');
    if(wins===2){assert.strictEqual(G.winner,1);assert.strictEqual(G.players[0].active,null);}else{assert(ev.some(e=>e.t==='ko'&&e.how==='revive'));assert.strictEqual(G.players[0].active.hp,row.expect.pass.result.reviveHp,row.name+': restores planned HP');}scenarios++;
  }
  // Circle and Triangle themes must both activate; Cross deliberately fails.
  for(const id of [304,307,310]){const row=design.cards.find(r=>r.id===id);expectPass(row,{choice:1},row.expect.pass.result);scenarios++;}
  // MachGaogamon's comparison includes equality; less-HP themes exclude equality.
  expectPass(design.cards.find(r=>r.id===314),{hp:900},{hp:1050,atk:[650,550,450]});scenarios++;
  // Zero-power support checks the selected attack, including a zero created by an
  // earlier Option support in this same battle. It is not tied to one attack slot.
  for(const [id,boost] of [[339,250],[342,350],[345,500]])for(let choice=0;choice<3;choice++){
    const row=design.cards.find(r=>r.id===id),atk=[400,300,200];atk[choice]=0;
    const expected={...row.expect.pass.result,atk:atk.map(n=>n+boost)};
    expectPass(row,{choice,ownAtk:atk},expected);scenarios++;
    const nonzero=atk.slice();nonzero[choice]=10;const patch={choice,ownAtk:nonzero},failed=setup(id,patch);assert.strictEqual(failed.support.ok,false);assert.deepStrictEqual(state(failed),baseline(id,patch));scenarios++;
    expectPass(row,{choice,foeSupport:byName(['Defense Disk ○','Defense Disk △','Defense Disk ✕'][choice])},expected);scenarios++;
  }
  for(const id of [321,327]){const r=setup(id,{choice:2},327);assert(r.events.some(e=>e.t==='counter'&&e.p===0));assert.strictEqual(r.events.find(e=>e.t==='attack'&&e.p===0).dmg,240);assert.strictEqual(r.events.find(e=>e.t==='attack'&&e.p===1).dmg,0);scenarios++;}
  const protectedCircle=setup(324,{choice:2},327);assert.strictEqual(protectedCircle.order.s[1].atk[0],0);scenarios++;
  for(const row of design.cards.filter(r=>r.expect.pass.result?.flag==='eatup')){const r=setup(row.id,row.expect.pass.patch);const strike=r.events.find(e=>e.t==='attack'&&e.p===0);assert.strictEqual(strike.heal,strike.dmg,row.name+': actual eat-up healing');assert(strike.heal>0);scenarios++;}
  for(const id of [333,336])for(const target of ['Agumon','Attack Chip']){const r=setup(id,{foeSupport:byName(target)}),effect=r.events.find(e=>e.t==='support'&&e.p===1);assert.strictEqual(!!effect.voided,target==='Agumon');scenarios++;}
  for(const id of [320,326]){const r=setup(id,{foeSpec:0});E.endTurn(r.G);assert.strictEqual(r.G.players[1].active.spec,3,'changed enemy Specialty persists after battle');scenarios++;}
  // Disruption must affect an actual future evolution, not just a printed battle
  // snapshot. Enemy starts with a legal Fire R→C and two real +20 DP cards.
  for(const id of [320,323,326]){
    const G=fixture(id),O=G.players[1],rookie=byName('Agumon'),champion=byName('Greymon'),special=byName('Special Digivolve');
    O.active={stack:[rookie],armor:-1,hp:2000,spec:0,base:[100,0,0],abn:0};O.hand=[champion,special];O.dp=[NATURE,NATURE];
    assert(E.evoLegal(O,champion,-1),'normal evolution initially legal');resolve(G);E.endTurn(G);
    assert(!E.evoLegal(O,champion,-1),'theme support disrupts prepared normal evolution');
    if(id===323){assert.strictEqual(O.active.spec,0);assert.strictEqual(O.dp.length,1);O.dp.push(NATURE);assert(E.evoLegal(O,champion,-1),'restoring DP permits normal evolution');}
    else {assert.strictEqual(O.active.spec,3,'enemy Specialty stays changed');if(id===326){assert.strictEqual(O.dp.length,0);assert(!E.evoLegal(O,champion,special),'DP mill also denies an underfunded Special');O.dp=[NATURE,NATURE];}assert(E.evoLegal(O,champion,special),'Special can recover from changed Specialty with enough DP');G.tp=1;assert(E.digivolve(G,1,{kind:'option',target:0,opt:1}));assert.strictEqual(O.active.spec,0,'successful evolution resets Specialty to new card');}
    scenarios++;
  }
  assert.strictEqual(E.card(303).atk[0].name,'Corona\uff70Knuckles');assert.strictEqual(E.card(335).atk[0].name,'Giga Destroyer\u2161');assert.strictEqual(E.card(341).atk[2].name,'Great Strike\u2161');
  console.log('PASS: 45 themed cards; '+scenarios+' independent support/cross scenarios, permitted Specialties, failed gates, costs and revival.');return scenarios;
}
function soak(games=750){
  const {checkState}=require('./time_stranger_deck_test.js'),decks=E.DATA.decks.slice(160),disc=E.DATA.decks.slice(0,159),stats={games,timeouts:0,maxTurns:0,turns:0,supports:new Set(),seen:new Set(),failed:0},originalRandom=Math.random;
  try{for(let k=0;k<games;k++){
    const a=decks[k%decks.length],b=k%2?decks[Math.floor(k/decks.length)%decks.length]:disc[(k*17)%disc.length],pair=[a,b];Math.random=E.makeRng(27000+k);const G=E.newGame({names:pair.map(d=>d.name),decks:pair,seed:16000+k});let guard=0;
    while(G.winner===null&&guard++<400){E.beginTurn(G);if(G.winner!==null)break;const p=G.tp,o=p^1;AI.prep(G,p);if(G.winner!==null)break;AI.digivolvePhase(G,p);
      if(E.battleOn(G)){const attacks=[AI.chooseAttack(G,0,.9),AI.chooseAttack(G,1,.9)];E.setSupport(G,o,AI.chooseSupport(G,o,attacks[o],.9));E.setSupport(G,p,AI.chooseSupport(G,p,attacks[p],.9));const ev=E.resolveBattle(G,attacks,[]);ev.filter(e=>e.t==='support'&&e.card>=302).forEach(e=>{stats.seen.add(e.card);if(e.ok&&!e.voided)stats.supports.add(e.card);else stats.failed++;});}checkState(G,pair);E.endTurn(G);
    }if(G.winner===null)stats.timeouts++;stats.turns+=G.turn;stats.maxTurns=Math.max(stats.maxTurns,G.turn);
  }}finally{Math.random=originalRandom;}
  assert.strictEqual(stats.timeouts,0,'extended theme matches finish without intervention');assert.strictEqual(stats.supports.size,45,'extended matches naturally activate every themed support');stats.avgTurns=+(stats.turns/games).toFixed(1);stats.supports=[...stats.supports].sort((a,b)=>a-b);stats.seen=[...stats.seen].sort((a,b)=>a-b);console.log(JSON.stringify(stats));return stats;
}
module.exports={verify,soak,setup};
if(require.main===module){verify();if(process.argv.includes('--soak'))soak();}
