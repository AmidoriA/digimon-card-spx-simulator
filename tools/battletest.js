// Run every Digimon's three attack/hit scripts in BOTH styles, and validate refined meshes.
// This checks animation logic; the browser preview separately checks real WebGL shaders.
const fs = require('fs'), path = require('path'), vm = require('vm'), zlib = require('zlib'), assert = require('assert');
const web = path.join(__dirname, '..', 'web');
const data = require(path.join(web, 'js/data/cards.js'));
let interval = null;
let seed = 1;
const math = Object.create(Math);
math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const gl = new Proxy({}, { get: (t, k) => {
  if (k === 'getShaderParameter' || k === 'getProgramParameter') return () => true;
  if (k === 'getAttribLocation') return () => 0;
  if (/^[A-Z_0-9]+$/.test(k)) return 1;
  return () => ({});
} });
class TestImage {
  set src(url) { assert(fs.existsSync(path.join(web, url)), 'missing image ' + url); this.width = 256; this.height = 256; queueMicrotask(() => this.onload()); }
}
const canvas = { getContext: () => gl, hidden: true, width: 1280, height: 960, classList: { toggle() {} } };
const sandbox = {
  window: { DDCB_DATA: data }, console, performance, Math: math, Promise, Blob, Response, TextDecoder, DecompressionStream,
  Image: TestImage, Int16Array, Uint16Array, Uint8Array, Int32Array, Float32Array, Float64Array, DataView,
  document: { getElementById: id => id === 'b3d' ? canvas : null },
  fetch: async url => { const p = path.join(web, url); return fs.existsSync(p) ? new Response(fs.readFileSync(p)) : new Response('', { status: 404 }); },
  setInterval: fn => { interval = fn; return 1; }, clearInterval: () => { interval = null; }
};
vm.createContext(sandbox);
for (const f of ['data/effects.js', 'effects.js', 'battlehd.js', 'battle3d.js']) vm.runInContext(fs.readFileSync(path.join(web, 'js', f), 'utf8'), sandbox);
const B = sandbox.window.DDCB_B3D, HD = sandbox.window.DDCB_BATTLE_HD;
const cards = data.cards.filter(c => c.type === 'digimon');
function mesh(model) {
  const bytes = zlib.gunzipSync(fs.readFileSync(path.join(web, 'assets/models', String(model).padStart(3, '0') + '.bin.gz')));
  const w = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const u = new Uint16Array(w.buffer), nv = u[4], nto = u[5], ntb = u[6], off = 10 + w[2] * 4;
  return { n: w[2], nv, nto, ntb, vb: new Float32Array(w.slice(off, off + nv * 13)), ib: u.slice(off + nv * 13, off + nv * 13 + (nto + ntb) * 3) };
}
(async () => {
  let vertices = 0, triangles = 0;
  for (const model of new Set(cards.map(c => c.model))) {
    const m = mesh(model), before = m.vb.slice(), hd = HD.refine(m);
    assert(hd.vb.every(Number.isFinite), 'non-finite mesh ' + model);
    assert(hd.ib.every(i => i < hd.vb.length / 13), 'invalid index ' + model);
    assert(hd.ib.length === (hd.nto + hd.ntb) * 3);
    assert.deepStrictEqual(m.vb, before, 'modified original mesh ' + model);
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
      attack: k, name: atk.name, specialty: c.spec, hp: [1000, 700], hpBefore: 1000, damage: 300, sound: false, dry: true };
    seed = 123; B.setStyle('legacy'); const old = await B.attack(opts);
    seed = 123; B.setStyle('enhanced'); const modern = await B.attack(opts);
    assert(old && modern, 'failed ' + c.name + ' / ' + atk.name);
    assert(old.frames < 4000, 'timeout ' + c.name + ' / ' + atk.name);
    assert.deepStrictEqual(old, modern, 'changed original timing/effects ' + c.name + ' / ' + atk.name);
    max = Math.max(max, modern.frames); count++;
    if (count % 90 === 0) console.log('Checked %d / %d attacks in both styles.', count, cards.length * 3);
  }
  for (const mode of ['zero', 'countered']) {
    const c = cards[0], a = c.atk[0];
    const result = await B.attack({ models: [c.model, c.model], attacker: 0, script: a.script, hit: a.hit, mode, dry: true });
    assert(result.frames < 4000 && result.sprites === 0 && result.quads === 0, mode + ' emitted attacks');
  }
  const c = cards.find(c => c.name === 'Agumon'), a = c.atk[0];
  const sample = { models: [c.model, cards[0].model], attacker: 0, script: a.script, hit: a.hit,
    name: a.name, hp: [1000, 700], hpBefore: 1000, damage: 300, sound: false };
  const stale = B.attack({ ...sample, dry: true });
  const replacement = B.attack({ ...sample, dry: true });
  assert.strictEqual(await stale, false, 'superseded loading request started a scene');
  assert((await replacement).frames > 0, 'replacement scene failed');
  for (const style of ['legacy', 'enhanced']) {
    B.setStyle(style); B.paused = true;
    const playback = B.attack(sample);
    for (let i = 0; i < 100 && !B.busy(); i++) await new Promise(resolve => setImmediate(resolve));
    assert(B.busy(), 'live preview failed to start');
    B.advance(120); B.advance(48);
    const sc = B._debug();
    assert(sc && sc.frame === 168, 'frame stepping did not preserve the paused moment');
    assert(sc.modern.length <= 112, 'particle budget exceeded');
    if (style === 'legacy') assert(sc.modern.length === 0, 'legacy emitted modern particles');
    else assert(sc.modern.length > 0, 'enhanced attack emitted no accents');
    B.setStyle(style === 'legacy' ? 'enhanced' : 'legacy');
    assert.strictEqual(B._debug().frame, 168, 'toggle advanced animation');
    B.stop(); assert.strictEqual(await playback, false, 'stopped playback did not settle');
  }
  assert.strictEqual(B.setStyle('nonsense'), 'enhanced');
  console.log('PASS: %d Digimon, %d attacks × two styles; longest %d frames; misses and counters emit no attack effects.', cards.length, count, max);
})().catch(e => { console.error(e); process.exitCode = 1; });
