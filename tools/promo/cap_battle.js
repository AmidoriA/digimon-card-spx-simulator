// usage: node cap_battle.js <outdir> <style> <card> <attack> <opponent> <arenaIndex> <step> [maxFrames] [startFrame]
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const [outdir, style, cardName, atk, oppName, arenaIdx, step, maxF, startF] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(outdir, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 1080 } });
  p.on('console', m => { if (m.type()==='error') console.log('ERR', m.text()); });
  if (process.env.RES) await p.addInitScript(r => { window.__res = r; }, process.env.RES);
  await p.goto((process.env.SITE || 'http://127.0.0.1:8765/') + 'battle-preview.html');
  await p.addStyleTag({ content: '.battle-view{position:fixed!important;inset:0!important;width:1440px!important;height:1080px!important;border:0!important;border-radius:0!important;z-index:99;aspect-ratio:auto!important}.preview-empty{display:none!important}' });
  await p.waitForFunction(() => !document.getElementById('previewPlay').disabled);
  const info = await p.evaluate(async ([style, cardName, atk, oppName, arenaIdx]) => {
    const B = window.DDCB_B3D, cards = window.DDCB_DATA.cards;
    B.setStyle(style); if (window.__res) B.setGraphics({ resolution: window.__res });
    const card = cards.find(c => c.name === cardName && c.type === 'digimon'), opp = cards.find(c => c.name === oppName && c.type === 'digimon');
    const list = await (await fetch('assets/battle/arenas.json')).json();
    const arena = list.find(a => String(a.index) === arenaIdx) || list[0];
    const k = +atk, attack = card.atk[k];
    B.paused = true;
    window.__done = false;
    B.attack({ models: [card.model, opp.model], attacker: 0, first: 0, script: attack.script, hit: attack.hit,
      attack: k, name: attack.name, specialty: card.spec, arena, sound: false, hp: [1200, 900], hpBefore: 1200, damage: 300 }).then(() => window.__done = true);
    for (let i = 0; i < 400 && !B._debug(); i++) await new Promise(r => setTimeout(r, 25));
    return { name: attack.name, arena: arena.file, scene: !!B._debug(), stats: B.stats() };
  }, [style, cardName, atk, oppName, arenaIdx]);
  console.log(JSON.stringify(info));
  const st = +step || 2, max = +maxF || 2000, start = +startF || 0;
  if (start) await p.evaluate(n => { const B = window.DDCB_B3D; while (n > 0 && B._debug()) { B.advance(Math.min(n, 120)); n -= 120; } }, start);
  let n = 0;
  const view = await p.$('.battle-view');
  while (n < max) {
    const alive = await p.evaluate(s => { const B = window.DDCB_B3D; if (!B._debug()) return false; B.advance(s); return !!B._debug(); }, st);
    if (!alive) break;
    await view.screenshot({ path: `${outdir}/${String(n).padStart(4,'0')}.png` });
    n++;
  }
  console.log('frames', n);
  await b.close();
})();
