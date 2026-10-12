/*
 * Deck editor: one of the player's own decks is built from the card pool. The rules it
 * keeps to are the game's (decks.js: 30 cards, 4 of a card, no armor forms, a Digimon card).
 * The screen is this project's, laid out for finding cards fast: a search box over names,
 * attacks and effects, filters that say how many cards each would leave, and a list that
 * can be worked with the keyboard alone.
 */
(function () {
  'use strict';
  var E = window.DDCB, K = window.DDCB_DECKS, UI = window.DDCB_UI;
  var h = UI.h, clear = UI.clear;
  var SPEC_CLS = ['fire', 'ice', 'nature', 'dark', 'rare'];
  function $(id) { return document.getElementById(id); }

  var W = null;          // what is being edited: { deck, opts, undo: [], redo: [] }
  var F = K.newFilter(); // search box, filters and sort
  var more = false;      // the second set of filters is open
  var ROWS = {};         // card id -> its row in the card list, made once
  var shown = [];        // card ids in the list now, in order
  var tabId = -1;        // the row the Tab key lands on
  var cur = -1;          // the card in the detail panel

  function say(text) { $('edSay').textContent = ''; $('edSay').textContent = text; }
  function typing(el) { return el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable); }
  function rowOf(el) {
    while (el && el !== document.body) { if (el.dataset && el.dataset.id != null && el.dataset.id !== '') return el; el = el.parentNode; }
    return null;
  }

  // ------------------------------------------------------------------ text with the found words marked
  function mark(el, text, terms) {
    var pos = 0;
    clear(el);
    function put(s, on) {
      var box = on ? h('mark') : el;
      s.split(/([○△✕])/).forEach(function (part) {
        if (!part) return;
        if (part.length === 1 && E.ATK.indexOf(part) >= 0) box.appendChild(h('span', 'sym s' + E.ATK.indexOf(part), part));
        else box.appendChild(document.createTextNode(part));
      });
      if (on) el.appendChild(box);
    }
    K.ranges(text, terms).forEach(function (r) {
      if (r[0] > pos) put(text.slice(pos, r[0]));
      put(text.slice(r[0], r[1]), true);
      pos = r[1];
    });
    if (pos < text.length) put(text.slice(pos));
    return el;
  }
  function kindOf(c) { return c.type === 'digimon' ? E.SPEC[c.spec] + ' · Level ' + E.LEVEL[c.level] : c.type === 'option' ? 'Option card' : 'Digivolve option'; }
  function effectOf(c) { return c.text === 'None' ? (c.type === 'digimon' ? 'No support effect.' : 'No effect.') : c.text; }

  // ------------------------------------------------------------------ card list
  function stat(k, v, cl) {
    var s = h('span', 'st' + (cl ? ' ' + cl : ''));
    s.appendChild(h('i', null, k)); s.appendChild(document.createTextNode(String(v)));
    return s;
  }
  function stepper(c) {
    var step = h('span', 'ed-step'), sub = h('button', 'ed-sub', '−'), cnt = h('span', 'ed-cnt'), add = h('button', 'ed-plus', '+');
    sub.type = add.type = 'button'; sub.tabIndex = add.tabIndex = -1;
    sub.setAttribute('aria-label', 'Take out one ' + c.name); add.setAttribute('aria-label', 'Add one ' + c.name);
    step.appendChild(sub); step.appendChild(cnt); step.appendChild(add);
    return { el: step, sub: sub, cnt: cnt, add: add };
  }
  function row(id) {
    if (ROWS[id]) return ROWS[id];
    var c = E.card(id), dig = c.type === 'digimon';
    var li = h('li', 'ed-row'), main = h('button', 'ed-main'), pic = UI.thumb(id), who = h('span', 'ed-who'), st = h('span', 'ed-stats'), fx = h('span', 'ed-fx');
    var r = { id: id, li: li, main: main, nm: h('span', 'ed-nm'), xf: null, atk: null, tx: h('span', 'ed-tx' + (c.text === 'None' ? ' none' : '')), marked: null, n: -1 };
    li.dataset.id = id; main.type = 'button'; main.tabIndex = -1;
    pic.appendChild(h('span', 'badge ' + UI.cls(c), UI.lvl(c)));
    main.appendChild(pic);
    who.appendChild(r.nm); who.appendChild(h('span', 'ed-kind', kindOf(c)));
    main.appendChild(who);
    if (dig) {
      st.appendChild(stat('HP', c.hp)); st.appendChild(stat('DP', c.dp)); st.appendChild(stat('+P', c.pp));
      c.atk.forEach(function (a, i) { st.appendChild(stat(E.ATK[i], a.power, 'a' + i)); });
      if (c.xfx) { r.xf = h('span', 'ed-xf'); fx.appendChild(r.xf); }
      r.atk = h('span', 'ed-atk');
    }
    main.appendChild(st);
    fx.appendChild(r.tx);
    if (r.atk) fx.appendChild(r.atk);
    main.appendChild(fx);
    li.appendChild(main);
    r.step = stepper(c);
    li.appendChild(r.step.el);
    ROWS[id] = r;
    return r;
  }
  // mark the words of the search in a row; an attack name is only shown when it is what was found
  function setMarks(r, terms, key) {
    var c = E.card(r.id), names;
    r.marked = key;
    mark(r.nm, c.name, terms);
    mark(r.tx, effectOf(c), c.text === 'None' ? [] : terms);
    if (r.xf) { mark(r.xf, E.XFX[c.xfx], terms); r.xf.insertBefore(h('i', null, E.ATK[2] + ' effect'), r.xf.firstChild); }
    if (r.atk) {
      names = c.atk.filter(function (a) { return K.ranges(a.name, terms).length; });
      r.atk.hidden = !names.length;
      if (names.length) mark(r.atk, names.map(function (a) { return E.ATK[c.atk.indexOf(a)] + ' ' + a.name; }).join('   '), terms);
    }
  }
  function setCount(r, k, full) {
    var stop = k >= K.COPIES || full;
    r.li.classList.toggle('has', k > 0);
    r.li.classList.toggle('stop', stop);
    r.step.sub.disabled = !k; r.step.add.disabled = stop;
    r.main.setAttribute('aria-disabled', stop ? 'true' : 'false');
    if (r.n === k) return;
    if (r.n >= 0) { r.step.cnt.classList.remove('bump'); void r.step.cnt.offsetWidth; r.step.cnt.classList.add('bump'); }
    r.n = k;
    r.step.cnt.textContent = k + ' / ' + K.COPIES;
    r.step.cnt.title = k + ' of ' + E.card(r.id).name + ' in the deck';
  }

  function emptyRow() {
    var li = h('li', 'ed-none'), row1 = h('div', 'row'), b;
    li.appendChild(h('p', null, 'No cards match.'));
    if (K.filtering(F) && F.q.trim()) {
      b = h('button', 'btn small', 'Search all cards for “' + F.q.trim() + '”'); b.type = 'button';
      b.onclick = function () { resetFilters(true); refresh(); $('edQ').focus(); };
      row1.appendChild(b);
    }
    b = h('button', 'btn ghost small', 'Clear search and filters'); b.type = 'button';
    b.onclick = function () { resetFilters(); refresh(); $('edQ').focus(); };
    row1.appendChild(b);
    li.appendChild(row1);
    return li;
  }
  function drawList(res, n) {
    var list = $('edList'), ids = res.ids, key = res.query.terms.join('\n'), full = W.deck.cards.length >= K.SIZE;
    var at = rowOf(document.activeElement), had = at && list.contains(at) ? +at.dataset.id : -1, pos = shown.indexOf(had);
    ids.forEach(function (id) {
      var r = row(id);
      if (r.marked !== key) setMarks(r, res.query.terms, key);
      setCount(r, n[id] || 0, full);
    });
    if (ids.length !== shown.length || ids.some(function (id, i) { return id !== shown[i]; }) || !list.firstChild) {
      var frag = document.createDocumentFragment();
      ids.forEach(function (id) { frag.appendChild(ROWS[id].li); });
      if (!ids.length) frag.appendChild(emptyRow());
      clear(list).appendChild(frag);
      shown = ids.slice();
    } else if (!ids.length) clear(list).appendChild(emptyRow());
    if (ROWS[tabId]) ROWS[tabId].main.tabIndex = -1;
    if (ids.indexOf(tabId) < 0) tabId = ids.length ? ids[0] : -1;
    if (ROWS[tabId]) ROWS[tabId].main.tabIndex = 0;
    // a row that was being used moved or went: stay on it, or on the one that took its place
    if (had >= 0 && !list.contains(document.activeElement)) {
      if (ids.length) focusRow(ids.indexOf(had) >= 0 ? had : ids[Math.min(Math.max(pos, 0), ids.length - 1)]);
      else $('edQ').focus();
    }
  }
  function focusRow(id) {
    var r = ROWS[id];
    if (!r) return;
    if (ROWS[tabId]) ROWS[tabId].main.tabIndex = -1;
    tabId = id; r.main.tabIndex = 0;
    r.main.focus();
    r.li.scrollIntoView({ block: 'nearest' });
  }

  // ------------------------------------------------------------------ filters
  function drawFacets(res) {
    var box = $('edFacets'), a = document.activeElement, keep = a && box.contains(a) ? a.dataset.f + '=' + a.dataset.v : null, hidden = 0;
    clear(box);
    K.FACETS.forEach(function (Fc) {
      var sel = F.sel[Fc.key];
      if (Fc.more && !more) { hidden += sel.length; return; }
      var g = h('div', 'ed-fgroup');
      g.setAttribute('role', 'group'); g.setAttribute('aria-label', Fc.label);
      g.appendChild(h('span', 'ed-flabel', Fc.label));
      function chip(v, label, count, on, cls) {
        var b = h('button', 'chip' + (on ? ' on' : '') + (cls ? ' ' + cls : ''));
        b.type = 'button'; b.dataset.f = Fc.key; b.dataset.v = String(v);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        UI.rich(b, label);
        if (count != null) b.appendChild(h('span', 'n', String(count)));
        b.disabled = count === 0 && !on;
        g.appendChild(b);
      }
      if (Fc.single) chip('', 'All', null, !sel.length);
      Fc.values.forEach(function (v) { chip(v[0], v[1], res.facets[Fc.key][v[0]], sel.indexOf(v[0]) >= 0, Fc.key === 'spec' ? SPEC_CLS[v[0]] : ''); });
      box.appendChild(g);
    });
    $('edMore').textContent = more ? 'Fewer filters' : 'More filters' + (hidden ? ' (' + hidden + ' on)' : '');
    $('edMore').setAttribute('aria-expanded', more ? 'true' : 'false');
    if (keep) {
      var again = Array.prototype.filter.call(box.querySelectorAll('.chip'), function (b) { return b.dataset.f + '=' + b.dataset.v === keep; })[0];
      if (again && !again.disabled) again.focus();
    }
  }
  function toggle(key, raw) {
    var Fc = K.FACETS.filter(function (x) { return x.key === key; })[0], sel = F.sel[key];
    var v = Fc.values.filter(function (x) { return String(x[0]) === raw; })[0];
    if (!v) { F.sel[key] = []; return; }                   // "All"
    var k = sel.indexOf(v[0]);
    if (Fc.single) F.sel[key] = k >= 0 ? [] : [v[0]];
    else if (k >= 0) sel.splice(k, 1);
    else sel.push(v[0]);
  }
  function resetFilters(keepSearch) {
    var f = K.newFilter();
    f.sort = F.sort; f.desc = F.desc;
    if (keepSearch) f.q = F.q;
    F = f;
    $('edQ').value = F.q;
  }
  function drawSort() {
    var S = K.SORTS.filter(function (s) { return s.key === F.sort; })[0];
    $('edSort').value = F.sort;
    $('edDir').textContent = S.key === 'name' ? (F.desc ? 'Z to A' : 'A to Z') : (F.desc ? 'High first' : 'Low first');
    $('edDir').title = 'Turn the order round';
  }

  function refresh() {
    if (!W) return;
    var n = K.counts(W.deck.cards), res = K.search(F, n), on = K.filtering(F) || !!F.q.trim();
    drawFacets(res);
    drawList(res, n);
    drawSort();
    $('edCount').textContent = res.ids.length === res.total ? res.total + ' cards' : res.ids.length + ' of ' + res.total + ' cards';
    $('edClear').hidden = !on;
  }

  // ------------------------------------------------------------------ the deck
  function drawTop() {
    var d = W.deck, sel = clear($('edArmor')), any = false, a, forms, o;
    if (document.activeElement !== $('edName')) $('edName').value = d.name;
    o = h('option', null, 'None'); o.value = '0'; sel.appendChild(o);
    for (a = 1; a <= 3; a++) {
      forms = K.armorForms(d.cards, a);
      if (!forms.length) continue;
      any = true;
      o = h('option', null, forms.map(function (f) { return E.card(f[0]).name + ' → ' + E.card(f[1]).name; }).join(', '));
      o.value = String(a); sel.appendChild(o);
    }
    sel.value = String(d.armor);
    $('edArmorBox').hidden = !any;
    $('edUndo').disabled = !W.undo.length; $('edRedo').disabled = !W.redo.length;
    $('edEmpty').disabled = !d.cards.length;
  }
  function drawDeck() {
    var d = W.deck, n = K.counts(d.cards), bad = K.problems(d.cards), list = $('edDeck'), ul = clear($('edProblems')), mix = clear($('edMix'));
    var a = document.activeElement, at = rowOf(a), keep = at && list.contains(at) ? { id: +at.dataset.id, sub: a.classList.contains('ed-sub') } : null;
    var order = [], k;
    $('edTotal').textContent = d.cards.length + ' / ' + K.SIZE;
    $('edTabDeck').textContent = 'Deck ' + d.cards.length + ' / ' + K.SIZE;
    $('edMeter').style.width = Math.min(100, d.cards.length * 100 / K.SIZE) + '%';
    $('edMeter').parentNode.classList.toggle('ok', !bad.length);
    bad.forEach(function (t) { ul.appendChild(h('li', null, t)); });
    if (!bad.length) ul.appendChild(h('li', 'ok', 'Ready to play.'));

    // what the deck is made of: cards by level, and its Digimon by Specialty
    var groups = K.grouped(d.cards), per = [0, 0, 0, 0, 0], mons = 0;
    if (groups.length) {
      var line = h('div', 'ed-levels');
      groups.forEach(function (g) { var s = h('span', null, g.label.replace('Level ', '')); s.appendChild(h('b', null, String(g.total))); line.appendChild(s); });
      mix.appendChild(line);
    }
    d.cards.forEach(function (id) { var c = E.card(id); if (c.type === 'digimon') { per[c.spec]++; mons++; } });
    if (mons) {
      var bar = h('div', 'ed-specbar');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', 'Digimon by Specialty: ' + per.map(function (v, i) { return v ? E.SPEC[i] + ' ' + v : ''; }).filter(Boolean).join(', '));
      per.forEach(function (v, i) {
        if (!v) return;
        var seg = h('span', SPEC_CLS[i], String(v));
        seg.style.flexGrow = v; seg.title = E.SPEC[i] + ': ' + v + (v === 1 ? ' Digimon card' : ' Digimon cards');
        bar.appendChild(seg);
      });
      mix.appendChild(bar);
    }

    clear(list);
    if (!groups.length) list.appendChild(h('li', 'ed-hint', 'No cards yet. Click a card on the left to put it in, or search for one and press Enter.'));
    groups.forEach(function (g) {
      list.appendChild(h('li', 'grp', g.label + ' — ' + g.total));
      g.ids.forEach(function (id) {
        var c = E.card(id), li = h('li', 'ed-drow'), s = stepper(c);
        li.dataset.id = id;
        li.appendChild(UI.thumb(id));
        li.appendChild(h('span', 'ed-nm', c.name));
        s.cnt.textContent = '×' + n[id];
        s.add.disabled = !!K.whyNot(d.cards, id);
        li.appendChild(s.el);
        list.appendChild(li);
        order.push(id);
      });
    });
    // the button that was pressed is rebuilt with the list: stay on it, or next to where it was
    if (keep && !list.contains(document.activeElement) && order.length) {
      k = order.indexOf(keep.id);
      var to = list.querySelector('.ed-drow[data-id="' + (k >= 0 ? keep.id : order[Math.min(order.length - 1, order.filter(function (x) { return x < keep.id; }).length)]) + '"]');
      to = to && to.querySelector(keep.sub || k < 0 ? '.ed-sub' : '.ed-plus:not(:disabled), .ed-sub');
      if (to) to.focus();
    }
  }

  // ------------------------------------------------------------------ card detail
  function drawInfo(id) {
    var box = $('edInfo'), c = E.card(id), k;
    if (id === cur && box.firstChild) { inDeck(); return; }
    cur = id;
    clear(box);
    if (!c) {
      box.appendChild(h('p', 'ed-hint', 'Point at a card, or move to it with the arrow keys, to see it here.'));
      return;
    }
    var art = h('div', 'ed-art ' + UI.cls(c)), img = document.createElement('img'), body = h('div', 'ed-ibody');
    img.src = UI.art(id, false); img.alt = ''; img.decoding = 'async';
    art.appendChild(img); box.appendChild(art);
    body.appendChild(h('div', 'ed-iname', c.name));
    body.appendChild(h('div', 'ed-kind', kindOf(c)));
    if (c.type === 'digimon') {
      var st = h('div', 'ed-istats');
      st.appendChild(stat('HP', c.hp)); st.appendChild(stat('DP', c.dp)); st.appendChild(stat('+P', c.pp));
      body.appendChild(st);
      var at = h('div', 'ed-iatk');
      c.atk.forEach(function (a, i) {
        at.appendChild(h('span', 'sym s' + i, E.ATK[i])); at.appendChild(h('span', null, a.name)); at.appendChild(h('b', null, String(a.power)));
      });
      body.appendChild(at);
    }
    box.appendChild(body);
    var tx = h('div', 'ed-itext');
    tx.appendChild(h('b', null, c.type === 'digimon' ? 'Support effect' : c.type === 'option' ? 'Option effect' : 'Digivolve option'));
    tx.appendChild(UI.rich(h('span'), effectOf(c)));
    if (c.type === 'digimon' && c.xfx) {
      tx.appendChild(UI.rich(h('b'), E.ATK[2] + ' ' + E.XFX[c.xfx]));
      tx.appendChild(UI.rich(h('span'), UI.XFX_HELP[c.xfx]));
    }
    k = E.PARTNERS.indexOf(id);
    if (k >= 0) {
      tx.appendChild(h('b', null, 'Partner'));
      tx.appendChild(h('span', null, 'Can armor digivolve when it enters, to ' + E.ARMORS[k].filter(Boolean).map(function (x) { return E.card(x).name; }).join(' or ') + ': the Armor choice of the deck says which.'));
    }
    tx.appendChild(h('span', 'ed-have'));
    box.appendChild(tx);
    inDeck();
  }
  function inDeck() {
    var el = $('edInfo').querySelector('.ed-have'), k;
    if (!el || !W) return;
    k = K.counts(W.deck.cards)[cur] || 0;
    el.textContent = k ? k + ' of ' + K.COPIES + ' in the deck.' : 'Not in the deck.';
  }

  // ------------------------------------------------------------------ changing the deck
  function apply(cards, armor) {
    var d = W.deck;
    d.cards = cards.slice().sort(function (a, b) { return a - b; });
    d.armor = K.armorForms(d.cards, armor).length ? armor : 0;   // an armor choice with no partner left to use it is dropped
    W.opts.save(d);
    drawTop(); refresh(); drawDeck(); inDeck();
  }
  function change(cards, armor) {
    W.undo.push({ cards: W.deck.cards, armor: W.deck.armor });
    if (W.undo.length > 200) W.undo.shift();
    W.redo = [];
    apply(cards, armor == null ? W.deck.armor : armor);
  }
  function step(from, to, what) {
    var s = from.pop();
    if (!s) return;
    to.push({ cards: W.deck.cards, armor: W.deck.armor });
    apply(s.cards, s.armor);
    say(what + '. Deck ' + W.deck.cards.length + ' of ' + K.SIZE + '.');
  }
  function nudge(id) {
    var r = ROWS[id];
    if (!r) return;
    r.li.classList.remove('nope'); void r.li.offsetWidth; r.li.classList.add('nope');
  }
  function add(id) {
    var c = E.card(id), why = K.whyNot(W.deck.cards, id), had = K.armorForms(W.deck.cards, 1).length + K.armorForms(W.deck.cards, 2).length;
    if (why) { say(why); nudge(id); return; }
    change(W.deck.cards.concat([id]));
    say(c.name + ' added, ' + K.counts(W.deck.cards)[id] + ' of ' + K.COPIES + '. Deck ' + W.deck.cards.length + ' of ' + K.SIZE + '.' +
      (E.PARTNERS.indexOf(id) >= 0 && !had ? ' ' + c.name + ' is a partner: its armor form can be chosen at the top.' : ''));
  }
  function take(id) {
    var cards = W.deck.cards.slice(), k = cards.lastIndexOf(id);
    if (k < 0) return;
    cards.splice(k, 1);
    change(cards);
    say(E.card(id).name + ' taken out, ' + (K.counts(cards)[id] || 0) + ' left. Deck ' + cards.length + ' of ' + K.SIZE + '.');
  }

  // ------------------------------------------------------------------ opening and closing
  function open(deck, opts) {
    W = { deck: deck, opts: opts, undo: [], redo: [] };
    resetFilters();
    tabId = -1; cur = -1;
    $('editor').hidden = false;
    $('edGrid').dataset.view = 'cards';
    Array.prototype.forEach.call($('edTabs').children, function (b) { b.classList.toggle('on', b.dataset.view === 'cards'); });
    $('edName').value = deck.name;
    drawTop(); refresh(); drawDeck(); drawInfo(-1);
    $('edList').scrollTop = 0;
    window.scrollTo(0, 0);
    // on a touch screen the keyboard would cover the cards: leave the search box alone there
    if (!window.matchMedia || window.matchMedia('(hover: hover)').matches) $('edQ').focus();
  }
  function close() {
    if (!W) return;
    var done = W.opts.done;
    W.deck.name = K.tidyName($('edName').value);
    W.opts.save(W.deck);
    W = null;
    $('editor').hidden = true;
    done();
  }

  // ------------------------------------------------------------------ wiring
  K.SORTS.forEach(function (s) { var o = h('option', null, s.label); o.value = s.key; $('edSort').appendChild(o); });

  $('edQ').oninput = function () { F.q = $('edQ').value; refresh(); $('edList').scrollTop = 0; };
  $('edQ').onkeydown = function (e) {
    if (e.key === 'ArrowDown' && shown.length) { e.preventDefault(); focusRow(shown[0]); }
    else if (e.key === 'Enter' && shown.length) { e.preventDefault(); if (e.shiftKey) take(shown[0]); else add(shown[0]); drawInfo(shown[0]); }
    else if (e.key === 'Escape' && $('edQ').value) { e.preventDefault(); $('edQ').value = ''; F.q = ''; refresh(); }
  };
  $('edSort').onchange = function () {
    F.sort = $('edSort').value;
    F.desc = !!K.SORTS.filter(function (s) { return s.key === F.sort; })[0].desc;
    refresh(); $('edList').scrollTop = 0;
  };
  $('edDir').onclick = function () { F.desc = !F.desc; refresh(); $('edList').scrollTop = 0; };
  $('edHelpBtn').onclick = function () {
    $('edHelp').hidden = !$('edHelp').hidden;
    $('edHelpBtn').setAttribute('aria-expanded', $('edHelp').hidden ? 'false' : 'true');
  };
  $('edFacets').onclick = function (e) {
    var b = e.target;
    while (b && b !== this && !(b.classList && b.classList.contains('chip'))) b = b.parentNode;
    if (!b || b === this || b.disabled) return;
    toggle(b.dataset.f, b.dataset.v);
    refresh(); $('edList').scrollTop = 0;
  };
  $('edMore').onclick = function () { more = !more; refresh(); };
  $('edClear').onclick = function () { resetFilters(); refresh(); $('edQ').focus(); };

  function listClick(e) {
    var li = rowOf(e.target), t = e.target;
    if (!li || !W) return;
    while (t && t !== li && t.tagName !== 'BUTTON') t = t.parentNode;
    if (!t || t === li || t.disabled) return;
    if (t.classList.contains('ed-sub') || (e.shiftKey && t.classList.contains('ed-main'))) take(+li.dataset.id);
    else add(+li.dataset.id);
  }
  $('edList').onclick = listClick;
  $('edDeck').onclick = listClick;
  $('edList').onkeydown = function (e) {
    var li = rowOf(e.target), k = li ? shown.indexOf(+li.dataset.id) : -1, to = -1;
    if (k < 0 || e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowDown': to = k + 1; break;
      case 'ArrowUp': to = k - 1; break;
      case 'PageDown': to = Math.min(k + 8, shown.length - 1); break;
      case 'PageUp': to = Math.max(k - 8, 0); break;
      case 'Home': to = 0; break;
      case 'End': to = shown.length - 1; break;
      case '+': case '=': e.preventDefault(); add(shown[k]); return;
      case '-': case '_': case 'Delete': case 'Backspace': e.preventDefault(); take(shown[k]); return;
      default: return;
    }
    e.preventDefault();
    if (to < 0) $('edQ').focus();
    else if (to < shown.length) focusRow(shown[to]);
  };
  function peek(e) { var li = rowOf(e.target); if (li && W) drawInfo(+li.dataset.id); }
  ['edList', 'edDeck'].forEach(function (id) { $(id).addEventListener('mouseover', peek); $(id).addEventListener('focusin', peek); });

  $('edName').oninput = function () { if (W) { W.deck.name = K.tidyName($('edName').value); W.opts.save(W.deck); } };
  $('edName').onblur = function () { if (W) $('edName').value = W.deck.name; };
  $('edName').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); $('edQ').focus(); } };
  $('edArmor').onchange = function () { change(W.deck.cards, +$('edArmor').value); };
  $('edUndo').onclick = function () { step(W.undo, W.redo, 'Undone'); };
  $('edRedo').onclick = function () { step(W.redo, W.undo, 'Done again'); };
  $('edEmpty').onclick = function () { if (W.deck.cards.length) { change([]); say('All cards taken out. Undo brings them back.'); } };
  $('edExport').onclick = function () { W.deck.name = K.tidyName($('edName').value); W.opts.exportDeck(W.deck); };
  $('edBack').onclick = close;
  $('edDone').onclick = close;
  Array.prototype.forEach.call($('edTabs').children, function (b) {
    b.onclick = function () {
      $('edGrid').dataset.view = b.dataset.view;
      Array.prototype.forEach.call($('edTabs').children, function (x) { x.classList.toggle('on', x === b); });
    };
  });

  document.addEventListener('keydown', function (e) {
    if (!W || document.querySelector('dialog[open]')) return;
    var z = (e.ctrlKey || e.metaKey) && !e.altKey ? e.key.toLowerCase() : '';
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target)) { e.preventDefault(); $('edQ').focus(); $('edQ').select(); }
    else if (z === 'z' && !typing(e.target)) { e.preventDefault(); if (e.shiftKey) step(W.redo, W.undo, 'Done again'); else step(W.undo, W.redo, 'Undone'); }
    else if (z === 'y' && !typing(e.target)) { e.preventDefault(); step(W.redo, W.undo, 'Done again'); }
  });

  window.DDCB_EDITOR = { open: open, close: close, filter: function () { return F; } };
})();
