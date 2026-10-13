// TS-106: behavioral checks of the designed effects, independent of their encoding.
const assert = require('assert');
const path = require('path');
const E = require(path.join(__dirname, '..', 'web', 'js', 'engine.js'));
const AI = require(path.join(__dirname, '..', 'web', 'js', 'ai.js'));
const byName = n => { const c=E.CARDS.find(c=>c.name===n); assert(c,n); return c.id; };
const NATURE=byName('Palmon'), FILL=byName('Agumon');
function setup(id,patch={}) {
  const G=E.newGame({names:['Design','Opponent'],seed:7,first:1,decks:[{cards:Array(30).fill(FILL)},{cards:Array(30).fill(FILL)}]});
  G.players.forEach((P,p)=>{
    P.active={stack:[byName('WarGreymon')],armor:-1,hp:p?900:600,spec:p?3:E.card(id).spec,base:p?[360,240,120]:[400,300,200],abn:0};
    P.hand=p?[]:[id]; P.deck=Array(p?27:26).fill(FILL); P.dp=[NATURE,NATURE];P.offline=[];
  });
  const P=G.players[0],O=G.players[1];
  if(patch.hp!=null)P.active.hp=patch.hp;
  if(patch.foeHp!=null)O.active.hp=patch.foeHp;
  if(patch.spec!=null)P.active.spec=patch.spec;
  if(patch.foeSpec!=null)O.active.spec=patch.foeSpec;
  if(patch.dp!=null)P.dp=Array(patch.dp).fill(NATURE);
  if(patch.deck!=null)P.deck=Array(patch.deck).fill(FILL);
  E.setSupport(G,0,0);
  const events=E.resolveBattle(G,[patch.choice||0,patch.foeChoice||0],[]);
  return {G,events,order:events.find(e=>e.t==='order'),support:events.find(e=>e.t==='support'&&e.card===id)};
}
// Expected resulting values are handwritten from the design, not calculated from acts.
const PASS={
  302:{atk:[650,300,200]},
  303:{hp:500,atk:[650,550,450]},
  304:{patch:{choice:1},atk:[400,400,200],first:0},
  305:{atk:[500,300,200],foeAtk:[210,90,0]},
  306:{atk:[550,450,350],hand:1,deck:25},
  307:{patch:{choice:1},atk:[400,500,200],first:0},
  308:{atk:[750,650,550],deck:23},
  309:{hp:850,atk:[550,450,350]},
  310:{hp:800,atk:[800,700,600]},
  311:{patch:{choice:1},foeAtk:[260,240,120],first:0},
  312:{hp:750,foeAtk:[360,160,120]},
  313:{patch:{hp:500},hp:500,foeAtk:[180,120,60]},
  314:{atk:[550,300,200],first:0},
  315:{hp:700,foeAtk:[0,240,120]},
  316:{hand:2,deck:24,foeAtk:[260,140,20]},
  317:{patch:{choice:1},atk:[400,500,200],first:0},
  318:{patch:{choice:1},atk:[400,600,200]},
  319:{foeAtk:[160,40,0],foeChoice:1},
  320:{spec:3,hand:1,deck:25},
  321:{atk:[480,380,280],hand:1,deck:25},
  322:{hp:750,hand:1,deck:25},
  323:{hp:700,foeAtk:[210,90,0]},
  324:{atk:[650,300,200],foeAtk:[360,240,0]},
  325:{hp:800,atk:[500,300,200]},
  326:{hp:800,atk:[200,150,100],void:true},
  327:{dp:1,atk:[600,500,400],first:0},
  328:{atk:[300,200,100],flag:'revive'},
  329:{foeDeck:25,hand:1,deck:25},
  330:{patch:{hp:400},hp:400,atk:[650,550,450]},
  331:{foeChoice:1,foeAtk:[360,140,120]},
  332:{hp:900,dp:1,foeDeck:24},
  333:{hp:500,atk:[700,600,500]},
  334:{foeAtk:[260,240,120],flag:'eatup'},
  335:{atk:[550,300,200],foeAtk:[180,240,120]},
  336:{atk:[300,200,100],void:true},
  337:{atk:[400,450,200],flag:'eatup'},
  338:{patch:{hp:300},hp:300,atk:[600,500,400],foeAtk:[460,340,220]},
  339:{hp:750,atk:[500,300,200]},
  340:{hp:700,foeAtk:[260,240,120]},
  341:{atk:[650,300,200],foeAtk:[260,240,120]},
  342:{hp:800,flag:'counter'},
  343:{atk:[400,450,200],foeAtk:[360,90,120]},
  344:{hp:500,atk:[550,300,200],first:0},
  345:{dp:1,atk:[700,600,500],hand:1,deck:25},
  346:{hp:1000,foeAtk:[160,40,0]}
};
// Each gate gets a negative scenario, including insufficient resources and boundaries.
const FAIL={
  302:[{spec:1}],303:[{hp:100}],304:[{choice:0}],305:[{spec:1}],306:[{spec:1}],307:[{choice:0}],
  308:[{spec:1},{deck:2}],309:[{spec:1}],310:[{hp:900},{hp:1000}],
  311:[{spec:0},{choice:0}],312:[{spec:0}],313:[{hp:510}],314:[{spec:0},{choice:1}],315:[{spec:0}],316:[{spec:0}],317:[{spec:0}],318:[{spec:0},{choice:0}],319:[{spec:0}],
  321:[{spec:0}],322:[{spec:0}],323:[{spec:0}],324:[{spec:0}],325:[{spec:0}],326:[{spec:0}],327:[{spec:0},{dp:0}],328:[{spec:0}],
  329:[{spec:0}],330:[{spec:0},{hp:410}],331:[{spec:0}],332:[{spec:0},{dp:0}],333:[{foeSpec:0},{hp:100}],334:[{spec:0}],335:[{spec:0}],336:[{foeSpec:0}],337:[{hp:900},{hp:1000}],
  338:[{spec:0},{hp:310}],339:[{spec:0}],340:[{spec:0}],341:[{spec:0}],342:[{foeChoice:1},{foeChoice:2}],343:[{spec:0}],344:[{spec:0},{hp:100}],345:[{spec:0},{dp:0}],346:[{spec:0},{hp:900},{hp:1000}]
};
const CROSS=['1st Attack','○ to 0','△ Counter','Ice Foe x3','1st Attack','○ Counter','Crash','Jamming','1st Attack','1st Attack','○ to 0','○ Counter','1st Attack','○ to 0','Jamming','1st Attack','△ to 0','Jamming','○ Counter','1st Attack','○ to 0','Jamming','✕ to 0','Eat-up HP','Jamming','1st Attack','△ to 0','Jamming','○ to 0','Eat-up HP','△ to 0','Darkness Foe x3','Eat-up HP','○ Counter','Darkness Foe x3','1st Attack','Crash','○ Counter','Darkness Foe x3','○ to 0','○ Counter','1st Attack','1st Attack','△ Counter','Darkness Foe x3'];
function verify() {
  let scenarios=0;
  assert.strictEqual(Object.keys(PASS).length,45);
  const supports=new Set();
  for(let id=302;id<=346;id++) {
    const c=E.card(id),base=E.card(c.custom),q=PASS[id];
    assert.notDeepStrictEqual([c.hp,c.dp,c.pp,...c.atk.map(a=>a.power)],[base.hp,base.dp,base.pp,...base.atk.map(a=>a.power)],c.name+' is still a stat clone');
    assert.strictEqual(E.XFX[c.xfx],CROSS[id-302]);
    assert.notStrictEqual(c.xfx,base.xfx,c.name+' cross still donor');
    assert.notDeepStrictEqual([c.prio,c.conds,c.acts,c.text],[base.prio,base.conds,base.acts,base.text],c.name+' support still donor');
    supports.add(JSON.stringify([c.prio,c.conds,c.acts,c.text]));
    const peers=E.CARDS.filter(a=>a.custom==null&&a.type==='digimon'&&a.spec===c.spec&&a.level===c.level);
    for(const [label,value,values] of [['HP',c.hp,peers.map(a=>a.hp)],['DP',c.dp,peers.map(a=>a.dp)],['+P',c.pp,peers.map(a=>a.pp)],...c.atk.map((a,k)=>['power'+k,a.power,peers.map(b=>b.atk[k].power)])]){
      assert(Number.isInteger(value)&&value>=Math.min(...values)&&value<=Math.max(...values),c.name+' '+label+' outside disc range');
    }
    const r=setup(id,q.patch),s=r.order.s;
    assert(r.support.ok&&!r.support.voided,c.name+' support should activate');
    for(const [field,value] of Object.entries({atk:[400,300,200],hp:600,dp:2,deck:26,hand:0,spec:c.spec,...q})) {
      if(['patch','first','void','flag','foeAtk','foeChoice','foeDeck'].includes(field))continue;
      assert.deepStrictEqual(['hand','dp'].includes(field)?s[0][field].length:s[0][field],value,c.name+' '+field);
    }
    assert.deepStrictEqual(s[1].atk,q.foeAtk||[360,240,120],c.name+' foe attacks');
    assert.strictEqual(s[1].choice,q.foeChoice||0,c.name+' foe choice');
    assert.strictEqual(s[1].deck,q.foeDeck||27,c.name+' foe deck');
    assert.strictEqual(r.order.first,q.first==null?1:q.first,c.name+' order');
    if(q.flag)assert(r.events.some(e=>e.t==='flag'&&e.flag===q.flag),c.name+' flag');
    if(q.void)assert(r.events.some(e=>e.t==='void'&&e.p===1&&e.all===false),c.name+' Digimon-only void');
    scenarios++;
    for(const patch of FAIL[id]||[]) {
      const f=setup(id,{...q.patch,...patch}),s=f.order.s;
      assert.strictEqual(f.support.ok,false,c.name+' condition should fail: '+JSON.stringify(patch));
      assert.deepStrictEqual(s[0].atk,[400,300,200],c.name+' failed effect changed attacks');
      assert.deepStrictEqual(s[1].atk,[360,240,120],c.name+' failed effect changed foe attacks');
      assert.strictEqual(s[0].hp,patch.hp??q.patch?.hp??600,c.name+' failed effect changed HP');
      assert.strictEqual(s[0].dp.length,patch.dp??2,c.name+' failed cost spent DP');
      assert.strictEqual(s[0].deck,patch.deck??26,c.name+' failed cost spent deck');
      assert.strictEqual(s[1].deck,27,c.name+' failed mill');
      assert.strictEqual(s[0].hand.length,0,c.name+' failed draw');
      scenarios++;
    }
  }
  assert.strictEqual(supports.size,45);
  assert.strictEqual(E.card(303).atk[0].name,'Corona\uff70Knuckles');
  assert.strictEqual(E.card(335).atk[0].name,'Giga Destroyer\u2161');
  assert.strictEqual(E.card(341).atk[2].name,'Great Strike\u2161');
  const copied=setup(320);E.endTurn(copied.G);
  assert.strictEqual(copied.G.players[0].active.spec,3,'Renamon changes the active Specialty beyond this battle');scenarios++;
  // DP scaling counts only Nature, not all DP cards or their summed +P.
  const G=E.newGame({names:['A','B'],seed:9,decks:[{cards:Array(30).fill(FILL)},{cards:Array(30).fill(FILL)}]});
  const prepare=(P,spec)=>{P.active={stack:[2],armor:-1,hp:2000,spec,base:[400,300,200],abn:0};P.dp=[];P.hand=[];};
  prepare(G.players[0],2);prepare(G.players[1],0);G.players[0].dp=[NATURE,FILL,NATURE];G.players[0].hand=[321];E.setSupport(G,0,0);
  let ev=E.resolveBattle(G,[0,0],[]);assert.deepStrictEqual(ev.find(e=>e.t==='order').s[0].atk,[480,380,280]);scenarios++;
  // Revive awards the lost point and restores exactly 300; deciding KO stays lost.
  for(const wins of [0,2]) {
    const H=E.clone(G);H.winner=null;H.tp=1;prepare(H.players[0],2);prepare(H.players[1],0);H.players[0].active.hp=100;H.players[1].active.base=[900,0,0];H.players[1].wins=wins;H.players[0].hand=[328];E.setSupport(H,0,0);
    ev=E.resolveBattle(H,[0,0],[]);assert.strictEqual(H.players[1].wins,wins+1);
    if(wins===0){assert.strictEqual(H.players[0].active.hp,300);assert(ev.some(e=>e.t==='ko'&&e.how==='revive'));}
    else {assert.strictEqual(H.winner,1);assert.strictEqual(H.players[0].active,null);}
    scenarios++;
  }
  // Void outruns a lower-tier Digimon support, but not an Option support.
  for(const id of [326,336])for(const target of ['Agumon','Attack Chip']) {
    const H=E.clone(G);H.tp=1;prepare(H.players[0],E.card(id).spec);prepare(H.players[1],3);H.players[0].hand=[id];H.players[1].hand=[byName(target)];E.setSupport(H,0,0);E.setSupport(H,1,0);
    ev=E.resolveBattle(H,[0,0],[]);const targetEvent=ev.find(e=>e.t==='support'&&e.card===byName(target));
    assert.strictEqual(!!targetEvent.voided,target==='Agumon');scenarios++;
  }
  console.log('PASS: 45 original designs within disc stat ranges; '+scenarios+' support scenarios including failed gates, costs, scaling, revive and Digimon-only void.');
  return scenarios;
}
function soak(games=750) {
  const options=['Attack Chip','Defense Disk ○','Recovery Floppy','Speed Digivolve'];
  const optionCards=options.map(byName);
  const custom=[],disc=[],mixed=[];
  for(let spec=0;spec<5;spec++) {
    const cards=E.CARDS.filter(c=>c.custom!=null&&c.id>=302&&c.spec===spec);
    const ids=cards.flatMap(c=>Array(c.level===0?3:2).fill(c.id));
    while(ids.length<30)ids.push(optionCards[(ids.length-21)%optionCards.length]);
    custom.push({name:E.SPEC[spec]+' TS',cards:ids,armor:0});
    disc.push({name:E.SPEC[spec]+' disc bases',cards:ids.map(id=>E.card(id).custom??id),armor:0});
    const mix=[];
    for(const levelStart of [0,3,6])for(let j=0;j<3;j++)mix.push(...Array(levelStart===0?3:2).fill(302+((spec+j)%5)*9+levelStart+j));
    while(mix.length<30)mix.push(optionCards[(mix.length-21)%optionCards.length]);
    mixed.push({name:E.SPEC[spec]+' triad',cards:mix,armor:0});
  }
  const stats={games,timeouts:0,maxTurns:0,turns:0,wins:{},supports:new Set(),seen:new Set(),failed:0};
  for(let k=0;k<games;k++){
    const a=(k>=600?mixed:custom)[k%5],b=(k>=600?[mixed,custom,disc][Math.floor(k/25)%3]:(Math.floor(k/25)%2?custom:disc))[Math.floor(k/5)%5];
    const G=E.newGame({names:[a.name,b.name],decks:[a,b],seed:16000+k});let guard=0;
    while(G.winner===null&&guard++<400){
      E.beginTurn(G);if(G.winner!==null)break;const p=G.tp,o=p^1;AI.prep(G,p);if(G.winner!==null)break;AI.digivolvePhase(G,p);
      if(E.battleOn(G)){const attacks=[AI.chooseAttack(G,0,.9),AI.chooseAttack(G,1,.9)];E.setSupport(G,o,AI.chooseSupport(G,o,attacks[o],.9));E.setSupport(G,p,AI.chooseSupport(G,p,attacks[p],.9));const ev=E.resolveBattle(G,attacks,[]);
        ev.filter(e=>e.t==='support'&&e.card>=302).forEach(e=>{stats.seen.add(e.card);if(e.ok&&!e.voided)stats.supports.add(e.card);else stats.failed++;});}
      for(const P of G.players){assert.strictEqual(P.deck.length+P.hand.length+P.dp.length+P.offline.length+(P.active?P.active.stack.length:0)+(P.sup?1:0),30);assert(P.hand.length<=E.HAND_MAX&&P.dp.length<=E.DP_MAX);if(P.active)assert(Number.isInteger(P.active.hp)&&P.active.hp>=0&&P.active.hp<=9990);}
      E.endTurn(G);
    }
    if(G.winner===null)stats.timeouts++;else {const key=(k>=600?'Mixed decks':(Math.floor(k/25)%2?'TS vs TS':'TS vs bases'))+': '+G.players[G.winner].name;stats.wins[key]=(stats.wins[key]||0)+1;}
    stats.turns+=G.turn;stats.maxTurns=Math.max(stats.maxTurns,G.turn);
  }
  assert.strictEqual(stats.timeouts,0);stats.avgTurns=+(stats.turns/games).toFixed(1);stats.supports=[...stats.supports].sort((a,b)=>a-b);stats.seen=[...stats.seen].sort((a,b)=>a-b);assert.strictEqual(stats.supports.length,45,'soak never activated some custom supports');
  console.log(JSON.stringify(stats));return stats;
}
module.exports={verify,soak};
if(require.main===module){verify();if(process.argv.includes('--soak'))soak();}
