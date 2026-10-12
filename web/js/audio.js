/*
 * Sound: battle music and effects rendered from the game's own SEQ/VAB data
 * (tools/build_audio.py). Effect ids are program*16 + tone in the SE0 bank, the same
 * numbers the game passes to its play routine; `script(n)` plays the sounds that battle
 * effect script n contains, at the script's own frame offsets.
 */
(function () {
  'use strict';
  var M = window.DDCB_AUDIO || { bgm: {}, se: [], scripts: [], frame: 1 / 60 };
  var ctx = null, master = null, musicGain = null, seGain = null;
  var buffers = {}, cur = null, curId = null;
  var enabled = true;
  try { enabled = localStorage.getItem('ddcb-sound') !== '0'; } catch (e) { /* storage unavailable */ }

  function pad(n, len, radix) { var s = n.toString(radix || 10); while (s.length < len) s = '0' + s; return s; }

  function init() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = enabled ? 1 : 0; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.5; musicGain.connect(master);
      seGain = ctx.createGain(); seGain.gain.value = 0.9; seGain.connect(master);
      [0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xaa].forEach(function (id) { load(seUrl(id)); });
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function load(url) {
    if (!buffers[url]) {
      buffers[url] = fetch(url).then(function (r) { return r.arrayBuffer(); })
        .then(function (b) { return ctx.decodeAudioData(b); });
      buffers[url].catch(function () { delete buffers[url]; });
    }
    return buffers[url];
  }
  function seUrl(id) { return 'assets/audio/se/' + pad(id, 2, 16) + '.ogg'; }

  function stopMusic() {
    if (cur) { try { cur.stop(); } catch (e) { /* already stopped */ } cur = null; }
    curId = null;
  }

  // Start a music track from its beginning (looping between the score's own loop markers), as
  // the game's start routine does (0x8002b858: stop what plays, play, set the volume). `vol`
  // is the volume the game loaded the track with, out of 127. No-op if it is playing.
  function music(id, vol) {
    if (!ctx || id === curId) return;
    stopMusic();
    curId = id;
    if (id == null) return;
    load('assets/audio/bgm/' + pad(id, 3) + '.ogg').then(function (buf) {
      if (curId !== id) return;
      var s = ctx.createBufferSource(), info = M.bgm[id];
      s.buffer = buf;
      musicGain.gain.value = 0.5 * (vol == null ? 127 : vol) / 127;
      if (info && info.loopEnd != null) { s.loop = true; s.loopStart = info.loopStart; s.loopEnd = info.loopEnd; }
      s.connect(musicGain);
      s.start();
      cur = s;
    }).catch(function () { /* missing file: stay silent */ });
  }

  function se(id, delay) {
    if (!ctx || !enabled || M.se.indexOf(id) < 0) return;
    var at = ctx.currentTime + (delay || 0);
    load(seUrl(id)).then(function (buf) {
      var s = ctx.createBufferSource();
      s.buffer = buf;
      s.connect(seGain);
      s.start(Math.max(at, ctx.currentTime));
    }).catch(function () { /* ignore */ });
  }

  function script(n) {
    (M.scripts[n] || []).forEach(function (e) { se(e[1], e[0] * M.frame); });
  }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem('ddcb-sound', enabled ? '1' : '0'); } catch (e) { /* ignore */ }
    if (master) master.gain.value = enabled ? 1 : 0;
  }

  window.DDCB_SND = {
    init: init, music: music, stopMusic: stopMusic, se: se, script: script,
    setEnabled: setEnabled, isEnabled: function () { return enabled; }
  };
})();
