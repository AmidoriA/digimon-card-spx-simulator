// Run every Digimon's three attack/hit scripts in all three styles, and validate refined meshes.
// This checks animation logic; the browser preview separately checks real WebGL shaders.
const fs = require('fs'), path = require('path'), vm = require('vm'), zlib = require('zlib'), assert = require('assert');
const web = path.join(__dirname, '..', 'web');
const data = require(path.join(web, 'js/data/cards.js'));
let interval = null;
let seed = 1;
let clock = 0;
const math = Object.create(Math);
math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const gl = new Proxy({}, { get: (t, k) => {
  if (k === 'getShaderParameter' || k === 'getProgramParameter') return () => true;
  if (k === 'getAttribLocation') return () => 0;
  if (k === 'checkFramebufferStatus') return () => 1;
  if (k === 'getParameter') return () => 16384;
  if (/^[A-Z_0-9]+$/.test(k)) return 1;
  return () => ({});
} });
class TestImage {
  set src(url) {
    assert(fs.existsSync(path.join(web, url)), 'missing image ' + url);
    if (url.includes('/arena-hd/')) { const info = JSON.parse(fs.readFileSync(path.join(web,url.replace('.webp','.json')))); this.width=info.width;this.height=info.height; }
    else { this.width = 256; this.height = 256; }
    queueMicrotask(() => this.onload());
  }
}
const canvas = { getContext: () => gl, hidden: true, width: 1280, height: 960, classList: { toggle() {} } };
const sandbox = {
  window: { DDCB_DATA: data }, console, performance: { now: () => clock }, Math: math, Promise, Blob, Response, TextDecoder, DecompressionStream,
  Image: TestImage, Int16Array, Uint16Array, Uint8Array, Int32Array, Float32Array, Float64Array, DataView,
  document: { getElementById: id => id === 'b3d' ? canvas : null, createElement: () => ({ width:0,height:0,getContext:()=>({drawImage(){}}) }) },
  fetch: async url => { const p = path.join(web, url); return fs.existsSync(p) ? new Response(fs.readFileSync(p)) : new Response('', { status: 404 }); },
  setInterval: fn => { interval = fn; return 1; }, clearInterval: () => { interval = null; }
};
vm.createContext(sandbox);
for (const f of ['data/effects.js', 'effects.js', 'battlehd.js', 'battleultra.js', 'battle3d.js']) vm.runInContext(fs.readFileSync(path.join(web, 'js', f), 'utf8'), sandbox);
const B = sandbox.window.DDCB_B3D, HD = sandbox.window.DDCB_BATTLE_HD;
const cards = data.cards.filter(c => c.type === 'digimon');
async function waitFor(check) {
  const deadline = Date.now() + 5000;
  while (!check() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
}
function mesh(model) {
  const bytes = zlib.gunzipSync(fs.readFileSync(path.join(web, 'assets/models', String(model).padStart(3, '0') + '.bin.gz')));
  const w = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const u = new Uint16Array(w.buffer), nv = u[4], nto = u[5], ntb = u[6], off = 10 + w[2] * 4;
  return { n: w[2], nv, nto, ntb, vb: new Float32Array(w.slice(off, off + nv * 13)), ib: u.slice(off + nv * 13, off + nv * 13 + (nto + ntb) * 3) };
}
(async () => {
  let vertices = 0, triangles = 0;
  for (const model of new Set(cards.map(c => c.model))) {
    const m = mesh(model), before = m.vb.slice(), hd = HD.refine(m), smooth = HD.smooth(m);
    assert(hd.vb.every(Number.isFinite), 'non-finite mesh ' + model);
    assert(hd.ib.every(i => i < hd.vb.length / 13), 'invalid index ' + model);
    assert(hd.ib.length === (hd.nto + hd.ntb) * 3);
    assert.deepStrictEqual(m.vb, before, 'modified original mesh ' + model);
    assert(smooth.vb.every(Number.isFinite), 'non-finite Smooth mesh ' + model);
    assert(smooth.ib.every(i => i < smooth.nv), 'invalid Smooth index ' + model);
    assert(smooth.ib.length === m.ib.length * 16, 'Smooth did not subdivide twice ' + model);
    for (let i = 0; i < smooth.vb.length; i += 13) {
      assert(Number.isInteger(smooth.vb[i + 11]), 'Smooth changed body-part index');
      assert(Number.isInteger(smooth.vb[i + 12]), 'Smooth changed palette index');
    }
    for (let i = 0; i < hd.vb.length; i += 13) {
      assert(Number.isInteger(hd.vb[i + 11]), 'interpolated body index');
      assert(Number.isInteger(hd.vb[i + 12]), 'interpolated palette index');
    }
    vertices += hd.vb.length / 13; triangles += hd.ib.length / 3;
  }
  console.log('Refined all %d card models: %d vertices, %d triangles; original meshes preserved.', new Set(cards.map(c => c.model)).size, vertices, triangles);
  let count = 0, max = 0;
  for (const c of cards) for (let k = 0; k < 3; k++) {
    const atk = c.atk[k], opts = { models: [c.model, cards[0].model], attacker: 0, first: 0, script: atk.script, hit: atk.hit,
      attack: k, name: atk.name, specialty: c.spec, accent: atk.accent, hp: [1000, 700], hpBefore: 1000, damage: 300, sound: false, dry: true };
    seed = 123; B.setStyle('legacy'); const old = await B.attack(opts);
    seed = 123; B.setStyle('enhanced'); const modern = await B.attack(opts);
    seed = 123; B.setStyle('ultra'); const ultra = await B.attack(opts);
    assert(old && modern, 'failed ' + c.name + ' / ' + atk.name);
    assert(old.frames < 4000, 'timeout ' + c.name + ' / ' + atk.name);
    assert.deepStrictEqual(old, modern, 'changed original timing/effects ' + c.name + ' / ' + atk.name);
    assert.deepStrictEqual(old, ultra, 'Ultra changed original timing/effects ' + c.name + ' / ' + atk.name);
    max = Math.max(max, modern.frames); count++;
    if (count % 90 === 0) console.log('Checked %d / %d attacks in three styles.', count, cards.length * 3);
  }
  for (const mode of ['zero', 'countered']) {
    const c = cards[0], a = c.atk[0];
    const result = await B.attack({ models: [c.model, c.model], attacker: 0, script: a.script, hit: a.hit, mode, dry: true });
    assert(result.frames < 4000 && result.sprites === 0 && result.quads === 0, mode + ' emitted attacks');
  }
  const c = cards.find(c => c.name === 'Agumon'), a = c.atk[0];
  const arenas = JSON.parse(fs.readFileSync(path.join(web,'assets/battle/arenas.json')));
  const sample = { models: [c.model, cards[0].model], attacker: 0, script: a.script, hit: a.hit, arena: arenas[0],
    name: a.name, hp: [1000, 700], hpBefore: 1000, damage: 300, sound: false };
  const stale = B.attack({ ...sample, dry: true });
  const replacement = B.attack({ ...sample, dry: true });
  assert.strictEqual(await stale, false, 'superseded loading request started a scene');
  assert((await replacement).frames > 0, 'replacement scene failed');
  const populations = {};
  for (const style of ['legacy', 'enhanced', 'ultra']) {
    B.setStyle(style); B.paused = true;
    const playback = B.attack(sample);
    await waitFor(() => B.busy());
    assert(B.busy(), 'live preview failed to start');
    B.advance(120); B.advance(48);
    const sc = B._debug();
    assert(sc && sc.frame === 168, 'frame stepping did not preserve the paused moment');
    const stats = B.stats();
    assert(sc.modern.length <= HD.quality(style).particles, 'particle budget exceeded');
    assert.strictEqual(stats.width, HD.quality(style).scale * 320, 'wrong rendering resolution');
    assert.strictEqual(stats.shadows, style === 'ultra', 'wrong shadow mode');
    assert.strictEqual(stats.arenaTextureScale, style === 'legacy' ? 1 : 4, 'wrong arena texture mode');
    populations[style] = sc.modern.length;
    if (style === 'legacy') assert(sc.modern.length === 0, 'legacy emitted modern particles');
    else assert(sc.modern.length > 0, 'enhanced attack emitted no accents');
    B.setStyle(style === 'legacy' ? 'enhanced' : 'legacy');
    assert.strictEqual(B._debug().frame, 168, 'toggle advanced animation');
    if (style === 'ultra') {
      B.setStyle('ultra');
      const originalScript = sc.script;
      sc.script = () => {}; // Keep a scene alive while simulating sustained slow frame delivery.
      B.paused = false;
      for (let i = 0; i < 150; i++) { clock += 50.1; interval(); }
      assert.strictEqual(B.stats().width, 640, 'Ultra did not adapt to slow rendering');
      assert.strictEqual(B.stats().shadows, true, 'resolution adaptation lost shadows');
      sc.script = originalScript;
    }
    B.stop(); assert.strictEqual(await playback, false, 'stopped playback did not settle');
  }
  assert(populations.ultra > populations.enhanced, 'Ultra did not increase the particle population');
  B.setStyle('ultra'); B.paused = true;
  for (const arena of arenas) {
    const playback = B.attack({ ...sample, arena });
    await waitFor(() => B.busy());
    assert(B.busy(), 'arena preview failed: ' + arena.file);
    B.advance(12);
    assert.strictEqual(B.stats().arenaTextureScale, 4, 'HD arena did not load: ' + arena.file);
    assert(B.stats().arenaAtlases <= 2, 'too many GPU arena atlases retained');
    B.stop(); await playback;
  }
  assert.strictEqual(B.setStyle('nonsense'), 'enhanced');
  B.setStyle('ultra'); B.paused=true;
  const customPlayback=B.attack(sample);
  await waitFor(() => B.busy());
  assert(B.busy());B.advance(120);
  const frame=B._debug().frame;
  const initial=B.getGraphics();
  B.setGraphics({model:'original'});
  assert.strictEqual(B.stats().model,'original');assert.strictEqual(B.getGraphics().lighting,initial.lighting);
  B.setGraphics({model:'smooth',lighting:'legacy',resolution:'medium',arena:'2x'});
  await waitFor(() => B.stats().arenaTextureScale === 2);
  assert.strictEqual(B.stats().width,640);assert.strictEqual(B.stats().model,'smooth');assert.strictEqual(B.stats().shadows,false);
  assert.strictEqual(B.stats().arenaTextureScale,2);assert.strictEqual(B.style,'ultra','changing lighting changed particle level');
  assert.strictEqual(B.getPreset(),'custom');assert.strictEqual(B._debug().frame,frame,'graphics change advanced the animation');
  for(const [resolution,width] of [['ps1',320],['medium',640],['high',960],['maximum',1280],['auto',960]]){
    B.setGraphics({resolution});assert.strictEqual(B.stats().width,width,'incorrect independent resolution');
  }
  B.setGraphics({effects:'legacy'});B.advance(12);assert.strictEqual(B._debug().modern.length,0,'Original effects kept modern particles');
  B.setStyle('legacy');assert.strictEqual(B.getPreset(),'legacy');assert.strictEqual(B.stats().width,320);assert.strictEqual(B.stats().arenaTextureScale,1);
  B.setGraphics({model:'bad',lighting:'bad',resolution:'bad',arena:'bad',effects:'bad'});assert.strictEqual(B.getPreset(),'legacy','invalid settings changed preset');
  B.stop();await customPlayback;
  B.setStyle('ultra');B.paused=true;
  for(const digimon of cards.filter((c,i,all)=>all.findIndex(a=>a.model===c.model)===i).slice(0,6)){
    const atk=digimon.atk[0], playback=B.attack({...sample,models:[digimon.model,cards[0].model],script:atk.script,hit:atk.hit,name:atk.name});
    await waitFor(() => B.busy());
    assert(B.busy(),'Smooth model preview failed');assert(B.stats().smoothModels<=4,'Smooth cache exceeded its budget');
    B.stop();await playback;
  }
  assert(B.stats().smoothModels<=4,'Smooth GPU model budget exceeded');
  console.log('PASS: Smooth meshes, independent settings, fixed/adaptive resolutions, 24 arena atlases and bounded GPU caches.');
  console.log('PASS: %d Digimon, %d attacks × three styles; longest %d frames; misses and counters emit no attack effects.', cards.length, count, max);
})().catch(e => { console.error(e); process.exitCode = 1; });
