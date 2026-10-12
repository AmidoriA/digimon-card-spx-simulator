/* Optional Ultra shadows, authored for this remake. A colour depth map works in WebGL 1
 * without depth-texture extensions. Shadows shade the Digimon surfaces only; the native
 * arena keeps its original painter order and receives no floor shadows. */
(function () {
  'use strict';
  var SIZE = 1024;
  var sample = 'uniform sampler2D uShadow;varying vec4 vShadow;' +
    'float shadowMask(float bias){vec3 q=vShadow.xyz/vShadow.w*0.5+0.5;if(q.x<0.0||q.y<0.0||q.x>1.0||q.y>1.0||q.z<0.0||q.z>1.0)return 0.0;float s=0.0;' +
    'for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){vec2 d=texture2D(uShadow,q.xy+vec2(float(x),float(y))/1024.0).rg;s+=step(d.x+d.y/255.0+bias,q.z);}return s/9.0;}';
  function unit(a) { var d = Math.hypot.apply(Math, a) || 1; return a.map(function (n) { return n / d; }); }
  function cross(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
  function matrix(actors) {
    var b = [1e9,1e9,1e9,-1e9,-1e9,-1e9];
    actors.forEach(function(a) { var p=a.bounds(); for(var k=0;k<3;k++){b[k]=Math.min(b[k],p[k]);b[k+3]=Math.max(b[k+3],p[k+3]);} });
    b[1]=Math.min(b[1],0); b[4]=Math.max(b[4],0);
    var c=[(b[0]+b[3])/2,(b[1]+b[4])/2,(b[2]+b[5])/2];
    var r=Math.max(500, Math.hypot(b[3]-b[0],b[4]-b[1],b[5]-b[2])/2+200);
    var z=unit([0.45,1,0.55]), x=unit(cross([0,-1,0],z)), y=cross(z,x), rows=[x,y,z], m=new Float32Array(16);
    rows.forEach(function(a,i){ for(var k=0;k<3;k++)m[k*4+i]=a[k]/r; m[12+i]=-(a[0]*c[0]+a[1]*c[1]+a[2]*c[2])/r; }); m[15]=1;
    return { light:m, center:c, radius:r };
  }
  function create(gl, program) {
    var depthVS='attribute vec3 aP;attribute vec4 aT;uniform mat3 uM[32];uniform vec3 uT[32];uniform float uShow[32];uniform mat4 uLight;uniform vec2 uTex;uniform float uPalN;varying vec2 uv;varying float pal,textured;' +
      'void main(){int i=int(aT.z+0.5);gl_Position=uLight*vec4(uM[i]*aP+uT[i],1.0);if(uShow[i]>0.5)gl_Position=vec4(2.0,2.0,2.0,1.0);uv=(aT.xy+0.5)/uTex;pal=(aT.w+0.5)/uPalN;textured=step(0.0,aT.x);}';
    var depthFS='precision highp float;uniform sampler2D uS,uP;varying vec2 uv;varying float pal,textured;void main(){if(textured>0.5){float ix=texture2D(uS,uv).r*255.0;if(texture2D(uP,vec2((ix+0.5)/256.0,pal)).a<0.5)discard;}vec2 d=fract(gl_FragCoord.z*vec2(1.0,255.0));d.x-=d.y/255.0;gl_FragColor=vec4(d,0.0,1.0);}';
    var dp=program(depthVS,depthFS), dl={};
    ['aP','aT'].forEach(function(n){dl[n]=gl.getAttribLocation(dp,n);});
    ['uM','uT','uShow','uLight','uTex','uPalN','uS','uP'].forEach(function(n){dl[n]=gl.getUniformLocation(dp,n);});
    var tex=gl.createTexture(), fbo=gl.createFramebuffer(), depth=gl.createRenderbuffer();
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,SIZE,SIZE,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
    gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,SIZE,SIZE);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){gl.deleteTexture(tex);gl.deleteFramebuffer(fbo);gl.deleteRenderbuffer(depth);gl.deleteProgram(dp);return null;}
    function draw(actors,meshFor) {
      var frame=matrix(actors);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,SIZE,SIZE);gl.clearColor(1,1,1,1);gl.clearDepth(1);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(dp);
      gl.uniformMatrix4fv(dl.uLight,false,frame.light);
      actors.forEach(function(a){
        var m=a.m, mesh=meshFor?meshFor(m):m.hd||m, M=new Float32Array(288), T=new Float32Array(96), S=new Float32Array(32);
        for(var i=0;i<m.n&&i<32;i++){var mt=a.mats[i];for(var k=0;k<9;k++)M[i*9+k]=mt.m[(k%3)*3+Math.floor(k/3)];T.set(mt.t,i*3);S[i]=a.show[i]?1:0;}
        gl.uniformMatrix3fv(dl.uM,false,M);gl.uniform3fv(dl.uT,T);gl.uniform1fv(dl.uShow,S);gl.uniform2f(dl.uTex,m.tw,m.th);gl.uniform1f(dl.uPalN,Math.max(1,m.npal));
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.tex);gl.uniform1i(dl.uS,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,m.pal);gl.uniform1i(dl.uP,1);
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vbo);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ibo);
        gl.enableVertexAttribArray(dl.aP);gl.vertexAttribPointer(dl.aP,3,gl.FLOAT,false,52,0);gl.enableVertexAttribArray(dl.aT);gl.vertexAttribPointer(dl.aT,4,gl.FLOAT,false,52,36);
        gl.drawElements(gl.TRIANGLES,mesh.nto*3,gl.UNSIGNED_SHORT,0);
      });
      gl.disableVertexAttribArray(dl.aP);gl.disableVertexAttribArray(dl.aT);return frame;
    }
    return { texture:tex, draw:draw };
  }
  window.DDCB_BATTLE_ULTRA={create:create, shadowGLSL:sample, matrix:matrix};
})();
