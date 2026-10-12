// Checks of the deck rules, the card search and deck export/import (web/js/decks.js).
// Usage: node tools/decktest.js
const path = require('path');
const assert = require('assert');
const E = require(path.join(__dirname, '..', 'web', 'js', 'engine.js'));
const K = require(path.join(__dirname, '..', 'web', 'js', 'decks.js'));

const id = (n) => { const c = E.CARDS.find((x) => x.name === n); assert(c, 'no card ' + n); return c.id; };
const names = (ids) => ids.map((i) => E.card(i).name);
const CUSTOM = E.CARDS.filter((c) => c.custom != null).length;
const find = (q, sel) => {
  const f = K.newFilter();
  f.q = q || '';
  Object.assign(f.sel, sel || {});
  return K.search(f, {});
};
let n = 0;
function test(what, fn) { fn(); n++; }

test('rules: every deck of the game passes them', () => {
  E.DATA.decks.forEach((d) => assert.deepStrictEqual(K.problems(d.cards), [], d.name));
});

test('rules: 30 cards, 4 of a card, no armor forms, a Digimon card', () => {
  const agu = id('Agumon');
  assert.strictEqual(K.whyNot([], agu), '');
  assert.ok(/at most 4/.test(K.whyNot([agu, agu, agu, agu], agu)));
  assert.ok(/armor form/.test(K.whyNot([], id('Flamedramon'))));
  assert.strictEqual(K.whyNot([], id('Veemon')), '', 'a partner Rookie is an ordinary card to the check');
  const full = E.DATA.decks[0].cards;
  assert.ok(/full/.test(K.whyNot(full, agu)));
  assert.ok(/more cards needed/.test(K.problems(full.slice(0, 28))[0]));
  const opts = E.CARDS.filter((c) => c.type === 'option').slice(0, 8).map((c) => c.id);
  const noMon = [].concat(opts, opts, opts, opts).slice(0, 30);
  assert.deepStrictEqual(K.problems(noMon), ['Please place Digimon Cards in a Deck.']);
  // the armor forms are exactly the level A cards
  assert.deepStrictEqual(E.CARDS.filter((c) => !K.usable(c.id)).map((c) => c.id), E.CARDS.filter((c) => c.level === 1).map((c) => c.id));
  // the game's 288, and the custom cards (tools/custom_cards.json)
  assert.strictEqual(K.POOL.length, 288 + CUSTOM);
});

test('search: words, in any order, over names, attacks and effects', () => {
  assert.strictEqual(names(find('agumon').ids)[0], 'Agumon');
  assert.ok(names(find('greymon').ids).includes('MetalGreymon'));
  assert.deepStrictEqual(find('terra force').ids, [id('WarGreymon'), id('BlackWarGreymon')]);
  assert.deepStrictEqual(find('force terra').ids, find('terra force').ids);
  assert.ok(find('"attack first"').ids.length > 0);
  assert.ok(find('"attack first"').ids.every((i) => /attack first/i.test(E.card(i).text)));
  // a name match comes before a card that only mentions the word
  const r = find('digivice').ids;
  assert.ok(/Digivice/.test(E.card(r[0]).name));
  assert.strictEqual(find('zzzz').ids.length, 0);
});

test('search: apostrophes and attack symbols can be typed plainly', () => {
  assert.ok(names(find('devils chip').ids).includes("Devil's Chip"));
  assert.ok(names(find('circle +300').ids).includes('Agumon'));
  assert.deepStrictEqual(K.ranges('Boost own ○ Attack Power +300.', ['circle', 'boost']), [[0, 5], [10, 11]]);
  assert.deepStrictEqual(K.ranges("Devil's Chip", ['devils']), [[0, 7]]);
});

test('search: number comparisons and leaving words out', () => {
  const big = find('hp>=2000').ids;
  assert.ok(big.length > 0 && big.every((i) => E.card(i).hp >= 2000));
  const cheap = find('dp<=20 hp>1000').ids;
  assert.ok(cheap.every((i) => E.card(i).dp <= 20 && E.card(i).hp > 1000));
  assert.ok(find('+p=30').ids.every((i) => E.card(i).pp === 30));
  assert.ok(find('o>900').ids.every((i) => E.card(i).atk[0].power > 900));
  const q = K.parseQuery('agu hp>=500 -chip "attack first"');
  assert.deepStrictEqual(q, { terms: ['agu', 'attack first'], not: ['chip'], stats: [{ key: 'hp', op: '>=', value: 500 }] });
  assert.ok(!names(find('attack -chip').ids).some((x) => /chip/i.test(x)));
});

