// usage: node rec_board.js <outdir> <seconds> <style>
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const [outdir, secs, style] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(outdir, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.addInitScript(s => { try { localStorage.setItem('ddcb-battle-style', s); localStorage.removeItem('ddcb-battle-graphics'); } catch (e) {} }, style || 'enhanced');
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type()==='error') console.log('ERR', m.text()); });
  await p.goto((process.env.SITE || 'http://127.0.0.1:8765/') + 'index.html'); await p.waitForTimeout(1500);
  await p.click('text=Start battle'); await p.evaluate(() => { const c = document.getElementById('anim3d'); if (c.checked) c.click(); });
  await p.waitForTimeout(300);
  // simple bot for player 0
  await p.evaluate(() => {
    setInterval(() => {
      const S = DDCB_UI.state, E = DDCB;
      const ask = document.getElementById('ask');
      if (ask && !ask.hidden) { document.getElementById('askYes').click(); return; }
      if (!S.resolve || S.actor !== 0 || window.__hold) return;
      const G = S.G, P = G.players[0];
      window.__hold = true; setTimeout(() => { window.__hold = false; }, 900);
      const pick = f => { for (let i = 0; i < P.hand.length; i++) if (f(i)) return i; return -1; };
      let i;
      switch (S.step) {
        case 'entrance': i = pick(k => E.canEnter(G, 0, k)); DDCB_UI.act(i >= 0 ? { t: 'card', i } : { t: 'changeAll' }); break;
        case 'prepEnd': DDCB_UI.act({ t: 'ok' }); break;
        case 'dp': i = pick(k => E.canAddDP(G, 0, k)); DDCB_UI.act(i >= 0 ? { t: 'card', i } : { t: 'skip' }); break;
        case 'evo': { const m = E.evoMoves(G, 0).filter(m => m.kind === 'normal'); DDCB_UI.act(m.length ? { t: 'card', i: m[0].target } : { t: 'skip' }); break; }
        case 'attack': DDCB_UI.act({ t: 'attack', k: 0 }); break;
        case 'support': DDCB_UI.act({ t: 'support', choice: -1 }); break;
        default: DDCB_UI.act({ t: 'skip' });
      }
    }, 150);
  });
  const cdp = await ctx.newCDPSession(p);
  let n = 0; const times = [];
  cdp.on('Page.screencastFrame', async ev => {
    const f = `${outdir}/${String(n).padStart(5,'0')}.jpg`; n++;
    fs.writeFileSync(f, Buffer.from(ev.data, 'base64')); times.push(ev.metadata.timestamp);
    cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }).catch(()=>{});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  await p.waitForTimeout(+secs * 1000);
  await cdp.send('Page.stopScreencast');
  fs.writeFileSync(`${outdir}/times.json`, JSON.stringify(times));
  console.log('frames', n, 'span', times[times.length-1]-times[0]);
  await b.close();
})();
