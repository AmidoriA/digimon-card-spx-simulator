/*
 * Battle effects: plays the game's own effect scripts (B/CBTL_EFF.ARC, exported to
 * js/data/effects.js by tools/build_effects.py) with a port of its effect engine.
 *
 * A script is a small program on 190 integer variables, run once per frame by the
 * interpreter at 0x801f663c. It fills variables, creates effect objects in 16 slots from
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
 * Drawn on a 320x240 canvas (the game's screen) blended additively over the board.
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

  // ------------------------------------------------------------------ transform node
  // Variables 0x92..0xb5 describe a node (0x801f6f44 copies them).
  function Node(v, parent) {
    this.parent = parent;
    this.pos0 = [s16(v[0x92]), s16(v[0x93]), s16(v[0x94])];
    this.target = [s16(v[0x95]), s16(v[0x96]), s16(v[0x97])];
    this.speed = s16(v[0x98]); this.accel = s16(v[0x99]);
    this.rot0 = [s16(v[0x9a]), s16(v[0x9b]), s16(v[0x9c])];
    this.rotV = [s16(v[0x9d]), s16(v[0x9e]), s16(v[0x9f])];
    this.rotA = [s16(v[0xa0]), s16(v[0xa1]), s16(v[0xa2])];
    this.sc0 = [v[0xa3], v[0xa4], v[0xa5]];
    this.scT = [v[0xa6], v[0xa7], v[0xa8]];
    this.scS = [s16(v[0xa9]), s16(v[0xaa]), s16(v[0xab])];
    this.dur = s16(v[0xad]); this.fadeMode = v[0xae] & 0xff; this.fadeStep = s16(v[0xaf]);
    this.type = s16(v[0xb0]);
    this.pos = this.pos0.slice(); this.rot = this.rot0.slice(); this.sc = this.sc0.slice();
    this.t = 0; this.t2 = 0; this.life = 0; this.done = 0; this.state = -1; this.fadeState = 0;
    this.hidden = this.type >= 91;
    // unit vector towards the target (0x80030bc4)
    var d = [this.target[0] - this.pos0[0], this.target[1] - this.pos0[1], this.target[2] - this.pos0[2]];
    var len = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    this.dir = len ? [d[0] / len, d[1] / len, d[2] / len] : [0, 0, 0];
    this.m = IDENT; this.tr = [0, 0, H];
  }
  // 0x80030f90 for the motion types the scripts use (56, 69: fixed; 70: straight line), then
  // the matrix (0x8001eea0). `mode` 1..3 keeps one rotation axis and ignores the parent's turn.
  Node.prototype.update = function (mode) {
    var i, v, t = this.t;
    for (i = 0; i < 3; i++) {
      if (this.sc[i] !== this.scT[i]) {
        v = this.scS[i] * t + this.sc0[i];
        if (this.scS[i] >= 0) this.sc[i] = v >= this.scT[i] ? this.scT[i] : v;
        else { this.sc[i] = v; if (this.sc[i] <= this.scT[i]) this.sc[i] = this.scT[i]; }
      }
      this.rot[i] = s16(this.rot0[i] + this.rotV[i] * t + tdiv(this.rotA[i] * this.t2 * this.t2, 64));
    }
    if (this.type === 70) {
      v = this.speed * t + this.accel * this.t2 * this.t2;
      for (i = 0; i < 3; i++) this.pos[i] = this.pos0[i] + Math.trunc(v * this.dir[i]);
    } else for (i = 0; i < 3; i++) this.pos[i] = this.pos0[i];
    this.t++; this.t2++;
    if (this.dur !== 0 && !this.done) {
      if (this.dur < this.life) {
        this.life = this.dur;
        if (this.type === 56) this.hidden = true;                                  // gone at once
        else { this.fadeMode = 2; this.fadeStep = -Math.abs(this.fadeStep); }       // fade out
        this.done = 1;
      } else this.life++;
    }
    var P = this.parent, r = this.rot;
    if (mode === 1) r = [0, 0, r[2]]; else if (mode === 2) r = [0, r[1], 0]; else if (mode === 3) r = [r[0], 0, 0];
    var m = mode === 4 ? IDENT : mode ? rotMatrix(r) : mul(P ? P.m : IDENT, rotMatrix(r));
    this.tr = P ? apply(P.m, P.tr, this.pos) : [this.pos[0], this.pos[1], this.pos[2] + H];
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

  function project(m, tr, p) {
    var w = apply(m, tr, p);
    if (w[2] < 8) return null;
    return [CX + w[0] * H / w[2], CY + w[1] * H / w[2]];
  }

  // ------------------------------------------------------------------ ring
  function Ring(v, parent) {
    this.node = new Node(v, parent);
    this.mode = v[0x45] & 0xff;
    this.alpha = s16(v[0x37]);
    this.col = [[v[0x25] & 255, v[0x26] & 255, v[0x27] & 255], [v[0x28] & 255, v[0x29] & 255, v[0x2a] & 255], [v[0x2b] & 255, v[0x2c] & 255, v[0x2d] & 255]];
    var n = this.n = v[0x15], r0 = s16(v[0x3d]), r1 = s16(v[0x3e]), k = s16(v[0x41]), z0 = s16(v[0x3f]), z1 = s16(v[0x40]);
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
    if (N.hidden) return;
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
  function Particles(v, parent) {
    var N = this.node = new Node(v, parent), i, z = 0;
    this.mode = v[0x45] & 1; this.spin = v[0x45] & 2;
    this.colA = [v[0x25] & 255, v[0x26] & 255, v[0x27] & 255];
    this.colB = [v[0x28] & 255, v[0x29] & 255, v[0x2a] & 255];
    var spreadY = s16(v[0xb7]) || 1, spreadX = s16(v[0xb6]) || 1, size0 = s16(v[0xb8]), size1 = s16(v[0xbd]);
    var L = this.cycle = s16(v[0xb9]) & 0xffff, speedMax = s16(v[0xba]), amode = s16(v[0x4e]), off = s16(v[0x50]);
    this.count = s16(v[0xbc]) & 0xffff;
    this.offset = s16(v[0x4f]);
    this.gouraud = (v[0x51] & 0xff) !== 0;
    this.dir = s16(v[0xbb]) !== 0 ? -1 : 1;                       // -1: fly inwards
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
    void N;
  }
  Particles.prototype.update = function (out) {
    var N = this.node, L = this.cycle;
    if (N.hidden || !L) return;
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

  function Plain(v, parent) { this.node = new Node(v, parent); }
  Plain.prototype.update = function () { this.node.update(0); };

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

  // ------------------------------------------------------------------ script runner
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
