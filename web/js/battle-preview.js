(function () {
  'use strict';
  var B = window.DDCB_B3D, cards = window.DDCB_DATA.cards.filter(function (c) { return c.type === 'digimon'; });
  var $ = function (id) { return document.getElementById(id); }, run = 0, playingName = '';
  cards.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (c) {
    var option = document.createElement('option'); option.value = c.id; option.textContent = c.name; $('previewCard').appendChild(option);
  });
  var agumon = cards.find(function (c) { return c.name === 'Agumon'; });
  if (agumon) $('previewCard').value = agumon.id;
  function selected() { return window.DDCB_DATA.cards[+$('previewCard').value]; }
  function attacks() {
    $('previewAttack').textContent = '';
    selected().atk.forEach(function (a, i) {
      var option = document.createElement('option'); option.value = i; option.textContent = ['○ ', '△ ', '✕ '][i] + a.name; $('previewAttack').appendChild(option);
    });
  }
  attacks();
  $('previewCard').onchange = attacks;
  try { $('previewStyle').value = localStorage.getItem('ddcb-battle-style') || 'enhanced'; } catch (err) { /* ignore */ }
  B.setStyle($('previewStyle').value);
  $('previewStyle').onchange = function () {
    B.setStyle(this.value);
    try { localStorage.setItem('ddcb-battle-style', B.style); } catch (err) { /* ignore */ }
  };
  var arenaList = [];
  function showStage() {
    var arena = arenaList.find(function (a) { return String(a.index) === $('previewStage').value; });
    $('previewStageThumb').hidden = !arena;
    if (arena) {
      $('previewStageThumb').src = 'assets/battle/arena/' + arena.file + '.webp';
      $('previewStageThumb').alt = 'Stage ' + (arenaList.indexOf(arena) + 1) + ' preview';
    }
  }
  var arenas = fetch('assets/battle/arenas.json').then(function (r) {
    if (!r.ok) throw new Error('No stages');
    return r.json();
  }).then(function (list) {
    if (!list.length) throw new Error('No stages');
    arenaList = list;
    $('previewStage').textContent = '';
    var random = document.createElement('option'); random.value = ''; random.textContent = 'Random'; $('previewStage').appendChild(random);
    list.forEach(function (arena, i) {
      var option = document.createElement('option'); option.value = arena.index; option.textContent = 'Stage ' + (i + 1); $('previewStage').appendChild(option);
    });
    var pick = '44';
    try {
      var saved = localStorage.getItem('ddcb-preview-arena');
      if (saved !== null) pick = saved;
    } catch (err) { /* storage unavailable */ }
    if (pick && !list.some(function (a) { return String(a.index) === pick; })) pick = String(list[0].index);
    $('previewStage').value = pick;
    $('previewStage').disabled = $('previewPlay').disabled = false;
    showStage();
    return list;
  }).catch(function () {
    $('previewStatus').textContent = 'The stages could not load. Reload and try again.';
    return [];
  });
  $('previewStage').onchange = function () {
    showStage();
    try { localStorage.setItem('ddcb-preview-arena', this.value); } catch (err) { /* storage unavailable */ }
  };
  $('previewPause').onclick = function () { B.paused = !B.paused; this.textContent = B.paused ? 'Resume' : 'Pause'; };
  $('previewStep').onclick = function () {
    B.paused = true; $('previewPause').textContent = 'Resume'; B.advance(12);
    var scene = B._debug();
    if (scene) $('previewStatus').textContent = playingName + ' · paused at ' + (scene.frame / 60).toFixed(1) + ' seconds';
  };
  $('previewPlay').onclick = function () {
    var token = ++run, card = selected(), k = +$('previewAttack').value, attack = card.atk[k], stage = $('previewStage').value;
    playingName = card.name;
    B.stop(); B.paused = false; $('previewPause').textContent = 'Pause'; $('previewPause').disabled = $('previewStep').disabled = true;
    $('previewStatus').textContent = 'Loading ' + card.name + ' · ' + attack.name + '…';
    arenas.then(function (list) {
      if (token !== run) return;
      if (!list.length) return;
      var arena = list.find(function (a) { return String(a.index) === stage; });
      if (!arena) {
        var free = list.filter(function (a) { return a.index >= 44 && a.index <= 55; });
        arena = (free.length ? free : list)[Math.floor(Math.random() * (free.length || list.length))];
      }
      var opponent = cards.find(function (c) { return c.name === 'Garurumon'; }) || cards[0];
      $('previewPause').disabled = $('previewStep').disabled = false;
      $('previewStatus').textContent = card.name + ' · ' + attack.name + ' — preview damage: 300 HP';
      return B.attack({ models: [card.model, opponent.model], attacker: 0, first: 0, script: attack.script, hit: attack.hit,
        attack: k, name: attack.name, specialty: card.spec, arena: arena, sound: false,
        hp: [1200, 900], hpBefore: 1200, damage: 300 }).then(function (ok) {
        if (token !== run) return;
        $('previewPause').disabled = $('previewStep').disabled = true; $('previewPause').textContent = 'Pause';
        $('previewStatus').textContent = ok ? card.name + ' · ' + attack.name + ' finished. Play again or choose another move.' : 'The animation could not load. Reload and try again.';
      });
    }).catch(function () { if (token === run) $('previewStatus').textContent = 'The arena could not load. Reload and try again.'; });
  };
})();