test('filters: values add up, and each count is what choosing it gives', () => {
  const all = find('');
  assert.strictEqual(all.ids.length, 288 + CUSTOM);
  assert.strictEqual(all.facets.kind.digimon + all.facets.kind.option + all.facets.kind.digivolve, 288 + CUSTOM);
  const fire = find('', { spec: [0] });
  assert.strictEqual(fire.ids.length, all.facets.spec[0]);
  assert.ok(fire.ids.every((i) => E.card(i).spec === 0 && E.card(i).type === 'digimon'));
  const fireU = find('', { spec: [0], level: [3] });
  assert.strictEqual(fireU.ids.length, fire.facets.level[3]);
  // two values of one filter widen it; the other Specialties stay on offer
  assert.strictEqual(find('', { spec: [0, 1] }).ids.length, all.facets.spec[0] + all.facets.spec[1]);
  assert.strictEqual(fire.facets.spec[1], all.facets.spec[1]);
  const counter = find('', { xfx: ['counter'] });
  assert.ok(counter.ids.every((i) => E.card(i).xfx >= 5 && E.card(i).xfx <= 7));
});

test('filters: in the deck or not', () => {
  const f = K.newFilter(), agu = id('Agumon');
  f.sel.deck = ['in'];
  assert.deepStrictEqual(K.search(f, { [agu]: 2 }).ids, [agu]);
  f.sel.deck = ['out'];
  assert.strictEqual(K.search(f, { [agu]: 2 }).ids.length, 287 + CUSTOM);
});

test('sort: by a number, cards without it last either way', () => {
  const f = K.newFilter();
  f.sort = 'hp'; f.desc = true;
  let ids = K.search(f, {}).ids;
  assert.strictEqual(E.card(ids[0]).hp, Math.max(...E.CARDS.filter((c) => c.type === 'digimon' && K.usable(c.id)).map((c) => c.hp)));
  assert.notStrictEqual(E.card(ids[ids.length - 1]).type, 'digimon');
  f.desc = false;
  ids = K.search(f, {}).ids;
  assert.strictEqual(E.card(ids[0]).type, 'digimon');
  assert.notStrictEqual(E.card(ids[ids.length - 1]).type, 'digimon');
  f.sort = 'name';
  ids = K.search(f, {}).ids;
  assert.ok(E.card(ids[0]).name.toLowerCase() <= E.card(ids[1]).name.toLowerCase());
});

test('export: every deck of the game comes back the same from the list and from the code', () => {
  E.DATA.decks.forEach((d) => {
    const deck = K.clean({ name: d.name, cards: d.cards, armor: d.armor });
    [K.toText(deck), K.toCode(deck), 'https://example.org/#deck=' + K.toCode(deck)].forEach((s) => {
      const back = K.parse(s);
      assert.deepStrictEqual(back.notes, [], d.name);
      assert.deepStrictEqual({ name: back.name, cards: back.cards, armor: back.armor }, deck, d.name);
    });
  });
});

test('import: loose lists, and what is wrong with them', () => {
  let d = K.parse('name: Test\n\n4x agumon\nGreymon x2\nmetal greymon\n// note\nDEVILS CHIP (3)\n');
  assert.strictEqual(d.name, 'Test');
  assert.deepStrictEqual(names(d.cards).sort(), ['Agumon', 'Agumon', 'Agumon', 'Agumon', "Devil's Chip", "Devil's Chip", "Devil's Chip", 'Greymon', 'Greymon', 'MetalGreymon'].sort());
  assert.deepStrictEqual(d.notes, []);
  d = K.parse('6 Agumon\n2 Flamedramon\n1 Agumom\n1 Nosuchthing at all');
  assert.strictEqual(d.cards.length, 4);
  assert.strictEqual(d.notes.length, 4);
  assert.ok(/Did you mean Agumon\?/.test(d.notes.join('\n')));
  assert.ok(/armor form/.test(d.notes.join('\n')));
  d = K.parse(E.CARDS.filter((c) => K.usable(c.id)).slice(0, 10).map((c) => '4 ' + c.name).join('\n'));
  assert.strictEqual(d.cards.length, 30);
  assert.ok(/last 10 left out/.test(d.notes[0]));
  assert.strictEqual(K.parse('DCB1-AAAA').cards.length, 0);
  assert.ok(/cannot be read/.test(K.parse('DCB1-AAAA').notes[0]));
  const code = K.toCode(K.clean({ name: 'x', cards: E.DATA.decks[0].cards, armor: 0 }));
  assert.ok(/cannot be read/.test(K.parse(code.slice(0, -3)).notes[0]), 'a cut code is refused');
});

test('import: every card is found by its name, in capitals and without punctuation too', () => {
  E.CARDS.filter((c) => K.usable(c.id)).forEach((c) => {
    assert.deepStrictEqual(K.parse('2 ' + c.name).cards, [c.id, c.id], c.name);
    assert.deepStrictEqual(K.parse(c.name.toUpperCase().replace(/['.]/g, '') + ' x1').cards, [c.id], c.name);
  });
  // three cards differ only in the attack symbol that ends their name
  assert.deepStrictEqual(K.parse('Mega Def. Disk triangle').cards, [id('Mega Def. Disk △')]);
});

console.log(n + ' checks passed');
