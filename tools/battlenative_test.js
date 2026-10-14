// Semantic native mesh regressions; no game assets, browser or GPU required.
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const box = { window: {}, console, Float32Array, Float64Array, Int32Array, Uint32Array, Uint8Array, ArrayBuffer, WeakMap };
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../web/js/battlenative.js'), 'utf8'), box);
const N = box.window.DDCB_BATTLE_NATIVE;
const identity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
function multiply(a,b) {
  const out = new Array(16).fill(0);
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) for(let k=0;k<4;k++) out[r*4+c] += a[r*4+k]*b[k*4+c];
  return out;
}
function transform(m,p,w) { return [0,1,2].map(r => m[r*4]*p[0]+m[r*4+1]*p[1]+m[r*4+2]*p[2]+m[r*4+3]*w); }
function asBone(m) { return {m:[m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]],t:[m[3],m[7],m[11]]}; }
function almost(actual, expected, tolerance=1e-6) {
  assert.strictEqual(actual.length,expected.length);
  for(let i=0;i<actual.length;i++) assert(Math.abs(actual[i]-expected[i])<=tolerance, `${i}: ${actual[i]} != ${expected[i]}`);
}
function document(n=4) {
  const r=new Array((n+1)*11).fill(0),q=[];
  for(let b=0;b<n;b++) { r[b*11+7]=r[b*11+8]=r[b*11+9]=4096;q.push(0,0,0,1); }
  return {format:'ts-native-v1',n,names:Array.from({length:n},(_,i)=>`bone${i}`),parents:new Array(n).fill(-1),
    offsets:Array.from({length:n},()=>[0,0,0]),inverseBind:Array.from({length:n},identity).flat(),
    materials:[{texture:'native.png',width:512,height:1024,rgba:true}],
    meshes:[{positions:[1,2,3, 4,5,6, -1,2,1],normals:[1,1,0, 0,0,1, 0,1,0],uv0:[0,0,1,1,1.25,-.5],
      joints:[0,1,2,3, 0,1,2,3, 0,1,2,3],weights:[.1,.2,.3,.4, .25,.25,.25,.25, 1,0,0,0],indices:[0,1,2],material:0}],
    motions:[[{dur:2,snd:7,r,q}]],anchors:{0:3}};
}
function actor(doc, world) { return {m:N.parse(doc),skinMats:world.map(asBone),nativePoseVersion:1}; }
function reference(doc,world,vertex) {
  const mesh=doc.meshes[0], p=mesh.positions.slice(vertex*3,vertex*3+3), normal=mesh.normals.slice(vertex*3,vertex*3+3);
  const pos=[0,0,0],norm=[0,0,0];
  for(let k=0;k<4;k++) {
    const weight=mesh.weights[vertex*4+k],bone=mesh.joints[vertex*4+k];
    const combined=multiply(world[bone],doc.inverseBind.slice(bone*16,bone*16+16));
    const v=transform(combined,p,1),n=transform(combined,normal,0);
    for(let axis=0;axis<3;axis++) {pos[axis]+=weight*v[axis];norm[axis]+=weight*n[axis];}
  }
  const length=Math.hypot(...norm)||1;
  return [...pos,...norm.map(x=>x/length)];
}
const tests=[];
function test(name,fn) {tests.push([name,fn]);}

test('four native weights include every bone and normalize blended normals',()=>{
  const d=document(), world=[identity(),identity(),identity(),identity()];
  world[0][3]=10;world[1][7]=-20;world[2][11]=30;world[3][0]=2;world[3][5]=3;world[3][3]=5;
  d.inverseBind[1*16+3]=-2;d.inverseBind[2*16+7]=4;
  const a=actor(d,world),draw=N.skin(a)[0];
  for(let v=0;v<3;v++) almost(Array.from(draw.vb.slice(v*13,v*13+6)),reference(d,world,v));
  assert.strictEqual(draw.material,0);assert.strictEqual(a.m.materials[0].rgba,true);
});

test('rotated child of nonuniform parent retains affine shear and zero scales',()=>{
  const d=document(), c=Math.SQRT1_2;
  const parent=[0,-3,0,7, 2,0,0,-5, 0,0,4,9, 0,0,0,1];
  const child=[c,0,c,1, 0,1,0,2, -c,0,c,3, 0,0,0,1];
  const world=[parent,multiply(parent,child),identity(),identity()];
  // A native effect collapses a complete bone without needing a posed inverse.
  world[2]=[0,0,0,11, 0,0,0,12, 0,0,0,13, 0,0,0,1];
  // Another has only one collapsed axis.
  world[3]=[1,0,0,2, 0,0,0,3, 0,0,2,4, 0,0,0,1];
  d.parents[1]=0;
  const a=actor(d,world),draw=N.skin(a)[0];
  for(let v=0;v<3;v++) almost(Array.from(draw.vb.slice(v*13,v*13+6)),reference(d,world,v));
  assert(Array.from(draw.vb).every(Number.isFinite));
});

