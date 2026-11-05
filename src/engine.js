/* ShiftGL - small instanced WebGL2 renderer for LAST SHIFT. No runtime dependencies. */
'use strict';
const ShiftGL = (() => {
  const I = () => new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function multiply(a,b,out=new Float32Array(16)){
    for(let j=0;j<4;j++){const k=j*4;for(let i=0;i<4;i++) out[k+i]=a[i]*b[k]+a[4+i]*b[k+1]+a[8+i]*b[k+2]+a[12+i]*b[k+3];}return out;
  }
  function compose(p,r,s,out=new Float32Array(16)){
    const a=Math.cos(r[0]),b=Math.sin(r[0]),c=Math.cos(r[1]),d=Math.sin(r[1]),e=Math.cos(r[2]),f=Math.sin(r[2]);
    out[0]=c*e*s[0];out[1]=(a*f+b*d*e)*s[0];out[2]=(b*f-a*d*e)*s[0];out[3]=0;
    out[4]=-c*f*s[1];out[5]=(a*e-b*d*f)*s[1];out[6]=(b*e+a*d*f)*s[1];out[7]=0;
    out[8]=d*s[2];out[9]=-b*c*s[2];out[10]=a*c*s[2];out[11]=0;
    out[12]=p[0];out[13]=p[1];out[14]=p[2];out[15]=1;return out;
  }
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
  const normalize = v=>{const l=Math.hypot(...v)||1;return v.map(a=>a/l);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  function lookAt(eye,target,up=[0,1,0]){const z=normalize(eye.map((x,i)=>x-target[i])),x=normalize(cross(up,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  function rgb(hex){if(Array.isArray(hex))return hex.slice(0,3);const n=parseInt(hex.replace('#',''),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
  function geoBox(){const p=[],n=[],idx=[];const faces=[[[1,0,0],[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]],[[-1,0,0],[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]],[[0,1,0],[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]],[[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]]];
    for(const [normal,verts]of faces){const a=p.length/3;verts.forEach(v=>{p.push(...v);n.push(...normal);});idx.push(a,a+1,a+2,a,a+2,a+3);}return {p,n,idx};}
  function geoSphere(seg=16,rings=10){const p=[],n=[],idx=[];for(let j=0;j<=rings;j++){const t=j/rings*Math.PI;for(let i=0;i<=seg;i++){const u=i/seg*Math.PI*2,v=[Math.sin(t)*Math.cos(u),Math.cos(t),Math.sin(t)*Math.sin(u)];p.push(...v);n.push(...v);}}for(let j=0;j<rings;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;idx.push(a,b,a+1,b,b+1,a+1);}return{p,n,idx};}
  function geoCylinder(seg=16,top=1){const p=[],n=[],idx=[];for(let j=0;j<2;j++)for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,r=j?top:1,normal=normalize([Math.cos(a),1-top,Math.sin(a)]);p.push(Math.cos(a)*r,j-.5,Math.sin(a)*r);n.push(...normal);}for(let i=0;i<seg;i++){idx.push(i,i+1,i+seg+1,i+1,i+seg+2,i+seg+1);}for(let j=0;j<2;j++){const start=p.length/3,y=j-.5,r=j?top:1;p.push(0,y,0);n.push(0,j?1:-1,0);for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2;p.push(Math.cos(a)*r,y,Math.sin(a)*r);n.push(0,j?1:-1,0);}for(let i=0;i<seg;i++)if(j)idx.push(start,start+i+2,start+i+1);else idx.push(start,start+i+1,start+i+2);}return{p,n,idx};}
  function geoTorus(seg=20,tube=7){const p=[],n=[],idx=[];for(let i=0;i<=seg;i++){const u=i/seg*Math.PI*2;for(let j=0;j<=tube;j++){const v=j/tube*Math.PI*2,c=Math.cos(v),s=Math.sin(v);p.push((1+.16*c)*Math.cos(u),(1+.16*c)*Math.sin(u),.16*s);n.push(c*Math.cos(u),c*Math.sin(u),s);}}for(let i=0;i<seg;i++)for(let j=0;j<tube;j++){const a=i*(tube+1)+j,b=a+tube+1;idx.push(a,b,a+1,b,b+1,a+1);}return{p,n,idx};}
  function geoWedge(){return geoCylinder(3,.02);}
  class Node{
    constructor(shape=null,color='#ffffff',scale=[1,1,1],position=[0,0,0],rotation=[0,0,0]){this.shape=shape;this.color=rgb(color);this.s=scale;this.p=position;this.r=rotation;this.children=[];this.visible=true;this.emission=0;this.shadow=true;this.metal=0;this.world=I();this.local=I();this.parent=null;}
    add(...items){items.forEach(n=>{if(n.parent)n.parent.remove(n);this.children.push(n);n.parent=this;});return this;}
    remove(n){const i=this.children.indexOf(n);if(i>=0){this.children.splice(i,1);n.parent=null;}return this;}
    setColor(color){this.color=rgb(color);return this;}
    traverse(fn){fn(this);this.children.forEach(c=>c.traverse(fn));}
  }
  const group=()=>new Node();
  const mesh=(shape,color,scale,position,rotation)=>new Node(shape,color,scale,position,rotation);
  const vertex=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;
  layout(location=2) in mat4 aModel;layout(location=6) in vec4 aColor;layout(location=7) in vec2 aStyle;
  uniform mat4 uVP;uniform mat4 uLight;uniform vec3 uEye;
  out vec3 vColor;out vec3 vNormal;out vec3 vWorld;out vec4 vShadow;out float vEmission;out float vMetal;
  void main(){vec4 w=aModel*vec4(aPos,1.0);vWorld=w.xyz;
    mat3 m=mat3(aModel);vNormal=normalize(m*(aNormal/vec3(dot(m[0],m[0]),dot(m[1],m[1]),dot(m[2],m[2]))));
    vColor=aColor.rgb;vEmission=aColor.a;vMetal=aStyle.x;vShadow=uLight*w;gl_Position=uVP*w;}`;
  const fragment=`#version 300 es
  precision highp float;
  in vec3 vColor;in vec3 vNormal;in vec3 vWorld;in vec4 vShadow;in float vEmission;in float vMetal;
  uniform vec3 uEye;uniform vec3 uFog;uniform vec3 uSun;uniform float uNight;uniform sampler2D uDepth;uniform float uShadows;
  out vec4 frag;
  float shadow(){vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0)return 1.0;
    float bias=max(.0025*(1.0-dot(normalize(vNormal),uSun)),.0010),s=0.0;vec2 texel=1.0/vec2(textureSize(uDepth,0));
    for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(uDepth,p.xy+vec2(x,y)*texel).r;s+=(p.z-bias>d)?.48:1.0;}return s/9.0;}
  vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
  void main(){vec3 N=normalize(vNormal),V=normalize(uEye-vWorld),H=normalize(uSun+V);float sun=max(dot(N,uSun),0.0);float sh=mix(1.0,shadow(),uShadows);
    vec3 base=pow(vColor,vec3(2.2));vec3 ambient=mix(vec3(.30,.34,.38),vec3(.50,.56,.60),N.y*.5+.5);
    ambient*=mix(1.0,.48,uNight);vec3 diffuse=ambient+vec3(1.45,1.22,.95)*sun*sh*mix(1.0,.43,uNight);
    float spec=pow(max(dot(N,H),0.0),mix(24.0,72.0,vMetal))*(.06+vMetal*.95)*sh;
    float rim=pow(1.0-max(dot(N,V),0.0),3.0)*.1;
    vec3 c=base*diffuse+vec3(1.0,.86,.64)*spec+base*vEmission*2.2+rim*base;
    c=pow(aces(c),vec3(1.0/2.2));float fog=smoothstep(55.0,165.0,length(vWorld-uEye));c=mix(c,uFog,fog);
    frag=vec4(c,1.0);}`;
  const depthV=`#version 300 es
  precision highp float;layout(location=0) in vec3 aPos;layout(location=2) in mat4 aModel;uniform mat4 uVP;void main(){gl_Position=uVP*aModel*vec4(aPos,1.0);}`;
  const depthF=`#version 300 es
  precision highp float;void main(){}`;
  const skyV=`#version 300 es
  out vec2 vUv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);vUv=p;gl_Position=vec4(p*2.0-1.0,1.0,1.0);}`;
  const skyF=`#version 300 es
  precision highp float;in vec2 vUv;out vec4 frag;uniform float uNight;uniform float uTime;uniform float uAspect;
  void main(){vec3 low=mix(vec3(.84,.76,.65),vec3(.18,.25,.34),uNight);vec3 high=mix(vec3(.40,.61,.65),vec3(.055,.12,.21),uNight);
    vec3 c=mix(low,high,smoothstep(.15,1.0,vUv.y));vec2 q=(vUv-vec2(.73,.76))*vec2(uAspect,1.0);float d=length(q);c+=vec3(1.0,.68,.32)*exp(-d*10.0)*.18*(1.0-uNight);c=mix(c,vec3(1.,.91,.69),(1.0-smoothstep(.032,.035,d))*(1.0-uNight));
    float cloud=sin(vUv.x*12.0+uTime*.008)*sin(vUv.x*7.0+vUv.y*29.0);c+=vec3(.13,.12,.09)*smoothstep(.55,.85,cloud)*smoothstep(.56,.8,vUv.y)*(1.0-uNight);
    frag=vec4(c,1.0);}`;
  class Renderer{
    constructor(canvas){this.canvas=canvas;const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});if(!gl)throw new Error('WebGL2 desteklenmiyor. Chrome veya Edge ile tekrar deneyin.');this.gl=gl;this.dpr=Math.min(devicePixelRatio||1,1.6);this.program=this.compile(vertex,fragment);this.depthProgram=this.compile(depthV,depthF);this.skyProgram=this.compile(skyV,skyF);this.shadows=true;this.night=0;this.time=0;this.eye=[0,6.0,10];this.target=[0,1.6,-12];this.fov=54;this.geometries={};this.batches={};this.drawCalls=0;this.instances=0;
      const shapes={box:geoBox(),sphere:geoSphere(),cylinder:geoCylinder(),cone:geoCylinder(12,.08),torus:geoTorus(),wedge:geoWedge()};for(const [key,geo] of Object.entries(shapes))this.geometries[key]=this.upload(geo);
      this.depthTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.depthTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,1024,1024,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      this.fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.depthTex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)this.shadows=false;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      this.lightVP=multiply(ortho(-27,27,-39,39,.5,140),lookAt([-27,44,5],[0,0,-22]));this.sun=normalize([-27,44,27]);this.resize();
    }
    compile(vs,fs){const g=this.gl;const shader=(type,text)=>{const s=g.createShader(type);g.shaderSource(s,text);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw new Error(g.getShaderInfoLog(s));return s;};const v=shader(g.VERTEX_SHADER,vs),f=shader(g.FRAGMENT_SHADER,fs),p=g.createProgram();g.attachShader(p,v);g.attachShader(p,f);g.linkProgram(p);g.deleteShader(v);g.deleteShader(f);if(!g.getProgramParameter(p,g.LINK_STATUS))throw new Error(g.getProgramInfoLog(p));return p;}
    upload(geo){const g=this.gl,vao=g.createVertexArray();g.bindVertexArray(vao);const inter=new Float32Array(geo.p.length*2);for(let i=0;i<geo.p.length/3;i++){inter.set(geo.p.slice(i*3,i*3+3),i*6);inter.set(geo.n.slice(i*3,i*3+3),i*6+3);}const v=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,v);g.bufferData(g.ARRAY_BUFFER,inter,g.STATIC_DRAW);g.enableVertexAttribArray(0);g.vertexAttribPointer(0,3,g.FLOAT,false,24,0);g.enableVertexAttribArray(1);g.vertexAttribPointer(1,3,g.FLOAT,false,24,12);const indices=g.createBuffer();g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,indices);g.bufferData(g.ELEMENT_ARRAY_BUFFER,new Uint16Array(geo.idx),g.STATIC_DRAW);const instance=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,instance);const stride=22*4;for(let i=0;i<4;i++){g.enableVertexAttribArray(2+i);g.vertexAttribPointer(2+i,4,g.FLOAT,false,stride,i*16);g.vertexAttribDivisor(2+i,1);}g.enableVertexAttribArray(6);g.vertexAttribPointer(6,4,g.FLOAT,false,stride,64);g.vertexAttribDivisor(6,1);g.enableVertexAttribArray(7);g.vertexAttribPointer(7,2,g.FLOAT,false,stride,80);g.vertexAttribDivisor(7,1);g.bindVertexArray(null);return{vao,instance,count:geo.idx.length,data:new Float32Array(22*8192),n:0};}
    resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.width=w;this.height=h;this.canvas.width=Math.floor(w*this.dpr);this.canvas.height=Math.floor(h*this.dpr);this.aspect=w/h;}
    collect(node,parent=I()){
      if(!node.visible)return;compose(node.p,node.r,node.s,node.local);multiply(parent,node.local,node.world);
      if(node.shape){const g=this.geometries[node.shape];if(g.n>=8192)return;const o=g.n++*22;g.data.set(node.world,o);g.data[o+16]=node.color[0];g.data[o+17]=node.color[1];g.data[o+18]=node.color[2];g.data[o+19]=node.emission;g.data[o+20]=node.metal;g.data[o+21]=node.shadow?1:0;}
      for(let i=0;i<node.children.length;i++)this.collect(node.children[i],node.world);
    }
    render(scene,dt=0){const g=this.gl;this.time+=dt;this.drawCalls=0;this.instances=0;for(const geo of Object.values(this.geometries))geo.n=0;this.collect(scene);
      for(const geo of Object.values(this.geometries)){if(!geo.n)continue;this.instances+=geo.n;g.bindBuffer(g.ARRAY_BUFFER,geo.instance);g.bufferData(g.ARRAY_BUFFER,geo.data.subarray(0,geo.n*22),g.DYNAMIC_DRAW);}
      const draw=()=>{for(const geo of Object.values(this.geometries))if(geo.n){g.bindVertexArray(geo.vao);g.drawElementsInstanced(g.TRIANGLES,geo.count,g.UNSIGNED_SHORT,0,geo.n);this.drawCalls++;}};
      g.enable(g.DEPTH_TEST);g.depthFunc(g.LEQUAL);g.disable(g.BLEND);g.disable(g.CULL_FACE);
      if(this.shadows){g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.viewport(0,0,1024,1024);g.clear(g.DEPTH_BUFFER_BIT);g.useProgram(this.depthProgram);g.uniformMatrix4fv(g.getUniformLocation(this.depthProgram,'uVP'),false,this.lightVP);g.enable(g.POLYGON_OFFSET_FILL);g.polygonOffset(1.5,2.0);draw();g.disable(g.POLYGON_OFFSET_FILL);}
      g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,this.canvas.width,this.canvas.height);g.clearColor(.78,.72,.62,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
      g.disable(g.DEPTH_TEST);g.useProgram(this.skyProgram);g.bindVertexArray(null);g.uniform1f(g.getUniformLocation(this.skyProgram,'uNight'),this.night);g.uniform1f(g.getUniformLocation(this.skyProgram,'uTime'),this.time);g.uniform1f(g.getUniformLocation(this.skyProgram,'uAspect'),this.aspect);g.drawArrays(g.TRIANGLES,0,3);g.enable(g.DEPTH_TEST);
      const vp=multiply(perspective(this.fov*Math.PI/180,this.aspect,.12,220),lookAt(this.eye,this.target));g.useProgram(this.program);const u=n=>g.getUniformLocation(this.program,n);g.uniformMatrix4fv(u('uVP'),false,vp);g.uniformMatrix4fv(u('uLight'),false,this.lightVP);g.uniform3fv(u('uEye'),this.eye);g.uniform3fv(u('uFog'),[.84*(1-this.night)+.18*this.night,.76*(1-this.night)+.25*this.night,.65*(1-this.night)+.34*this.night]);g.uniform3fv(u('uSun'),this.sun);g.uniform1f(u('uNight'),this.night);g.uniform1f(u('uShadows'),this.shadows?1:0);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.depthTex);g.uniform1i(u('uDepth'),0);draw();g.bindVertexArray(null);
    }
    project(position){const vp=multiply(perspective(this.fov*Math.PI/180,this.aspect,.12,220),lookAt(this.eye,this.target)),[x,y,z]=position,w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];return{x:(vp[0]*x+vp[4]*y+vp[8]*z+vp[12])/w*this.width*.5+this.width*.5,y:-(vp[1]*x+vp[5]*y+vp[9]*z+vp[13])/w*this.height*.5+this.height*.5,visible:w>0};}
  }
  return{Renderer,Node,group,mesh,rgb,I,multiply,compose,normalize};
})();
