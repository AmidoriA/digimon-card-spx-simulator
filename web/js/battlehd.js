/* Optional modern battle presentation. These refinements are this project's art direction,
 * not recovered PS1 behaviour. All animation and effect timing stays in battle3d.js. */
(function () {
  'use strict';
  function unit(v) {
    var d = Math.hypot(v[0], v[1], v[2]) || 1;
    return v.map(function (x) { return x / d; });
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  // Fixed budgets keep the optional effects bounded on mobile WebGL as well as desktop.
  function quality(style) {
    return style === 'ultra' ? { scale: 6, minScale: 3, particles: 448, quads: 768, emitters: 24, spawn: 5, burst: 96 } :
      { scale: style === 'legacy' ? 1 : 3, minScale: 2, particles: 112, quads: 160, emitters: 5, spawn: 2, burst: 32 };
  }
  // Weld only within a rigid body part. A crease keeps teeth, blades and armor edges sharp.
  // One curved subdivision adds four triangles per source triangle, without new assets.
  function refine(m) {
    var vb = m.vb, ib = m.ib, faces = [], weld = {}, keys = [], i, j;
    function key(n) { var p = n * 13; return [vb[p + 11], vb[p], vb[p + 1], vb[p + 2]].join(':'); }
    for (i = 0; i < m.nv; i++) keys[i] = key(i);
    for (i = 0; i < ib.length; i += 3) {
      var a = ib[i] * 13, b = ib[i + 1] * 13, c = ib[i + 2] * 13;
      var u = [vb[b] - vb[a], vb[b + 1] - vb[a + 1], vb[b + 2] - vb[a + 2]];
      var v = [vb[c] - vb[a], vb[c + 1] - vb[a + 1], vb[c + 2] - vb[a + 2]];
      var n = unit([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
      var source = [vb[a + 3] + vb[b + 3] + vb[c + 3], vb[a + 4] + vb[b + 4] + vb[c + 4], vb[a + 5] + vb[b + 5] + vb[c + 5]];
      if (dot(n, source) < 0) n = n.map(function (x) { return -x; });
      faces.push(n);
      for (j = 0; j < 3; j++) {
        var k = keys[ib[i + j]];
        if (!weld[k]) weld[k] = [];
        weld[k].push(n);
      }
    }
    var subdivide = ib.length * 2 <= 65535, out = [], ids = [], midpoints = {};
    for (i = 0; i < ib.length; i += 3) {
      var corners = [], face = faces[i / 3];
      for (j = 0; j < 3; j++) {
        var id = ib[i + j], p = Array.prototype.slice.call(vb, id * 13, id * 13 + 13), sum = [0, 0, 0];
        weld[keys[id]].forEach(function (n) {
          if (dot(face, n) > 0.62) { sum[0] += n[0]; sum[1] += n[1]; sum[2] += n[2]; }
        });
        var normal = unit(sum);
        p[3] = normal[0]; p[4] = normal[1]; p[5] = normal[2]; corners.push(p);
      }
      if (subdivide) {
        [[0, 1], [1, 2], [2, 0]].forEach(function (edge) {
          var a = corners[edge[0]], b = corners[edge[1]], p = a.map(function (x, k) { return (x + b[k]) / 2; });
          var na = a.slice(3, 6), nb = b.slice(3, 6), d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
          // Conservative curvature; keep part and palette indices discrete.
          var da = dot(d, na), db = dot(d, nb);
          for (var k = 0; k < 3; k++) p[k] -= (da * na[k] - db * nb[k]) * 0.12;
          // Share geometry across UV/normal seams so curvature cannot open cracks.
          var ka = keys[ib[i + edge[0]]], kb = keys[ib[i + edge[1]]], ek = ka < kb ? ka + '/' + kb : kb + '/' + ka;
          if (!midpoints[ek]) midpoints[ek] = p.slice(0, 3);
          for (k = 0; k < 3; k++) p[k] = midpoints[ek][k];
          var n = unit([na[0] + nb[0], na[1] + nb[1], na[2] + nb[2]]);
          for (k = 0; k < 3; k++) p[k + 3] = n[k];
          p[11] = a[11]; p[12] = a[12]; corners.push(p);
        });
      }
      var base = out.length / 13;
      corners.forEach(function (p) { Array.prototype.push.apply(out, p); });
      (subdivide ? [0, 3, 5, 3, 1, 4, 5, 4, 2, 3, 4, 5] : [0, 1, 2]).forEach(function (n) { ids.push(base + n); });
    }
    // The source models fit 16-bit indices. Fall back to their mesh for larger inputs.
    if (out.length / 13 > 65535) return { vb: vb, ib: ib, nto: m.nto, ntb: m.ntb };
    return { vb: new Float32Array(out), ib: new Uint16Array(ids), nto: m.nto * (subdivide ? 4 : 1), ntb: m.ntb * (subdivide ? 4 : 1) };
  }
  function profile(name, spec) {
    name = (name || '').toLowerCase();
    if (/fire|flame|flare|heat|burn|terra|meteor|crimson|pepper/.test(name)) return { kind: 'fire', color: [1, 0.34, 0.07], gravity: -0.025 };
    if (/ice|snow|freeze|freez|frost|blizzard|water|ocean|aqua|bubble|harpoon/.test(name)) return { kind: 'ice', color: [0.2, 0.7, 1], gravity: 0.012 };
    if (/electric|thunder|lightning|spark|bolt|shock/.test(name)) return { kind: 'electric', color: [0.5, 0.8, 1], gravity: 0 };
    if (/dark|evil|night|death|poison|venom|hell|nightmare/.test(name)) return { kind: 'dark', color: [0.65, 0.22, 1], gravity: -0.012 };
    if (/holy|heaven|angel|celestial|shine|shining|divine|light|star/.test(name)) return { kind: 'holy', color: [1, 0.84, 0.35], gravity: -0.01 };
    if (/blade|claw|slash|sword|cut|punch|kick|tackle|horn|bite|hammer|drill/.test(name)) return { kind: 'physical', color: [1, 0.72, 0.35], gravity: 0.06 };
    var colors = [[1, 0.4, 0.12], [0.25, 0.75, 1], [0.45, 1, 0.45], [0.7, 0.3, 1], [1, 0.85, 0.3]];
    return { kind: 'energy', color: colors[spec] || [0.3, 0.75, 1], gravity: 0 };
  }
  function material(model) {
    var cards = window.DDCB_DATA && window.DDCB_DATA.cards || [], name = '';
    for (var i = 0; i < cards.length; i++) if (cards[i].model === model) { name = cards[i].name; break; }
    if (/metal|machine|giga|andro|knight|omni|magnamon|tank|guard|mekanor|haguru|kokuw|megadramon/i.test(name)) return 1;
    if (/garuru|leomon|gato|bear|frigi|ikkaku|zudo|vikemon|patamon|terrier|mammoth/i.test(name)) return 2;
    if (/angemon|angewomon|wizard|piemon|piedmon|myotis|devimon|rosemon|lillymon|ninjamon/i.test(name)) return 3;
    return 0;
  }
  // Palette indices must ALWAYS use nearest sampling. Interpolate decoded colours instead.
  var paletteGLSL = 'vec4 palSample(vec2 uv){float ix=texture2D(uS,uv).r*255.0;return texture2D(uP,vec2((ix+0.5)/256.0,PAL));}' +
    'vec4 smoothPal(vec2 uv){vec2 p=uv*uTex-0.5;vec2 f=fract(p);vec2 q=(floor(p)+0.5)/uTex;vec2 d=1.0/uTex;' +
    'return mix(mix(palSample(q),palSample(q+vec2(d.x,0.0)),f.x),mix(palSample(q+vec2(0.0,d.y)),palSample(q+d),f.x),f.y);}';
  window.DDCB_BATTLE_HD = { refine: refine, profile: profile, material: material, paletteGLSL: paletteGLSL, quality: quality };
})();
