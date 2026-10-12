/*
 * Browser front end. The battle screen is laid out on the game's 320x240 screen
 * (1 unit = 4 CSS px on a 1280x960 stage that is scaled to fit) and built from the
 * game's own battle textures (CBTL_SYS.ARC), upscaled 4x. Slot and bar positions
 * inside each texture are measured from the original art; how the textures are
 * arranged on screen is this project's arrangement.
 */
(function () {
  'use strict';
  var E = window.DDCB, AI = window.DDCB_AI, D = E.DATA, SND = window.DDCB_SND, FXV = window.DDCB_FX, B3D = window.DDCB_B3D;
  // Sound ids traced in the game: the controller plays 0xA0 on a confirming button and 0xA1
  // on cancel, the hand selector 0xA2 when the cursor moves, message windows 0xA3 / 0xA4.
  var SE = { OK: 0xa0, CANCEL: 0xa1, CURSOR: 0xa2, OPEN: 0xa3, CLOSE: 0xa4 };
  // Card object task (0x8003b210): a card that starts moving plays 0xA5, a face-down card
  // that is turned over on the way plays 0xA6 instead, and a card arriving on the Digimon
  // stack or in the DP Slot plays 0xA7 when its 16-frame move ends. The number display
  // (0x8003e4f0) ticks 0xAA on every 4th frame while a shown value is still rolling.
  var CARD = { MOVE: 0xa5, FLIP: 0xa6, LAND: 0xa7, TICK: 0xaa };
  var FRAME = 1 / 60, MOVE_FRAMES = 16, STAGGER = 8 * FRAME;
  // Battle effect scripts (B/CBTL_EFF.ARC) by the message number the game passes to them.
  var FX = { DIGIVOLVE: 0x00, ARMOR: 0x01, FIRST: 0x0a, EATUP: 0x0b, REVIVE_SET: 0x0c, CRASH_SET: 0x0d, COUNTER_SET: 0x0e,
    SPEC: 0x0f, ATTACK_CHANGE: 0x10, VOID: 0x11, VOID_ALL: 0x12, MISFIRE: 0x13, STAT: 0x14,
    HIT: 0x18, COUNTER_HIT: 0x19, EATUP_HIT: 0x1a, CRASH: 0x1b, NO_DAMAGE: 0x1c, REVIVE: 0x1d, DE_ARMOR: 0x1e };
  // digivolve option type -> script: Special, Warp, Speed, Mutant, Digi-devolve, Download, ArmorCrush, De-Armor
  var EVO_FX = [0x03, 0x04, 0x05, 0x07, 0x09, 0x02, 0x06, 0x08];
  var U = 4;
  var SPEC_CLS = ['fire', 'ice', 'nature', 'dark', 'rare'];
  var SPEC_DOT = ['#e5484d', '#3b9eff', '#46a758', '#555', '#e2b714'];
  var ATK_WORD = ['DEADLY ATTACK!', 'NORMAL ATTACK!', 'SPECIAL ATTACK!'];
  var EVO_NAME = ['Special Digivolve', 'Warp Digivolve', 'Speed Digivolve', 'Mutant Digivolve', 'Digi-Devolve', 'Download Digivolve', 'ArmorCrush Digivolve', 'Armor Digi-devolve'];
  var XFX_HELP = [
    '', 'Attack first, regardless of turn.',
    "Lowers the opponent's " + E.ATK[0] + ' attack power to 0.',
    "Lowers the opponent's " + E.ATK[1] + ' attack power to 0.',
    "Lowers the opponent's " + E.ATK[2] + ' attack power to 0.',
    'If the opponent uses ' + E.ATK[0] + ', it misses; counter with its power.',
    'If the opponent uses ' + E.ATK[1] + ', it misses; counter with its power.',
    'If the opponent uses ' + E.ATK[2] + ', it misses; counter with its power.',
    'Attack power becomes same as HP. HP becomes 10.',
    'Recover the same amount of HP as the damage inflicted.',
    "Opponent's support effect is voided. Can't void option effects.",
    'Tripled if the opponent is Fire.', 'Tripled if the opponent is Ice.', 'Tripled if the opponent is Nature.',
    'Tripled if the opponent is Darkness.', 'Tripled if the opponent is Rare.'
  ];

  // ------------------------------------------------------------------ layout (320x240 units)
  // Player 0 = you (blue, bottom); player 1 = opponent (orange, top).
  var L = {
    tray: [{ x: 32, y: 176, w: 256, h: 64, tex: 'tray_blue' }, { x: 32, y: 0, w: 256, h: 63, tex: 'tray_orange' }],
    hand: [[80, 123, 166, 209].map(function (x) { return { x: x, y: 179 }; }), [70, 113, 156, 199].map(function (x) { return { x: x, y: 16 }; })],
    trash: [{ x: 52, y: 179 }, { x: 242, y: 17 }],
    deck: [{ x: 52, y: 203 }, { x: 242, y: 41 }],
    pips: [[180, 195, 210].map(function (y) { return { x: 256, y: y }; }), [17, 32, 47].map(function (y) { return { x: 34, y: y }; })],
    name: [{ x: 38, y: 227, w: 244, h: 11 }, { x: 38, y: 2, w: 244, h: 11 }],
    panel: [{ x: 44, y: 88, tex: 'panel_blue' }, { x: 160, y: 88, tex: 'panel_orange' }],
    mon: [{ x: 115, y: 99 }, { x: 165, y: 99 }],
    monPlate: [{ x: 114, y: 100 }, { x: 164, y: 100 }],
    bars: [{ x: 66, w: 47 }, { x: 207, w: 47 }], barY: [100, 112, 125], barH: [12, 13, 12],
    hp: [{ x: 66, y: 137, w: 47, h: 10 }, { x: 207, y: 137, w: 47, h: 10 }],
    pname: [{ x: 60, y: 89, w: 97, h: 8 }, { x: 164, y: 89, w: 92, h: 8 }],
    dptag: [{ x: 46, y: 89, w: 13, h: 8, c: 'blue' }, { x: 258, y: 89, w: 14, h: 8, c: 'orange' }],
    dpnum: [{ x: 46, y: 98, w: 18, h: 13 }, { x: 257, y: 98, w: 15, h: 14 }],
    dpslot: [{ x: 46, y: 112 }, { x: 255, y: 112 }],
    suplabel: [{ x: 0, y: 68, tex: 'support_blue', tx: 4, ty: 77 }, { x: 272, y: 68, tex: 'support_orange', tx: 276, ty: 70 }],
    sup: [{ x: 4, y: 96 }, { x: 276, y: 96 }],
    // attack panel (CBTL_SYS texture 13, 208x64): it is exactly as wide as the hand
    // slots of the tray, so it is drawn over them; fields measured from the texture
    atk: { x: 80, y: 176, rowY: [14, 26, 38], rowH: 11 }
  };

  // digivolve option card names by type, for sounding the opponent's digivolutions
  var EVO_CARD = [];
  E.CARDS.forEach(function (c) { if (c.type === 'digivolve') EVO_CARD[c.dtype] = c.name; });

  var S = {
    my: null, op: null, previewSide: 'me', skill: 0.7,
    G: null, step: null, sel: -1, myAtk: -1, anim: null, resolve: null, token: 0,
    viewCards: false // while choosing an attack: look at the hand instead of the attack panel
  };

  // ------------------------------------------------------------------ dom helpers
  function $(id) { return document.getElementById(id); }
  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function box(el, x, y, w, hh) {
    el.style.left = x * U + 'px'; el.style.top = y * U + 'px';
    if (w != null) el.style.width = w * U + 'px';
    if (hh != null) el.style.height = hh * U + 'px';
    return el;
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, $('fast').checked ? ms * 0.3 : ms); }); }
  function cls(c) { return c.type === 'digimon' ? SPEC_CLS[c.spec] : 'opt'; }
  function lvl(c) { return c.type === 'digimon' ? E.LEVEL[c.level] : (c.type === 'option' ? 'OP' : 'EV'); }
  function pad3(n) { return ('00' + n).slice(-3); }

  // ------------------------------------------------------------------ setup screen
  function deckKey(d) { return d.name + '|' + d.owner + '|' + d.armor + '|' + d.cards.join(','); }
  var ALL_DECKS = (function () {
    var seen = {}, out = [];
    D.decks.forEach(function (d) { var k = deckKey(d); if (!seen[k]) { seen[k] = 1; out.push(d); } });
    return out;
  })();
  var MY_DECKS = ALL_DECKS.filter(function (d) { return d.owner === 'Player'; })
    .concat(ALL_DECKS.filter(function (d) { return d.owner !== 'Player'; }));
  var OP_DECKS = ALL_DECKS.filter(function (d) { return d.owner !== 'Player'; })
    .sort(function (a, b) { return a.rank - b.rank || a.id - b.id; });

  function deckArmor(d) {
    if (!d.armor) return null;
    for (var k = 0; k < E.PARTNERS.length; k++) {
      if (d.cards.indexOf(E.PARTNERS[k]) >= 0 && E.ARMORS[k][d.armor - 1]) return [E.card(E.PARTNERS[k]), E.card(E.ARMORS[k][d.armor - 1])];
    }
    return null;
  }

  // small card picture for the setup screen (board art, assets/mini)
  function thumb(id) {
    var c = E.card(id), el = h('span', 'th ' + cls(c)), img = document.createElement('img');
    img.src = 'assets/mini/' + pad3(id) + '.webp'; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    el.appendChild(img);
    return el;
  }
  // the cards a deck is recognised by: its strongest Digimon, highest level first
  var faceCache = {};
  function deckFaces(d) {
    if (!faceCache[d.id]) {
      var seen = {}, ids = d.cards.filter(function (id) {
        if (seen[id] || E.card(id).type !== 'digimon') return false;
        seen[id] = 1; return true;
      });
      ids.sort(function (a, b) { var x = E.card(a), y = E.card(b); return y.level - x.level || y.hp - x.hp || a - b; });
      faceCache[d.id] = ids.slice(0, 6);
    }
    return faceCache[d.id];
  }

  function fillDeckList(ul, decks, selId, filter, onPick) {
    clear(ul);
    var f = (filter || '').toLowerCase();
    decks.forEach(function (d) {
      if (f && (d.name + ' ' + d.owner).toLowerCase().indexOf(f) < 0) return;
      var li = h('li');
      li.tabIndex = 0;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', d.id === selId ? 'true' : 'false');
      li.appendChild(h('span', 'dn', d.name));
      li.appendChild(h('span', 'do', d.owner === 'Player' ? 'Starter deck' : d.owner));
      if (d.owner !== 'Player') li.appendChild(h('span', 'dr', 'Lv ' + d.rank));
      var strip = h('span', 'dt');
      deckFaces(d).forEach(function (id) { var t = thumb(id); t.title = E.card(id).name; strip.appendChild(t); });
      li.appendChild(strip);
      li.onclick = function () { onPick(d.id); };
      li.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(d.id); } };
      ul.appendChild(li);
    });
    if (!ul.firstChild) ul.appendChild(h('li', 'do', 'No decks match.'));
  }

  function renderPreview() {
    var d = D.decks[S.previewSide === 'me' ? S.my : S.op];
    $('previewTitle').textContent = d.name + ' — 30 cards';
    var counts = {}, order = [];
    d.cards.forEach(function (id) { if (!counts[id]) { counts[id] = 0; order.push(id); } counts[id]++; });
    var ul = clear($('previewList')), ar = deckArmor(d);
    if (ar) ul.appendChild(h('li', 'note', ar[0].name + ' can armor digivolve to ' + ar[1].name + ' when it enters.'));
    grouped(ul, order, counts);
  }
  var GROUPS = [['Level R', function (c) { return c.type === 'digimon' && c.level === 0; }],
    ['Level C', function (c) { return c.type === 'digimon' && c.level === 2; }],
    ['Level U', function (c) { return c.type === 'digimon' && c.level === 3; }],
    ['Option', function (c) { return c.type !== 'digimon'; }]];
  // one card of a card list; corner = what to write in its lower corner, if anything
  function tile(id, corner, cornerCls) {
    var c = E.card(id), li = h('li', 'tile'), pic = thumb(id);
    pic.appendChild(h('span', 'badge ' + cls(c), lvl(c)));
    if (corner) pic.appendChild(h('span', cornerCls || 'cnt', corner));
    li.appendChild(pic);
    li.appendChild(h('span', 'tn', c.name));
    li.title = c.name + ' — ' + (c.type === 'digimon' ? ('HP ' + c.hp + ' • ' + c.atk.map(function (a) { return a.power; }).join(' / ') + ' • ' + c.text) : c.text);
    return li;
  }
  // the different cards of `order` by level, each with how many there are
  function grouped(ul, order, counts) {
    GROUPS.forEach(function (g) {
      var ids = order.filter(function (id) { return g[1](E.card(id)); });
      if (!ids.length) return;
      ul.appendChild(h('li', 'grp', g[0] + ' — ' + ids.reduce(function (t, id) { return t + counts[id]; }, 0)));
      ids.forEach(function (id) { ul.appendChild(tile(id, '×' + counts[id])); });
    });
  }

  // ------------------------------------------------------------------ looking into the piles
  // The Offline pile, newest card first. While a battle is being played back only the cards
  // that have been shown going there are listed.
  function showTrash(p) {
    var G = S.G;
    if (!G) return;
    var ids = G.players[p].offline.slice(0, view(p).offline).reverse(), ul = clear($('pileList'));
    $('pileTitle').textContent = poss(p) + ' Offline pile — ' + ids.length + (ids.length === 1 ? ' card' : ' cards');
    $('pileNote').textContent = ids.length ? 'Newest first.' : '';
    if (!ids.length) ul.appendChild(h('li', 'empty', 'No cards have gone Offline yet.'));
    ids.forEach(function (id, k) { ul.appendChild(tile(id, String(ids.length - k), 'ord')); });
    $('pile').showModal();
  }
  // What is left of a deck: the cards still in it, by level and not in their order, which
  // nobody knows. A support card lying face down from the deck counts as still in it.
  function showDeck(p) {
    var G = S.G;
    if (!G) return;
    var P = G.players[p], ids = P.deck.slice(), counts = {}, order = [], ul = clear($('pileList'));
    if (P.sup && P.sup.deck) ids.push(P.sup.id);
    ids.forEach(function (id) { if (!counts[id]) { counts[id] = 0; order.push(id); } counts[id]++; });
    order.sort(function (a, b) { return a - b; });
    $('pileTitle').textContent = poss(p) + ' Online deck — ' + ids.length + (ids.length === 1 ? ' card' : ' cards') + ' left';
    $('pileNote').textContent = ids.length ? 'The cards still to come, not in the order they will come.' : '';
    if (!ids.length) ul.appendChild(h('li', 'empty', 'The deck is empty.'));
    grouped(ul, order, counts);
    $('pile').showModal();
  }
  function pilePlate(el, p, show, what) {
    el.classList.add('pile'); el.tabIndex = 0; el.setAttribute('role', 'button');
    el.title = what + ' — click to look';
    el.onclick = function () { show(p); };
    el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(p); } };
    return el;
  }

  function renderSetup() {
    fillDeckList($('myDecks'), MY_DECKS, S.my, $('myFilter').value, function (id) { S.my = id; S.previewSide = 'me'; renderSetup(); });
    fillDeckList($('opDecks'), OP_DECKS, S.op, $('opFilter').value, function (id) { S.op = id; S.previewSide = 'op'; renderSetup(); });
    Array.prototype.forEach.call($('previewTabs').children, function (b) { b.classList.toggle('on', b.dataset.side === S.previewSide); });
    renderPreview();
  }

  // ------------------------------------------------------------------ static stage layer
  function tex(name, x, y, w, hh) {
    var el = h('div', 'tex');
    el.style.backgroundImage = 'url(assets/ui/' + name + '.png)';
    return box(el, x, y, w, hh);
  }
  function buildStatic() {
    var st = clear($('static'));
    st.appendChild(tex('bg', 0, 64, 160, 112));
    st.appendChild(tex('bg', 160, 64, 160, 112));
    L.tray.forEach(function (t) { st.appendChild(tex(t.tex, t.x, t.y, t.w, t.h)); });
    L.panel.forEach(function (p) { st.appendChild(tex(p.tex, p.x, p.y, 116, 60)); });
    L.suplabel.forEach(function (s) {
      st.appendChild(tex(s.tex, s.x, s.y, 48, 20));
      st.appendChild(box(h('div', 'tag sup', 'SUPPORT'), s.tx, s.ty, 40, 10));
    });
    L.dptag.forEach(function (t) { st.appendChild(box(h('div', 'tag ' + t.c, 'DP'), t.x, t.y, t.w, t.h)); });
  }

  // ------------------------------------------------------------------ cards
  function cardEl(id, small) {
    var c = E.card(id), el = h('div', 'c ' + cls(c) + (small ? ' small' : ''));
    el.dataset.id = id;
    var art = h('div', 'ca');
    art.style.backgroundImage = 'url(assets/mini/' + pad3(id) + '.webp)';
    el.appendChild(art);
    var nm = h('div', 'cn', c.name);
    if (!small) { if (c.name.length > 15) nm.style.fontSize = '14px'; else if (c.name.length > 11) nm.style.fontSize = '17px'; }
    else nm.textContent = '+' + c.pp;
    el.appendChild(nm);
    return el;
  }
  function backEl() {
    var el = h('div', 'c back');
    el.style.backgroundImage = 'url(assets/ui/card_back.png)';
    return el;
  }
  function plate(label, extra) { return h('div', 'plate ' + (extra || ''), label); }

  function showInfo(id, yUnits) {
    var c = E.card(id), box0 = clear($('info'));
    box0.hidden = false;
    box0.style.top = (yUnits < 70 ? 68 : yUnits < 160 ? 168 : 102) * U + 'px';
    var art = h('div', 'art'); art.style.backgroundImage = 'url(assets/art/' + pad3(id) + '.webp)'; box0.appendChild(art);
    box0.appendChild(h('div', 'nm', c.name));
    if (c.type === 'digimon') {
      box0.appendChild(h('div', 'ty', E.SPEC[c.spec] + ' ' + E.LEVEL[c.level]));
      var rows = [['HP', c.hp]].concat(c.atk.map(function (a, i) { return [E.ATK[i], a.power]; }));
      rows.forEach(function (r, i) {
        var row = h('div', 'row r' + i);
        row.appendChild(h('span', 'k', r[0])); row.appendChild(h('span', 'v', String(r[1])));
        box0.appendChild(row);
      });
      box0.appendChild(rich(h('div', 'xf'), c.xfx ? E.ATK[2] + ' ' + E.XFX[c.xfx] : ''));
      var b0 = h('div', 'box b0'); b0.appendChild(h('small', null, 'DP')); b0.appendChild(document.createTextNode(String(c.dp))); box0.appendChild(b0);
      var b1 = h('div', 'box b1'); b1.appendChild(h('small', null, '+P')); b1.appendChild(document.createTextNode(String(c.pp))); box0.appendChild(b1);
      var tx = h('div', 'tx');
      tx.appendChild(h('b', null, 'Support effect'));
      tx.appendChild(document.createTextNode(c.text));
      tx.appendChild(h('em', null, c.atk.map(function (a, i) { return E.ATK[i] + ' ' + a.name; }).join('   ')));
      if (c.xfx) tx.appendChild(h('em', null, E.XFX[c.xfx] + ': ' + XFX_HELP[c.xfx]));
      box0.appendChild(tx);
    } else {
      box0.appendChild(h('div', 'ty', c.type === 'option' ? 'Option' : 'Digivolve'));
      box0.appendChild(h('div', 'cover'));
      var t2 = h('div', 'tx'); t2.style.left = '270px'; t2.style.width = '740px';
      t2.appendChild(h('b', null, c.type === 'option' ? 'Option effect' : 'Digivolve option'));
      t2.appendChild(document.createTextNode(c.text));
      box0.appendChild(t2);
    }
  }

  // ------------------------------------------------------------------ view model
  function view(p) {
    var G = S.G, P = G.players[p], A = S.anim, v;
    if (A) {
      var s = A.s[p];
      v = { hand: s.hand, deck: s.deck, offline: s.offline, wins: s.wins, dp: s.dp, top: s.top, hp: s.hp, spec: s.spec,
        atk: s.atk, base: A.base[p], choice: A.reveal ? s.choice : (p === 0 ? S.myAtk : -1),
        sup: A.sup[p] >= 0 ? { id: A.sup[p], face: A.face[p] } : null, ko: A.koShow[p] };
      if (v.ko >= 0) v.top = v.ko;
    } else {
      v = { hand: P.hand, deck: P.deck.length, offline: P.offline.length, wins: P.wins, dp: P.dp,
        top: P.active ? E.top(P).id : -1, hp: P.active ? P.active.hp : 0, spec: P.active ? P.active.spec : 0,
        atk: P.active ? P.active.base : [0, 0, 0], base: P.active ? P.active.base : [0, 0, 0],
        choice: p === 0 ? S.myAtk : -1, sup: P.sup ? { id: P.sup.id, face: !P.sup.deck } : null, ko: -1 };
    }
    v.dpPts = Math.min(v.dp.reduce(function (t, id) { return t + E.card(id).pp; }, 0), 90);
    v.name = P.name;
    return v;
  }

  // ------------------------------------------------------------------ card and number sounds
  var prevView = [null, null];

  function added(now, was) { // how many cards of `now` were not in `was`
    var left = was.slice(), n = 0;
    now.forEach(function (id) { var k = left.indexOf(id); if (k < 0) n++; else left.splice(k, 1); });
    return n;
  }

  // Sound the card moves between the last drawn board and this one, as the game's card
  // objects do when their state changes: to the hand (state 3), Offline (8), the Digimon
  // stack (0xB, landing 0xC), the DP Slot (0x1A, landing 0x1B), the support place from the
  // hand (0x10) or from the Online deck (0x15); a face-down support turned up is 0x19 -> 0x10.
  function cardSounds(p, v) {
    var P = S.G.players[p], o = prevView[p], t = 0, n, k, mv = { hand: {}, top: null, dp: null, sup: null, flip: false };
    var stackN = S.anim ? (o ? o.stackN : 0) : (P.active ? P.active.stack.length : 0);
    var sup = v.sup ? (v.sup.face ? 2 : 1) : 0;
    prevView[p] = { hand: v.hand.slice(), offline: v.offline, top: v.top, dp: v.dp.length, sup: sup, stackN: stackN };
    if (!o) return mv;
    function move(land) {
      SND.se(CARD.MOVE, t);
      if (land) SND.se(CARD.LAND, t + MOVE_FRAMES * FRAME);
      t += STAGGER;
      return t - STAGGER;
    }
    // where a card that left the hand used to be
    function from(id) { k = o.hand.indexOf(id); return k >= 0 ? L.hand[p][Math.min(k, 3)] : null; }
    var left = o.hand.slice();
    v.hand.forEach(function (id, i) {
      k = left.indexOf(id);
      if (k >= 0) left.splice(k, 1); else if (i < 4) mv.hand[i] = { from: L.deck[p], delay: move(false) };
    });
    n = Math.min(v.offline - o.offline, 4); for (k = 0; k < n; k++) move(false);
    if (!S.anim && v.top >= 0 && (stackN > o.stackN || (v.top !== o.top && o.hand.indexOf(v.top) >= 0))) mv.top = { from: from(v.top), delay: move(true) };
    if (v.dp.length > o.dp) {
      mv.dp = { from: from(v.dp[v.dp.length - 1]), delay: t };
      n = Math.min(v.dp.length - o.dp, 4); for (k = 0; k < n; k++) move(true);
    }
    if (sup && !o.sup) mv.sup = { from: sup === 2 ? from(v.sup.id) : L.deck[p], delay: move(false) };
    else if (sup === 2 && o.sup === 1) { mv.flip = true; SND.se(CARD.FLIP, t); t += STAGGER; }
    return mv;
  }

  // Slide a card in from where it came, over the 16 frames the game's card objects take
  // (counter 0x10 in states 3, 0xB, 0x10, 0x15, 0x1A of 0x8003b210).
  function slide(el, to, m) {
    if (!m || !m.from || !el.animate) return;
    el.animate([{ transform: 'translate(' + (m.from.x - to.x) * U + 'px,' + (m.from.y - to.y) * U + 'px)' }, { transform: 'none' }],
      { duration: MOVE_FRAMES * FRAME * 1000, delay: m.delay * 1000, fill: 'backwards', easing: 'linear' });
  }
  function flip(el) {
    if (!el.animate) return;
    el.animate([{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: MOVE_FRAMES * FRAME * 1000, easing: 'linear' });
  }

  // Number roll, as in 0x8003e4f0: five values per player (HP, the three attack powers, DP).
  // Each frame a shown value moves |difference| / 16 + 1 towards the real one; while any is
  // still moving the tick plays on every 4th frame. Without a Digimon the first four are 0.
  var ROLL = { shown: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]], target: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]], el: [[], []], frame: 0, last: 0, timer: 0 };

  function rollReset() {
    for (var p = 0; p < 2; p++) for (var k = 0; k < 5; k++) { ROLL.shown[p][k] = 0; ROLL.target[p][k] = 0; }
    // an empty board, so the first draw of the match is heard
    prevView = [0, 1].map(function () { return { hand: [], offline: 0, top: -1, dp: 0, sup: 0, stackN: 0 }; });
  }
  function rollNum(p, k, el, target) {
    ROLL.target[p][k] = target; ROLL.el[p][k] = el;
    el.textContent = String(ROLL.shown[p][k]);
    if (!ROLL.timer && ROLL.shown[p][k] !== target) { ROLL.last = performance.now(); ROLL.timer = setInterval(rollStep, 1000 / 60); }
  }
  function rollClear(p) { for (var k = 0; k < 4; k++) { ROLL.shown[p][k] = 0; ROLL.target[p][k] = 0; } }
  function rollStep() {
    var now = performance.now(), frames = Math.min(Math.floor((now - ROLL.last) * 60 / 1000), 30), moving = false, tick = false, p, k, d, st;
    if (frames < 1) return;
    ROLL.last += frames * 1000 / 60;
    if (now - ROLL.last > 500) ROLL.last = now;
    while (frames-- > 0) {
      moving = false;
      for (p = 0; p < 2; p++) for (k = 0; k < 5; k++) {
        d = ROLL.target[p][k] - ROLL.shown[p][k];
        if (!d) continue;
        moving = true;
        st = (Math.abs(d) >> 4) + 1;
        ROLL.shown[p][k] += d > 0 ? Math.min(st, d) : -Math.min(st, -d);
      }
      if (!moving) break;
      if ((++ROLL.frame & 3) === 0) tick = true;
    }
    if (tick) SND.se(CARD.TICK);
    for (p = 0; p < 2; p++) for (k = 0; k < 5; k++) if (ROLL.el[p][k]) ROLL.el[p][k].textContent = String(ROLL.shown[p][k]);
    if (!moving) { clearInterval(ROLL.timer); ROLL.timer = 0; }
  }

  // arena table for the Polygon Battle (tools/build_battle.py)
  var ARENAS = [];
  fetch('assets/battle/arenas.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (a) {
    ARENAS = a;
    try { arenaPick = localStorage.getItem('ddcb-arena') || ''; } catch (err) { /* storage unavailable */ }
    if (!a.some(function (x) { return String(x.index) === arenaPick; })) arenaPick = '';
    showArena();
  }).catch(function () { /* no arenas: plain background */ });
  // The arena can be chosen ('' = at random); the game's table has no names for them, and the
  // previews are this project's pictures of them.
  var arenaPick = '';
  function arenaThumb(el, x) {
    el.style.backgroundImage = x ? 'url(assets/battle/arena/' + x.file + '.webp)' : '';
    el.textContent = x ? '' : '?';
  }
  function showArena() {
    var k = ARENAS.map(function (x) { return String(x.index); }).indexOf(arenaPick);
    arenaThumb($('arenaThumb'), ARENAS[k]);
    $('arenaName').textContent = k < 0 ? 'Random' : 'Arena ' + (k + 1);
  }
  function openArenas() {
    var grid = $('arenaGrid');
    clear(grid);
    [null].concat(ARENAS).forEach(function (x, k) {
      var id = x ? String(x.index) : '', b = h('button', 'arena-tile' + (id === arenaPick ? ' on' : '')), t = h('span', 'arena-thumb');
      b.type = 'button';
      arenaThumb(t, x);
      b.appendChild(t); b.appendChild(h('span', '', x ? 'Arena ' + k : 'Random'));
      b.onclick = function () {
        arenaPick = id;
        try { localStorage.setItem('ddcb-arena', id); } catch (err) { /* ignore */ }
        showArena(); $('arenas').close();
      };
      grid.appendChild(b);
    });
    $('arenas').showModal();
  }

  // ------------------------------------------------------------------ battle effects
  // Play effect script n the way the game's launcher (0x801f6294) is called: A is card
  // `kA` of player pA, B card `kB` of player pB (kind 0 = Digimon in play, 1 = support card).
  // The script brings its own sounds. `fxWait` lets the event player wait for the last one.
  var fxWait = null;
  function fx(n, pA, kA, pB, kB) { fxWait = FXV.play(n, pA, kA, pB, kB); return fxWait; }
  FXV.locate = function (p, kind) {
    if (!S.G) return null;
    var v = view(p);
    if (kind === 1) return v.sup ? { x: L.sup[p].x, y: L.sup[p].y, w: 40, h: 48 } : null;
    return v.top >= 0 ? { x: L.mon[p].x, y: L.mon[p].y, w: 40, h: 48 } : null;
  };

  // which of your hand cards can be clicked in the current step
  function handActions() {
    var G = S.G, P = G.players[0], n = P.hand.length, can = [], i;
    for (i = 0; i < n; i++) can.push(false);
    if (S.anim || !S.resolve) return can;
    var moves;
    switch (S.step) {
      case 'entrance': for (i = 0; i < n; i++) can[i] = E.canEnter(G, 0, i); break;
      case 'dp': for (i = 0; i < n; i++) can[i] = E.canAddDP(G, 0, i); break;
      case 'option':
        moves = E.evoMoves(G, 0);
        var waste = E.wasteMoves(G, 0);
        for (i = 0; i < n; i++) can[i] = waste.indexOf(i) >= 0 || moves.some(function (m) { return m.kind === 'option' && m.opt === i; });
        break;
      case 'target':
        moves = E.evoMoves(G, 0);
        for (i = 0; i < n; i++) can[i] = i === S.sel || moves.some(function (m) { return m.kind === 'option' && m.opt === S.sel && m.target === i; });
        break;
      case 'evo':
        moves = E.evoMoves(G, 0);
        for (i = 0; i < n; i++) can[i] = moves.some(function (m) { return m.kind === 'normal' && m.target === i; });
        break;
      case 'support': E.supportOptions(G, 0).hand.forEach(function (k) { can[k] = true; }); break;
    }
    return can;
  }

  // ------------------------------------------------------------------ render
  function render() {
    var G = S.G;
    if (!G) return;
    var dyn = clear($('dyn')), A = S.anim, tp = A ? A.tp : G.tp;
    $('turnNo').textContent = G.turn;
    var can = handActions();
    ROLL.el = [[], []];
    for (var p = 0; p < 2; p++) {
      var v = view(p), i, el;
      var mv = cardSounds(p, v);
      // nameplate
      var nm = box(h('div', 'name', v.name), L.name[p].x, L.name[p].y, L.name[p].w, L.name[p].h);
      if (tp === p) nm.appendChild(h('small', null, '◆ Turn — 1st Attack'));
      dyn.appendChild(nm);
      // win counters
      for (i = 0; i < 3; i++) dyn.appendChild(box(h('div', 'pip' + (i < v.wins ? ' on' : ''), i < v.wins ? 'KO' : ''), L.pips[p][i].x, L.pips[p][i].y, 29, 12));
      // piles
      el = plate('TRASH', 'small trash col'); el.appendChild(h('b', null, String(v.offline)));
      dyn.appendChild(box(pilePlate(el, p, showTrash, 'Offline pile'), L.trash[p].x, L.trash[p].y, 25, 19));
      el = plate('DECK', 'small col'); el.appendChild(h('b', null, String(v.deck)));
      dyn.appendChild(box(pilePlate(el, p, showDeck, 'Online deck'), L.deck[p].x, L.deck[p].y, 25, 19));
      // hand (open for both players)
      for (i = 0; i < 4; i++) {
        var slot = L.hand[p][i];
        if (i < v.hand.length) {
          el = cardEl(v.hand[i]);
          if (p === 0) {
            if (can[i]) { el.classList.add('can'); el.tabIndex = 0; el.setAttribute('role', 'button'); bindCard(el, i); }
            else if (S.resolve && !A && S.step && S.step !== 'attack' && S.step !== 'prepEnd') el.classList.add('dim');
            if (i === S.sel) el.classList.add('pick');
          }
          dyn.appendChild(box(el, slot.x, slot.y));
          slide(el, slot, mv.hand[i]);
        } else {
          el = plate('', 'col');
          if (p === 0) { el.appendChild(h('span', 'tri down')); el.appendChild(document.createTextNode('CARD')); }
          else { el.appendChild(document.createTextNode('CARD')); el.appendChild(h('span', 'tri up')); }
          dyn.appendChild(box(el, slot.x, slot.y, 40, 44));
        }
      }
      // active Digimon
      if (v.top >= 0) {
        el = cardEl(v.top);
        if (v.ko >= 0) el.classList.add('ko');
        if (A && A.hit === p) el.classList.add('hit');
        dyn.appendChild(box(el, L.mon[p].x, L.mon[p].y));
        slide(el, L.mon[p], mv.top);
        if (v.ko >= 0) dyn.appendChild(box(h('div', 'kox', 'KO'), L.mon[p].x, L.mon[p].y, 40, 48));
      } else dyn.appendChild(box(plate('DIGIMON'), L.monPlate[p].x, L.monPlate[p].y, 42, 47));
      // panel: name, attack bars, HP, DP
      if (v.top >= 0) {
        var c = E.card(v.top);
        var pn = h('div', 'pname'), dot = h('i'); dot.style.background = SPEC_DOT[v.spec]; dot.title = E.SPEC[v.spec];
        pn.appendChild(dot); pn.appendChild(document.createTextNode(c.name + ' · ' + E.LEVEL[c.level]));
        pn.title = c.name + ' — ' + E.SPEC[v.spec] + ', level ' + E.LEVEL[c.level];
        dyn.appendChild(box(pn, L.pname[p].x, L.pname[p].y, L.pname[p].w, L.pname[p].h));
        var choosing = p === 0 && S.step === 'attack' && S.resolve && !A;
        for (i = 0; i < 3; i++) {
          var bar = h(choosing ? 'button' : 'div', 'bar a' + i);
          bar.appendChild(h('span', 'ic', E.ATK[i]));
          var pw = h('span', 'pw' + (v.atk[i] > v.base[i] ? ' up' : v.atk[i] < v.base[i] ? ' down' : ''));
          bar.appendChild(pw); rollNum(p, 1 + i, pw, v.atk[i]);
          bar.title = c.atk[i].name + (i === 2 && c.xfx ? ' — ' + E.XFX[c.xfx] : '');
          if (choosing) { bar.classList.add('can'); bindAttack(bar, i); }
          if (v.choice === i) bar.classList.add('sel');
          else if (v.choice >= 0 && !choosing) bar.classList.add('off');
          dyn.appendChild(box(bar, L.bars[p].x, L.barY[i], L.bars[p].w, L.barH[i]));
        }
        var hp = h('div', 'hp' + (v.hp <= c.hp * 0.25 ? ' low' : ''));
        var hpn = h('span');
        hp.appendChild(h('small', null, 'HP')); hp.appendChild(hpn); rollNum(p, 0, hpn, v.hp);
        dyn.appendChild(box(hp, L.hp[p].x, L.hp[p].y, L.hp[p].w, L.hp[p].h));
      } else rollClear(p);
      el = h('div', 'dpnum'); el.title = 'Digivolve Points'; rollNum(p, 4, el, v.dpPts);
      dyn.appendChild(box(el, L.dpnum[p].x, L.dpnum[p].y, L.dpnum[p].w, L.dpnum[p].h));
      if (v.dp.length) {
        el = cardEl(v.dp[v.dp.length - 1], true);
        el.title = v.dp.length + ' card' + (v.dp.length > 1 ? 's' : '') + ' in the DP Slot: ' + v.dp.map(function (id) { return E.card(id).name + ' +' + E.card(id).pp; }).join(', ');
        dyn.appendChild(box(el, L.dpslot[p].x, L.dpslot[p].y));
        slide(el, L.dpslot[p], mv.dp);
      } else dyn.appendChild(box(plate('DP', 'small'), L.dpslot[p].x, L.dpslot[p].y, 19, 25));
      // support slot
      if (v.sup) {
        el = v.sup.face ? cardEl(v.sup.id) : backEl();
        if (A && A.glow === p) el.classList.add('pick');
        dyn.appendChild(box(el, L.sup[p].x, L.sup[p].y));
        if (mv.flip) flip(el); else slide(el, L.sup[p], mv.sup);
      }
    }
    if (S.step === 'attack' && S.resolve && !A && !S.viewCards) attackPanel(dyn);
    if (A) A.floats.forEach(function (f) {
      var fe = h('div', 'float' + (f.heal ? ' heal' : ''), f.text);
      dyn.appendChild(box(fe, L.mon[f.p].x - 6, L.mon[f.p].y + 10));
    });
    renderActions();
  }

  // The game's attack panel: the three attacks of your Digimon with their powers and
  // the special effect of its x attack. Rows are the attack buttons.
  function attackPanel(dyn) {
    var P = S.G.players[0], c = E.top(P), a = L.atk, i, el;
    dyn.appendChild(tex('atk_panel', a.x, a.y, 208, 64));
    el = h('div', 'ap-name', c.name);
    el.appendChild(h('small', null, E.SPEC[P.active.spec] + ' · Level ' + E.LEVEL[c.level]));
    dyn.appendChild(box(el, a.x + 3, a.y + 3, 119, 10));
    for (i = 0; i < 3; i++) {
      var row = h('button', 'bar ap-row can a' + i);
      row.appendChild(h('span', 'ic', E.ATK[i]));
      row.appendChild(h('span', 'an', c.atk[i].name));
      row.appendChild(h('span', 'pw', String(P.active.base[i])));
      bindAttack(row, i);
      dyn.appendChild(box(row, a.x + 10, a.y + a.rowY[i], 186, a.rowH));
    }
    dyn.appendChild(box(h('div', 'ap-lbl', 'SPECIAL EFFECT'), a.x + 9, a.y + 50, 60, 12));
    el = rich(h('div', 'ap-fx' + (c.xfx ? '' : ' none')), c.xfx ? E.ATK[2] + ' ' + E.XFX[c.xfx] : 'None');
    if (c.xfx) el.title = XFX_HELP[c.xfx];
    dyn.appendChild(box(el, a.x + 71, a.y + 50, 119, 12));
    dyn.appendChild(box(h('div', 'ap-set', 'SET UP'), a.x + 197, a.y + 2, 11, 46));
  }

  function bindCard(el, i) {
    el.onclick = function () { act({ t: 'card', i: i }); };
    el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act({ t: 'card', i: i }); } };
  }
  function bindAttack(el, i) { el.onclick = function () { act({ t: 'attack', k: i }); }; }

  function gbtn(label, fn, alt, disabled) {
    var b = h('button', 'gbtn' + (alt ? ' alt' : ''), label);
    b.onclick = fn; b.disabled = !!disabled;
    return b;
  }
  function renderActions() {
    var G = S.G, bx = clear($('acts'));
    if (S.anim || !S.resolve) return;
    function add(label, a, alt, dis) { bx.appendChild(gbtn(label, function () { act(a); }, alt, dis)); }
    switch (S.step) {
      case 'entrance': add('Change All Cards', { t: 'changeAll' }, true, !E.canChangeAll(G, 0)); break;
      case 'prepEnd': add('Change All Cards', { t: 'changeAll' }, true, !E.canChangeAll(G, 0)); add('OK', { t: 'ok' }); break;
      case 'dp': add('Skip', { t: 'skip' }); break;
      case 'option': add('Skip', { t: 'skip' }); break;
      case 'target': add('Cancel', { t: 'skip' }, true); break;
      case 'evo': add('Done', { t: 'skip' }); break;
      case 'attack':
        bx.appendChild(gbtn(S.viewCards ? 'Back to Attacks' : 'View Cards', function () { S.viewCards = !S.viewCards; render(); }, true));
        break;
      case 'support':
        add('No Support Card', { t: 'support', choice: -1 }, true);
        add('Top of Online Deck', { t: 'support', choice: 'deck' }, false, !E.supportOptions(G, 0).deck);
        break;
    }
  }

  // text with the attack symbols set in a font where they are legible
  function rich(el, text) {
    clear(el);
    String(text || '').split(/([○△✕])/).forEach(function (part) {
      if (!part) return;
      if (part.length === 1 && E.ATK.indexOf(part) >= 0) el.appendChild(h('span', 'sym s' + E.ATK.indexOf(part), part));
      else el.appendChild(document.createTextNode(part));
    });
    return el;
  }
  function status(a, b) { $('msg1').textContent = a || ''; rich($('msg2'), b); }
  function flash(text, kind) {
    var f = $('flash');
    f.hidden = true; void f.offsetWidth;
    f.className = 'flash ' + (kind || 'sys'); f.textContent = text; f.hidden = false;
  }
  function log(text, kind) {
    var ol = $('log');
    ol.appendChild(h('li', kind || '', text));
    ol.scrollTop = ol.scrollHeight;
  }
  function who(p) { return p === 0 ? 'me' : 'op'; }
  function name(p) { return S.G.players[p].name; }
  function poss(p) { return p === 0 ? 'Your' : name(p) + "'s"; }
  function vb(p, verb) { return name(p) + ' ' + (p === 0 ? verb : (/[sxz]$|ch$|sh$/.test(verb) ? verb + 'es' : verb + 's')); }
  function cards(n) { return n + ' card' + (n > 1 ? 's' : ''); }

  // ------------------------------------------------------------------ input plumbing
  function waitAction(step) { S.step = step; return new Promise(function (res) { S.resolve = res; render(); }); }
  function act(x) {
    var r = S.resolve;
    if (!r) return;
    S.resolve = null; $('info').hidden = true;
    SND.se(x.t === 'skip' && S.step === 'target' ? SE.CANCEL : SE.OK);
    r(x);
  }
  function ask(text) {
    $('askText').textContent = text; $('ask').hidden = false;
    SND.se(SE.OPEN);
    return new Promise(function (res) {
      $('askYes').onclick = function () { $('ask').hidden = true; SND.se(SE.OK); SND.se(SE.CLOSE, 0.08); res(true); };
      $('askNo').onclick = function () { $('ask').hidden = true; SND.se(SE.CANCEL); SND.se(SE.CLOSE, 0.08); res(false); };
      $('askYes').focus();
    });
  }
  function live(tok) { return S.token === tok && S.G; }

  // ------------------------------------------------------------------ preparation
  function showPrepEvents(ev, p) {
    var seq = Promise.resolve();
    ev.forEach(function (e) {
      seq = seq.then(function () {
        if (e.t === 'draw') { log(vb(p, 'draw') + ' ' + cards(e.n) + '.', who(p)); return; }
        if (e.t === 'forced') {
          status('Preparation: Change all Cards.', 'Redrawing Cards because there are no Digimon Cards.');
          log(vb(p, 'redraw') + ': no Digimon cards in hand.', who(p)); render(); return sleep(1100);
        }
        if (e.t === 'nocards') {
          status('Preparation: No Cards in Online Deck!', 'There are no more Cards, so ' + name(p) + (p === 0 ? ' lose!' : ' loses!'));
          log(name(p) + (p === 0 ? ' have' : ' has') + ' no Digimon and no cards left.', 'big'); render(); return sleep(1400);
        }
      });
    });
    return seq;
  }

  async function humanPrep(tok) {
    var G = S.G, P = G.players[0];
    while (live(tok) && G.winner === null) {
      if (!P.active) status('Preparation: Digimon Entrance.', 'Choose a Digimon card to send out. Level C enters at half strength, U at a quarter.');
      else status('Preparation: Preparation Complete.', 'OK to continue, or change all cards.');
      var a = await waitAction(P.active ? 'prepEnd' : 'entrance');
      if (!live(tok)) return;
      if (a.t === 'changeAll') {
        var ev = [];
        E.changeAll(G, 0, ev);
        log('You change all cards.', 'me');
        S.step = null; render();
        await showPrepEvents(ev, 0);
      } else if (a.t === 'card') {
        var c = E.card(P.hand[a.i]);
        E.enter(G, 0, a.i);
        log('You send out ' + c.name + (c.level >= 2 ? ' at reduced strength (level ' + E.LEVEL[c.level] + ' entrance).' : '.'), 'me');
        flash('DIGIMON ENTRANCE', 'sys');
        var ar = E.armorOption(G, 0);
        if (ar >= 0) {
          S.step = null; status('Preparation: Digi-Egg Power-Up.', ''); render();
          if (await ask('Do you want to Armor Digivolve to ' + E.card(ar).name + '?')) {
            log(c.name + ' armor digivolves to ' + E.card(ar).name + '.', 'me');
            flash('Armor Digivolve', 'fx');
            await fx(FX.ARMOR, 0, 0);               // the effect first, then the card (0x80034fb4)
            if (!live(tok)) return;
            E.armorDigivolve(G, 0);
          }
        }
      } else if (a.t === 'ok') return;
    }
  }

  // The opponent makes one move at a time. A digivolution is announced and its effect plays
  // to the end before the cards change, as in the game (the effect call 0x801f6214 comes
  // back only when the effect is over, and the card is moved after it: states 0x12, 0x15
  // and the armor digivolution of the entrance). The next move waits for the cards to land.
  async function aiSteps(steps, tok) {
    var it = steps.next();
    while (!it.done && live(tok)) {
      var m = it.value, k, n = -1;
      if (/armor digivolves/.test(m)) n = FX.ARMOR;
      else if (/ uses /.test(m)) {
        for (k = 0; k < 8; k++) if (m.indexOf(' uses ' + EVO_CARD[k]) >= 0) n = EVO_FX[k];
      } else if (/digivolves to/.test(m)) n = FX.DIGIVOLVE;
      log(m, 'op'); status($('msg1').textContent, m);
      if (n >= 0) {
        render();
        await fx(n, 1, 0);
        if (!live(tok)) return;
      } else SND.se(SE.OK);
      it = steps.next();                          // the move is made here
      render();
      await sleep(900);
    }
  }

  // ------------------------------------------------------------------ digivolve phase
  async function humanEvo(tok) {
    var G = S.G, P = G.players[0], a, i, c, moves;
    // 1. one card to the DP Slot
    if (P.hand.some(function (_, k) { return E.canAddDP(G, 0, k); })) {
      status('Digivolve: Digivolve Points (DP).', 'Rack-up DP: send one Digimon card to the DP Slot, or skip.');
      a = await waitAction('dp');
      if (!live(tok)) return;
      if (a.t === 'card') {
        c = E.card(P.hand[a.i]);
        E.addDP(G, 0, a.i);
        log('You send ' + c.name + ' to the DP Slot (+' + c.pp + ').', 'me');
      }
    }
    // 2. digivolve option card
    while (live(tok) && !P.evoEnded && !P.evoStarted && P.hand.some(function (id) { return E.card(id).type === 'digivolve'; })) {
      status('Digivolve: Digivolve Option.', 'Use a digivolve option card, or skip.');
      S.sel = -1;
      a = await waitAction('option');
      if (!live(tok)) return;
      if (a.t !== 'card') break;
      i = a.i; c = E.card(P.hand[i]);
      moves = E.evoMoves(G, 0).filter(function (m) { return m.kind === 'option' && m.opt === i; });
      if (!moves.length) {
        // state 0xF: a card that can do nothing may be used all the same, and is lost
        if (E.wasteMoves(G, 0).indexOf(i) < 0) continue;
        S.step = null; render();
        if (await ask('This Digivolve Option has no Effect. Do you still want to use it?')) {
          E.wasteOption(G, 0, i);
          log('You use ' + c.name + ' to no effect; it goes Offline.', 'me');
        }
        continue;
      }
      if (moves[0].target < 0) {
        S.step = null; render();
        var q = c.dtype === E.DIGIVOLVE.DEVOLVE ? 'Current Digimon will be discarded. Do you still want to Digi-devolve?'
          : "Your Digimon's level will become R. Do you still want to Armor Digi-devolve?";
        if (await ask(q)) {
          flash(EVO_NAME[c.dtype], 'fx');
          await fx(EVO_FX[c.dtype], 0, 0);          // the effect first, then the cards (state 0x10)
          if (!live(tok)) return;
          E.digivolve(G, 0, moves[0]);
          log('You use ' + c.name + ': now ' + E.top(P).name + '.', 'me');
        }
        continue;
      }
      S.sel = i;
      status('Digivolve: Digivolve Digimon.', c.name + ': choose the Digimon to digivolve into.');
      a = await waitAction('target');
      if (!live(tok)) return;
      var mv = a.t === 'card' ? moves.filter(function (m) { return m.target === a.i; })[0] : null;
      S.sel = -1;
      if (mv) {
        var tn = E.card(P.hand[mv.target]).name;
        log('You use ' + c.name + ' and digivolve to ' + tn + '.', 'me');
        S.step = null; render();
        flash(EVO_NAME[c.dtype], 'fx');
        await fx(EVO_FX[c.dtype], 0, 0);            // state 0x12
        if (!live(tok)) return;
        E.digivolve(G, 0, mv);
      }
    }
    S.sel = -1;
    // 3. normal digivolution, as long as one is possible
    while (live(tok) && !P.evoEnded) {
      moves = E.evoMoves(G, 0).filter(function (m) { return m.kind === 'normal'; });
      if (!moves.length) break;
      status('Digivolve: Digivolve Digimon.', 'Choose a Digimon to digivolve into, or finish.');
      a = await waitAction('evo');
      if (!live(tok)) return;
      if (a.t !== 'card') break;
      var m2 = moves.filter(function (m) { return m.target === a.i; })[0];
      if (!m2) continue;
      var nm = E.card(P.hand[m2.target]).name;
      log('You digivolve to ' + nm + '.', 'me');
      S.step = null; render();
      flash('Digivolve', 'fx');
      await fx(FX.DIGIVOLVE, 0, 0);                 // state 0x15
      if (!live(tok)) return;
      E.digivolve(G, 0, m2);
    }
    S.step = null;
    status('Digivolve: Digivolve Complete.', '');
    render();
  }

  // ------------------------------------------------------------------ battle
  var FLAG_CAPTION = { first: '1st Attack is Set', eatup: 'Eat-up HP is Set', counter: 'Counterattack is Set', revive: 'Revive is Set' };

  function playEvents(evs, tok) {
    var A = S.anim, i = 0;
    function mon(p) { var id = A.s[p].top >= 0 ? A.s[p].top : A.koShow[p]; return id >= 0 ? E.card(id).name : name(p); }
    // effect caused by the card now resolving (A.src), landing on player p's Digimon
    function fxs(n, p) { var src = A.src || { p: p, k: 0 }; fx(n, src.p, src.k, p, 0); }
    function step() {
      if (i >= evs.length || !live(tok)) return Promise.resolve();
      var e = evs[i++], d = 300, c, prevTop = [A.s[0].top, A.s[1].top];
      // Polygon Battle: the attack is shown in 3D first, then its result on the board
      if (e.t === 'attack' && B3D.enabled && !e.shown3d && prevTop[0] >= 0 && prevTop[1] >= 0) {
        e.shown3d = true; i--;
        c = E.card(prevTop[e.p]);
        status(c.name + ': ' + c.atk[e.attack].name, '');
        var tgt = e.p ^ 1, countered = A.counterBy >= 0 && A.counterBy !== e.p;
        var o3 = { models: [E.card(prevTop[0]).model, E.card(prevTop[1]).model], attacker: e.p, first: A.tp, arena: S.arena, sound: SND.isEnabled(),
          script: c.atk[e.attack].script, hit: c.atk[e.attack].hit, attack: e.attack, name: c.atk[e.attack].name,
          // director 0x801ee3d4: a countered attack shows its motion only, one that does no damage shows "Miss!!"
          mode: countered ? 'countered' : e.dmg === 0 ? 'zero' : 'normal',
          hp: [e.s ? e.s[0].hp : 1, e.s ? e.s[1].hp : 1], hpBefore: A.s[tgt].hp, damage: e.dmg, heal: e.heal || 0, hpSelf: A.s[e.p].hp,
          firstAttack: !A.shown3d && A.first !== A.tp, crash: !!A.crashed[e.p], counter: A.counterBy === e.p, x3: !!(A.x3 && A.x3[e.p] && e.attack === 2) };
        A.shown3d = true;
        return B3D.attack(o3).then(step);
      }
      if (e.s) A.s = e.s;
      A.glow = -1; A.hit = -1; A.floats = [];
      fxWait = null;
      switch (e.t) {
        case 'reveal':
          A.reveal = true;
          status('Battle: Support taking Effect.', '');
          [0, 1].forEach(function (p) {
            var ch = A.s[p].choice;
            log(name(p) + ': ' + E.ATK[ch] + ' ' + E.card(A.s[p].top).atk[ch].name + (A.sup[p] >= 0 ? (A.face[p] ? ', support ' + E.card(A.sup[p]).name : ', support from the Online deck') : ''), who(p));
          });
          d = 1100; break;
        case 'support':
          c = E.card(e.card); A.glow = e.p; A.face[e.p] = true; A.src = { p: e.p, k: 1 };
          if (e.none) { status(poss(e.p) + ' support: ' + c.name, 'No effect.'); log(poss(e.p) + ' ' + c.name + ' has no effect.', who(e.p)); d = 900; }
          else if (e.voided) { status(poss(e.p) + ' support: ' + c.name, 'Voided!'); log(poss(e.p) + ' ' + c.name + ' is voided.', who(e.p)); flash('Void-out Support', 'fx'); fx(FX.MISFIRE, e.p, 1); d = 1200; }
          else if (!e.ok) { status(poss(e.p) + ' support: ' + c.name, c.text); log(poss(e.p) + ' ' + c.name + ': condition not met.', who(e.p)); flash('Misfire Failure', 'fx'); fx(FX.MISFIRE, e.p, 1); d = 1200; }
          else { status(poss(e.p) + ' support: ' + c.name, c.text); log(poss(e.p) + ' ' + c.name + ': ' + c.text, who(e.p)); d = 1300; }
          break;
        case 'xfx':
          if (e.ok) {
            status(mon(e.p) + ': ' + E.XFX[e.fx], XFX_HELP[e.fx]);
            log(mon(e.p) + "'s " + E.ATK[2] + ' effect: ' + E.XFX[e.fx] + '.', who(e.p));
            flash(e.fx === 1 ? FLAG_CAPTION.first : e.fx === 8 ? 'Self-Destruct is Set' : e.fx === 9 ? FLAG_CAPTION.eatup : e.fx === 10 ? 'Jamming Support' : e.fx >= 5 && e.fx <= 7 ? FLAG_CAPTION.counter : E.XFX[e.fx], 'fx');
            A.src = { p: e.p, k: 0 };
            if (e.fx >= 11 && e.fx <= 15) { A.x3 = A.x3 || {}; A.x3[e.p] = true; }      // foe x3
            fx(e.fx === 1 ? FX.FIRST : e.fx === 8 ? FX.CRASH_SET : e.fx === 9 ? FX.EATUP : e.fx === 10 ? FX.VOID : e.fx >= 5 && e.fx <= 7 ? FX.COUNTER_SET : FX.STAT, e.p, 0);
            d = 1100;
          } else { log(mon(e.p) + "'s " + E.XFX[e.fx] + ' does not trigger.', who(e.p)); fx(FX.MISFIRE, e.p, 0); d = 500; }
          break;
        case 'flag': flash(FLAG_CAPTION[e.flag], 'fx'); fxs({ first: FX.FIRST, eatup: FX.EATUP, counter: FX.COUNTER_SET, revive: FX.REVIVE_SET }[e.flag], e.p); d = 900; break;
        case 'void': log(poss(e.p) + ' ' + (e.all ? 'support and option effects are' : 'Digimon support effect is') + ' voided.', who(e.p)); fxs(e.all ? FX.VOID_ALL : FX.VOID, e.p); d = 900; break;
        case 'spec': flash('Speciality Change', 'fx'); fxs(FX.SPEC, e.p); d = 800; break;
        case 'choice': flash('Attack Change', 'fx'); fxs(FX.ATTACK_CHANGE, e.p); d = 800; break;
        case 'hp': case 'atk': fxs(FX.STAT, e.p); d = 600; break;
        case 'discard':
          log(vb(e.p, 'discard') + ' ' + cards(e.n) + ' from ' + ({ hand: 'hand', deck: 'the Online deck', dp: 'the DP Slot' })[e.from] + '.', who(e.p)); d = 500; break;
        case 'draw': log(vb(e.p, 'draw') + ' ' + cards(e.n) + '.', who(e.p)); d = 500; break;
        case 'return': log(vb(e.p, 'return') + ' ' + cards(e.n) + ' to the Online deck.', who(e.p)); break;
        case 'recycle': log(vb(e.p, 'move') + ' ' + cards(e.n) + ' from Offline to the Online deck.', who(e.p)); break;
        case 'shuffle': log(vb(e.p, 'shuffle') + ' the Online deck.', who(e.p)); break;
        case 'order':
          A.first = e.first;
          status('Battle: ' + mon(e.first) + ' attacks first.', '');
          if (e.first !== A.tp) log(mon(e.first) + ' takes the first attack.', who(e.first));
          d = 600; break;
        case 'counter':
          A.counterBy = e.p;
          status(mon(e.p) + ' counters!', "The opponent's attack misses."); log(mon(e.p) + ' counterattacks.', who(e.p)); d = 900; break;
        case 'crash':
          status(mon(e.p) + ': Crash!', 'Attack power becomes HP; HP drops to 10.'); log(mon(e.p) + ' uses Crash.', who(e.p)); A.crashed[e.p] = true; fx(FX.CRASH, e.p, 0, e.p ^ 1, 0); d = 1100; break;
        case 'attack':
          c = E.card(A.s[e.p].top);
          status(c.name + ': ' + c.atk[e.attack].name, e.dmg + ' damage' + (e.heal ? ', recovers ' + e.heal + ' HP.' : '.'));
          log(c.name + ' attacks with ' + c.atk[e.attack].name + ' for ' + e.dmg + (e.heal ? ' and recovers ' + e.heal : '') + '.', 'big ' + who(e.p));
          flash(ATK_WORD[e.attack], 'a' + e.attack);
          // result message the game shows for this strike (state 0x23)
          if (e.dmg === 0) fx(FX.NO_DAMAGE, e.p, 0, e.p ^ 1, 0);
          else if (e.heal) fx(FX.EATUP_HIT, e.p, 0, e.p ^ 1, 0);
          else if (A.counterBy === e.p) fx(FX.COUNTER_HIT, e.p, 0, e.p ^ 1, 0);
          else if (!A.crashed[e.p]) fx(FX.HIT, e.p, 0, e.p ^ 1, 0);
          if (e.dmg > 0) { A.hit = e.p ^ 1; A.floats.push({ p: e.p ^ 1, text: '-' + e.dmg }); }
          if (e.heal) A.floats.push({ p: e.p, text: '+' + e.heal, heal: true });
          d = 1500; break;
        case 'ko':
          if (e.how === 'revive') { status(mon(e.p) + " is KO'd, but revives!", vb(e.p ^ 1, 'score') + ' the KO.'); log(mon(e.p) + " is KO'd and revives with " + A.s[e.p].hp + ' HP.', 'big'); flash('REVIVE', 'fx'); fx(FX.REVIVE, e.p, 0); }
          else if (e.how === 'armor') { A.koShow[e.p] = e.rookie; status(E.card(prevTop[e.p]).name + " is KO'd!", 'It drops back to ' + E.card(e.rookie).name + ', which goes Offline. ' + vb(e.p ^ 1, 'score') + ' a KO.'); log(E.card(prevTop[e.p]).name + " is KO'd; " + E.card(e.rookie).name + ' goes Offline.', 'big'); flash('KO', 'a0'); fx(FX.DE_ARMOR, e.p, 0); }
          else { A.koShow[e.p] = prevTop[e.p]; status(E.card(prevTop[e.p]).name + " is KO'd!", vb(e.p ^ 1, 'score') + ' a KO.'); log(E.card(prevTop[e.p]).name + " is KO'd.", 'big'); flash('KO', 'a0'); }
          d = 1600; break;
      }
      render();
      var w = fxWait;
      return sleep(d).then(function () { return w; }).then(step);
    }
    return step();
  }

  async function battle(tok) {
    var G = S.G, t = G.tp, o = t ^ 1, P0 = G.players[0], P1 = G.players[1];
    S.myAtk = -1;
    // both players decide an attack; neither is shown yet
    var aiAtk = AI.chooseAttack(G, 1, S.skill);
    var mine = E.top(P0), foe = E.top(P1);
    S.viewCards = false;
    status('Battle: Deciding an Attack.',
      (mine.xfx ? 'Your ' + E.ATK[2] + ' ' + E.XFX[mine.xfx] + ': ' + XFX_HELP[mine.xfx] : 'Your ' + E.ATK[2] + ' attack has no special effect.') +
      ' Opponent’s ' + E.ATK[2] + ': ' + (foe.xfx ? E.XFX[foe.xfx] : 'no effect') + '.');
    var a = await waitAction('attack');
    if (!live(tok)) return;
    S.myAtk = a.k;
    log('You choose your attack.', 'me');
    // support cards: the non-turn player commits first
    var order = [o, t];
    for (var k = 0; k < 2 && live(tok); k++) {
      var p = order[k];
      if (p === 0) {
        var opts = E.supportOptions(G, 0);
        if (!opts.hand.length && !opts.deck) {
          status('Battle: Your Support Card.', "You have no Cards left, so you can't use any Support Cards!");
          S.step = null; render(); await sleep(1100);
        } else {
          status('Battle: Your Support Card.', k === 0 ? 'You commit first: choose a support card, or none.' : "The opponent has committed. Choose a support card, or none.");
          var s = await waitAction('support');
          if (!live(tok)) return;
          var choice = s.t === 'card' ? s.i : s.choice;
          var cn = choice === -1 ? null : choice === 'deck' ? 'the top card of your Online deck' : E.card(P0.hand[choice]).name;
          E.setSupport(G, 0, choice);
          log(cn ? 'You set ' + cn + ' as support.' : 'You use no support card.', 'me');
        }
      } else {
        status('Battle: ' + P1.name + "'s Support Card.", '');
        S.step = null; render(); await sleep(500);
        var H = G;
        if (P0.sup && P0.sup.deck) { H = E.clone(G); H.players[0].sup = null; } // a face-down card stays unknown to the AI
        var c1 = AI.chooseSupport(H, 1, aiAtk, S.skill);
        var n1 = c1 >= 0 ? E.card(P1.hand[c1]).name : null;
        E.setSupport(G, 1, c1);
        log(n1 ? P1.name + ' sets ' + n1 + ' as support.' : P1.name + ' uses no support card.', 'op');
        status('Battle: ' + P1.name + "'s Support Card.", n1 || 'No support card.');
        render(); await sleep(900);
      }
    }
    if (!live(tok)) return;
    S.step = null;
    S.anim = {
      tp: t, reveal: false, glow: -1, hit: -1, floats: [], koShow: [-1, -1], counterBy: -1, crashed: [false, false],
      sup: [P0.sup ? P0.sup.id : -1, P1.sup ? P1.sup.id : -1],
      face: [!(P0.sup && P0.sup.deck), !(P1.sup && P1.sup.deck)],
      base: [P0.active.base.slice(), P1.active.base.slice()],
      s: E.snap(G)
    };
    status('Battle: Begin Battle.', '');
    flash('BEGIN BATTLE', 'sys');
    render();
    var evs = E.resolveBattle(G, [S.myAtk, aiAtk], []);
    await sleep(900);
    await playEvents(evs, tok);
    await sleep(500);
    S.anim = null; S.myAtk = -1;
  }

  // ------------------------------------------------------------------ game loop
  async function runGame(tok) {
    var G = S.G;
    while (live(tok) && G.winner === null) {
      var ev = [];
      E.beginTurn(G, ev);
      var t = G.tp;
      log('Turn ' + G.turn + ' — ' + name(t), 'turn');
      S.step = null; S.myAtk = -1;
      status('Preparation: Preparing a Hand.', vb(t, 'draw') + ' cards.');
      flash((t === 0 ? 'YOUR' : name(t).toUpperCase() + "'S") + ' TURN', 'sys');
      render();
      await sleep(900);
      await showPrepEvents(ev, t);
      if (!live(tok) || G.winner !== null) break;
      if (t === 0) await humanPrep(tok);
      else { status('Preparation: Digimon Entrance.', ''); await aiSteps(AI.prepSteps(G, 1), tok); }
      if (!live(tok) || G.winner !== null) break;
      if (t === 0) await humanEvo(tok);
      else { status('Digivolve: Digivolve Points (DP).', ''); render(); await sleep(400); await aiSteps(AI.digivolveSteps(G, 1), tok); }
      if (!live(tok)) break;
      if (!E.battleOn(G)) {
        S.step = null;
        status('Battle: ' + name(t ^ 1) + (t === 1 ? ' have' : ' has') + ' no Digimon.', 'Since ' + name(t ^ 1) + (t === 1 ? ' have' : ' has') + ' no Digimon, there is no Battle Phase.');
        log('No Battle Phase: ' + name(t ^ 1) + (t === 1 ? ' have' : ' has') + ' no Digimon.', 'big');
        render();
        await sleep(1500);
      } else await battle(tok);
      if (!live(tok)) break;
      E.endTurn(G);
      render();
    }
    if (live(tok)) finish();
  }

  function finish() {
    var G = S.G, w = G.winner, me = G.players[0], op = G.players[1];
    S.step = null; S.anim = null; render();
    var why = G.winReason === 'KO' ? me.wins + ' Wins, ' + op.wins + ' Losses.'
      : G.winReason === 'nocards' ? 'There are no more Cards, so ' + name(w ^ 1) + (w === 1 ? ' lose.' : ' loses.')
        : 'Since ' + name(w ^ 1) + (w === 1 ? ' have' : ' has') + ' no more Digimon, the winner is ' + name(w) + '.';
    $('resultTitle').textContent = w === 0 ? 'You win!' : 'You lose';
    $('resultText').textContent = why + ' Finished on turn ' + G.turn + '.';
    status(w === 0 ? 'YOU WIN!' : name(w) + ' WINS!', why);
    log(w === 0 ? 'You win the match.' : op.name + ' wins the match.', 'big');
    SND.music(w === 0 ? 149 : 150);
    $('result').showModal();
  }

  function startGame() {
    var md = D.decks[S.my], od = D.decks[S.op];
    S.skill = parseFloat($('skill').value);
    S.token++;
    S.G = E.newGame({ names: ['You', od.owner], decks: [md, od] });
    S.anim = null; S.resolve = null; S.step = null; S.sel = -1; S.myAtk = -1;
    // the arena: the one chosen, or, as the game does with none named, one of entries 44..55
    // of its table (0x8002e42c)
    S.arena = ARENAS.filter(function (a) { return String(a.index) === arenaPick; })[0] ||
      ARENAS.filter(function (a) { return a.index >= 44; })[Math.floor(Math.random() * 12)] || null;
    rollReset();
    clear($('log')); $('ask').hidden = true; $('info').hidden = true; $('flash').hidden = true;
    $('setup').hidden = true; $('game').hidden = false;
    buildStatic(); fit();
    log('Your deck: ' + md.name + '. Opponent: ' + od.owner + ' (' + od.name + ').');
    log(S.G.players[S.G.tp].name + (S.G.tp === 0 ? ' take' : ' takes') + ' the first turn.');
    window.scrollTo(0, 0);
    SND.init();
    SND.music(od.bgm || 143 + Math.floor(Math.random() * 2)); // free battle: 0x8f + rand % 2
    runGame(S.token);
  }

  function toMenu() {
    if ($('pile').open) $('pile').close();
    S.token++; S.G = null; S.resolve = null; S.anim = null;
    SND.stopMusic(); FXV.stop(); B3D.stop();
    $('game').hidden = true; $('setup').hidden = false;
    renderSetup();
  }

  // scale the 1280x960 stage to the space available
  function fit() {
    if ($('game').hidden) return;
    var narrow = window.innerWidth <= 900;
    var availW = window.innerWidth - (narrow ? 12 : 290 + 44);
    var availH = narrow ? Infinity : window.innerHeight - 20;
    var k = Math.max(0.2, Math.min(availW / 1280, availH / 960));
    $('stage').style.transform = 'scale(' + k + ')';
    $('stageBox').style.width = Math.floor(1280 * k) + 'px';
    $('stageBox').style.height = Math.floor(960 * k) + 'px';
  }

  // ------------------------------------------------------------------ wiring
  function findCard(t) {
    while (t && t !== document.body) { if (t.dataset && t.dataset.id != null && t.dataset.id !== '') return t; t = t.parentNode; }
    return null;
  }
  var lastHover = null;
  function hover(e) {
    if ($('game').hidden) return;
    var t = e.target, hot = null;
    while (t && t !== $('stage')) { if (t.classList && (t.classList.contains('can') || t.classList.contains('gbtn'))) { hot = t; break; } t = t.parentNode; }
    if (hot && hot !== lastHover && !hot.disabled) SND.se(SE.CURSOR);
    lastHover = hot;
    var el = findCard(e.target);
    if (!el) { $('info').hidden = true; return; }
    showInfo(+el.dataset.id, parseFloat(el.style.top) / U + 20);
  }
  $('stage').addEventListener('mouseover', hover);
  $('stage').addEventListener('focusin', hover);
  $('stage').addEventListener('mouseleave', function () { $('info').hidden = true; });
  window.addEventListener('resize', fit);

  $('myFilter').oninput = renderSetup;
  $('opFilter').oninput = renderSetup;
  Array.prototype.forEach.call($('previewTabs').children, function (b) { b.onclick = function () { S.previewSide = b.dataset.side; renderSetup(); }; });
  $('btnRandom').onclick = function () { S.op = OP_DECKS[Math.floor(Math.random() * OP_DECKS.length)].id; S.previewSide = 'op'; renderSetup(); };
  $('btnStart').onclick = startGame;
  $('arenaBtn').onclick = openArenas;
  try { B3D.enabled = localStorage.getItem('ddcb-anim3d') !== '0'; } catch (err) { /* storage unavailable */ }
  $('anim3d').checked = B3D.enabled;
  $('anim3d').onchange = function () {
    B3D.enabled = $('anim3d').checked;
    try { localStorage.setItem('ddcb-anim3d', B3D.enabled ? '1' : '0'); } catch (err) { /* ignore */ }
  };
  $('sound').checked = SND.isEnabled();
  $('sound').onchange = function () { SND.setEnabled($('sound').checked); };
  $('btnRules').onclick = function () { $('rules').showModal(); };
  $('btnQuit').onclick = function () { if (!S.G || S.G.winner !== null || window.confirm('Quit this battle?')) toMenu(); };
  $('btnAgain').onclick = function () { $('result').close(); startGame(); };
  $('btnMenu').onclick = function () { $('result').close(); toMenu(); };

  S.my = MY_DECKS[0].id;
  S.op = OP_DECKS[0].id;
  renderSetup();

  // small hook for automated checks
  window.DDCB_UI = { state: S, act: act };
})();
