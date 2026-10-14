/* Native Time Stranger mesh data and CPU weighted skinning.
 * This project's renderer path, not recovered PS1 behavior. Full source bones,
 * triangles, weights and RGBA UVs are retained; no GPU uniform/index limit is used.
 */
(function () {
  'use strict';
  var cache = new WeakMap();
  function check(ok, message) { if (!ok) throw new Error('native model: ' + message); }
  function finiteArray(a, length, name) {
    check(a && a.length === length, name + ' length');
    var out = new Float64Array(a);
    for (var i = 0; i < out.length; i++) check(Number.isFinite(out[i]), name + ' finite value');
    return out;
  }
  function quatMatrix(q) {
    var d = Math.hypot(q[0], q[1], q[2], q[3]);
    if (!d) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    var x = q[0] / d, y = q[1] / d, z = q[2] / d, w = q[3] / d;
    return [1 - 2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w),
      2*(x*y+z*w), 1 - 2*(x*x+z*z), 2*(y*z-x*w),
      2*(x*z-y*w), 2*(y*z+x*w), 1 - 2*(x*x+y*y)];
  }
  function slerp(a, b, t) {
    var ad = Math.hypot(a[0],a[1],a[2],a[3]) || 1, bd = Math.hypot(b[0],b[1],b[2],b[3]) || 1;
    var x = [a[0]/ad,a[1]/ad,a[2]/ad,a[3]/ad], y = [b[0]/bd,b[1]/bd,b[2]/bd,b[3]/bd];
    var dot = x[0]*y[0]+x[1]*y[1]+x[2]*y[2]+x[3]*y[3];
    if (dot < 0) { dot = -dot; y = y.map(function(v) { return -v; }); }
    dot = Math.min(1, Math.max(-1, dot));
    var u, v;
    if (dot > .9995) { u = 1-t; v = t; }
    else { var angle = Math.acos(dot), den = Math.sin(angle); u = Math.sin((1-t)*angle)/den; v = Math.sin(t*angle)/den; }
    var q = x.map(function(k,i) { return u*k+v*y[i]; }), d = Math.hypot(q[0],q[1],q[2],q[3]) || 1;
    return q.map(function(k) { return k/d; });
  }
  function parse(doc) {
    check(doc && doc.format === 'ts-native-v1', 'format');
    var n = doc.n;
    check(Number.isInteger(n) && n > 0, 'bone count');
    check(doc.parents && doc.parents.length === n, 'parents length');
    var parents = new Int32Array(n), offsets = [], i, j;
    for (i = 0; i < n; i++) {
      var p = Number(doc.parents[i]);
      check(Number.isInteger(p) && p >= -1 && p < n && p !== i, 'parent index');
      parents[i] = p;
      var off = doc.offsets && (Array.isArray(doc.offsets[i]) || ArrayBuffer.isView(doc.offsets[i]) ? doc.offsets[i] : doc.offsets.slice(i*3,i*3+3));
      offsets.push(finiteArray(off, 3, 'offset'));
    }
    // Refuse cycles before Actor.resolve follows the source hierarchy.
    var visited = new Uint8Array(n);
    function visit(b) {
      check(visited[b] !== 1, 'parent cycle');
      if (visited[b] === 2) return;
      visited[b] = 1; if (parents[b] >= 0) visit(parents[b]); visited[b] = 2;
    }
    for (i = 0; i < n; i++) visit(i);
    var inverseBind = finiteArray(doc.inverseBind, n*16, 'inverseBind');
    var materials = (doc.materials || []).map(function(mat) {
      check(Number.isFinite(mat.width) && mat.width > 0 && Number.isFinite(mat.height) && mat.height > 0, 'material dimensions');
      return Object.assign({}, mat);
    });
    check(Array.isArray(doc.meshes), 'meshes');
    var nv = 0, nto = 0;
    var meshes = doc.meshes.map(function(mesh) {
      check(mesh.positions && mesh.positions.length % 3 === 0, 'positions length');
      var count = mesh.positions.length / 3;
      var positions = finiteArray(mesh.positions, count*3, 'positions');
      var normals = finiteArray(mesh.normals, count*3, 'normals');
      var uv0 = finiteArray(mesh.uv0, count*2, 'uv0');
      var weights = finiteArray(mesh.weights, count*4, 'weights');
      check(mesh.joints && mesh.joints.length === count*4, 'joints length');
      var joints = new Uint32Array(count*4);
      for (var v = 0; v < count; v++) {
        var sum = 0;
        for (var k = 0; k < 4; k++) {
          var at = v*4+k, bone = Number(mesh.joints[at]);
          check(weights[at] >= 0, 'negative weight');
          check(Number.isInteger(bone) && bone >= 0 && (weights[at] === 0 || bone < n), 'joint index');
          joints[at] = bone; sum += weights[at];
        }
        if (sum > 0) for (k = 0; k < 4; k++) weights[v*4+k] /= sum;
      }
      check(mesh.indices && mesh.indices.length % 3 === 0, 'triangle indices length');
      var indices = new Uint32Array(mesh.indices.length), usedVertices = new Uint8Array(count);
      for (var ix = 0; ix < indices.length; ix++) {
        var index = Number(mesh.indices[ix]);
        check(Number.isInteger(index) && index >= 0 && index < count, 'vertex index'); indices[ix] = index; usedVertices[index] = 1;
      }
      for (v = 0; v < count; v++) if (usedVertices[v])
        check(weights[v*4]+weights[v*4+1]+weights[v*4+2]+weights[v*4+3] > 0, 'zero drawn vertex weights');
      var material = Number(mesh.material);
      check(Number.isInteger(material) && material >= 0 && material < materials.length, 'material index');
      nv += count; nto += indices.length / 3;
      return Object.assign({}, mesh, { positions: positions, normals: normals, uv0: uv0, joints: joints,
        weights: weights, indices: indices, usedVertices: usedVertices, material: material, nv: count, nto: indices.length/3 });
    });
    var motions = (doc.motions || []).map(function(slot) {
      var keys = Array.isArray(slot) ? slot : slot.keys;
      check(Array.isArray(keys), 'motion keys');
      return keys.map(function(key) {
        check(Number.isFinite(key.dur) && key.dur >= 1, 'key duration');
        return Object.assign({}, key, { r: finiteArray(key.r,n*11+11,'motion records'), q: finiteArray(key.q,n*4,'motion quaternions') });
      });
    });
    var anchors = {};
    for (var alias in (doc.anchors || {})) {
      var b = Number(doc.anchors[alias]); check(Number.isInteger(b) && b >= 0 && b < n, 'anchor bone'); anchors[alias] = b;
    }
    var vb = new Float32Array(nv*13), ib = new Uint32Array(nto*3), vo = 0, io = 0;
    meshes.forEach(function(mesh) {
      for (var v = 0; v < mesh.nv; v++) {
        var to = (vo+v)*13, p = v*3;
        for (var k = 0; k < 3; k++) { vb[to+k] = mesh.positions[p+k]; vb[to+3+k] = mesh.normals[p+k]; vb[to+6+k] = 128; }
        vb[to+9] = mesh.uv0[v*2]; vb[to+10] = mesh.uv0[v*2+1];
      }
      for (var k = 0; k < mesh.indices.length; k++) ib[io+k] = mesh.indices[k]+vo;
      vo += mesh.nv; io += mesh.indices.length;
    });
    return { native: true, format: doc.format, n: n, names: (doc.names || []).slice(), nmot: motions.length,
      nv: nv, nto: nto, ntb: 0, tw: 1, th: 1, npal: 1, parents: parents, offsets: offsets,
      inverseBind: inverseBind, meshes: meshes, materials: materials, motions: motions, anchors: anchors, vb: vb, ib: ib };
  }
  function allocate(model) {
    return { model: model, version: NaN, bounds: new Float64Array(6),
      linear: new Float64Array(model.n*9), translation: new Float64Array(model.n*3),
      compact: model.meshes.map(function(mesh) { return new Float64Array(mesh.nv*6); }),
      draws: model.meshes.map(function(mesh) {
        var vb = new Float32Array(mesh.indices.length*13), mat = model.materials[mesh.material];
        for (var i = 0; i < mesh.indices.length; i++) {
          var src = mesh.indices[i], at = i*13;
          vb[at+6] = vb[at+7] = vb[at+8] = 128;
          // Existing shader adds .5 before dividing by material dimensions. This
          // preserves exact normalized 0/1 endpoints and out-of-range repeat UVs.
          vb[at+9] = mesh.uv0[src*2]*mat.width-.5;
          vb[at+10] = mesh.uv0[src*2+1]*mat.height-.5;
        }
        return { vb: vb, nv: mesh.indices.length, nto: mesh.indices.length/3, ntb: 0,
          material: mesh.material, materialIndex: mesh.material };
      }) };
  }
  function skin(actor) {
    var model = actor.m;
    check(model && model.native, 'actor model');
    check(actor.skinMats && actor.skinMats.length >= model.n, 'actor bone matrices');
    var state = cache.get(actor);
    if (!state || state.model !== model) { state = allocate(model); cache.set(actor,state); }
    if (state.version === actor.nativePoseVersion) return state.draws;
    var linear = state.linear, translation = state.translation, i, row, col;
    for (i = 0; i < model.n; i++) {
      var mt = actor.skinMats[i], bm = mt.m, bt = mt.t, ib = i*16, lm = i*9, lt = i*3;
      for (row = 0; row < 3; row++) {
        for (col = 0; col < 3; col++) linear[lm+row*3+col] =
          bm[row*3]*model.inverseBind[ib+col] + bm[row*3+1]*model.inverseBind[ib+4+col] + bm[row*3+2]*model.inverseBind[ib+8+col];
        translation[lt+row] = bt[row] + bm[row*3]*model.inverseBind[ib+3] + bm[row*3+1]*model.inverseBind[ib+7] + bm[row*3+2]*model.inverseBind[ib+11];
      }
    }
    var bounds = state.bounds;
    bounds[0] = bounds[1] = bounds[2] = Infinity; bounds[3] = bounds[4] = bounds[5] = -Infinity;
    model.meshes.forEach(function(mesh, mi) {
      var compact = state.compact[mi];
      for (var v = 0; v < mesh.nv; v++) {
        if (!mesh.usedVertices[v]) continue;
        var p = v*3, x = mesh.positions[p], y = mesh.positions[p+1], z = mesh.positions[p+2];
        var nx = mesh.normals[p], ny = mesh.normals[p+1], nz = mesh.normals[p+2];
        var px = 0, py = 0, pz = 0, ax = 0, ay = 0, az = 0;
        for (var k = 0; k < 4; k++) {
          var w = mesh.weights[v*4+k]; if (!w) continue;
          var bone = mesh.joints[v*4+k], m = bone*9, t = bone*3;
          px += w*(linear[m]*x+linear[m+1]*y+linear[m+2]*z+translation[t]);
          py += w*(linear[m+3]*x+linear[m+4]*y+linear[m+5]*z+translation[t+1]);
          pz += w*(linear[m+6]*x+linear[m+7]*y+linear[m+8]*z+translation[t+2]);
          ax += w*(linear[m]*nx+linear[m+1]*ny+linear[m+2]*nz);
          ay += w*(linear[m+3]*nx+linear[m+4]*ny+linear[m+5]*nz);
          az += w*(linear[m+6]*nx+linear[m+7]*ny+linear[m+8]*nz);
        }
        var norm = Math.hypot(ax,ay,az) || 1, c = v*6;
        compact[c] = px; compact[c+1] = py; compact[c+2] = pz;
        compact[c+3] = ax/norm; compact[c+4] = ay/norm; compact[c+5] = az/norm;
        bounds[0] = Math.min(bounds[0],px); bounds[1] = Math.min(bounds[1],py); bounds[2] = Math.min(bounds[2],pz);
        bounds[3] = Math.max(bounds[3],px); bounds[4] = Math.max(bounds[4],py); bounds[5] = Math.max(bounds[5],pz);
      }
      var vb = state.draws[mi].vb;
      for (var ix = 0; ix < mesh.indices.length; ix++) {
        var src = mesh.indices[ix]*6, dst = ix*13;
        for (var field = 0; field < 6; field++) vb[dst+field] = compact[src+field];
      }
    });
    if (!Number.isFinite(bounds[0])) bounds.fill(0);
    state.version = actor.nativePoseVersion;
    return state.draws;
  }
  function bounds(actor) { skin(actor); return cache.get(actor).bounds; }
  window.DDCB_BATTLE_NATIVE = { parse: parse, skin: skin, bounds: bounds, quatMatrix: quatMatrix, slerp: slerp };
})();
