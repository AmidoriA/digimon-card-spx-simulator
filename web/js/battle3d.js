/*
 * Polygon Battle: the game's 3D battle animation.
 *
 * Models, textures and motions come from F/NNN.PAK (tools/omd.py, tools/build_models.py).
 * A model is a tree of rigid parts. A motion is a list of keys; each key holds a rotation,
 * an offset and a scale for every part plus one record for the whole model, and the model
 * eases from its current pose to the key over 2 x duration frames (0x80022100, 0x80021aa8:
 * two halves with constant acceleration, aiming at the speed the next key needs).
 *
 * An attack is two of the game's battle scripts (tools/build_battle.py): the attack script
 * of the attacking Digimon, run in the attacker's own frame, then the hit script, run in the
 * target's (director 0x801ee3d4). The scripts use the effect engine of effects.js with more
 * variables and commands (interpreter 0x801e8678): they start the Digimon's motions, create
 * rings, particles, sprites (0x801eb874), animated effect models and light changes
 * (0x801e7880), switch them on and off and play sounds.
 *
 * The two Digimon stand 1500 apart (0x801edb64). The camera (task 0x800250f4) follows the
 * Digimon or effect model the script puts on screen: the last record of every motion key is
 * a camera track, its offset and angles relative to that model. The arena (0x8002e42c) is a
 * model drawn around the camera.
 *
 * Drawn on a 320x240 canvas like the game's screen.
 */
