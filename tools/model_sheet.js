// Contact sheets of the 3D battle, for looking at a model next to another: a row for each
// card in each style, a column for each frame. A checking tool (the import-ts-model skill),
// not part of the site: tools/sheet_server.py serves it as /sheet.js and keeps the sheets.
//
// In battle-preview.html, from the browser tool:
//   await new Promise((ok, no) => { const s = document.createElement('script'); s.src = '/sheet.js?' + Date.now(); s.onload = ok; s.onerror = no; document.head.appendChild(s); });
//   await modelSheet({ cards: ['Agumon', 'Guilmon'], attack: 0, frames: [30, 110, 150, 195, 230], out: 'attack1.jpg' })
//
// Options:
//   cards     card names, one row each (in every style)
//   styles    default ['legacy', 'enhanced', 'ultra']: Original PS1, Enhanced, Enhanced Ultra,
//             which draw a model as written, refined and smooth (preset() in battle3d.js)
//   attack    0..2: the card's attack that is played
//   defend    1..3 instead: the opponent attacks the card with that attack (damage motion);
//             ko: true ends at 0 HP (KO motion)
//   win       true: the card's attack takes the opponent to 0 HP (victory motion follows)
//   frames    the scene's frames to draw, rising. Every simulated frame is observed;
//             inspection APIs render only capture frames, when available.
//   inspect   false forces the old render-every-frame path for comparison checks
//   out       file name under the server's save directory (.jpg or .png)
//   cw        width of a cell, default 256 (its height is 3/4 of that)
//   opponent  default 'Garurumon';  arena: index in arenas.json, default the first (a dark one)
// The result names the file and gives `timeline`: for each row the frames at which the
// card's model changed motion or reached its last key ([frame, slot, 'runs' | 'ended']),
// and `sameTimeline`: whether every row's is the same. `errors` counts page errors.
window.__sheetErrors = window.__sheetErrors || [];
if (!window.modelSheet) window.addEventListener('error', function (e) { window.__sheetErrors.push(String(e.message)); });
window.modelSheet = async function (opt) {
  const B = DDCB_B3D, D = DDCB_DATA.cards;
  const arenas = await (await fetch('assets/battle/arenas.json')).json();
  const arena = arenas.find(a => a.index === opt.arena) || arenas[0];
  const cw = opt.cw || 256, ch = cw * 3 / 4, frames = opt.frames, styles = opt.styles || ['legacy', 'enhanced', 'ultra'];
  const rows = [];
  for (const style of styles) for (const name of opt.cards) rows.push({ style, name });
  const sheet = document.createElement('canvas'); sheet.width = cw * frames.length; sheet.height = ch * rows.length;
  const g = sheet.getContext('2d');
  const said = { legacy: 'Original PS1', enhanced: 'Enhanced', ultra: 'Enhanced Ultra (Smooth)' }, timeline = {};
  let shots = 0;
  for (let r = 0; r < rows.length; r++) {
    const card = D.find(c => c.name === rows[r].name && c.type === 'digimon'), opp = D.find(c => c.name === (opt.opponent || 'Garurumon') && c.type === 'digimon');
    if (!card || !opp) throw new Error('no Digimon card ' + (card ? opt.opponent : rows[r].name));
    const k = opt.attack || 0, atk = card.atk[k];
    B.stop(); B.paused = false; B.setStyle(rows[r].style);
    g.imageSmoothingEnabled = rows[r].style !== 'legacy';
    let o;
    if (opt.defend) {
      const oa = opp.atk[opt.defend - 1];
      o = { models: [card.model, opp.model], attacker: 1, first: 1, script: oa.script, hit: oa.hit, attack: opt.defend - 1, name: oa.name, specialty: opp.spec, accent: oa.accent,
        arena: arena, sound: false, hp: [opt.ko ? 0 : 300, 900], hpBefore: 600, damage: opt.ko ? 600 : 300 };
    } else {
      o = { models: [card.model, opp.model], attacker: 0, first: 0, script: atk.script, hit: atk.hit, attack: k, name: atk.name, specialty: card.spec, accent: atk.accent,
        arena: arena, sound: false, hp: [1200, opt.win ? 0 : 900], hpBefore: 1200, damage: opt.win ? 1200 : 300 };
    }
    await new Promise(function (res, reject) {
      o.shown = res;
      const started = B.attack(o);
      // attack() returns false when loading or WebGL setup fails, without calling shown.
      if (started && typeof started.then === 'function') started.then(function (result) {
        if (result === false) reject(new Error('battle scene could not load for ' + rows[r].name));
      }, reject);
    });
    B.paused = true;
    const line = timeline[rows[r].name + ' / ' + said[rows[r].style]] = [];
    let was = null;
    const inspect = opt.inspect !== false && typeof B.advanceInspect === 'function' && typeof B.renderInspect === 'function';
    function observe(sc) {
      if (!sc) return;
      const a = sc.actors[0], state = a.cur < 0 ? 'ended' : 'runs';
      if (a.motion + state !== was) { line.push([sc.frame, a.motion, state]); was = a.motion + state; }
    }
    for (let c = 0; c < frames.length; c++) {
      let sc = B._debug(); if (!sc) break;
      while (sc && sc.frame < frames[c]) {
        if (inspect) {
          // Observe every frame inside the chunk, including short motions between shots.
          B.advanceInspect(Math.min(120, frames[c] - sc.frame), observe);
          sc = B._debug();
        } else {
          B.advance(1); sc = B._debug(); observe(sc);
        }
      }
      if (!sc) break;
      if (inspect) B.renderInspect();
      g.drawImage(document.getElementById('b3d'), c * cw, r * ch, cw, ch);
      g.drawImage(document.getElementById('b3dui'), c * cw, r * ch, cw, ch);
      g.font = '12px sans-serif'; const text = rows[r].name + ' · frame ' + sc.frame + ' · ' + said[rows[r].style];
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(c * cw, r * ch + ch - 18, g.measureText(text).width + 8, 18);
      g.fillStyle = '#fff'; g.fillText(text, c * cw + 4, r * ch + ch - 5);
      shots++;
    }
  }
  B.stop(); B.paused = false;
  const blob = await new Promise(function (res) { sheet.toBlob(res, /\.jpg$/.test(opt.out) ? 'image/jpeg' : 'image/png', 0.9); });
  const resp = await fetch('/save/' + opt.out, { method: 'POST', body: blob });
  const lines = Object.keys(timeline).map(function (key) { return JSON.stringify(timeline[key]); });
  return { saved: resp.ok, out: opt.out, width: sheet.width, height: sheet.height, shots: shots, wanted: rows.length * frames.length,
    errors: window.__sheetErrors.length, sameTimeline: lines.every(function (x) { return x === lines[0]; }), timeline: timeline };
};
