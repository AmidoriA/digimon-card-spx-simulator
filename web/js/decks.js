/*
 * Deck building: the rules of the game's deck editor (overlay P/SUBSEG.BIN), the card
 * search of this project's editor, and the two forms a deck is exported as (a card list
 * anyone can read, and a short code). Nothing in here touches the page.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./engine.js'), root);
  else root.DDCB_DECKS = factory(root.DDCB, root);
})(typeof globalThis !== 'undefined' ? globalThis : self, function (E, root) {
  'use strict';

  var CARDS = E.CARDS;

  // ---------------------------------------------------------------- rules
  // A deck is 30 cards: the editor's exit check (0x801ed61c) walks 0x1e slots and with an
  // empty one says "There are not enough Cards."
  var SIZE = 30;
  // 0x801ece70, asked before a card goes into a slot: an armor form never does (card numbers
  // 172-174, 176-181, 185, 186, 188, 189), any other card only while the deck holds fewer
  // than 4 of it.
  var COPIES = 4;
  var NAME_MAX = 24; // this project's limit, for the layout

  function usable(id) {
    return !!CARDS[id] && !((id >= 172 && id <= 174) || (id >= 176 && id <= 181) || id === 185 || id === 186 || id === 188 || id === 189);
  }
  function counts(cards) {
    var n = {};
    cards.forEach(function (id) { n[id] = (n[id] || 0) + 1; });
    return n;
  }
  // '' when one more of card `id` may go in, or why not
  function whyNot(cards, id) {
    if (!CARDS[id]) return 'No such card.';
    if (!usable(id)) return 'An armor form cannot be put in a deck.';
    if ((counts(cards)[id] || 0) >= COPIES) return 'A deck holds at most ' + COPIES + ' of the same card.';
    if (cards.length >= SIZE) return 'The deck is full (' + SIZE + ' cards).';
    return '';
  }
  // What keeps a deck from being played, as sentences. After the count the exit check looks
  // for a Digimon card (0x801ed674): "Please place Digimon Cards in a Deck."
  function problems(cards) {
    var out = [], n = counts(cards), over = 0, armor = 0;
    if (cards.length < SIZE) out.push((SIZE - cards.length) + ' more ' + (SIZE - cards.length === 1 ? 'card' : 'cards') + ' needed: a deck is ' + SIZE + ' cards.');
    if (cards.length > SIZE) out.push((cards.length - SIZE) + ' too many: a deck is ' + SIZE + ' cards.');
    if (!cards.some(function (id) { return CARDS[id] && CARDS[id].type === 'digimon'; })) out.push('Please place Digimon Cards in a Deck.');
    Object.keys(n).forEach(function (id) { if (!usable(+id)) armor++; else if (n[id] > COPIES) over++; });
    if (over) out.push('More than ' + COPIES + ' of the same card.');
    if (armor) out.push('An armor form cannot be put in a deck.');
    return out;
  }
  function legal(cards) { return !problems(cards).length; }

  // the partner Rookies of a deck with the armor form its armor byte gives each: [[rookie, form]]
  function armorForms(cards, armor) {
    var out = [];
    if (!armor) return out;
    E.PARTNERS.forEach(function (id, k) {
      if (cards.indexOf(id) >= 0 && E.ARMORS[k][armor - 1]) out.push([id, E.ARMORS[k][armor - 1]]);
    });
    return out;
  }

  // ---------------------------------------------------------------- search
  // Text is compared in a folded form: lower case, no apostrophes, and the attack symbols
  // spelled out so that they can be typed. `map` gives, for each folded character, where it
  // came from, so that what matched can be marked in the text as written.
  var SYM = { '○': 'circle', '△': 'triangle', '✕': 'cross' };
  function foldMap(s) {
    var text = '', map = [], i, ch, w, k;
    s = String(s);
    for (i = 0; i < s.length; i++) {
      ch = s[i];
      if (ch === "'" || ch === '’') continue;
      w = SYM[ch] || ch.toLowerCase();
      for (k = 0; k < w.length; k++) { text += w[k]; map.push(i); }
    }
    return { text: text, map: map };
  }
  function fold(s) { return foldMap(s).text; }

  var INDEX = CARDS.map(function (c) {
    var dig = c.type === 'digimon';
    return {
      name: fold(c.name),
      atk: dig ? fold(c.atk.map(function (a) { return a.name; }).join(' | ')) : '',
      xfx: dig && c.xfx ? fold(E.XFX[c.xfx]) : '',
      text: c.text === 'None' ? '' : fold(c.text)
    };
  });
  var POOL = CARDS.map(function (c) { return c.id; }).filter(usable);

  // numbers that can be compared in the search box: hp>=1500  dp<40  +p=20  o>600
  var STAT = {
    hp: function (c) { return c.hp; }, dp: function (c) { return c.dp; },
    pp: function (c) { return c.pp; }, '+p': function (c) { return c.pp; }, p: function (c) { return c.pp; },
    o: function (c) { return c.atk[0].power; }, circle: function (c) { return c.atk[0].power; },
    t: function (c) { return c.atk[1].power; }, triangle: function (c) { return c.atk[1].power; },
    x: function (c) { return c.atk[2].power; }, cross: function (c) { return c.atk[2].power; }
  };
  var STAT_RE = /^(hp|dp|pp|\+p|p|o|circle|t|triangle|x|cross)(<=|>=|=|<|>|:)(\d+)$/i;
  var CMP = {
    '<': function (a, b) { return a < b; }, '>': function (a, b) { return a > b; },
    '<=': function (a, b) { return a <= b; }, '>=': function (a, b) { return a >= b; },
    '=': function (a, b) { return a === b; }, ':': function (a, b) { return a === b; }
  };

  // -> { terms: [folded words to find], not: [words that must be absent], stats: [{key, op, value}] }
  function parseQuery(q) {
    var out = { terms: [], not: [], stats: [] }, re = /"([^"]*)"?|(\S+)/g, m, tok, s, f;
    while ((m = re.exec(String(q || '')))) {
      if (m[1] != null) { f = fold(m[1]).trim(); if (f) out.terms.push(f); continue; }
      tok = m[2];
      s = STAT_RE.exec(tok);
      if (s) { out.stats.push({ key: s[1].toLowerCase(), op: s[2], value: +s[3] }); continue; }
      if (tok.length > 1 && tok[0] === '-') { f = fold(tok.slice(1)); if (f) out.not.push(f); continue; }
      f = fold(tok);
      if (f) out.terms.push(f);
    }
    return out;
  }
  // how well a word fits a card: 0 the name starts with it ... 4 only the effect text has it; -1 not at all
  function score(ix, term) {
    var k = ix.name.indexOf(term);
    if (k === 0) return 0;
    if (k > 0) return /[a-z0-9]/.test(ix.name[k - 1]) ? 2 : 1;
    if (ix.atk.indexOf(term) >= 0 || ix.xfx.indexOf(term) >= 0) return 3;
    if (ix.text.indexOf(term) >= 0) return 4;
    return -1;
  }
  // rank of a card for a parsed query (lower is better), or -1 when it does not match
  function rank(id, P) {
    var c = CARDS[id], ix = INDEX[id], r = 0, i, s;
    for (i = 0; i < P.stats.length; i++) {
      if (c.type !== 'digimon' || !CMP[P.stats[i].op](STAT[P.stats[i].key](c), P.stats[i].value)) return -1;
    }
    for (i = 0; i < P.not.length; i++) if (score(ix, P.not[i]) >= 0) return -1;
    for (i = 0; i < P.terms.length; i++) {
      s = score(ix, P.terms[i]);
      if (s < 0) return -1;
      r += s;
    }
    return r;
  }
  // where the words of a query are in `text` as written: [[from, to), ...], merged and in order
  function ranges(text, terms) {
    var fm = foldMap(text), raw = [], out = [];
    (terms || []).forEach(function (t) {
      var k = fm.text.indexOf(t);
      while (t && k >= 0) { raw.push([fm.map[k], fm.map[k + t.length - 1] + 1]); k = fm.text.indexOf(t, k + 1); }
    });
    raw.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    raw.forEach(function (r) {
      var last = out[out.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else out.push(r.slice());
    });
    return out;
  }

  // x attack effects by family, for one filter chip each
  function xfxFamily(x) { return x === 0 ? 'none' : x === 1 ? 'first' : x <= 4 ? 'zero' : x <= 7 ? 'counter' : x === 8 ? 'crash' : x === 9 ? 'eatup' : x === 10 ? 'jam' : 'x3'; }
  function dig(f) { return function (c, n) { return c.type === 'digimon' ? f(c, n) : null; }; }
  // The filters. A card passes a filter with nothing chosen, or when its value is one of the
  // chosen ones; a card with no value for it (an option card has no Specialty) then fails.
  var FACETS = [
    { key: 'kind', label: 'Type', single: true, values: [['digimon', 'Digimon'], ['option', 'Option'], ['digivolve', 'Digivolve']], of: function (c) { return c.type; } },
    { key: 'spec', label: 'Specialty', values: E.SPEC.map(function (s, i) { return [i, s]; }), of: dig(function (c) { return c.spec; }) },
    { key: 'level', label: 'Level', values: [[0, 'R'], [2, 'C'], [3, 'U']], of: dig(function (c) { return c.level; }) },
    { key: 'deck', label: 'Show', single: true, values: [['in', 'In deck'], ['out', 'Not in deck']], of: function (c, n) { return n[c.id] ? 'in' : 'out'; } },
    { key: 'xfx', label: E.ATK[2] + ' effect', more: true, values: [['first', '1st Attack'], ['zero', 'to 0'], ['counter', 'Counter'], ['crash', 'Crash'], ['eatup', 'Eat-up HP'], ['jam', 'Jamming'], ['x3', 'Foe x3'], ['none', 'None']], of: dig(function (c) { return xfxFamily(c.xfx); }) },
    { key: 'dp', label: 'DP cost', more: true, values: [0, 20, 30, 40, 50, 60, 70].map(function (v) { return [v, String(v)]; }), of: dig(function (c) { return c.dp; }) },
    { key: 'pp', label: '+P', more: true, values: [0, 10, 20, 30].map(function (v) { return [v, '+' + v]; }), of: dig(function (c) { return c.pp; }) }
  ];
  // Sort keys: those of the game's editor sort menu (table 0x801f2154: Number, Level, Strength,
  // Required DP, Added DP, the three attack powers, Cards Used) and the name. `desc` is the
  // direction a key starts in; a card without the value (an option card's HP) always comes last.
  var SORTS = [
    { key: 'number', label: 'Number', of: function (c) { return c.id; } },
    { key: 'name', label: 'Name', of: function (c) { return INDEX[c.id].name; } },
    { key: 'level', label: 'Level', of: dig(function (c) { return c.level; }) },
    { key: 'hp', label: 'HP', desc: true, of: dig(function (c) { return c.hp; }) },
    { key: 'dp', label: 'DP cost', of: dig(function (c) { return c.dp; }) },
    { key: 'pp', label: '+P', desc: true, of: dig(function (c) { return c.pp; }) },
    { key: 'a0', label: E.ATK[0] + ' power', desc: true, of: dig(function (c) { return c.atk[0].power; }) },
    { key: 'a1', label: E.ATK[1] + ' power', desc: true, of: dig(function (c) { return c.atk[1].power; }) },
    { key: 'a2', label: E.ATK[2] + ' power', desc: true, of: dig(function (c) { return c.atk[2].power; }) },
    { key: 'deck', label: 'Cards in deck', desc: true, of: function (c, n) { return n[c.id] || 0; } }
  ];

  function newFilter() {
    var sel = {};
    FACETS.forEach(function (F) { sel[F.key] = []; });
    return { q: '', sel: sel, sort: 'number', desc: false };
  }
  function filtering(f) { return FACETS.some(function (F) { return f.sel[F.key].length; }); }

  // The cards of the pool that pass the query and the filters, in order, and for every filter
  // value how many cards there would be with it chosen (the other filters staying as they are).
  // inDeck: {card id: copies in the deck being built}
  function search(f, inDeck) {
    var P = parseQuery(f.q), n = inDeck || {}, base = [], rk = {}, facets = {}, ids;
    POOL.forEach(function (id) { var r = rank(id, P); if (r >= 0) { rk[id] = r; base.push(id); } });
    function pass(id, skip) {
      var c = CARDS[id];
      return FACETS.every(function (F) {
        var s = f.sel[F.key];
        return F.key === skip || !s.length || s.indexOf(F.of(c, n)) >= 0;
      });
    }
    FACETS.forEach(function (F) {
      var t = facets[F.key] = {};
      F.values.forEach(function (v) { t[v[0]] = 0; });
      base.forEach(function (id) {
        var v = F.of(CARDS[id], n);
        if (v != null && t[v] != null && pass(id, F.key)) t[v]++;
      });
    });
    ids = base.filter(function (id) { return pass(id); });
    var S = SORTS.filter(function (s) { return s.key === f.sort; })[0] || SORTS[0], dir = f.desc ? -1 : 1;
    ids.sort(function (a, b) {
      var x = S.of(CARDS[a], n), y = S.of(CARDS[b], n);
      if ((x == null) !== (y == null)) return x == null ? 1 : -1;
      // in number order a search puts the cards whose name matches before those that only mention the word
      if (S.key === 'number' && rk[a] !== rk[b]) return rk[a] - rk[b];
      if (x !== y && x != null) return (x < y ? -1 : 1) * dir;
      return a - b;
    });
    return { ids: ids, facets: facets, total: POOL.length, query: P };
  }

  // ---------------------------------------------------------------- export and import
  function tidyName(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, NAME_MAX); }
  // A deck as it is kept: name, armor byte, and its card ids in number order. Cards the rules
  // do not allow are left out.
  function clean(d) {
    var cards = [], n = {};
    (Array.isArray(d && d.cards) ? d.cards : []).forEach(function (id) {
      id = +id;
      if (!usable(id) || id !== Math.floor(id) || (n[id] || 0) >= COPIES || cards.length >= SIZE) return;
      n[id] = (n[id] || 0) + 1; cards.push(id);
    });
    cards.sort(function (a, b) { return a - b; });
    var armor = d && +d.armor;
    return { name: tidyName(d && d.name), cards: cards, armor: armor >= 1 && armor <= 3 ? Math.floor(armor) : 0 };
  }

  var GROUPS = [['Level R', function (c) { return c.type === 'digimon' && c.level === 0; }],
    ['Level C', function (c) { return c.type === 'digimon' && c.level === 2; }],
    ['Level U', function (c) { return c.type === 'digimon' && c.level === 3; }],
    ['Option', function (c) { return c.type === 'option'; }],
    ['Digivolve', function (c) { return c.type === 'digivolve'; }]];
  // the different cards of a deck by group: [{label, total, ids}], empty groups left out
  function grouped(cards) {
    var n = counts(cards), ids = Object.keys(n).map(Number).sort(function (a, b) { return a - b; });
    return GROUPS.map(function (g) {
      var own = ids.filter(function (id) { return g[1](CARDS[id]); });
      return { label: g[0], ids: own, total: own.reduce(function (t, id) { return t + n[id]; }, 0) };
    }).filter(function (g) { return g.ids.length; });
  }

  // The card list: one "count name" line per card, readable and editable by hand.
  function toText(d) {
    var n = counts(d.cards), lines = ['Deck: ' + (d.name || 'Deck')], forms = armorForms(d.cards, d.armor);
    if (d.armor) {
      lines.push('Armor: ' + d.armor + (forms.length ? ' (' + forms.map(function (f) { return CARDS[f[0]].name + ' > ' + CARDS[f[1]].name; }).join(', ') + ')' : ''));
    }
    grouped(d.cards).forEach(function (g) {
      lines.push('', '# ' + g.label + ' (' + g.total + ')');
      g.ids.forEach(function (id) { lines.push(n[id] + ' ' + CARDS[id].name); });
    });
    return lines.join('\n') + '\n';
  }

  function b64(bytes) {
    var s = '', i;
    for (i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return root.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64(str) {
    var s, out = [], i;
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    try { s = root.atob(str); } catch (err) { return null; }
    for (i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }
  function checksum(bytes, n) {
    var t = 0x5a, i;
    for (i = 0; i < n; i++) t = (t * 31 + bytes[i]) & 0xff;
    return t;
  }
  // The code: "DCB1-" and, in URL-safe base64: armor byte, number of different cards, two bytes
  // per card (number, low byte first, with the copies in the top four bits), the name in UTF-8
  // and a check byte.
  var CODE = 'DCB1-', CODE_RE = /DCB1-([A-Za-z0-9_-]+)/;
  function toCode(d) {
    var n = counts(d.cards), ids = Object.keys(n).map(Number).sort(function (a, b) { return a - b; });
    var bytes = [d.armor & 3, ids.length];
    ids.forEach(function (id) { bytes.push(id & 0xff, (id >> 8) | (n[id] << 4)); });
    Array.prototype.push.apply(bytes, Array.prototype.slice.call(new root.TextEncoder().encode(d.name || '')));
    bytes.push(checksum(bytes, bytes.length));
    return CODE + b64(bytes);
  }
  function fromCode(code) {
    var b = unb64(code), entries = [], i, k, id;
    if (!b || b.length < 3 || checksum(b, b.length - 1) !== b[b.length - 1]) return null;
    k = b[1];
    if (b.length < 3 + 2 * k) return null;
    for (i = 0; i < k; i++) {
      id = b[2 + 2 * i] | ((b[3 + 2 * i] & 0x0f) << 8);
      if (!CARDS[id]) return null;
      entries.push({ id: id, n: b[3 + 2 * i] >> 4 });
    }
    var name = '';
    try { name = new root.TextDecoder().decode(new Uint8Array(b.slice(2 + 2 * k, b.length - 1))); } catch (err) { /* a name that is not text: none */ }
    return { name: name, armor: b[0] & 3, entries: entries };
  }

  // card names as typed: case, spaces and punctuation do not count
  function key(s) { return fold(s).replace(/[^a-z0-9]/g, ''); }
  var BY_NAME = {};
  CARDS.forEach(function (c) {
    BY_NAME[key(c.name)] = c.id;
    // "Attack Disk ✕" may also be typed with the letter: o, t, x
    if (/[○△✕]/.test(c.name)) BY_NAME[key(c.name.replace('○', 'o').replace('△', 't').replace('✕', 'x'))] = c.id;
  });
  function distance(a, b) {
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  // the card whose name is nearest to an unknown one, if any is near
  function nearest(name) {
    var k = key(name), best = -1, bd = Math.max(2, Math.floor(k.length / 4)) + 1;
    if (!k) return -1;
    CARDS.forEach(function (c) {
      var ck = key(c.name), d = ck.indexOf(k) >= 0 && k.length >= 4 ? 1 : distance(k, ck);
      if (d < bd) { bd = d; best = c.id; }
    });
    return best;
  }

  // Read a deck from what was pasted or loaded: a deck code (alone or inside a link), or a card
  // list with lines such as "4 Agumon", "4x Agumon", "Agumon x4" or just "Agumon".
  // -> { name, armor, cards, notes: [what was changed or not understood], found: lines read as cards }
  // Cards the rules do not allow are left out and said so, so that what comes back can be kept.
  function parse(text) {
    var notes = [], entries = [], name = '', armor = 0, m;
    text = String(text == null ? '' : text);
    m = CODE_RE.exec(text);
    if (m) {
      var d = fromCode(m[1]);
      if (!d) return { name: '', armor: 0, cards: [], found: 0, notes: ['That deck code cannot be read. It may have been cut short or mistyped.'] };
      name = d.name; armor = d.armor; entries = d.entries;
    } else {
      text.split(/\r?\n/).forEach(function (line, k) {
        var s = line.replace(/\s+/g, ' ').trim(), n = 1, nm, id;
        if (!s || s[0] === '#' || s.slice(0, 2) === '//') return;
        if ((m = /^(?:deck|name)\s*:\s*(.*)$/i.exec(s))) { name = m[1]; return; }
        if ((m = /^(?:armor|digi-egg)\s*:\s*(\d+)/i.exec(s))) { armor = +m[1]; return; }
        if (/^(?:armor|digi-egg)\s*:/i.test(s)) return;
        nm = s;
        if (BY_NAME[key(s)] == null) {
          if ((m = /^(\d+)\s*[x×*]?\s+(.+)$/i.exec(s))) { n = +m[1]; nm = m[2]; }
          else if ((m = /^(.+?)\s*[x×*]\s*(\d+)$/i.exec(s)) || (m = /^(.+?)\s*\((\d+)\)$/.exec(s))) { n = +m[2]; nm = m[1]; }
        }
        id = BY_NAME[key(nm)];
        if (id == null) {
          var near = nearest(nm);
          notes.push('Line ' + (k + 1) + ': no card is called "' + nm + '"' + (near >= 0 ? '. Did you mean ' + CARDS[near].name + '?' : '.'));
          return;
        }
        if (n < 1) return;
        entries.push({ id: id, n: n });
      });
    }
    var cards = [], have = {}, full = 0;
    entries.forEach(function (e) {
      var c = CARDS[e.id], had = have[e.id] || 0, take = Math.min(e.n, COPIES - had), room;
      if (!usable(e.id)) { notes.push(c.name + ' is an armor form and cannot be put in a deck; left out.'); return; }
      if (take < e.n) notes.push(c.name + ': at most ' + COPIES + ' of the same card; ' + (had + e.n) + ' asked for.');
      room = SIZE - cards.length;
      if (take > room) { full += take - room; take = room; }
      have[e.id] = had + take;
      while (take-- > 0) cards.push(e.id);
    });
    if (full) notes.push('A deck is ' + SIZE + ' cards; the last ' + full + ' left out.');
    if (armor < 0 || armor > 3) { notes.push('Armor ' + armor + ' is not one of 0 to 3; set to none.'); armor = 0; }
    var out = clean({ name: name, cards: cards, armor: armor });
    out.notes = notes; out.found = entries.length;
    return out;
  }

  // ---------------------------------------------------------------- the player's own decks
  var STORE = 'ddcb-decks';
  function storage() { try { return root.localStorage || null; } catch (err) { return null; } }
  // -> [{ id: 'u<n>', name, cards, armor }]
  function load() {
    var raw, list, out = [], seen = {};
    try { raw = JSON.parse(storage().getItem(STORE)); } catch (err) { return out; }
    list = raw && Array.isArray(raw.decks) ? raw.decks : [];
    list.forEach(function (d) {
      if (!d || typeof d.id !== 'string' || !/^u\d+$/.test(d.id) || seen[d.id]) return;
      var c = clean(d);
      c.id = d.id; seen[d.id] = 1; out.push(c);
    });
    return out;
  }
  function save(list) {
    try {
      storage().setItem(STORE, JSON.stringify({ v: 1, decks: list.map(function (d) { return { id: d.id, name: d.name, cards: d.cards, armor: d.armor }; }) }));
      return true;
    } catch (err) { return false; }
  }
  function newId(list) {
    var top = 0;
    list.forEach(function (d) { top = Math.max(top, +String(d.id).slice(1) || 0); });
    return 'u' + (top + 1);
  }

  return {
    SIZE: SIZE, COPIES: COPIES, NAME_MAX: NAME_MAX, POOL: POOL, FACETS: FACETS, SORTS: SORTS,
    usable: usable, counts: counts, whyNot: whyNot, problems: problems, legal: legal, armorForms: armorForms,
    parseQuery: parseQuery, ranges: ranges, newFilter: newFilter, filtering: filtering, search: search,
    clean: clean, tidyName: tidyName, grouped: grouped, toText: toText, toCode: toCode, parse: parse,
    load: load, save: save, newId: newId
  };
});