(function () {
  'use strict';
  var W = 320, HGT = 240, FRAME_MS = 1000 / 60;
  var C = window.DDCB_FXCORE, MAP = C.MAP_BATTLE, SND = window.DDCB_SND;
  var canvas = null, gl = null, prog = null, loc = {}, cache = {}, timer = 0, last = 0;
  var scene = null;
  var api = { enabled: true };

  // ------------------------------------------------------------------ maths (column vectors)
  function sin12(a) { return Math.sin(a * Math.PI / 2048); }
  function cos12(a) { return Math.cos(a * Math.PI / 2048); }
  // RotMatrixYXZ at 0x8005cbc4: R = Ry * Rx * Rz (checked by running it)
  function rotYXZ(r) {
    var sx = sin12(r[0]), cx = cos12(r[0]), sy = sin12(r[1]), cy = cos12(r[1]), sz = sin12(r[2]), cz = cos12(r[2]);
    return [cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx,
      cx * sz, cx * cz, -sx,
      -sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx];
  }
  function mul3(a, b) {
    var o = new Array(9), i, j;
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) o[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    return o;
  }
  function xf(m, t, p) {
    return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + t[0], m[3] * p[0] + m[4] * p[1] + m[5] * p[2] + t[1], m[6] * p[0] + m[7] * p[1] + m[8] * p[2] + t[2]];
  }

  // ------------------------------------------------------------------ model files
  function inflate(buf) {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('no DecompressionStream'));
    var s = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(s).arrayBuffer();
  }
  function image(url) {
    return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = url; });
  }
  function texture(im) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function parse(buf) {
    var w = new Int16Array(buf), u = new Uint16Array(buf), p = 0, i, k;
    if (u[0] !== 0x4d44) throw new Error('not a model file');
    var m = { n: w[2], nmot: w[3], nv: u[4], nto: u[5], ntb: u[6], tw: w[7], th: w[8], npal: w[9], parents: [], offsets: [], motions: [] };
    p = 10;
    for (i = 0; i < m.n; i++) { m.parents.push(w[p]); m.offsets.push([w[p + 1], w[p + 2], w[p + 3]]); p += 4; }
    var vb = new Float32Array(m.nv * 13);
    for (i = 0; i < m.nv * 13; i++) vb[i] = w[p + i];
    p += m.nv * 13;
    m.vb = vb;
    m.ib = new Uint16Array(u.subarray(p, p + (m.nto + m.ntb) * 3)); p += (m.nto + m.ntb) * 3;
    m.blend = Array.prototype.slice.call(w.subarray(p, p + m.ntb)); p += m.ntb;
    var rec = (m.n + 1) * 11;
    for (k = 0; k < m.nmot; k++) {
      var nk = w[p++], keys = [];
      for (i = 0; i < nk; i++) { keys.push({ dur: w[p], snd: w[p + 1], r: w.subarray(p + 2, p + 2 + rec) }); p += 2 + rec; }
      m.motions.push(keys);
    }
    return m;
  }
  function rawTexture(fmt, w, h, bytes) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, w, h, 0, fmt, gl.UNSIGNED_BYTE, bytes);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function buffers(m) {
    m.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo); gl.bufferData(gl.ARRAY_BUFFER, m.vb, gl.STATIC_DRAW);
    m.ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.ib, gl.STATIC_DRAW);
    return m;
  }
  // battle scripts by id, and the effect assets of one E/NNN.PAK (tools/build_battle.py)
  var scriptsP = null, fxCache = {};
  function loadScripts() {
    if (!scriptsP) {
      scriptsP = fetch('assets/battle/scripts.json.gz').then(function (r) { if (!r.ok) throw new Error('no scripts'); return r.arrayBuffer(); })
        .then(inflate).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
      scriptsP.catch(function () { scriptsP = null; });
    }
    return scriptsP;
  }
  function loadFx(id) {
    if (fxCache[id]) return fxCache[id];
    fxCache[id] = fetch('assets/battle/fx/' + id + '.bin.gz').then(function (r) { if (!r.ok) throw new Error('no fx ' + id); return r.arrayBuffer(); })
      .then(inflate).then(function (buf) {
        var n = new DataView(buf).getUint32(0, true), idx = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, n))), base = 4 + n, k;
        var fx = { sprites: idx.sprites, tims: {}, models: {} };
        for (k in idx.tims) {
          var t = idx.tims[k];
          fx.tims[k] = { w: t.w, h: t.h, rows: t.rows, tex: rawTexture(gl.LUMINANCE, t.w, t.h, new Uint8Array(buf, base + t.off, t.w * t.h)),
            pal: rawTexture(gl.RGBA, 256, t.rows, new Uint8Array(buf, base + t.pal, 1024 * t.rows)) };
        }
        for (k in idx.models) {
          var d = idx.models[k], m = buffers(parse(buf.slice(base + d.off, base + d.off + d.len)));
          m.tex = rawTexture(gl.LUMINANCE, d.tw, d.th, new Uint8Array(buf, base + d.tex, d.tw * d.th));
          m.pal = rawTexture(gl.RGBA, 256, d.rows, new Uint8Array(buf, base + d.pal, 1024 * d.rows));
          fx.models[k] = m;
        }
        return fx;
      }).catch(function () { return { sprites: {}, tims: {}, models: {} }; });
    return fxCache[id];
  }
  // num: a Digimon's model number, or 'bg912' for an arena
  function load(num) {
    if (cache[num]) return cache[num];
    var base = 'assets/models/' + (typeof num === 'number' ? ('00' + num).slice(-3) : num);
    cache[num] = Promise.all([
      fetch(base + '.bin.gz').then(function (r) { if (!r.ok) throw new Error('no model ' + num); return r.arrayBuffer(); }).then(inflate),
      image(base + '.png'), image(base + 'p.png')
    ]).then(function (a) {
      var m = buffers(parse(a[0]));
      m.tex = texture(a[1]); m.pal = texture(a[2]);
      return m;
    });
    cache[num].catch(function () { delete cache[num]; });
    return cache[num];
  }

  // ------------------------------------------------------------------ a Digimon in the scene
  function Actor(model, pos, facing) {
    this.m = model; this.pos = pos.slice(); this.facing = facing;
    var n = (model.n + 1) * 9, i;
    this.p = new Float64Array(n); this.v = new Float64Array(n); this.a1 = new Float64Array(n); this.a2 = new Float64Array(n);
    this.cur = -1; this.count = -1; this.phase = 0; this.keys = null; this.loop = -1; this.show = [];
    for (i = 0; i <= model.n; i++) this.show.push(0);
    this.mats = []; this.onSound = null;
    this.baseM = null;      // set by an effect object that carries this model
    this.visible = true; this.bright = 1;
    if (model.motions.length) { this.snap(0); this.play(0, true); }
    else { for (i = 0; i < n; i += 9) { this.p[i + 6] = this.p[i + 7] = this.p[i + 8] = 4096; } }
  }
  // record fields: rot 0..2, show 3, move 4..6, scale 7..9, next 10 -> channel order rot, move, scale
  var FIELD = [0, 1, 2, 4, 5, 6, 7, 8, 9];
  // 0x80023148: take the pose of the motion's first key at once
  Actor.prototype.snap = function (mot) {
    var k = this.m.motions[mot][0].r, i, c;
    for (i = 0; i <= this.m.n; i++) for (c = 0; c < 9; c++) { this.p[i * 9 + c] = k[i * 11 + FIELD[c]]; this.v[i * 9 + c] = 0; }
  };
  // 0x80022d34: start a motion from the current pose. With loop = true the motion's own
  // "next key" field decides whether it repeats.
  Actor.prototype.play = function (mot, loop) {
    this.keys = this.m.motions[mot] || this.m.motions[0];
    if (!this.keys) return;
    this.loop = loop ? this.keys[0].r[10] : -1;
    this.cur = 0; this.count = 0;
  };
  Actor.prototype.busy = function () { return this.cur >= 0 || this.count > 0; };
  // 0x80022100: aim every channel at the current key
  Actor.prototype.setup = function () {
    if (this.cur < 0) { this.count = -1; return; }
    var key = this.keys[this.cur], D = Math.max(1, key.dur), nx = this.cur + 1 < this.keys.length ? this.cur + 1 : this.loop, i, c;
    if (key.snd > 0 && this.onSound) this.onSound(key.snd - 1);
    var k1 = key.r, k2 = nx >= 0 ? this.keys[nx].r : key.r, Dn = nx >= 0 ? Math.max(1, this.keys[nx].dur * 2) : 1;
    this.count = 2 * D; this.phase = D; this.cur = nx;
    for (i = 0; i <= this.m.n; i++) {
      if (i < this.m.n) this.show[i] = k1[i * 11 + 3];
      for (c = 0; c < 9; c++) {
        var j = i * 9 + c, f = i * 11 + FIELD[c];
        this.p[j] = Math.trunc(this.p[j]);
        var avg = (k1[f] - this.p[j]) / (2 * D), end = ((k2[f] - k1[f]) / Dn + avg) / 2, mid = 2 * avg - (end + this.v[j]) / 2;
        this.a1[j] = (mid - this.v[j]) / D; this.a2[j] = (end - mid) / D;
      }
    }
  };
  Actor.prototype.step = function () {
    if (this.count >= 0) {
      this.count--;
      if (this.count <= 0) this.setup();
    }
    var n = this.m.n, j, live = this.count > 0;
    if (live) {
      for (j = 0; j < (n + 1) * 9; j++) this.p[j] += this.v[j];
      this.phase--;
      var acc = this.phase >= 0 ? this.a1 : this.a2;
      for (j = 0; j < (n + 1) * 9; j++) this.v[j] += acc[j];
    }
    this.base = this.baseM || rotYXZ([0, this.facing, 0]);
    // Part 0's z offset is not a pose value: 0x80021964 takes it away every frame and walks the
    // whole model that far along its facing.
    var dz = Math.trunc(this.p[5]);
    if (dz) {
      this.p[5] -= dz;
      if (!this.baseM) { this.pos[0] += this.base[2] * dz; this.pos[1] += this.base[5] * dz; this.pos[2] += this.base[8] * dz; }
    }
  };
  // parents may come after their children in the part list: resolve in dependency order
  Actor.prototype.resolve = function () {
    var n = this.m.n, done = [], i, guard = 0, self = this;
    var base = this.base;
    function part(i) {
      if (done[i]) return done[i];
      if (guard++ > 4096) return { m: base, t: self.pos };
      var par = self.m.parents[i], pm = par >= 0 ? part(par) : { m: base, t: self.pos }, j = i * 9;
      var lm = rotYXZ([self.p[j], self.p[j + 1], self.p[j + 2]]), s = [self.p[j + 6] / 4096, self.p[j + 7] / 4096, self.p[j + 8] / 4096];
      lm = [lm[0] * s[0], lm[1] * s[1], lm[2] * s[2], lm[3] * s[0], lm[4] * s[1], lm[5] * s[2], lm[6] * s[0], lm[7] * s[1], lm[8] * s[2]];
      var lt = [self.m.offsets[i][0] + Math.trunc(self.p[j + 3]), self.m.offsets[i][1] + Math.trunc(self.p[j + 4]), self.m.offsets[i][2] + Math.trunc(self.p[j + 5])];
      done[i] = { m: mul3(pm.m, lm), t: xf(pm.m, pm.t, lt) };
      return done[i];
    }
    for (i = 0; i < n; i++) part(i);
    this.mats = done;
  };

  // box around the model in its current pose: [min x, y, z, max x, y, z]
  Actor.prototype.bounds = function () {
    var b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9], vb = this.m.vb, i, k;
    for (i = 0; i < this.m.nv; i++) {
      var mt = this.mats[vb[i * 13 + 11]], w = xf(mt.m, mt.t, [vb[i * 13], vb[i * 13 + 1], vb[i * 13 + 2]]);
      for (k = 0; k < 3; k++) { if (w[k] < b[k]) b[k] = w[k]; if (w[k] > b[k + 3]) b[k + 3] = w[k]; }
    }
    return b;
  };

  // ------------------------------------------------------------------ renderer
  // Lighting as the GTE does it for the models' normals: colour = back colour + colour matrix x
  // max(0, light matrix x normal). Defaults from 0x801ef25c / 0x801ef27c; back colour
  // (0x30, 0x30, 0x40) is set at 0x80024440.
  var LIGHT_DIR = [[0, -4096, -1500], [0, 4096, -2000], [0, 0, 0]], LIGHT_COL = [[4096, 4096, 4096], [1500, 1500, 1500], [0, 0, 0]];
  var BACK = [0x30 / 256, 0x30 / 256, 0x40 / 256];
  var VS = 'attribute vec3 aP,aN,aC;attribute vec4 aT;uniform mat3 uM[32];uniform vec3 uT[32];uniform float uShow[32];uniform mat3 uV;uniform vec3 uVT;uniform vec2 uTex;uniform float uPalN,uBright;' +
    'uniform vec3 uLD[3];uniform vec3 uLC[3];uniform vec3 uBK;varying vec3 vC;varying vec2 vUV;varying float vPal,vTex;' +
    'void main(){int i=int(aT.z+0.5);mat3 m=uM[i];vec3 w=m*aP+uT[i];vec3 e=uV*w+uVT;' +
    'vec3 lit=vec3(1.0);if(dot(aN,aN)>0.5){vec3 n=normalize(m*aN);lit=uBK;for(int k=0;k<3;k++)lit+=uLC[k]*max(0.0,dot(n,uLD[k]));lit=clamp(lit,0.0,2.0);}' +
    'vC=aC/128.0*lit*uBright;vTex=aT.x<0.0?0.0:1.0;vUV=(aT.xy+0.5)/uTex;vPal=(aT.w+0.5)/uPalN;' +
    'float z=max(e.z,1.0);gl_Position=vec4(e.x*448.0/160.0,-e.y*448.0/120.0,(z-60.0)/20000.0*z,z);if(uShow[i]>0.5)gl_Position=vec4(2.0,2.0,2.0,1.0);}';
  var FS = 'precision mediump float;uniform sampler2D uS,uP;varying vec3 vC;varying vec2 vUV;varying float vPal,vTex;' +
    'void main(){if(vTex<0.5){gl_FragColor=vec4(vC*0.5,1.0);return;}float ix=texture2D(uS,vUV).r*255.0;vec4 c=texture2D(uP,vec2((ix+0.5)/256.0,vPal));if(c.a<0.5)discard;gl_FragColor=vec4(c.rgb*vC,1.0);}';
  // flat-coloured effect primitives and sprites, already projected: x, y in screen pixels, z = depth
  var PVS = 'attribute vec3 p;attribute vec3 c;varying vec3 v;void main(){v=c/255.0;gl_Position=vec4(p.x/160.0-1.0,1.0-p.y/120.0,clamp((p.z-60.0)/20000.0,0.0,1.0),1.0);}';
  var PFS = 'precision mediump float;varying vec3 v;void main(){gl_FragColor=vec4(v,1.0);}';
  var SVS = 'attribute vec3 p;attribute vec2 t;uniform vec2 uTex;varying vec2 vUV;void main(){vUV=(t+0.5)/uTex;gl_Position=vec4(p.x/160.0-1.0,1.0-p.y/120.0,clamp((p.z-60.0)/20000.0,0.0,1.0),1.0);}';
  var SFS = 'precision mediump float;uniform sampler2D uS,uP;uniform float uPal,uCol;varying vec2 vUV;' +
    'void main(){float ix=texture2D(uS,vUV).r*255.0;vec4 c=texture2D(uP,vec2((ix+0.5)/256.0,uPal));if(c.a<0.5)discard;gl_FragColor=vec4(c.rgb*uCol,1.0);}';
  var pprog = null, sprog = null, pbuf = null, ploc = {}, sloc = {};
  function program(vs, fs) {
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    return p;
  }
  function initGL() {
    canvas = document.getElementById('b3d');
    if (!canvas) return false;
    if (gl) return true;
    gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return false;
    prog = program(VS, FS);
    ['aP', 'aN', 'aC', 'aT'].forEach(function (a) { loc[a] = gl.getAttribLocation(prog, a); });
    ['uM', 'uT', 'uShow', 'uV', 'uVT', 'uTex', 'uPalN', 'uS', 'uP', 'uBright', 'uLD', 'uLC', 'uBK'].forEach(function (u) { loc[u] = gl.getUniformLocation(prog, u); });
    pprog = program(PVS, PFS); ploc = { p: gl.getAttribLocation(pprog, 'p'), c: gl.getAttribLocation(pprog, 'c') };
    sprog = program(SVS, SFS);
    sloc = { p: gl.getAttribLocation(sprog, 'p'), t: gl.getAttribLocation(sprog, 't') };
    ['uTex', 'uS', 'uP', 'uPal', 'uCol'].forEach(function (u) { sloc[u] = gl.getUniformLocation(sprog, u); });
    pbuf = gl.createBuffer();
    return true;
  }
  function drawActor(a) {
    var m = a.m, M = new Float32Array(32 * 9), T = new Float32Array(32 * 3), S = new Float32Array(32), i, k;
    for (i = 0; i < m.n && i < 32; i++) {
      var x = a.mats[i];
      // GLSL mat3 is column-major
      for (k = 0; k < 9; k++) M[i * 9 + k] = x.m[(k % 3) * 3 + Math.floor(k / 3)];
      T[i * 3] = x.t[0]; T[i * 3 + 1] = x.t[1]; T[i * 3 + 2] = x.t[2];
      S[i] = a.show[i] ? 1 : 0;
    }
    gl.uniformMatrix3fv(loc.uM, false, M); gl.uniform3fv(loc.uT, T); gl.uniform1fv(loc.uShow, S);
    gl.uniform2f(loc.uTex, m.tw, m.th); gl.uniform1f(loc.uPalN, Math.max(1, m.npal)); gl.uniform1f(loc.uBright, a.bright);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, m.tex); gl.uniform1i(loc.uS, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, m.pal); gl.uniform1i(loc.uP, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    var st = 13 * 4;
    gl.enableVertexAttribArray(loc.aP); gl.vertexAttribPointer(loc.aP, 3, gl.FLOAT, false, st, 0);
    gl.enableVertexAttribArray(loc.aN); gl.vertexAttribPointer(loc.aN, 3, gl.FLOAT, false, st, 12);
    gl.enableVertexAttribArray(loc.aC); gl.vertexAttribPointer(loc.aC, 3, gl.FLOAT, false, st, 24);
    gl.enableVertexAttribArray(loc.aT); gl.vertexAttribPointer(loc.aT, 4, gl.FLOAT, false, st, 36);
    gl.disable(gl.BLEND);
    gl.drawElements(gl.TRIANGLES, m.nto * 3, gl.UNSIGNED_SHORT, 0);
    if (m.ntb) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
      gl.drawElements(gl.TRIANGLES, m.ntb * 3, gl.UNSIGNED_SHORT, m.nto * 6);
      gl.depthMask(true);
    }
  }
  // view: rows right, down, forward (the PlayStation's x right, y down, z into the screen)
  function lookAt(eye, at) {
    var f = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]], l = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]) || 1;
    f = [f[0] / l, f[1] / l, f[2] / l];
    var r = [f[2], 0, -f[0]]; l = Math.sqrt(r[0] * r[0] + r[2] * r[2]) || 1; r = [r[0] / l, 0, r[2] / l];
    var d = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    return [r[0], r[1], r[2], d[0], d[1], d[2], f[0], f[1], f[2]];
  }
  // 0x800250f4: the camera sits at the focus model's place plus the offset of the motion's
  // camera record (mirrored for the Digimon that faces the other way) and is turned by minus
  // its angles, plus that Digimon's facing.
  function camera(sc) {
    var a = sc.focus, o = sc.focusOwner || a;
    if (!a || !a.keys) return;
    var r = a.m.n * 9, s5 = o.facing ? -1 : 1;
    sc.cam.eye = [Math.trunc(a.p[r + 3]) * s5 + a.pos[0], Math.trunc(a.p[r + 4]) + a.pos[1], Math.trunc(a.p[r + 5]) * s5 + a.pos[2]];
    sc.view = C.rotMatrix([-Math.trunc(a.p[r]), -Math.trunc(a.p[r + 1]) + o.facing, -Math.trunc(a.p[r + 2])]);
  }
  var tri = [], lin = [], sprites = [], rects = [];
  var sink = {
    quad: function (a, b, c, d, ca, cb, cc, cd) {
      tri.push(a[0], a[1], a[2], ca[0], ca[1], ca[2], b[0], b[1], b[2], cb[0], cb[1], cb[2], c[0], c[1], c[2], cc[0], cc[1], cc[2],
        b[0], b[1], b[2], cb[0], cb[1], cb[2], d[0], d[1], d[2], cd[0], cd[1], cd[2], c[0], c[1], c[2], cc[0], cc[1], cc[2]);
    },
    line: function (a, b, ca, cb) { lin.push(a[0], a[1], a[2], ca[0], ca[1], ca[2], b[0], b[1], b[2], cb[0], cb[1], cb[2]); },
    sprite: function (s) { sprites.push(s); },
    rect: function (r) { rects.push(r); }
  };
  function render() {
    if (!gl || !scene) return;
    gl.viewport(0, 0, W, HGT);
    var bk = scene.arena ? scene.arena.back : [8, 10, 20];
    gl.clearColor(bk[0] / 255, bk[1] / 255, bk[2] / 255, 1); gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
    gl.useProgram(prog);
    var R = scene.view, e = scene.cam.eye, t = xf(R, [0, 0, 0], [-e[0], -e[1], -e[2]]), V = new Float32Array(9), k, L = scene.lights;
    for (k = 0; k < 9; k++) V[k] = R[(k % 3) * 3 + Math.floor(k / 3)];
    gl.uniformMatrix3fv(loc.uV, false, V);
    if (scene.arena && scene.arena.actor) {
      // the arena turns with the camera but does not move with it, and is behind everything
      gl.uniform3f(loc.uVT, 0, 0, 0);
      gl.uniform3fv(loc.uLD, new Float32Array(9)); gl.uniform3fv(loc.uLC, new Float32Array(9)); gl.uniform3f(loc.uBK, 1, 1, 1);
      gl.depthMask(false);
      drawActor(scene.arena.actor);
      gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
    }
    gl.uniform3f(loc.uVT, t[0], t[1], t[2]);
    gl.uniform3fv(loc.uLD, new Float32Array(L.dir[0].concat(L.dir[1], L.dir[2]).map(function (x) { return x / 4096; })));
    gl.uniform3fv(loc.uLC, new Float32Array(L.col[0].concat(L.col[1], L.col[2]).map(function (x) { return x / 4096; })));
    gl.uniform3f(loc.uBK, BACK[0], BACK[1], BACK[2]);
    scene.actors.forEach(function (a) { if (a.visible) drawActor(a); });
    scene.extra.forEach(function (a) { if (a.visible && a.bright > 0) drawActor(a); });
    [loc.aP, loc.aN, loc.aC, loc.aT].forEach(function (x) { gl.disableVertexAttribArray(x); });
    // effects: added over the scene like the game's semi-transparent primitives, tested against depth
    gl.enable(gl.BLEND); gl.depthMask(false);
    if (sprites.length) {
      gl.useProgram(sprog);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
      gl.enableVertexAttribArray(sloc.p); gl.enableVertexAttribArray(sloc.t);
      gl.vertexAttribPointer(sloc.p, 3, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(sloc.t, 2, gl.FLOAT, false, 20, 12);
      gl.uniform1i(sloc.uS, 0); gl.uniform1i(sloc.uP, 1);
      sprites.forEach(function (s) {
        // blend modes of the GPU: 0 half + half, 1 add, 2 subtract, 3 add a quarter; -1 opaque
        if (s.blend < 0) gl.disable(gl.BLEND); else gl.enable(gl.BLEND);
        if (s.blend === 0) { gl.blendColor(0.5, 0.5, 0.5, 1); gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR); }
        else if (s.blend === 2) gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
        else gl.blendFunc(gl.ONE, gl.ONE);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.tim.tex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, s.tim.pal);
        gl.uniform2f(sloc.uTex, s.tim.w, s.tim.h); gl.uniform1f(sloc.uPal, (Math.min(s.row, s.tim.rows - 1) + 0.5) / s.tim.rows);
        gl.uniform1f(sloc.uCol, s.col / 128 * (s.blend === 3 ? 0.25 : 1));
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(s.v), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });
      gl.disableVertexAttribArray(sloc.p); gl.disableVertexAttribArray(sloc.t);
    }
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    if (tri.length || lin.length) {
      gl.useProgram(pprog);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
      gl.enableVertexAttribArray(ploc.p); gl.enableVertexAttribArray(ploc.c);
      gl.vertexAttribPointer(ploc.p, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(ploc.c, 3, gl.FLOAT, false, 24, 12);
      if (tri.length) { gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tri), gl.DYNAMIC_DRAW); gl.drawArrays(gl.TRIANGLES, 0, tri.length / 6); }
      if (lin.length) { gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lin), gl.DYNAMIC_DRAW); gl.drawArrays(gl.LINES, 0, lin.length / 6); }
      gl.disableVertexAttribArray(ploc.p); gl.disableVertexAttribArray(ploc.c);
    }
    if (rects.length) {                       // screen rectangles go over everything
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(pprog);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
      gl.enableVertexAttribArray(ploc.p); gl.enableVertexAttribArray(ploc.c);
      gl.vertexAttribPointer(ploc.p, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(ploc.c, 3, gl.FLOAT, false, 24, 12);
      rects.forEach(function (q) {
        var x0 = q.box[0], y0 = q.box[1], x1 = x0 + q.box[2], y1 = y0 + q.box[3], c = q.col, f = q.abr === 3 ? 0.25 : 1;
        if (q.abr === 0) { gl.blendColor(0.5, 0.5, 0.5, 1); gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR); }
        else if (q.abr === 2) gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
        else gl.blendFunc(gl.ONE, gl.ONE);
        var d = [];
        [[x0, y0], [x1, y0], [x0, y1], [x1, y0], [x1, y1], [x0, y1]].forEach(function (pt) { d.push(pt[0], pt[1], 100, c[0] * f, c[1] * f, c[2] * f); });
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.DYNAMIC_DRAW); gl.drawArrays(gl.TRIANGLES, 0, 6);
      });
      gl.disableVertexAttribArray(ploc.p); gl.disableVertexAttribArray(ploc.c);
      gl.enable(gl.DEPTH_TEST);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }

  // ------------------------------------------------------------------ script objects
  // Sprite (object type 16, 0x801e41ac / 0x801eb874): a flat picture facing the viewer that
  // steps through the frames of a sprite chunk. A frame is [frames, u0, u1, v0, v1, w, h,
  // blend, brightness, palette row, x, y]; it is drawn 4 x its size.
  function Sprite(v, parent, fx) {
    this.node = new C.Node(v, parent, MAP);
    this.alpha = C.s16(v[0x3b]);
    this.mode = C.s16(v[0x4f]) < 1 ? 1 : 0;
    this.desc = fx.sprites[v[0x1ba]] || null;
    this.tim = this.desc ? fx.tims[this.desc.tim] : null;
    this.frame = 0; this.tick = -1;
  }
  Sprite.prototype.update = function (out) {
    var N = this.node, d = this.desc;
    if (N.hidden) { N.idle(); return; }
    this.alpha = N.fade(this.alpha);
    if (!this.alpha) { N.idle(); return; }
    N.update(this.mode);
    if (!d || !this.tim || this.frame < 0) return;
    var f = d.frames[this.frame];
    if (!f) return;
    if (++this.tick >= f[0]) {
      this.tick -= f[0];
      if (++this.frame >= d.frames.length) this.frame = d.loop;
      if (this.frame < 0) return;                   // played once: gone
      f = d.frames[this.frame];
      if (!f) return;
    }
    var x0 = -((f[5] * 4) >> 1), x1 = f[5] * 4 + x0 - 1, y0 = -((f[6] * 4) >> 1), y1 = f[6] * 4 + y0 - 1;
    var p = [[x0, y0, 0], [x1, y0, 0], [x0, y1, 0], [x1, y1, 0]].map(function (q) { return C.core.project(C.apply(N.m, N.tr, q)); });
    if (!p[0] || !p[1] || !p[2] || !p[3]) return;
    out.sprite({ tim: this.tim, row: f[9], blend: f[7] < 0 ? -1 : f[7] & 3, col: f[8] * this.alpha >> 8,
      v: [p[0][0], p[0][1], p[0][2], f[1], f[3], p[1][0], p[1][1], p[1][2], f[2], f[3], p[2][0], p[2][1], p[2][2], f[1], f[4], p[3][0], p[3][1], p[3][2], f[2], f[4]] });
  };
  // Effect model (object type 15, 0x801e38a0): a model of the attack's asset file with its own
  // motion, carried by a node; its brightness follows the node's fade.
  function FxModel(v, parent, fx, run) {
    this.node = new C.Node(v, parent, MAP);
    this.alpha = C.s16(v[0x3b]);
    this.mode = v[0x4a] & 0xff;
    var m = fx.models[v[0x1ba]];
    this.actor = m ? new Actor(m, [0, 0, 0], 0) : null;
    if (this.actor) { this.actor.visible = false; run.scene.extra.push(this.actor); }
  }
  FxModel.prototype.update = function () {
    var N = this.node, a = this.actor;
    if (a) a.visible = false;
    if (N.hidden) { N.idle(); return; }
    N.update(this.mode);
    this.alpha = N.fade(this.alpha);
    if (!a || !this.alpha) return;
    a.baseM = N.m; a.pos = N.tr.slice(); a.bright = this.alpha / 255; a.visible = true;
    a.step(); a.resolve();
  };
  FxModel.prototype.off = function () { if (this.actor) this.actor.visible = false; };
  // Light change (object type 3, 0x801e76a8 / 0x801e7880): light `index` swings its direction
  // from the position to the target variables and its colour from the scale to the
  // scale-target variables, restarting every `period` frames, for `frames` frames.
  function Light(v, run) {
    var b = MAP.node;
    this.node = { state: 0, done: 0 };
    this.run = run;
    this.d0 = [v[b], v[b + 1], v[b + 2]]; this.d1 = [v[b + 3], v[b + 4], v[b + 5]];
    this.c0 = [v[b + 17], v[b + 18], v[b + 19]]; this.c1 = [v[b + 20], v[b + 21], v[b + 22]];
    this.index = Math.max(0, Math.min(2, v[b + 8])); this.period = v[b + 9] || 1; this.frames = v[b + 10]; this.t = 0;
  }
  Light.prototype.update = function () {
    if (this.t >= this.frames) return;
    var k = this.t % this.period, L = this.run.scene.lights, i;
    L.dir[this.index] = [0, 1, 2].map(function (i) { return C.s16(this.d0[i] + k * C.tdiv(this.d1[i] - this.d0[i], this.period)); }, this);
    L.col[this.index] = [0, 1, 2].map(function (i) { return C.s16(this.c0[i] + k * C.tdiv(this.c1[i] - this.c0[i], this.period)); }, this);
    if (++this.t === this.frames) for (i = 0; i < 3; i++) { L.dir[i] = LIGHT_DIR[i].slice(); L.col[i] = LIGHT_COL[i].slice(); }
  };
  // Screen rectangle (object type 0, 0x801e6424 / 0x801e651c): a blended rectangle whose
  // colour steps from the first to the second colour; mode 1 then steps back and stops,
  // mode 3 keeps going back and forth, mode 2 starts idle. Used for flashes.
  function Rect(v) {
    this.node = { state: 0, done: 0 };
    this.box = [C.s16(v[0x50]), C.s16(v[0x51]), C.s16(v[0x52]), C.s16(v[0x53])];
    this.a = [v[0x29] & 255, v[0x2a] & 255, v[0x2b] & 255]; this.b = [v[0x2c] & 255, v[0x2d] & 255, v[0x2e] & 255];
    this.col = this.a.slice();
    this.abr = v[0x1e] & 3; this.stepBy = Math.abs(C.s16(v[0x20])) || 1; this.mode = v[0x48] & 0xff;
    this.state = this.mode === 2 ? 0 : 1;
  }
  Rect.prototype.update = function (out) {
    if (!this.state) return;
    var to = this.state === 1 ? this.b : this.a, st = this.stepBy, reached = true, i;
    for (i = 0; i < 3; i++) {
      if (this.col[i] < to[i]) this.col[i] = Math.min(to[i], this.col[i] + st); else if (this.col[i] > to[i]) this.col[i] = Math.max(to[i], this.col[i] - st);
      if (this.col[i] !== to[i]) reached = false;
    }
    if (this.col[0] || this.col[1] || this.col[2]) out.rect({ box: this.box, col: this.col.slice(), abr: this.abr });
    if (reached) {
      if (this.state === 1) this.state = this.mode === 1 || this.mode === 3 ? 2 : 1;
      else this.state = this.mode === 3 ? 1 : 0;
    }
  };
  function Dummy(v, parent) { this.node = new C.Node(v, parent, MAP); }      // object types not ported yet
  Dummy.prototype.update = function () { if (this.node.hidden) this.node.idle(); else this.node.update(0); };

  // ------------------------------------------------------------------ script runner
  // One battle script, run for the Digimon `self` (0x801ea258): effects live in that Digimon's
  // frame; variable 0x1be says whether a command means it (0) or its opponent (1).
  function Run(cmds, self, sc, fx) {
    this.cmds = cmds; this.self = self; this.scene = sc; this.fx = fx;
    this.v = new Int32Array(460);
    this.pc = 0; this.wait = 0; this.skip = false; this.ready = false; this.frames = 0;
    this.slots = [];
    for (var i = 0; i < 150; i++) this.slots.push({ type: -1, on: false, obj: null });
    var a = sc.actors[self];
    this.base = { m: rotYXZ([0, a.facing, 0]), tr: a.pos.slice() };
  }
  Run.prototype.actor = function (who) { return who === 0 ? this.scene.actors[this.self] : who === 1 ? this.scene.actors[this.self ^ 1] : null; };
  // 0x801e9494: what a new object hangs on
  Run.prototype.parent = function () {
    var v = this.v, par = v[0x1b9], who = v[0x1be], a, s;
    if (par < 0) return this.base;
    if (who === -1) { s = this.slots[par]; return s && s.obj && s.obj.node && s.obj.node.m ? s.obj.node : this.base; }
    if (who < -1) { s = this.slots[-who - 2]; a = s && s.obj ? s.obj.actor : null; } else a = this.actor(who);
    if (!a) return this.base;
    return { get m() { return (a.mats[par] || a.mats[0] || { m: a.base }).m; }, get tr() { return (a.mats[par] || a.mats[0] || { t: a.pos }).t; } };
  };
  Run.prototype.spawn = function (slot, type) {
    var s = this.slots[slot], v = this.v;
    if (!s) return;
    if (s.obj && s.obj.off) s.obj.off();
    s.type = type; s.on = false;
    switch (type) {
      case 13: s.obj = new C.Ring(v, this.parent(), MAP); break;
      case 14: s.obj = new C.Plain(v, this.parent(), MAP); break;
      case 17: s.obj = new C.Particles(v, this.parent(), MAP); break;
      case 16: s.obj = new Sprite(v, this.parent(), this.fx); break;
      case 15: s.obj = new FxModel(v, this.parent(), this.fx, this); break;
      case 3: s.obj = new Light(v, this); break;
      case 0: s.obj = new Rect(v); break;
      default: s.obj = new Dummy(v, this.parent());
    }
  };
  var NODE_GET = [['pos0', 0, 3], ['target', 3, 3], ['rot0', 8, 3], ['rotV', 11, 3], ['rotA', 14, 3], ['sc0', 17, 3], ['scT', 20, 3], ['scS', 23, 3]];
  // 0x801e908c: copy an object's node back into the variables (its start values, or with
  // `now` where it is at the moment)
  Run.prototype.readNode = function (slot, now) {
    var s = this.slots[slot], n = s && s.obj ? s.obj.node : null, v = this.v, b = MAP.node;
    if (!n || !n.pos0) return;
    NODE_GET.forEach(function (g) { for (var i = 0; i < g[2]; i++) v[b + g[1] + i] = n[g[0]][i]; });
    if (now) for (var i = 0; i < 3; i++) { v[b + i] = n.pos[i]; v[b + 8 + i] = n.rot[i]; v[b + 17 + i] = n.sc[i]; }
    v[b + 6] = n.speed; v[b + 7] = n.accel; v[b + 26] = n.hitR; v[b + 27] = n.dur; v[b + 28] = n.fadeMode; v[b + 29] = n.fadeStep;
    v[b + 30] = n.type; v[b + 31] = n.delay; v[b + 32] = n.amp; v[b + 33] = n.freq;
  };
  Run.prototype.host = function (c) {
    var v = this.v, a0 = c.length > 3 ? C.s16(c[2] ? v[c[3]] : c[3]) : 0, a1 = c.length > 5 ? C.s16(c[4] ? v[c[5]] : c[5]) : 0, s, a;
    if (c[0] === 0x0a) {
      switch (c[1]) {
        case 7: a = this.actor(v[0x1be]); if (a) a.visible = false; break;       // 0x80022ca4
        case 8: a = this.actor(v[0x1be]); if (a) a.visible = true; break;        // 0x80022d00
        case 9: v[0x1a0] = -Math.round(Math.atan2(v[0x197] - v[0x19a], v[0x19c] - v[0x199]) * 2048 / Math.PI); break;
      }
    } else if (c[0] === 0x0b) {
      switch (c[1]) {
        case 2:                               // start a motion; the damage motion becomes the KO one
          a = this.actor(v[0x1be]);
          if (a) a.play(a0 === 4 && this.scene.hp[this.scene.actors.indexOf(a)] <= 0 ? 5 : a0, true);
          break;
        case 3: if (SND && this.scene.sound) SND.se(a0); break;
        case 5: this.readNode(a0, false); break;
        case 15: this.readNode(a0, true); break;
        case 6:                               // give the object a new node from the variables
          s = this.slots[a0];
          if (s && s.obj && s.obj.node && s.obj.node.pos0) s.obj.node = new C.Node(v, this.parent(), MAP);
          break;
        case 8: s = this.slots[a0]; if (s && s.obj) s.on = true; break;
        case 9: s = this.slots[a0]; if (s) { s.on = false; if (s.obj && s.obj.off) s.obj.off(); } break;
        case 10:                              // wait; ignored until the script says it is set up
          if (!this.ready) { if (v[0] !== -1) return false; this.ready = true; }
          this.wait = a0 - 1; return true;
        case 13:                              // put the position variables where the object is
          s = this.slots[a0];
          if (s && s.obj && s.obj.node && s.obj.node.tr) {
            var w = s.obj.node.tr, b = this.base, d = [w[0] - b.tr[0], w[1] - b.tr[1], w[2] - b.tr[2]];
            v[0x197] = Math.round(b.m[0] * d[0] + b.m[3] * d[1] + b.m[6] * d[2]);
            v[0x198] = Math.round(b.m[1] * d[0] + b.m[4] * d[1] + b.m[7] * d[2]);
            v[0x199] = Math.round(b.m[2] * d[0] + b.m[5] * d[1] + b.m[8] * d[2]);
          }
          break;
        case 14:                              // which Digimon is on screen
          if (a0 === 0) {
            a = this.actor(v[0x1be]); this.scene.actors.forEach(function (x) { x.visible = x === a; });
            if (a) { this.scene.focus = a; this.scene.focusOwner = null; }
          } else if (a0 === 1) {                // an effect model takes the camera
            s = this.slots[v[0x1be]];
            if (s && s.obj && s.obj.actor) { this.scene.focus = s.obj.actor; this.scene.focusOwner = this.scene.actors[this.self]; }
          } else if (a0 === 2) this.scene.actors.forEach(function (x) { x.visible = true; });
          break;
      }
    } else if (c[0] === 0x0c) {
      switch (c[1]) {
        case 0: this.spawn(a0, a1); break;
        case 1: v[1] = Math.trunc(C.sin12(a1) * a0); break;
        case 2: v[1] = Math.trunc(C.cos12(a1) * a0); break;
        case 3: if (SND && this.scene.sound) SND.se(a1); break;
        case 4: v[1] = Math.round(Math.atan2(a0, a1) * 2048 / Math.PI); break;
        case 5: s = this.slots[a0]; if (s && s.obj && s.obj.node) s.obj.node.type = a1; break;
      }
    }
    return false;
  };
  // 0x801e8500: one frame
  Run.prototype.step = function () {
    var v = this.v, c, x, i, guard = 0;
    v[0] = 1;
    if (this.wait) this.wait--;
    else {
      while (this.pc < this.cmds.length && guard++ < 200000) {
        c = this.cmds[this.pc++];
        if (this.skip) { this.skip = false; continue; }
        if (c[0] === 7) {
          x = c[3] ? v[c[4]] : c[4];
          switch (c[2]) {
            case 0: v[c[1]] = x; break;
            case 1: v[c[1]] += x; break;
            case 2: v[c[1]] -= x; break;
            case 3: v[c[1]] = Math.imul(v[c[1]], x); break;
            case 4: v[c[1]] = C.tdiv(v[c[1]], x); break;
            case 5: v[c[1]] = x ? v[c[1]] % x : 0; break;
            case 6: v[c[1]] = C.rand() % (x + 1); break;
          }
        } else if (c[0] === 9) {
          x = c[3] ? v[c[4]] : c[4];
          var y = v[c[1]];
          this.skip = [y === x, y !== x, y < x, y > x, y <= x, y >= x][c[2]] || false;
        } else if (c[0] === 5) this.pc = c[1];
        else if (c[0] >= 0x0a && this.host(c)) break;
      }
    }
    for (i = 0; i < 150; i++) {
      var s = this.slots[i];
      if (!s.on || !s.obj) continue;
      s.obj.update(sink);
      if (s.type >= 10) { v[0x6b + i] = s.obj.node.state; v[0x101 + i] = s.obj.node.done; }
    }
    this.frames++;
    return v[0] !== 0 && this.frames < 1500;
  };
  Run.prototype.end = function () {
    this.slots.forEach(function (s) { if (s.obj && s.obj.off) s.obj.off(); });
    this.scene.extra.length = 0;
    this.scene.lights = { dir: LIGHT_DIR.map(function (r) { return r.slice(); }), col: LIGHT_COL.map(function (r) { return r.slice(); }) };
  };

  function tick() {
    var now = performance.now(), n = Math.min(Math.floor((now - last) / FRAME_MS), 4);
    if (n < 1 || !scene) return;
    last += n * FRAME_MS;
    if (now - last > 200) last = now;
    if (api.paused) return;                     // for looking at one frame while testing
    // the effect objects of effects.js draw through this scene's camera while it runs
    var core = C.core, keep = { project: core.project, bill: core.bill, origin: core.origin };
    var sc = scene;
    core.origin = [0, 0, 0];
    core.project = function (w) {
      var R = sc.view, e = sc.cam.eye, q = xf(R, [0, 0, 0], [w[0] - e[0], w[1] - e[1], w[2] - e[2]]);
      return q[2] < 8 ? null : [160 + q[0] * 448 / q[2], 120 + q[1] * 448 / q[2], q[2]];
    };
    while (n-- > 0 && scene === sc) {
      tri.length = 0; lin.length = 0; sprites.length = 0; rects.length = 0;
      sc.frame++;
      sc.actors.forEach(function (a) { a.step(); a.resolve(); });
      camera(sc);
      core.bill = [sc.view[0], sc.view[3], sc.view[6], sc.view[1], sc.view[4], sc.view[7], sc.view[2], sc.view[5], sc.view[8]];
      if (sc.script) sc.script(sc);
    }
    core.project = keep.project; core.bill = keep.bill; core.origin = keep.origin;
    if (scene === sc) render();
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = 0; }
    if (scene && scene.finish) { var f = scene.finish; scene.finish = null; f(false); }
    scene = null;
    tri.length = 0; lin.length = 0; sprites.length = 0; rects.length = 0;
    if (canvas) canvas.hidden = true;
  }

  // ------------------------------------------------------------------ one attack
  // The battle setup (0x801edb64) puts the turn player's Digimon at z = 750 facing -z and the
  // other at z = -750 facing it.
  var HOME = 750;
  // Each script starts with the camera on its Digimon (the game's free camera between scripts
  // was not ported).
  function cut(sc, self) {
    var a = sc.actors[self], h = a.height, d = Math.max(h * 2.4, 460), m = rotYXZ([0, a.facing, 0]);
    sc.cam = { eye: xf(m, a.pos, [d * 0.62, -h * 0.62, -d]), at: xf(m, a.pos, [0, -h * 0.5, -h * 0.25]) };
    sc.view = lookAt(sc.cam.eye, sc.cam.at);
    sc.focus = a; sc.focusOwner = null;
    camera(sc);
  }
  // opts: models [player 0, player 1], attacker 0|1, first (the turn player, who stands at
  // z = 750), script (attack script id), hit (hit script id, 0 = none), hp [after the attack,
  // for both players], arena ({file, back, bright} from arenas.json), sound (bool).
  // With opts.dry the attack is run to its end at once without drawing, for testing; the
  // result is then {frames, quads, lines, sprites, models}.
  api.attack = function (opts) {
    if (!(api.enabled || opts.dry) || !initGL()) return Promise.resolve(false);
    var arenaP = opts.arena ? load('bg' + opts.arena.file).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([load(opts.models[0]), load(opts.models[1]), loadScripts(), arenaP]).then(function (r) {
      var scripts = r[2], list = [[scripts[opts.script], opts.attacker]];
      if (opts.hit && scripts[opts.hit]) list.push([scripts[opts.hit], opts.attacker ^ 1]);
      list = list.filter(function (x) { return x[0]; });
      // each script names its asset file with its first command (b.16)
      var paks = list.map(function (x) {
        var c = x[0].filter(function (q) { return q[0] === 0x0b && q[1] === 16 && !q[2]; })[0];
        return c ? loadFx(c[3]) : Promise.resolve({ sprites: {}, tims: {}, models: {} });
      });
      return Promise.all(paks).then(function (fxs) {
        return new Promise(function (res) {
          var first = opts.first === 1 ? 1 : 0;
          var act = [0, 1].map(function (p) { return new Actor(r[p], [0, 0, p === first ? HOME : -HOME], p === first ? 0 : 2048); });
          act.forEach(function (a) { a.step(); a.resolve(); var b = a.bounds(); a.height = Math.max(b[4] - b[1], 60); });
          var arena = null;
          if (r[3]) {
            arena = { actor: new Actor(r[3], [0, 0, 0], 0), back: opts.arena.back, bright: opts.arena.bright };
            arena.actor.bright = opts.arena.bright / 255; arena.actor.step(); arena.actor.resolve();
          }
          var sc = scene = { actors: act, extra: [], arena: arena, focus: null, focusOwner: null, hp: opts.hp || [1, 1], sound: opts.sound !== false, frame: 0, cam: null, view: null, script: null, finish: res,
            lights: { dir: LIGHT_DIR.map(function (x) { return x.slice(); }), col: LIGHT_COL.map(function (x) { return x.slice(); }) } };
          var k = -1, run = null, hold = 0;
          function next() {
            if (run) run.end();
            if (++k >= list.length) { run = null; hold = 20; return; }
            act.forEach(function (a) { a.visible = true; });
            cut(sc, list[k][1]);
            run = new Run(list[k][0], list[k][1], sc, fxs[k]);
          }
          next();
          if (!run) { scene = null; res(false); return; }
          sc.script = function () {
            if (run) { if (!run.step()) next(); }
            else if (--hold <= 0) { sc.finish = null; stop(); if (!opts.dry) res(true); }
          };
          if (opts.dry) {
            var st = { frames: 0, quads: 0, lines: 0, sprites: 0, models: 0 }, core = C.core, keep = { project: core.project, bill: core.bill, origin: core.origin };
            core.origin = [0, 0, 0];
            core.project = function (w) { return [w[0], w[1], 100 + Math.abs(w[2])]; };
            try {
              while (scene === sc && st.frames < 4000) {
                tri.length = 0; lin.length = 0; sprites.length = 0; rects.length = 0;
                act.forEach(function (a) { a.step(); a.resolve(); });
                camera(sc);
                core.bill = [sc.view[0], sc.view[3], sc.view[6], sc.view[1], sc.view[4], sc.view[7], sc.view[2], sc.view[5], sc.view[8]];
                sc.script(sc);
                st.frames++; st.quads += tri.length / 36; st.lines += lin.length / 12; st.sprites += sprites.length;
                st.models += sc ? sc.extra.filter(function (a) { return a.visible; }).length : 0;
              }
            } finally { core.project = keep.project; core.bill = keep.bill; core.origin = keep.origin; if (scene === sc) { sc.finish = null; stop(); } }
            res(st);
            return;
          }
          canvas.hidden = false;
          last = performance.now();
          if (!timer) timer = setInterval(tick, FRAME_MS);
          render();
        });
      });
    }).catch(function () { stop(); return false; });
  };
  api.stop = stop;
  api.busy = function () { return !!scene; };
  api._debug = function () { return scene; };
  window.DDCB_B3D = api;
})();
