// Runs every effect script through web/js/effects.js without a display and reports how long
// each lasts and how much it draws. Usage: node tools/fxtest.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const web = path.join(__dirname, '..', 'web', 'js');
let now = 0, tickFn = null;
const stats = { tri: 0, lin: 0, se: [] };
const glStub = new Proxy({}, { get: (t, k) => k === 'drawArrays' ? (mode, first, n) => { if (mode === 4) stats.tri += n / 3; else stats.lin += n / 2; } : typeof k === 'string' && /^[A-Z_0-9]+$/.test(k) ? (k === 'TRIANGLES' ? 4 : 1) : () => ({}) });
const sandbox = {
  window: {}, performance: { now: () => now }, Promise, Math, Int32Array, Float32Array, console,
  setInterval: (f) => { tickFn = f; return 1; }, clearInterval: () => { tickFn = null; },
  document: { getElementById: () => ({ getContext: () => glStub, width: 320, height: 240, hidden: true }) }
};
sandbox.window.DDCB_SND = { se: (id) => stats.se.push(id.toString(16)) };
vm.createContext(sandbox);
for (const f of ['data/effects.js', 'effects.js']) vm.runInContext(fs.readFileSync(path.join(web, f), 'utf8'), sandbox);
const FX = sandbox.window.DDCB_FX;
FX.locate = (p, kind) => kind ? { x: p ? 276 : 4, y: 96, w: 40, h: 48 } : { x: p ? 165 : 115, y: 99, w: 40, h: 48 };
(async () => {
  for (let n = 0; n < sandbox.window.DDCB_EFFECTS.length; n++) {
    stats.tri = stats.lin = 0; stats.se = [];
    let done = false, frames = 0, peak = 0;
    FX.play(n, 0, 1, 1, 0).then(() => { done = true; });
    while (!done && frames < 2000) {
      const before = stats.tri + stats.lin;
      now += 1000 / 60 + 0.01; if (tickFn) tickFn(); frames++;
      peak = Math.max(peak, stats.tri + stats.lin - before);
      await null;
    }
    console.log('script %s: %d frames, %d quads, %d lines, peak %d prims/frame, sounds %s',
      n.toString(16).padStart(2, '0'), frames, stats.tri / 2, stats.lin, peak, stats.se.join(' ') || '-');
  }
})();