test('full bone IDs and expanded vertices exceed old GPU and 16-bit index limits',()=>{
  const d=document(40), count=65537, mesh=d.meshes[0];
  mesh.positions=new Array(count*3).fill(0);mesh.positions[65536*3]=123;
  mesh.normals=new Array(count*3).fill(0);mesh.uv0=new Array(count*2).fill(0);
  mesh.joints=new Array(count*4).fill(0);mesh.weights=new Array(count*4).fill(0);
  for(let v=0;v<count;v++){mesh.joints[v*4]=39;mesh.weights[v*4]=1;}
  mesh.indices=Array.from({length:65538},(_,i)=>i%3===0?65536:i%3);
  const world=Array.from({length:40},identity);world[39][3]=17;
  const a=actor(d,world),draw=N.skin(a)[0];
  assert.strictEqual(a.m.meshes[0].indices[0],65536);
  assert.strictEqual(a.m.ib[0],65536);assert.strictEqual(draw.nv,65538);assert.strictEqual(draw.nto,21846);
  assert.strictEqual(draw.vb[0],140);assert.strictEqual(draw.vb[(draw.nv-3)*13],140);
  assert.strictEqual(draw.ib,undefined,'drawArrays data does not use a wrapping index buffer');
});

test('native RGBA UV endpoints and repeat coordinates survive shader texel convention',()=>{
  const d=document(),a=actor(d,Array.from({length:4},identity)),draw=N.skin(a)[0];
  for(let v=0;v<3;v++) {
    almost([(draw.vb[v*13+9]+.5)/512,(draw.vb[v*13+10]+.5)/1024],d.meshes[0].uv0.slice(v*2,v*2+2),0);
    almost(Array.from(draw.vb.slice(v*13+6,v*13+9)),[128,128,128],0);
    assert.strictEqual(draw.vb[v*13+11],0);assert.strictEqual(draw.vb[v*13+12],0);
  }
});

test('bounds reuse compact skinned vertices and cached pose invalidates on version change',()=>{
  const d=document(),a=actor(d,Array.from({length:4},identity)),first=N.skin(a),vb=first[0].vb;
  almost(Array.from(N.bounds(a)),[-1,2,1,4,5,6],0);
  assert.strictEqual(N.skin(a),first);assert.strictEqual(N.bounds(a),N.bounds(a));
  a.skinMats[0].t[0]=100;
  assert.strictEqual(N.skin(a)[0].vb[0],1,'same version uses cached pose');
  a.nativePoseVersion++;
  assert.strictEqual(N.skin(a)[0].vb,vb,'expanded allocation is reused');
  almost(Array.from(vb.slice(0,3)),[11,2,3]);
  almost(Array.from(N.bounds(a)),[11,2,1,99,5,6]);
});

test('motion records keep Float64 precision, parents can follow children, cycles reject',()=>{
  const d=document();d.parents=[2,-1,1,-1];d.motions[0][0].r[4]=Math.PI;
  const m=N.parse(d);assert.strictEqual(m.motions[0][0].r[4],Math.PI);assert.strictEqual(m.anchors[0],3);
  d.parents=[1,0,-1,-1];assert.throws(()=>N.parse(d),/parent cycle/);
});

test('quaternion helpers retain orientation and antipodal interpolation follows shortest path',()=>{
  const a=[0,0,0,1],b=[0,Math.SQRT1_2,0,Math.SQRT1_2],q=N.slerp(a,b,.5);
  almost(q,[0,Math.sin(Math.PI/8),0,Math.cos(Math.PI/8)],1e-12);
  almost(N.slerp(b,b.map(x=>-x),.5),b,1e-12);
  almost(N.quatMatrix([0,0,Math.SQRT1_2,Math.SQRT1_2]),[0,-1,0,1,0,0,0,0,1],1e-12);
});

test('exporter motion-slot objects preserve source keys alongside array compatibility',()=>{
  const d=document(), key=d.motions[0][0];
  d.motions=[{source:'bn01',loop:0,keys:[key]}];
  const m=N.parse(d);assert.strictEqual(m.motions[0][0].dur,2);assert.strictEqual(m.motions[0][0].snd,7);
  almost(Array.from(m.motions[0][0].q),key.q,0);
});

test('unused zero-weight source vertices are preserved but cannot widen drawn bounds',()=>{
  const d=document(),mesh=d.meshes[0];
  mesh.positions.push(1e9,-1e9,1e9);mesh.normals.push(0,0,0);mesh.uv0.push(0,0);
  mesh.joints.push(0,0,0,0);mesh.weights.push(0,0,0,0);
  const a=actor(d,Array.from({length:4},identity));assert.strictEqual(a.m.nv,4);
  almost(Array.from(N.bounds(a)),[-1,2,1,4,5,6],0);
  mesh.indices=[0,1,3];assert.throws(()=>N.parse(d),/zero drawn vertex weights/);
});

let failed=0;
for(const [name,fn] of tests){try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
if(failed)process.exitCode=1;else console.log(`${tests.length} native semantic regressions passed`);
