// Exercise real battle assets with delayed/failed requests; no browser or GPU needed.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const web = path.join(__dirname, '..', 'web'), data = require(path.join(web, 'js/data/cards.js'));
const cards = data.cards.filter(c => c.type === 'digimon');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check) {
  const end = Date.now() + 5000;
  while (!check() && Date.now() < end) await delay(5);
  assert(check(), 'request or scene did not become ready');
}
function harness() {
  const requests = [], gates = new Map(), failures = new Set(), attrs = {};
  let fxPending = 0, fxPeak = 0;
  const overlay = { hidden: true, parentNode: { setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: k => { delete attrs[k]; } } };
  const gl = new Proxy({}, { get: (_, k) => {
    if (k === 'getShaderParameter' || k === 'getProgramParameter') return () => true;
    if (k === 'getAttribLocation') return () => 0;
    if (k === 'getParameter') return () => 16384;
    if (/^[A-Z_0-9]+$/.test(k)) return 1;
    return () => ({});
  } });
  const canvas = { getContext: () => gl, hidden: true, width: 1280, height: 960, classList: { toggle() {} } };
  class AssetImage {
    set src(url) {
      requests.push(url);
      const file = path.join(web, url);
      if (!fs.existsSync(file)) { queueMicrotask(() => this.onerror()); return; }
      if (url.includes('/arena-hd/')) Object.assign(this, JSON.parse(fs.readFileSync(file.replace('.webp', '.json'))));
      else { this.width = 1024; this.height = 864; }
      queueMicrotask(() => this.onload());
    }
  }
  const context = {
    window: {}, console, performance, Promise, Blob, Response, TextDecoder, DecompressionStream, Image: AssetImage,
    setTimeout, clearTimeout, setInterval: () => 1, clearInterval() {},
    document: { getElementById: id => id === 'b3d' ? canvas : id === 'assetLoading' ? overlay : null },
    fetch: async url => {
      requests.push(url);
      if (gates.has(url)) await gates.get(url);
      if (failures.delete(url)) return new Response('', { status: 503 });
      if (url.includes('/fx/')) { fxPending++; fxPeak = Math.max(fxPeak, fxPending); await delay(5); fxPending--; }
      const file = path.join(web, url);
      return fs.existsSync(file) ? new Response(fs.readFileSync(file)) : new Response('', { status: 404 });
    }
  };
  vm.createContext(context);
  for (const file of ['data/effects.js', 'effects.js', 'battlehd.js', 'battleultra.js', 'battle3d.js']) {
    vm.runInContext(fs.readFileSync(path.join(web, 'js', file), 'utf8'), context);
  }
  const B = context.window.DDCB_B3D; B.setStyle('legacy'); B.paused = true;
  return { B, overlay, attrs, requests, failures, gates, fxPeak: () => fxPeak,
    hold(url) { let release; gates.set(url, new Promise(resolve => { release = resolve; })); return release; } };
}
function options(card) {
  const a = card.atk[0];
  return { models: [card.model, card.model], attacker: 0, script: a.script, hit: a.hit, name: a.name,
    hp: [1000, 700], hpBefore: 1000, damage: 300, sound: false };
}
function modelUrl(card) { return 'assets/models/' + String(card.model).padStart(3, '0') + '.bin.gz'; }

(async () => {
  const h = harness(), card = cards.find(c => c.name === 'Agumon');
  h.B.enabled = false;
  assert.strictEqual(await h.B.preload([card]), false);
  assert.strictEqual(h.requests.length, 0, 'animation disabled still downloaded assets');
  h.B.enabled = true;
  const arena = JSON.parse(fs.readFileSync(path.join(web, 'assets/battle/arenas.json')))[0];
  const warming = h.B.preload([card, card], arena);
  assert.strictEqual(h.B.preload([card, card], arena), warming, 'repeated preload did not share work');
  assert.strictEqual(h.overlay.hidden, true, 'background preload covered the board');
  assert.strictEqual(h.attrs['aria-busy'], undefined, 'background preload marked the board busy');
  assert.strictEqual(await warming, true);
  const scripts = JSON.parse(require('zlib').gunzipSync(fs.readFileSync(path.join(web, 'assets/battle/scripts.json.gz'))));
  const packs = new Set(card.atk.flatMap(a => [a.script, a.hit]).map(id => (scripts[id] || []).find(q => q[0] === 11 && q[1] === 16 && !q[2])).filter(Boolean).map(q => 'assets/battle/fx/' + q[3] + '.bin.gz'));
  for (const pack of packs) assert(h.requests.includes(pack), 'missing attack/hit pack ' + pack);
  assert(h.fxPeak() <= 2, 'preload flooded effect downloads');
  assert(h.requests.every((url, i) => h.requests.indexOf(url) === i), 'duplicate asset downloads');
  const before = h.requests.length;
  const playback = h.B.attack({ ...options(card), arena });
  await until(() => h.B.busy());
  assert.strictEqual(h.requests.length, before, 'warmed attack downloaded more assets');
  assert.strictEqual(h.overlay.hidden, true, 'cached attack flashed loading');
  h.B.stop(); await playback;

  const slow = harness(), release = slow.hold(modelUrl(card));
  const first = slow.B.attack(options(card));
  assert.strictEqual(slow.overlay.hidden, true, 'overlay appeared before its grace period');
  await delay(210);
  assert.strictEqual(slow.overlay.hidden, false, 'slow load did not show overlay');
  assert.strictEqual(slow.attrs['aria-busy'], 'true');
  slow.B.stop();
  assert.strictEqual(slow.overlay.hidden, true, 'cancel left overlay visible');
  release(); assert.strictEqual(await first, false, 'cancelled loading started a scene');
  assert.strictEqual(slow.attrs['aria-busy'], undefined);

  const race = harness(), other = cards.find(c => c.model !== card.model);
  const releaseOld = race.hold(modelUrl(card));
  race.failures.add(modelUrl(card));
  const old = race.B.attack(options(card));
  const releaseNew = race.hold(modelUrl(other));
  const current = race.B.attack(options(other));
  await delay(210); releaseOld();
  assert.strictEqual(await old, false);
  assert.strictEqual(race.overlay.hidden, false, 'stale failure hid replacement loading');
  releaseNew(); await until(() => race.B.busy());
  assert.strictEqual(race.overlay.hidden, true, 'ready scene kept overlay visible');
  race.B.stop(); await current;

  const retry = harness(), failedPack = [...packs][0];
  retry.failures.add(failedPack);
  await retry.B.preload([card]);
  retry.B.stop(); await retry.B.preload([card]);
  assert.strictEqual(retry.requests.filter(url => url === failedPack).length, 2, 'failed effect stayed cached');
  const failed = harness(); failed.failures.add(modelUrl(card));
  assert.strictEqual(await failed.B.attack(options(card)), false);
  assert.strictEqual(failed.overlay.hidden, true, 'failed attack left overlay visible');
  assert.strictEqual(failed.attrs['aria-busy'], undefined);
  console.log('PASS: disabled/background preloads, all attack/hit packs, two workers, shared requests, cached playback, slow loads, cancellation, stale failures and retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });
