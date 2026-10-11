/*
 * Polygon Battle (stage 1): the game's 3D Digimon models and their own motions.
 *
 * Models, textures and motions come from F:\NNN.PAK (tools/omd.py, tools/build_models.py).
 * A model is a tree of rigid parts. A motion is a list of keys; each key holds a rotation,
 * an offset and a scale for every part plus one record for the whole model, and the model
 * eases from its current pose to the key over 2 x duration frames (0x80022100, 0x80021aa8:
 * two halves with constant acceleration, aiming at the speed the next key needs).
 *
 * Drawn on a 320x240 canvas like the game's screen. The staging of a battle (where the
 * Digimon stand, the camera, when the target reacts) is this project's until the game's
 * battle scripts are ported; see README.
 */
(function () {
  'use strict';
  var W = 320, HGT = 240, FRAME_MS = 1000 / 60;
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
  function load(num) {
    if (cache[num]) return cache[num];
    var base = 'assets/models/' + ('00' + num).slice(-3);
    cache[num] = Promise.all([
      fetch(base + '.bin.gz').then(function (r) { if (!r.ok) throw new Error('no model ' + num); return r.arrayBuffer(); }).then(inflate),
      image(base + '.png'), image(base + 'p.png')
    ]).then(function (a) {
      var m = parse(a[0]);
      m.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo); gl.bufferData(gl.ARRAY_BUFFER, m.vb, gl.STATIC_DRAW);
      m.ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.ib, gl.STATIC_DRAW);
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
    this.snap(0); this.play(0, true);
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
    // Part 0's z offset is not a pose value: 0x80021964 takes it away every frame and walks the
    // whole model that far along its facing. The walk is left out until the scripts that place
    // the Digimon are ported, so the model stays where it stands.
    this.p[5] -= Math.trunc(this.p[5]);
    var base = rotYXZ([0, this.facing, 0]);
    this.base = base;
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
  var VS = 'attribute vec3 aP,aN,aC;attribute vec4 aT;uniform mat3 uM[32];uniform vec3 uT[32];uniform float uShow[32];uniform mat3 uV;uniform vec3 uVT;uniform vec2 uTex;uniform float uPalN;' +
    'varying vec3 vC;varying vec2 vUV;varying float vPal,vTex;' +
    'void main(){int i=int(aT.z+0.5);mat3 m=uM[i];vec3 w=m*aP+uT[i];vec3 e=uV*w+uVT;' +
    'float lit=1.0;if(dot(aN,aN)>0.5){vec3 n=normalize(m*aN);lit=0.55+0.6*max(0.0,dot(n,normalize(vec3(-0.35,-0.75,-0.55))));}' +
    'vC=aC/128.0*lit;vTex=aT.x<0.0?0.0:1.0;vUV=(aT.xy+0.5)/uTex;vPal=(aT.w+0.5)/uPalN;' +
    'float z=max(e.z,1.0);gl_Position=vec4(e.x*448.0/160.0,-e.y*448.0/120.0,(z-60.0)/20000.0*z,z);if(uShow[i]>0.5)gl_Position=vec4(2.0,2.0,2.0,1.0);}';
  var FS = 'precision mediump float;uniform sampler2D uS,uP;varying vec3 vC;varying vec2 vUV;varying float vPal,vTex;' +
    'void main(){if(vTex<0.5){gl_FragColor=vec4(vC*0.5,1.0);return;}float ix=texture2D(uS,vUV).r*255.0;vec4 c=texture2D(uP,vec2((ix+0.5)/256.0,vPal));if(c.a<0.5)discard;gl_FragColor=vec4(c.rgb*vC,1.0);}';
  function initGL() {
    canvas = document.getElementById('b3d');
    if (!canvas) return false;
    if (gl) return true;
    gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return false;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    ['aP', 'aN', 'aC', 'aT'].forEach(function (a) { loc[a] = gl.getAttribLocation(prog, a); });
    ['uM', 'uT', 'uShow', 'uV', 'uVT', 'uTex', 'uPalN', 'uS', 'uP'].forEach(function (u) { loc[u] = gl.getUniformLocation(prog, u); });
    return true;
  }
  function drawActor(a, cam) {
    var m = a.m, M = new Float32Array(32 * 9), T = new Float32Array(32 * 3), S = new Float32Array(32), i, k;
    for (i = 0; i < m.n; i++) {
      var x = a.mats[i];
      // GLSL mat3 is column-major
      for (k = 0; k < 9; k++) M[i * 9 + k] = x.m[(k % 3) * 3 + Math.floor(k / 3)];
      T[i * 3] = x.t[0]; T[i * 3 + 1] = x.t[1]; T[i * 3 + 2] = x.t[2];
      S[i] = a.show[i] ? 1 : 0;
    }
    gl.uniformMatrix3fv(loc.uM, false, M); gl.uniform3fv(loc.uT, T); gl.uniform1fv(loc.uShow, S);
    gl.uniform2f(loc.uTex, m.tw, m.th); gl.uniform1f(loc.uPalN, Math.max(1, m.npal));
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
    void cam;
  }
  function render() {
    if (!gl || !scene) return;
    gl.viewport(0, 0, W, HGT);
    gl.clearColor(0.03, 0.04, 0.08, 1); gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.useProgram(prog);
    // camera: yaw then pitch about the look-at point, then back off by `dist`
    var c = scene.cam, R = mul3(rotYXZ([c.pitch, 0, 0]), rotYXZ([0, c.yaw, 0]));
    var t = xf(R, [0, 0, 0], [-c.at[0], -c.at[1], -c.at[2]]);
    var V = new Float32Array(9), k;
    for (k = 0; k < 9; k++) V[k] = R[(k % 3) * 3 + Math.floor(k / 3)];
    gl.uniformMatrix3fv(loc.uV, false, V); gl.uniform3f(loc.uVT, t[0], t[1], t[2] + c.dist);
    scene.actors.forEach(function (a) { drawActor(a, c); });
  }

  function tick() {
    var now = performance.now(), n = Math.min(Math.floor((now - last) / FRAME_MS), 4);
    if (n < 1 || !scene) return;
    last += n * FRAME_MS;
    if (now - last > 200) last = now;
    while (n-- > 0) {
      scene.frame++;
      scene.actors.forEach(function (a) { a.step(); a.resolve(); });
      if (scene.script) scene.script(scene);
    }
    render();
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = 0; }
    scene = null;
    if (canvas) canvas.hidden = true;
  }

  // ------------------------------------------------------------------ one attack
  // models: [model number of player 0, of player 1]; attacker 0|1; attack 0..2 (motion 1..3,
  // as the attack scripts 554..556 of each Digimon start them); hit: the target reacts
  // (motion 4, the one its damage scripts start).
  api.attack = function (models, attacker, attack, hit, onSound) {
    if (!api.enabled || !initGL()) return Promise.resolve(false);
    return Promise.all([load(models[0]), load(models[1])]).then(function (ms) {
      return new Promise(function (res) {
        var a0 = new Actor(ms[0], [0, 0, 0], 1024), a1 = new Actor(ms[1], [0, 0, 0], -1024);
        var act = [a0, a1], A = act[attacker], T = act[attacker ^ 1];
        A.onSound = T.onSound = onSound || null;
        // stand both on the ground facing each other, and back the camera off until they fit
        var tall = 0, reach = 0;
        act.forEach(function (a, k) {
          a.step(); a.resolve();
          var b = a.bounds(), h = b[4] - b[1], half = Math.min(Math.max(b[3], -b[0], b[5], -b[2]), h * 0.7);
          a.pos = [(k ? 1 : -1) * (half + 90), -b[4], 0];
          tall = Math.max(tall, h); reach = Math.max(reach, 2 * half + 90);
        });
        var dist = Math.max((tall * 0.7 + 40) * 448 / 120, (reach + 30) * 448 / 160);
        scene = { actors: act, frame: 0, cam: { at: [0, -tall * 0.45, 0], yaw: attacker ? 200 : -200, pitch: -70, dist: dist }, script: null };
        var stage = 0, at = 0, total = 0;
        (ms[attacker].motions[1 + attack] || []).forEach(function (k) { total += 2 * Math.max(1, k.dur); });
        scene.script = function (s) {
          s.cam.yaw += attacker ? -0.35 : 0.35;
          if (stage === 0 && s.frame >= 30) { A.play(1 + attack, false); stage = 1; at = s.frame; }
          else if (stage === 1 && hit && s.frame - at >= Math.floor(total * 0.6)) { T.play(4, false); stage = 2; }
          else if ((stage === 1 || stage === 2) && !A.busy() && s.frame - at >= total) { A.play(0, true); if (stage === 2 && !T.busy()) T.play(0, true); stage = 3; at = s.frame; }
          else if (stage === 3 && s.frame - at >= 45) { stop(); res(true); }
        };
        canvas.hidden = false;
        act.forEach(function (a) { a.resolve(); });
        last = performance.now();
        if (!timer) timer = setInterval(tick, FRAME_MS);
        render();
      });
    }).catch(function () { stop(); return false; });
  };
  api.stop = stop;
  api.busy = function () { return !!scene; };
  api._debug = function () { return scene; };
  window.DDCB_B3D = api;
})();
