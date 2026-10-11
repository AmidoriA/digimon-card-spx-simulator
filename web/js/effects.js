/*
 * Battle effects: plays the game's own effect scripts (B/CBTL_EFF.ARC, exported to
 * js/data/effects.js by tools/build_effects.py) with a port of its effect engine.
 *
 * A script is a small program on integer variables, run once per frame by an interpreter
 * (0x801f663c for the board). It fills variables, creates effect objects in slots from
 * them, switches the slots on and off, plays sounds and waits. Two kinds of object draw:
 *
 *   ring      (0x80031f58 / 0x8003230c)  2 x N gouraud quads between an inner, a middle and
 *                                        an outer circle, each with its own colour
 *   particles (0x80032b44 / 0x80033258)  N line streaks flying along randomly turned axes,
 *                                        each one frame behind the previous, on a fixed cycle
 *
 * Both hang on a transform node (0x80030e3c / 0x80030f90): position, rotation with speed
 * and acceleration, scale moving to a target, a lifetime and a fade mode.
 *
 * The node, ring and particle code is shared with the Polygon Battle (battle3d.js), which
 * uses the same engine with its own variable numbers (window.DDCB_FXCORE).
 */
(function () {
  'use strict';
  var SCRIPTS = window.DDCB_EFFECTS || [];
  var SND = window.DDCB_SND;
  var H = 448, CX = 160, CY = 120;         // SetGeomScreen(0x1c0), SetGeomOffset(160, 120) at 0x800243b0
  var FRAME_MS = 1000 / 60;

  function s16(x) { x &= 0xffff; return x & 0x8000 ? x - 0x10000 : x; }
  function tdiv(a, b) { return b ? (a / b) | 0 : 0; }       // C integer division
  function rand() { return (Math.random() * 32768) | 0; }   // rand() at 0x80069124
  function sin12(a) { return Math.sin(a * Math.PI / 2048); }
  function cos12(a) { return Math.cos(a * Math.PI / 2048); }

  // Variable numbers: the board scripts (190 variables) and the Polygon Battle scripts (460).
  var MAP_BOARD = { node: 0x92, col: 0x25,
    ring: { alpha: 0x37, n: 0x15, r0: 0x3d, r1: 0x3e, k: 0x41, z0: 0x3f, z1: 0x40, mode: 0x45 },
    part: { sx: 0xb6, sy: 0xb7, size0: 0xb8, cycle: 0xb9, speed: 0xba, dir: 0xbb, count: 0xbc, size1: 0xbd, amode: 0x4e, offset: 0x4f, off: 0x50, kind: 0x51, mode: 0x45 } };
  var MAP_BATTLE = { node: 0x197, col: 0x29,
    ring: { alpha: 0x3b, n: 0x17, r0: 0x41, r1: 0x42, k: 0x45, z0: 0x43, z1: 0x44, mode: 0x4a },
    part: { sx: 0x1bf, sy: 0x1c0, size0: 0x1c1, cycle: 0x1c2, speed: 0x1c3, dir: 0x1c4, count: 0x1c5, size1: 0x1c6, amode: 0x64, offset: 0x65, off: 0x66, kind: 0x67, mode: 0x4a } };

  // ------------------------------------------------------------------ matrices
  var IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  // RotMatrix at 0x8005c934: R = Rx * Ry * Rz, angles in 1/4096 of a turn (checked by running it)
  function rotMatrix(r) {
    var sx = sin12(r[0]), cx = cos12(r[0]), sy = sin12(r[1]), cy = cos12(r[1]), sz = sin12(r[2]), cz = cos12(r[2]);
    return [cy * cz, -cy * sz, sy,
      sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy,
      -cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy];
  }
  function mul(a, b) {
    var o = new Array(9), i, j;
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) o[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    return o;
  }
  function apply(m, t, p) {
    return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + t[0], m[3] * p[0] + m[4] * p[1] + m[5] * p[2] + t[1], m[6] * p[0] + m[7] * p[1] + m[8] * p[2] + t[2]];
  }

  // The scene the objects live in. `project` turns a point into screen x, y and depth;
  // `bill` is the turn that makes an object face the viewer (the game keeps all matrices in
  // view space, so there it is the identity); `origin` is where a parentless node sits.
  var core = { bill: IDENT, origin: [0, 0, H],
    project: function (w) { return w[2] < 8 ? null : [CX + w[0] * H / w[2], CY + w[1] * H / w[2], w[2]]; } };

  // ------------------------------------------------------------------ transform node
  // Motion types (table at 0x800108b0): how the position moves each frame.
  var FAMILY = {}, ARRIVE = {}, EXPIRE = {};
  function fam(name, list) { list.forEach(function (t) { FAMILY[t] = name; }); }
  fam('line', [1, 11, 12, 13, 29, 30, 31, 50, 57, 63, 70, 76, 83]);    // 0x80030130
  fam('jump', [2, 14, 15, 16, 32, 33, 34, 51, 58, 64, 71, 77, 84]);    // 0x800301d0
  fam('wavex', [3, 17, 18, 19, 35, 36, 37, 52, 59, 65, 72, 78, 85]);   // 0x80030264
  fam('wavey', [4, 20, 21, 22, 38, 39, 40, 53, 60, 66, 73, 79, 86]);   // 0x800302e0
  fam('arc', [5, 23, 24, 25, 41, 42, 43, 54, 61, 67, 74, 80, 87]);     // 0x8003035c
  fam('arc2', [7, 26, 27, 28, 44, 45, 46, 55, 62, 68, 75, 81, 88]);    // 0x80030440
  fam('shake', [8, 89]);                                               // 0x8003058c
  // what happens on reaching the target (0x80010a20) and when the lifetime ends (0x80010b90)
  function tab(t, name, list) { list.forEach(function (x) { t[x] = name; }); }
  tab(ARRIVE, 'freeze', [11, 14, 17, 20, 23, 26]); tab(ARRIVE, 'stop', [12, 15, 18, 21, 24, 27]);
  tab(ARRIVE, 'restart', [13, 16, 19, 22, 25, 28]); tab(ARRIVE, 'hide', [50, 51, 52, 53, 54, 55]);
  tab(ARRIVE, 'land', [76, 77, 78, 79, 80, 81]); tab(ARRIVE, 'fade', [63, 64, 65, 66, 67, 68]);
  tab(EXPIRE, 'freeze', [29, 32, 35, 38, 41, 44, 47]); tab(EXPIRE, 'stop', [30, 33, 36, 39, 42, 45, 48]);
  tab(EXPIRE, 'restart', [31, 34, 37, 40, 43, 46, 49]); tab(EXPIRE, 'hide', [56, 57, 58, 59, 60, 61, 62]);
  tab(EXPIRE, 'stopfade', [82, 83, 84, 85, 86, 87, 88, 89]); tab(EXPIRE, 'fade', [69, 70, 71, 72, 73, 74, 75]);

  // A node is described by 40 variables from `map.node` on (0x801f6f44 / 0x801e92b0 copy them).
  function Node(v, parent, map) {
    var b = (map || MAP_BOARD).node;
    this.parent = parent;
    this.pos0 = [s16(v[b]), s16(v[b + 1]), s16(v[b + 2])];
    this.target = [s16(v[b + 3]), s16(v[b + 4]), s16(v[b + 5])];
    this.speed = s16(v[b + 6]); this.accel = s16(v[b + 7]);
    this.rot0 = [s16(v[b + 8]), s16(v[b + 9]), s16(v[b + 10])];
    this.rotV = [s16(v[b + 11]), s16(v[b + 12]), s16(v[b + 13])];
    this.rotA = [s16(v[b + 14]), s16(v[b + 15]), s16(v[b + 16])];
    this.sc0 = [v[b + 17], v[b + 18], v[b + 19]];
    this.scT = [v[b + 20], v[b + 21], v[b + 22]];
    this.scS = [s16(v[b + 23]), s16(v[b + 24]), s16(v[b + 25])];
    this.hitR = s16(v[b + 26]);
    this.dur = s16(v[b + 27]); this.fadeMode = v[b + 28] & 0xff; this.fadeStep = s16(v[b + 29]);
    this.type = s16(v[b + 30]);
    this.delay = s16(v[b + 31]); this.amp = s16(v[b + 32]); this.freq = s16(v[b + 33]);
    this.pos = this.pos0.slice(); this.rot = this.rot0.slice(); this.sc = this.sc0.slice();
    this.fadeState = 0;
    this.m = IDENT; this.tr = core.origin.slice();
    this.reinit();
  }
  // 0x80030ca8: restart the clock; a moving node goes back to its start, a fixed one keeps
  // where it is as its new start
  Node.prototype.reinit = function () {
    this.hidden = this.type >= 91;
    this.state = -1; this.t = 0; this.t2 = 0; this.life = 0; this.done = 0;
    if (this.type !== 0 && this.type !== 90) {
      this.sc = this.sc0.slice(); this.rot = this.rot0.slice(); this.pos = this.pos0.slice();
    } else {
      this.sc0 = this.sc.slice(); this.rot0 = this.rot.slice(); this.pos0 = this.pos.map(s16);
    }
    // unit vector towards the target (0x80030bc4)
    var d = [this.target[0] - this.pos0[0], this.target[1] - this.pos0[1], this.target[2] - this.pos0[2]];
    this.reach = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    this.dir = this.reach ? [d[0] / this.reach, d[1] / this.reach, d[2] / this.reach] : [0, 0, 0];
  };
  // 0x80031754: a type above 90 waits `delay` frames, then becomes type - 100
  Node.prototype.idle = function () {
    if (this.type < 91) return;
    if (this.t < this.delay) this.t++;
    else { this.t = 0; this.hidden = false; this.type -= 100; }
  };
  Node.prototype.freeze = function (stop) {
    this.type = 0; this.reinit();
    if (stop) { this.scT = this.sc.slice(); this.rotV = [0, 0, 0]; this.rotA = [0, 0, 0]; }
  };
  Node.prototype.fadeOut = function () { this.fadeMode = 2; this.fadeStep = -Math.abs(this.fadeStep); };
  // 0x80030f90, then the matrix (0x8001eea0). `mode` 1..3 keeps one rotation axis and ignores
  // the parent's turn (the object faces the viewer); 4 has no turn or scale at all.
  Node.prototype.update = function (mode) {
    var i, v, t = this.t, type = this.type, f = FAMILY[type];
    if (type !== 10 && type < 90) {
      for (i = 0; i < 3; i++) {
        if (this.sc[i] !== this.scT[i]) {
          v = this.scS[i] * t + this.sc0[i];
          if (this.scS[i] >= 0) this.sc[i] = v >= this.scT[i] ? this.scT[i] : v;
          else { this.sc[i] = v; if (this.sc[i] <= this.scT[i]) this.sc[i] = this.scT[i]; }
        }
        this.rot[i] = s16(this.rot0[i] + this.rotV[i] * t + tdiv(this.rotA[i] * this.t2 * this.t2, 64));
      }
    }
    var p = this.pos0.slice(), d, s, c;
    if (f === 'shake') {
      for (i = 0; i < 3; i++) p[i] += this.speed ? tdiv(this.speed, 2) - rand() % this.speed : 0;
    } else if (f) {
      d = f === 'arc2' ? this.speed * t : this.speed * t + this.accel * this.t2 * this.t2;
      for (i = 0; i < 3; i++) p[i] += Math.trunc(d * this.dir[i]);
      if (f === 'jump') p[1] += -this.speed * t + tdiv(this.speed * t * t, 56);
      else if (f === 'wavex' || f === 'wavey') p[f === 'wavex' ? 0 : 1] += Math.trunc(sin12((this.delay + this.speed * t) * this.freq) * 4096 * this.amp) >> 10;
      else if (f === 'arc' || f === 'arc2') {
        v = -this.speed * t + tdiv((f === 'arc' ? this.speed : this.accel) * t * t, 56);
        s = sin12(this.rot0[2]); c = cos12(this.rot0[2]);
        p[0] -= Math.trunc(v * s); p[1] += Math.trunc(v * c);
      }
    }
    this.pos = p;
    // arrival at the target
    if (f && f !== 'shake' && type < 90) {
      if (this.state === -1) this.state = 0;
      else if (this.state === 0 && this.reach > 0 && (p[0] - this.pos0[0]) * this.dir[0] + (p[1] - this.pos0[1]) * this.dir[1] + (p[2] - this.pos0[2]) * this.dir[2] >= this.reach - this.hitR) {
        switch (ARRIVE[type]) {
          case 'freeze': this.freeze(false); break;
          case 'stop': this.pos = this.target.slice(); this.freeze(true); break;
          case 'restart': this.reinit(); break;
          case 'hide': this.hidden = true; break;
          case 'land': this.type = 0; this.pos = this.target.slice(); this.pos0 = this.target.slice(); this.fadeOut(); break;
          case 'fade': this.fadeOut(); break;
        }
        this.state = 1;
        t = this.t;
      }
    }
    this.t++; this.t2++;
    if (this.dur !== 0 && !this.done) {
      if (this.dur < this.life) {
        this.life = this.dur;
        switch (EXPIRE[this.type]) {
          case 'freeze': this.freeze(false); break;
          case 'stop': this.freeze(true); break;
          case 'restart': this.reinit(); break;
          case 'hide': this.hidden = true; break;                    // gone at once
          case 'stopfade': this.freeze(true); this.fadeOut(); break;
          case 'fade': this.fadeOut(); break;                        // fade out
        }
        this.done = 1;
      } else this.life++;
    }
    var P = this.parent, r = this.rot;
    if (mode === 1) r = [0, 0, r[2]]; else if (mode === 2) r = [0, r[1], 0]; else if (mode === 3) r = [r[0], 0, 0];
    var m = mode === 4 ? core.bill : mode ? mul(core.bill, rotMatrix(r)) : mul(P ? P.m : IDENT, rotMatrix(r));
    this.tr = P ? apply(P.m, P.tr, this.pos) : [this.pos[0] + core.origin[0], this.pos[1] + core.origin[1], this.pos[2] + core.origin[2]];
    if (mode !== 4 && !(this.sc[0] === 4096 && this.sc[1] === 4096 && this.sc[2] === 4096)) {
      var sx = this.sc[0] / 4096, sy = this.sc[1] / 4096, sz = this.sc[2] / 4096;   // ScaleMatrix: columns
      m = [m[0] * sx, m[1] * sy, m[2] * sz, m[3] * sx, m[4] * sy, m[5] * sz, m[6] * sx, m[7] * sy, m[8] * sz];
    }
    this.m = m;
  };
  // 0x800317a8: next brightness (0..256) by fade mode
  Node.prototype.fade = function (a) {
    var st = this.fadeStep;
    switch (this.fadeMode) {
      case 1: a = this.sc[0] > 4096 ? 256 - ((this.sc[0] - 4096) >> 4) : this.sc[0] >> 4; break;
      case 2: a += st; break;
      case 3:
        if (this.fadeState === 0) { a += st; if (a > 256) { a = 256; this.fadeState = 1; } }
        else if (this.fadeState === 1) { a -= st; if (a < 0) { a = 0; this.fadeState = 2; } }
        break;
      case 4:
        if (this.fadeState === 0) { a += st; if (a > 256) { a = 256; this.fadeState = 1; } }
        else { a -= st; if (a < 0) { a = 0; this.fadeState = 0; } }
        break;
      case 5:
        this.fadeState = (this.fadeState + (st & 0xff)) & 0xff;
        a = this.fadeState < 128 ? this.fadeState + 128 : 255 - (this.fadeState & 0x7f);
        break;
    }
    return a < 0 ? 0 : a > 256 ? 256 : a;
  };

  function project(m, tr, p) { return core.project(apply(m, tr, p)); }

  // ------------------------------------------------------------------ ring
  function Ring(v, parent, map) {
    map = map || MAP_BOARD;
    var R = map.ring, c = map.col;
    this.node = new Node(v, parent, map);
    this.mode = v[R.mode] & 0xff;
    this.alpha = s16(v[R.alpha]);
    this.col = [[v[c] & 255, v[c + 1] & 255, v[c + 2] & 255], [v[c + 3] & 255, v[c + 4] & 255, v[c + 5] & 255], [v[c + 6] & 255, v[c + 7] & 255, v[c + 8] & 255]];
    var n = this.n = Math.max(0, Math.min(v[R.n], 64)), r0 = s16(v[R.r0]), r1 = s16(v[R.r1]), k = s16(v[R.k]), z0 = s16(v[R.z0]), z1 = s16(v[R.z1]);
    var rm = r0 + tdiv((r1 - r0) * k, 100), zm = z0 + tdiv((z1 - z0) * k, 100), i, a, b;
    this.verts = [];
    for (i = 0; i < n; i++) {
      a = tdiv(i << 12, n); b = tdiv((i + 1) << 12, n);
      this.verts.push([
        [Math.trunc(sin12(a) * r0), Math.trunc(cos12(a) * r0), z0], [Math.trunc(sin12(b) * r0), Math.trunc(cos12(b) * r0), z0],
        [Math.trunc(sin12(a) * rm), Math.trunc(cos12(a) * rm), zm], [Math.trunc(sin12(b) * rm), Math.trunc(cos12(b) * rm), zm],
        [Math.trunc(sin12(a) * r1), Math.trunc(cos12(a) * r1), z1], [Math.trunc(sin12(b) * r1), Math.trunc(cos12(b) * r1), z1]]);
    }
  }
  Ring.prototype.update = function (out) {
    var N = this.node;
    if (N.hidden) { N.idle(); return; }
    N.update(this.mode);
    this.alpha = N.fade(this.alpha);
    if (!this.alpha) return;
    var al = this.alpha, c = this.col.map(function (x) { return [x[0] * al >> 8, x[1] * al >> 8, x[2] * al >> 8]; });
    for (var i = 0; i < this.n; i++) {
      var p = this.verts[i].map(function (q) { return project(N.m, N.tr, q); });
      if (p[0] && p[1] && p[2] && p[3]) out.quad(p[0], p[1], p[2], p[3], c[0], c[0], c[1], c[1]);
      if (p[2] && p[3] && p[4] && p[5]) out.quad(p[2], p[3], p[4], p[5], c[1], c[1], c[2], c[2]);
    }
  };

  // ------------------------------------------------------------------ particles
  function Particles(v, parent, map) {
    map = map || MAP_BOARD;
    var P = map.part, cb = map.col, i, z = 0;
    this.node = new Node(v, parent, map);
    this.mode = v[P.mode] & 1; this.spin = v[P.mode] & 2;
    this.colA = [v[cb] & 255, v[cb + 1] & 255, v[cb + 2] & 255];
    this.colB = [v[cb + 3] & 255, v[cb + 4] & 255, v[cb + 5] & 255];
    var spreadY = s16(v[P.sy]) || 1, spreadX = s16(v[P.sx]) || 1, size0 = s16(v[P.size0]), size1 = s16(v[P.size1]);
    var L = this.cycle = s16(v[P.cycle]) & 0xffff, speedMax = s16(v[P.speed]), amode = s16(v[P.amode]), off = s16(v[P.off]);
    this.count = Math.min(s16(v[P.count]) & 0xffff, 512);
    this.offset = s16(v[P.offset]);
    this.gouraud = (v[P.kind] & 0xff) !== 0;
    this.dir = s16(v[P.dir]) !== 0 ? -1 : 1;                      // -1: fly inwards
    this.grow = size1 !== 0 ? tdiv((size1 - size0) << 3, L) : 0;
    this.step = [0, 1, 2].map(function (k) { return tdiv(this.colB[k] - this.colA[k], L) & 0xff; }, this);
    this.frame = 0;
    this.parts = [];
    for (i = 0; i < this.count; i++) {
      var p = { size: (size0 << 3) & 0xffff, speed: speedMax ? rand() % speedMax + 1 : 1, rot: [0, 0, 0], y: 0 };
      if (amode < 3) {
        p.rot[1] = rand() % spreadY - tdiv(spreadY, 2);
        p.rot[0] = rand() % spreadX - tdiv(spreadX, 2);
      }
      p.dist = (p.speed * L) & 0xffff;
      if (off !== 0) {
        switch (((amode % 3) + 3) % 3) {
          case 0: z = tdiv(i << 12, this.count); p.y = off; break;
          case 1: z = rand() & 0xfff; p.y = off; break;
          case 2: z = rand() & 0xfff; p.y = rand() % off; break;
        }
        p.rot[2] = z;
      }
      p.ang = rand() & 0xfff;
      p.spinV = (i & 1) ? -(rand() & 0x1ff) : rand() & 0x1ff;
      this.parts.push(p);
    }
  }
  Particles.prototype.update = function (out) {
    var N = this.node, L = this.cycle;
    if (N.hidden) { N.idle(); return; }
    if (!L) return;
    N.update(this.mode);
    var total = tdiv(N.dur + L - 1, L) * L;
    for (var i = 0; i < this.count; i++) {
      var p = this.parts[i], ta = (this.frame + i) & 0xffff;
      if (ta < total) {
        var t = ta % L, m = mul(N.m, rotMatrix(p.rot));
        var z = s16((this.dir < 0 ? p.dist - p.speed * t : p.speed * t) + this.offset);
        var len = (p.size + this.grow * t) * this.dir, a, b;
        if (this.spin) {
          var half = tdiv(len, 16), dx = Math.trunc(half * sin12(p.ang)), dz = Math.trunc(half * cos12(p.ang));
          a = project(m, N.tr, [dx, p.y, z + dz]); b = project(m, N.tr, [0, p.y, z]);
        } else {
          a = project(m, N.tr, [0, p.y, z]); b = project(m, N.tr, [0, p.y, z + tdiv(len, 8)]);
        }
        if (a && b) {
          if (this.gouraud) out.line(a, b, this.colA, this.colB);
          else {
            var c = [(this.colA[0] + this.step[0] * t) & 255, (this.colA[1] + this.step[1] * t) & 255, (this.colA[2] + this.step[2] * t) & 255];
            out.line(a, b, c, c);
          }
        }
      }
      if (this.spin) p.ang = (p.ang + p.spinV) & 0xffff;
    }
    this.frame = (this.frame + 1) & 0xffff;
  };

  function Plain(v, parent, map) { this.node = new Node(v, parent, map); }
  Plain.prototype.update = function () { if (this.node.hidden) this.node.idle(); else this.node.update(0); };

  window.DDCB_FXCORE = { core: core, Node: Node, Ring: Ring, Particles: Particles, Plain: Plain, MAP_BATTLE: MAP_BATTLE,
    rotMatrix: rotMatrix, mul: mul, apply: apply, s16: s16, tdiv: tdiv, rand: rand, sin12: sin12, cos12: cos12 };

  // ------------------------------------------------------------------ renderer (WebGL, 320x240)
  var gl = null, prog = null, buf = null, canvas = null, tri = [], lin = [];
  var out = {
    quad: function (a, b, c, d, ca, cb, cc, cd) {
      tri.push(a[0], a[1], ca[0], ca[1], ca[2], b[0], b[1], cb[0], cb[1], cb[2], c[0], c[1], cc[0], cc[1], cc[2],
        b[0], b[1], cb[0], cb[1], cb[2], d[0], d[1], cd[0], cd[1], cd[2], c[0], c[1], cc[0], cc[1], cc[2]);
    },
    line: function (a, b, ca, cb) { lin.push(a[0], a[1], ca[0], ca[1], ca[2], b[0], b[1], cb[0], cb[1], cb[2]); }
  };
  function initGL() {
    canvas = document.getElementById('fx');
    if (!canvas || gl) return !!gl;
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) return false;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;attribute vec3 c;varying vec3 v;void main(){v=c/255.0;gl_Position=vec4(p.x/160.0-1.0,1.0-p.y/120.0,0.0,1.0);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec3 v;void main(){gl_FragColor=vec4(v,1.0);}'));
    gl.linkProgram(prog); gl.useProgram(prog);
    buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    var lp = gl.getAttribLocation(prog, 'p'), lc = gl.getAttribLocation(prog, 'c');
    gl.enableVertexAttribArray(lp); gl.enableVertexAttribArray(lc);
    gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(lc, 3, gl.FLOAT, false, 20, 8);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);       // additive, as the semi-transparent prims
    gl.clearColor(0, 0, 0, 1);
    return true;
  }
  function flush() {
    if (!gl) { tri.length = 0; lin.length = 0; return; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (tri.length) { gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tri), gl.DYNAMIC_DRAW); gl.drawArrays(gl.TRIANGLES, 0, tri.length / 5); }
    if (lin.length) { gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lin), gl.DYNAMIC_DRAW); gl.drawArrays(gl.LINES, 0, lin.length / 5); }
    tri.length = 0; lin.length = 0;
  }

  // ------------------------------------------------------------------ script runner (board)
  var running = [], timer = 0, last = 0;
  var api = { locate: function () { return null; }, enabled: true };

  function Run(n, pA, kA, pB, kB, done) {
    this.cmds = SCRIPTS[n] || [];
    this.v = new Int32Array(190);
    this.pc = 0; this.wait = 0; this.skip = false;
    this.p = pA; this.a = [pA, kA]; this.b = [pB, kB];
    this.slots = []; for (var i = 0; i < 16; i++) this.slots.push({ type: -1, on: false, obj: null });
    this.root = { m: IDENT, tr: [0, 0, H] };
    this.tints = {};
    this.done = done; this.frames = 0;
  }
  Run.prototype.place = function (p, kind) {
    var r = api.locate(p, kind);
    if (!r) return;                           // no such card: the position variables keep their values
    this.v[0x92] = Math.round(r.x + r.w / 2 - CX); this.v[0x93] = Math.round(r.y + r.h / 2 - CY); this.v[0x94] = 0;
  };
  // 0x801f893c: the card's colour moves to the given one (128 = unchanged)
  Run.prototype.tint = function (p, kind) {
    var k = p + ':' + kind, t = this.tints[k] || (this.tints[k] = { p: p, kind: kind, cur: [128, 128, 128] });
    t.to = [this.v[0x25] & 255, this.v[0x26] & 255, this.v[0x27] & 255];
  };
  Run.prototype.host = function (c) {
    var v = this.v, a0 = c.length > 3 ? s16(c[2] ? v[c[3]] : c[3]) : 0, a1 = c.length > 5 ? s16(c[4] ? v[c[5]] : c[5]) : 0, s;
    if (c[0] === 0x0a) {
      switch (c[1]) {
        case 6: this.place(this.a[0], this.a[1]); break;
        case 7: this.place(this.b[0], this.b[1]); break;
        case 8: this.tint(this.a[0], this.a[1]); break;
        case 9: this.tint(this.b[0], this.b[1]); break;
      }
    } else if (c[0] === 0x0b) {
      switch (c[1]) {
        case 0: if (SND) SND.se(a0); break;
        case 4: s = this.slots[a0]; if (s && s.obj) s.on = true; break;
        case 5: s = this.slots[a0]; if (s) s.on = false; break;
        case 6: this.wait = a0 - 1; return true;
        case 9: this.place(this.p ^ a0, 0); break;
        case 10: this.place(this.p ^ a0, 1); break;
        case 13: this.tint(this.p ^ a0, 0); break;
        case 14: this.tint(this.p ^ a0, 1); break;
      }
    } else if (c[0] === 0x0c && c[1] === 0) {
      s = this.slots[a0];
      if (s && a1 >= 1 && a1 <= 3) {
        var pi = v[0xb4], parent = pi === -2 ? null : pi >= 0 && pi < 16 && this.slots[pi].obj ? this.slots[pi].obj.node : this.root;
        s.type = a1; s.on = false;
        s.obj = a1 === 1 ? new Ring(v, parent) : a1 === 3 ? new Particles(v, parent) : new Plain(v, parent);
      }
    }
    return false;
  };
  Run.prototype.step = function () {
    var v = this.v, c, x, i;
    v[0] = 1;
    if (this.wait) this.wait--;
    else {
      while (this.pc < this.cmds.length) {
        c = this.cmds[this.pc++];
        if (this.skip) { this.skip = false; continue; }
        if (c[0] === 7) {
          x = c[3] ? v[c[4]] : c[4];
          switch (c[2]) {
            case 0: v[c[1]] = x; break;
            case 1: v[c[1]] += x; break;
            case 2: v[c[1]] -= x; break;
            case 3: v[c[1]] = Math.imul(v[c[1]], x); break;
            case 4: v[c[1]] = tdiv(v[c[1]], x); break;
            case 5: v[c[1]] = x ? v[c[1]] % x : 0; break;
            case 6: v[c[1]] = rand() % (x + 1); break;
          }
        } else if (c[0] === 9) {
          x = c[3] ? v[c[4]] : c[4];
          this.skip = c[2] === 0 ? v[c[1]] === x : !(v[c[1]] < x);   // only ops 0 and 5 were read
        } else if (c[0] === 5) this.pc = c[1];
        else if (this.host(c)) break;
      }
    }
    for (i = 0; i < 16; i++) {
      var s = this.slots[i];
      if (!s.on || !s.obj) continue;
      s.obj.update(out);
      v[0x52 + i] = s.obj.node.state; v[0x72 + i] = s.obj.node.done;
    }
    // card tints: brighten the card towards the colour (the game modulates its texture)
    for (var k in this.tints) {
      var t = this.tints[k], r = api.locate(t.p, t.kind), lit = false;
      for (i = 0; i < 3; i++) {
        if (t.cur[i] < t.to[i]) t.cur[i] = Math.min(t.to[i], t.cur[i] + 16); else if (t.cur[i] > t.to[i]) t.cur[i] = Math.max(t.to[i], t.cur[i] - 16);
        if (t.cur[i] > 128) lit = true;
      }
      if (r && lit) {
        var col = t.cur.map(function (q) { return Math.max(0, q - 128); });
        out.quad([r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h], col, col, col, col);
      }
    }
    this.frames++;
    return v[0] !== 0 && this.frames < 1800;
  };

  function tick() {
    var now = performance.now(), n = Math.min(Math.floor((now - last) / FRAME_MS), 4);
    if (n < 1) return;
    last += n * FRAME_MS;
    if (now - last > 200) last = now;
    while (n-- > 0) {
      tri.length = 0; lin.length = 0;
      running = running.filter(function (r) {
        if (r.step()) return true;
        if (r.done) r.done();
        return false;
      });
    }
    flush();
    if (!running.length) { clearInterval(timer); timer = 0; if (canvas) canvas.hidden = true; }
  }

  // Play script n. A is card `kindA` of player pA and B card `kindB` of player pB
  // (kind 0 = Digimon in play, 1 = support card), as the launcher at 0x801f6294 sets them.
  api.play = function (n, pA, kindA, pB, kindB) {
    return new Promise(function (res) {
      if (!api.enabled || !SCRIPTS[n]) { res(); return; }
      initGL();
      if (canvas) canvas.hidden = false;
      running.push(new Run(n, pA, kindA, pB == null ? pA : pB, kindB == null ? kindA : kindB, res));
      if (!timer) { last = performance.now(); timer = setInterval(tick, FRAME_MS); }
    });
  };
  api.stop = function () {
    running.forEach(function (r) { if (r.done) r.done(); });
    running = []; tri.length = 0; lin.length = 0; flush();
    if (timer) { clearInterval(timer); timer = 0; }
    if (canvas) canvas.hidden = true;
  };
  api.busy = function () { return running.length > 0; };
  window.DDCB_FX = api;
})();
