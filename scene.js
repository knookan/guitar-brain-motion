/* WebGL instrument and SVG controls share the same camera and physical fret geometry. */
(function(root){
  "use strict";
  const T=root.MBS2Theory||(typeof require!=="undefined"?require("./theory.js"):null);
  const G=root.MBS2Guitar||(typeof require!=="undefined"?require("./guitar.js"):null);
  const NS="http://www.w3.org/2000/svg",LENGTH=13.6,HALF=LENGTH/2;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function bounds(range){return {start:range===0?0:range-1,end:range+12};}
  function fretX(fret,range=0){const b=bounds(range),fraction=f=>1-Math.pow(2,-f/12);return -HALF+(fraction(fret)-fraction(b.start))/(fraction(b.end)-fraction(b.start))*LENGTH;}
  function fretCenter(fret,range=0){return fret===0?fretX(0,range)-.4:(fretX(fret-1,range)+fretX(fret,range))/2;}
  function stringY(index,count){return -1.27+index*2.54/(count-1);}
  function multiply(a,b){const out=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)out[col*4+row]=a[row]*b[col*4]+a[4+row]*b[col*4+1]+a[8+row]*b[col*4+2]+a[12+row]*b[col*4+3];return out;}
  function normalize(v){const n=Math.hypot(...v)||1;return v.map(x=>x/n);}
  function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function dot(a,b){return a.reduce((v,x,i)=>v+x*b[i],0);}
  function lookAt(eye,center){const z=normalize(eye.map((v,i)=>v-center[i])),x=normalize(cross([0,0,1],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  function perspective(fov,aspect){const f=1/Math.tan(fov/2),near=.1,far=160,nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function project(point,m,width,height){
    const [x,y,z]=point,w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=0)return null;
    return {x:((m[0]*x+m[4]*y+m[8]*z+m[12])/w+1)*width/2,y:(1-(m[1]*x+m[5]*y+m[9]*z+m[13])/w)*height/2};
  }
  function cameraMatrix(width,height,{yaw=0,elevation=88,zoom=1,mobile=false}={}){
    const aspect=width/Math.max(1,height),fov=34*Math.PI/180,theta=yaw*Math.PI/180,phi=elevation*Math.PI/180;
    let distance=Math.max(7.6/(Math.tan(fov/2)*aspect),2.25/Math.tan(fov/2))*(mobile?.85:1.12),eye,matrix;
    const margin=mobile?.035:.08;
    function atDistance(value){eye=[Math.sin(theta)*value*.52,-Math.cos(theta)*value*Math.cos(phi),value*Math.sin(phi)];matrix=multiply(perspective(fov,aspect),lookAt(eye,[0,0,.06]));if(!mobile)for(const index of [1,5,9,13])matrix[index]+=.12*matrix[index+2];else if(aspect<4)for(const index of [1,5,9,13])matrix[index]*=1.55;}
    for(let attempt=0;attempt<18;attempt++){
      atDistance(distance);
      const corners=[[-7.7,-1.85,.25],[-7.7,1.85,.25],[7.2,-1.85,.25],[7.2,1.85,.25]].map(p=>project(p,matrix,width,height));
      if(corners.every(p=>p&&p.x>width*margin&&p.x<width*(1-margin)&&p.y>height*(mobile?.07:.06)&&p.y<height*(mobile?.91:.90)))break;
      distance*=1.06;
    }
    atDistance(distance/clamp(Number(zoom)||1,.55,2.5));return {matrix,eye};
  }
  function vertex(out,p,n,c,mat){out.push(...p,...n,...c,mat);}
  function box(out,center,size,c,mat){
    const [x,y,z]=center,[sx,sy,sz]=size,x0=x-sx/2,x1=x+sx/2,y0=y-sy/2,y1=y+sy/2,z0=z-sz/2,z1=z+sz/2;
    const faces=[[[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]],[[0,0,-1],[[x0,y1,z0],[x1,y1,z0],[x1,y0,z0],[x0,y0,z0]]],[[0,1,0],[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]]],[[0,-1,0],[[x1,y0,z1],[x0,y0,z1],[x0,y0,z0],[x1,y0,z0]]],[[1,0,0],[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]]],[[-1,0,0],[[x0,y1,z1],[x0,y1,z0],[x0,y0,z0],[x0,y0,z1]]]];
    for(const [normal,points] of faces)for(const i of [0,1,2,0,2,3])vertex(out,points[i],normal,c,mat);
  }
  function cylinder(out,a,b,radius,c,mat,axis="x"){
    for(let i=0;i<12;i++){
      const angles=[i*Math.PI/6,(i+1)*Math.PI/6],normals=angles.map(angle=>axis==="x"?[0,Math.cos(angle),Math.sin(angle)]:[Math.cos(angle),0,Math.sin(angle)]);
      const offset=(p,n)=>p.map((v,j)=>v+n[j]*radius),points=[offset(a,normals[0]),offset(b,normals[0]),offset(b,normals[1]),offset(a,normals[1])];
      for(const ix of [0,1,2,0,2,3])vertex(out,points[ix],normals[ix<2?0:1],c,mat);
    }
  }
  function sphere(out,center,radius,c,mat){
    const point=(a,b)=>[Math.sin(a)*Math.cos(b),Math.sin(a)*Math.sin(b),Math.cos(a)];
    for(let ring=0;ring<6;ring++)for(let slice=0;slice<12;slice++){
      const a0=Math.PI*ring/6,a1=Math.PI*(ring+1)/6,b0=Math.PI*slice/6,b1=Math.PI*(slice+1)/6;
      const pts=[point(a0,b0),point(a1,b0),point(a1,b1),point(a0,b1)];
      for(const ix of [0,1,2,0,2,3])vertex(out,center.map((v,j)=>v+pts[ix][j]*radius),pts[ix],c,mat);
    }
  }
  function geometry(count,range=0,capo=0){
    const data=[],b=bounds(range),wood=[.062,.053,.078],edge=[.026,.023,.036],metal=[.62,.60,.64],binding=[.35,.31,.39];
    box(data,[0,0,-.18],[LENGTH+.2,3.42,.36],edge,1);
    box(data,[0,0,.015],[LENGTH,3.28,.13],wood,0);
    for(const y of [-1.62,1.62])box(data,[0,y,.06],[LENGTH,.035,.06],binding,1);
    for(let f=b.start;f<=b.end;f++){
      const x=fretX(f,range);if(f===0)box(data,[x,0,.12],[.12,3.23,.16],[.72,.72,.65],2);
      else cylinder(data,[x,-1.59,.09],[x,1.59,.09],.037,metal,1,"y");
    }
    for(const fret of [3,5,7,9,12,15,17,19,21,24])if(fret>=Math.max(range,1)&&fret<=b.end){
      for(const y of fret===12||fret===24?[-.57,.57]:[0])sphere(data,[fretCenter(fret,range),y,.06],.095,[.52,.55,.58],2);
    }
    for(let string=0;string<count;string++){
      const y=stringY(string,count),radius=.007+(count-1-string)/(count-1)*.018;
      cylinder(data,[-HALF-.11,y,.21],[HALF+.11,y,.21],radius,string<3?[.66,.68,.65]:[.57,.62,.67],3);
    }
    if(capo>0&&capo>=range&&capo<=range+12)box(data,[fretX(capo,range)-.07,0,.26],[.13,3.37,.2],[.12,.14,.18],1);
    return new Float32Array(data);
  }
  function renderer(canvas){
    const gl=canvas?.getContext("webgl",{alpha:true,antialias:true,powerPreference:"high-performance"});if(!gl)return null;
    const vs="attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aMaterial;uniform mat4 uMatrix;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;varying float vMaterial;void main(){vPosition=aPosition;vNormal=aNormal;vColor=aColor;vMaterial=aMaterial;gl_Position=uMatrix*vec4(aPosition,1.0);}";
    const fs="precision mediump float;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;varying float vMaterial;uniform vec3 uEye;void main(){vec3 N=normalize(vNormal);vec3 V=normalize(uEye-vPosition);vec3 L=normalize(vec3(-.25,-.42,.86));vec3 R=normalize(vec3(.55,.58,.43));float diffuse=max(dot(N,L),0.0);float rim=max(dot(N,R),0.0);float gloss=step(.5,vMaterial);float spec=pow(max(dot(N,normalize(L+V)),0.0),mix(20.0,96.0,gloss));float grain=sin(vPosition.y*62.0+sin(vPosition.x*.9)*1.2)*.032+sin(vPosition.y*125.0+vPosition.x*.4)*.016;vec3 base=vColor;if(vMaterial<.5)base*=.97+grain;vec3 color=base*(.38+diffuse*.76)+vec3(.59,.73,.87)*spec*mix(.08,.52,gloss)+vec3(.13,.15,.24)*rim*.28;gl_FragColor=vec4(color,1.0);}";
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const buffer=gl.createBuffer(),matrix=gl.getUniformLocation(program,"uMatrix"),eye=gl.getUniformLocation(program,"uEye");let vertices=0;
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(const [name,size,offset] of [["aPosition",3,0],["aNormal",3,3],["aColor",3,6],["aMaterial",1,9]]){
      const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,40,offset*4);
    }
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
    return {upload(data){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);vertices=data.length/10;},
      draw(camera,width,height){const dpr=Math.min(2,root.devicePixelRatio||1),w=Math.round(width*dpr),h=Math.round(height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(matrix,false,camera.matrix);gl.uniform3fv(eye,camera.eye);gl.drawArrays(gl.TRIANGLES,0,vertices);}
    };
  }
  function create(svg,onPick,{canvas=null,stage=svg.parentElement,initialCamera={},onCameraChange=()=>{}}={}){
    let currentState=null,range=0,meshKey="",hitKey="",gpu=null,frame=0,tween=null,started=false,pointer=null,suppressClick=false;
    const presets={top:{yaw:0,elevation:88},perspective:{yaw:-8,elevation:56},close:{yaw:-6,elevation:62}};
    let preset=presets[initialCamera.preset]?initialCamera.preset:'top',camera={...presets[preset],zoom:clamp(Number(initialCamera.zoom)||1,.55,2.5)},width=1000,height=540,projection=null;
    const hits=[],groups={};
    let playback=null,playingPositions=[],playingToken=null,layoutDirty=true;
    const reduced=()=>{const preference=root.document?.documentElement?.getAttribute('data-motion-preference');return preference==='full'?false:preference==='reduced'?true:root.matchMedia?.("(prefers-reduced-motion: reduce)").matches||false;};
    const mobile=()=>root.matchMedia?.("(max-width: 940px), (pointer: coarse)").matches||false;
    const effectiveCamera=()=>mobile()?{yaw:0,elevation:88,zoom:1,preset:'top',mobile:true}:{...camera,preset};
    function el(name,attrs={}){const node=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node;}
    function line(parent,a,b,className,extra={}){if(a&&b)parent.append(el("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className,...extra}));}
    function text(parent,p,label,className){if(!p)return;const node=el("text",{x:p.x,y:p.y,class:className});node.textContent=label;parent.append(node);}
    svg.replaceChildren();
    const defs=el("defs"),board=el("linearGradient",{id:"boardGradient",x1:0,y1:0,x2:1,y2:1}),edge=el("linearGradient",{id:"edgeGradient",x1:0,y1:0,x2:0,y2:1});
    board.append(el("stop",{offset:"0%","stop-color":"#222b38"}),el("stop",{offset:"55%","stop-color":"#151e2b"}),el("stop",{offset:"100%","stop-color":"#1c2533"}));
    edge.append(el("stop",{offset:"0%","stop-color":"#161f2e"}),el("stop",{offset:"100%","stop-color":"#070b13"}));defs.append(board,edge);svg.append(defs);
    const arrow=el('marker',{id:'motionArrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:5,markerHeight:5,orient:'auto-start-reverse'});arrow.append(el('path',{d:'M 0 1 L 9 5 L 0 9',fill:'none',stroke:'#e6dcf0','stroke-width':1.8}));defs.append(arrow);
    for(const name of ["fallback-layer","label-layer","motion-layer","hit-layer","playback-layer"]){groups[name]=el("g",{class:name});svg.append(groups[name]);}
    try{gpu=renderer(canvas);}catch(error){console.warn("3D görünüm yerine vektör klavye kullanılıyor:",error.message);}
    svg.classList.toggle("webgl-overlay",Boolean(gpu));
    const toScreen=p=>project(p,projection,width,height);
    function polygon(parent,points,className){const coords=points.map(toScreen);if(coords.some(p=>!p))return;parent.append(el("polygon",{points:coords.map(p=>p.x+","+p.y).join(" "),class:className}));}
    function fallback(){
      const base=groups["fallback-layer"];base.replaceChildren();
      polygon(base,[[-HALF,-1.64,.08],[HALF,-1.64,.08],[HALF,-1.64,-.35],[-HALF,-1.64,-.35]],"board-edge");
      polygon(base,[[HALF,-1.64,.08],[HALF,1.64,.08],[HALF,1.64,-.35],[HALF,-1.64,-.35]],"board-edge");
      polygon(base,[[-HALF,-1.64,.08],[HALF,-1.64,.08],[HALF,1.64,.08],[-HALF,1.64,.08]],"board-face");
      for(const y of [-1.62,1.62])line(base,toScreen([-HALF,y,.09]),toScreen([HALF,y,.09]),"board-binding");
      const b=bounds(range);
      for(let f=b.start;f<=b.end;f++){
        const x=fretX(f,range),a=toScreen([x,-1.59,.13]),z=toScreen([x,1.59,.13]);
        line(base,a,z,"fret-wire"+(f===0?" nut":""));if(f!==0)line(base,{x:a.x-.6,y:a.y-.6},{x:z.x-.6,y:z.y-.6},"fret-highlight");
      }
      for(const f of [3,5,7,9,12,15,17,19,21,24])if(f>=Math.max(range,1)&&f<=b.end)for(const y of f===12||f===24?[-.57,.57]:[0]){
        const p=toScreen([fretCenter(f,range),y,.09]),p2=toScreen([fretCenter(f,range)+.1,y,.09]),r=clamp(Math.abs(p2.x-p.x),2,6);
        base.append(el("ellipse",{cx:p.x,cy:p.y,rx:r,ry:r*.7,class:"inlay"}));
      }
      const count=currentState.tuning.notes.length;
      for(let s=0;s<count;s++){
        const y=stringY(s,count);line(base,toScreen([-HALF,y,.09]),toScreen([HALF,y,.09]),"string-shadow");
        line(base,toScreen([-HALF,y,.21]),toScreen([HALF,y,.21]),"string-wire",{"stroke-width":1.15+(count-1-s)/(count-1)*1.1});
      }
      if(currentState.capo>0&&currentState.capo>=range&&currentState.capo<=range+12){
        const x=fretX(currentState.capo,range);line(base,toScreen([x,-1.67,.28]),toScreen([x,1.67,.28]),"capo-line");
      }
    }
    function labels(){
      const host=groups["label-layer"];host.replaceChildren();
      for(let f=Math.max(range,1);f<=range+12;f++){const p=toScreen([fretCenter(f,range),-1.94,.03]);text(host,p,String(f),"fret-number");}
      const count=currentState.tuning.notes.length;
      for(let s=0;s<count;s++){const p=toScreen([-HALF-.9,stringY(s,count),.21]);text(host,p,currentState.tuning.notes[s].replace(/-?\d+$/,""),"string-name");}
    }
    function rebuildHits(){
      const key=[range,currentState.tuning.notes.length,currentState.capo].join(":");if(key===hitKey)return;hitKey=key;
      const host=groups["hit-layer"];host.replaceChildren();hits.length=0;
      const count=currentState.tuning.notes.length,first=Math.max(range,1),frets=[];
      if(range===0&&currentState.capo===0)frets.push(0);
      for(let f=first;f<=range+12;f++)if(f>=currentState.capo)frets.push(f);
      for(let row=0;row<count;row++)for(const fret of frets){
        const stringIndex=count-1-row,g=el("g",{class:"hit-cell",role:"button",tabindex:hits.length===0?0:-1,"data-string":stringIndex,"data-row":row,"data-fret":fret});
        const area=el("polygon",{class:"hit-area"}),halo=el("circle",{class:"marker-halo"}),marker=el("circle",{class:"marker"}),ring=el("circle",{class:"marker-ring"}),label=el("text",{class:"marker-text"}),title=el("title");
        const degree=el('text',{class:'living-degree'});g.append(area,halo,marker,ring,label,title,degree);host.append(g);hits.push({g,area,halo,marker,ring,label,title,degree,stringIndex,row,fret});
      }
    }
    function positionHits(){
      const state=currentState,count=state.tuning.notes.length,selected=new Set(state.selectedPositions.map(p=>p.stringIndex+":"+p.fret));
      const voice=new Set((state.activeVoicing?.frets||[]).map((f,s)=>f<0?null:s+":"+f).filter(Boolean));
      const chord=state.activeChord,scale=state.activeScale,scalePcs=scale?.pcs||[],chordPcs=chord?.pitchClasses||[];
      for(const hit of hits){
        const {stringIndex:s,fret:f}=hit,y=stringY(s,count),x=fretCenter(f,range),p=toScreen([x,y,.24]);
        const halfLane=2.54/(count-1)*.47,left=f===0?-HALF-.73:fretX(f-1,range),right=f===0?-HALF-.1:fretX(f,range);
        const tile=[[left,y-halfLane,.24],[right,y-halfLane,.24],[right,y+halfLane,.24],[left,y+halfLane,.24]].map(toScreen);
        hit.area.setAttribute("points",tile.map(v=>v.x+","+v.y).join(" "));
        const note=G.noteOnPosition(state.tuning,s,f,state.capo),key=s+":"+f;if(!note)continue;
        const pc=note.pitchClass,isSelected=selected.has(key),isVoice=voice.has(key),tone=chord?.notes.find(n=>n.pc===pc);
        let role="",label="",light=false;
        if(isSelected){role="selected";label=note.name;}
        else if(isVoice){role=pc===chord?.rootPc?"root":"chord";label=tone?.name||note.name;}
        else if(state.sceneToneView&&chordPcs.includes(pc)){role=pc===chord.rootPc?"root":"chord";label=tone?.name||note.name;}
        else if(scalePcs.includes(pc)){role=pc===scale?.rootPc?"root":"scale";label=state.diagramLabels==="degrees"?scale.degreeLabels?.[scalePcs.indexOf(pc)]||"":scale.spellings?.[scalePcs.indexOf(pc)]||note.name;light=role==="scale";}
        else if(state.comparisonPcs?.includes(pc)){role="comparison";label=note.name;light=true;}
        if(chord&&root.GBMotionEngine){
          const r=root.GBMotionEngine.roleFor(pc,chord,state.motion?.contextPcs||scalePcs);
          if(isVoice||chordPcs.includes(pc)||r.contextual){role='role-'+r.kind;label=r.note;light=!isVoice;hit.g.style.setProperty('--note-role',r.color);}
          else {role='';label='';}
          hit.g.classList.toggle('context-note',!isVoice);hit.g.classList.toggle('voiced-note',isVoice);
          hit.g.setAttribute('data-tone-role',r.kind);hit.g.setAttribute('data-degree',r.label);
        }else{hit.g.classList.remove('context-note','voiced-note');hit.g.style.removeProperty?.('--note-role');hit.g.removeAttribute?.('data-tone-role');hit.g.removeAttribute?.('data-degree');}
        if(state.positionWindow&&(f<state.positionWindow[0]||f>state.positionWindow[1])&&!isSelected&&!isVoice){role="";label="";}
        hit.g.classList.toggle('shared-tone',!!state.comparisonPcs?.includes(pc)&&scalePcs.includes(pc));
        hit.g.setAttribute("aria-pressed",String(isSelected||isVoice));
        const description=note.name+(Math.floor(note.midi/12)-1)+" · "+(s+1)+". tel · "+(f===state.capo?"açık":f+". perde");
        const localized=root.MBS2I18n?.t(description)||description;hit.g.setAttribute("aria-label",localized);hit.title.textContent=localized;
        const lane=toScreen([x,y+2.54/(count-1),.24]),a=toScreen([left,y,.24]),b=toScreen([right,y,.24]);
        const laneSize=Math.hypot(lane.x-p.x,lane.y-p.y),cellSize=Math.hypot(b.x-a.x,b.y-a.y);
        const radius=Math.max(3.5,Math.min(14,laneSize*.38,cellSize*.32));
        for(const node of [hit.halo,hit.marker,hit.ring]){node.setAttribute("cx",p.x);node.setAttribute("cy",p.y);node.style.display=role?"":"none";}
        hit.halo.setAttribute("r",radius+5);hit.halo.setAttribute("class","marker-halo "+role);
        hit.marker.setAttribute("r",radius);hit.marker.setAttribute("class","marker "+role);hit.ring.setAttribute("r",radius-2);
        hit.label.setAttribute("x",p.x);hit.label.setAttribute("y",p.y);hit.label.setAttribute("class","marker-text"+(light?" light":""));hit.label.textContent=label;hit.label.style.fontSize=radius<10?"9px":"11px";hit.label.style.display=role&&radius>=6.5?"":"none";
        const living=!!chord&&!!root.GBMotionEngine&&isVoice&&radius>=10;
        hit.degree.textContent=living?root.GBMotionEngine.roleFor(pc,chord).label:'';hit.degree.setAttribute('x',p.x);hit.degree.setAttribute('y',p.y+6);hit.degree.style.display=living?'':'none';if(living){hit.label.setAttribute('y',p.y-3);hit.label.style.fontSize='10px';}
      }
      if(chord&&state.activeVoicing)for(let s=0;s<count;s++)if(state.activeVoicing.frets[s]<0)text(groups["label-layer"],toScreen([-HALF-.42,stringY(s,count),.24]),"×","mute-indicator");
    }
    function playbackOverlay(){
      const host=groups['playback-layer'];host.replaceChildren();if(!playback)return false;
      const snapshot=playback();if(snapshot.token!==playingToken){playback=null;return false;}
      const count=currentState.tuning.notes.length,now=snapshot.time;
      for(const event of snapshot.events){
        if(now<event.start||now>=event.end)continue;
        const position=event.position||playingPositions.find(p=>Math.abs(p.midi-event.midi)<.001);if(!position||position.fret<range||position.fret>range+12)continue;
        const s=position.stringIndex,y=stringY(s,count),age=now-event.start,strength=Math.max(.18,1-age/(event.end-event.start)),p=toScreen([fretCenter(position.fret,range),y,.29]);if(!p)continue;
        const approximate=Math.abs(position.offsetCents||0)>.01;
        const radius=clamp(width/65,5,14),group=el('g',{class:'playing-note'+(approximate?' microtonal-note':''),opacity:strength,'data-playing-midi':event.midi,'data-string':s,'data-fret':position.fret,'data-offset-cents':position.offsetCents||0});
        const offset=reduced()?0:Math.sin(age*90)*Math.exp(-age*9)*.018;
        line(group,toScreen([-HALF,y+offset,.24]),toScreen([HALF,y+offset,.24]),'playing-string');
        group.append(el('circle',{cx:p.x,cy:p.y,r:radius+5,class:'playing-halo'}),el('circle',{cx:p.x,cy:p.y,r:radius,class:'playing-marker'}));
        text(group,{x:p.x,y:p.y+3},T.noteName(Math.round(event.midi)),'playing-label');if(approximate){const title=el('title');title.textContent=(root.MBS2I18n?.getLocale()==='tr'?'Yaklaşık gitar konumu · ':'Approximate guitar position · ')+(position.offsetCents>0?'+':'')+position.offsetCents.toFixed(1)+' ¢';group.append(title);}host.append(group);
      }
      const running=snapshot.events.some(e=>e.end>now);if(!running)playback=null;return running;
    }
    function setPlayback(clock,positions){playback=clock;playingPositions=positions;playingToken=clock().token;request();}
    function motionOverlay(){
      const host=groups['motion-layer'];host.replaceChildren();const motion=currentState.motion,edge=motion?.edge;if(!motion?.enabled||!edge)return;
      const count=currentState.tuning.notes.length;
      const snapshot=root.MBS2Audio?.getPlayback();
      const nextStart=snapshot?.events.find(e=>e.stepIndex===motion.step+1)?.stepStart;
      const progress=motion.lastStep?1:nextStart?clamp((snapshot.time-nextStart+.6)/.6,0,1):0;
      for(const pair of edge.pairs){
        const a=pair.from,b=pair.to;if(a.fret<range||a.fret>range+12||b.fret<range||b.fret>range+12)continue;
        const from=toScreen([fretCenter(a.fret,range),stringY(a.stringIndex,count),.29]),to=toScreen([fretCenter(b.fret,range),stringY(b.stringIndex,count),.29]);if(!from||!to)continue;
        const color=pair.common?'#7ce8c8':b.role.color;
        if(pair.physicalHold){host.append(el('circle',{cx:from.x,cy:from.y,r:21,class:'held-orbit',stroke:color}));continue;}
        const lift=clamp(Math.hypot(to.x-from.x,to.y-from.y)*.24,20,72),path=el('path',{d:'M '+from.x+' '+from.y+' Q '+((from.x+to.x)/2)+' '+(Math.min(from.y,to.y)-lift)+' '+to.x+' '+to.y,class:'voice-trail'+(pair.common?' common-trail':''),stroke:color,'marker-end':'url(#motionArrow)','data-from-midi':a.midi,'data-to-midi':b.midi});host.append(path);
        host.append(el('circle',{cx:to.x,cy:to.y,r:6,class:'destination-ring',stroke:color}));
        if(motion.playing&&!reduced()){const p=path.getPointAtLength(path.getTotalLength()*progress);host.append(el('circle',{cx:p.x,cy:p.y,r:4,class:'voice-particle',fill:color}));}
      }
    }
    function render(now){
      frame=0;if(!currentState)return;
      const rect=stage.getBoundingClientRect(),nextWidth=Math.max(1,rect.width||1000),nextHeight=Math.max(1,rect.height||540),redraw=layoutDirty||!!tween||width!==nextWidth||height!==nextHeight;
      width=nextWidth;height=nextHeight;layoutDirty=false;svg.setAttribute("viewBox","0 0 "+width+" "+height);
      if(tween){
        const progress=clamp((now-tween.time)/tween.duration,0,1),ease=1-Math.pow(1-progress,3);
        for(const key of ["yaw","elevation","zoom"])camera[key]=tween.from[key]+(tween.to[key]-tween.from[key])*ease;
        if(progress>=1)tween=null;
      }
      const view=cameraMatrix(width,height,effectiveCamera());projection=view.matrix;
      if(redraw){
        if(gpu)try{gpu.draw(view,width,height);}catch(error){gpu=null;svg.classList.remove("webgl-overlay");console.warn("3D çizimi durdu; vektör görünümü etkin.",error.message);}
        fallback();labels();positionHits();
      }
      motionOverlay();const sounding=playbackOverlay();
      if(tween||sounding)frame=root.requestAnimationFrame(render);
    }
    function request(){layoutDirty=true;if(!frame)frame=root.requestAnimationFrame(render);}
    function stopTween(){tween=null;if(frame)root.cancelAnimationFrame(frame);frame=0;}
    function setCamera(choice){
      if(mobile())return;
      preset=choice==='reset'?'top':presets[choice]?choice:'top';
      const target={...presets[preset],zoom:choice==='reset'?1:choice==='close'?1.35:camera.zoom};
      stopTween();if(reduced()){camera=target;request();}else{tween={from:{...camera},to:target,time:root.performance.now(),duration:480};request();}
      onCameraChange({...target,preset});
    }
    function setZoom(value){if(mobile())return;stopTween();camera.zoom=clamp(Number(value)||1,.55,2.5);onCameraChange({...camera,preset});request();}
    function zoomBy(factor){setZoom(camera.zoom*factor);}
    function update(state){
      currentState=state;range=Number(state.sceneRange)||0;
      const key=[range,state.tuning.notes.length,state.capo].join(":");if(key!==meshKey){meshKey=key;if(gpu)gpu.upload(geometry(state.tuning.notes.length,range,state.capo));}
      rebuildHits();
      if(!started){started=true;if(!reduced()&&!mobile()){const target={...camera};camera={...camera,elevation:Math.max(46,camera.elevation-25),zoom:Math.max(.55,camera.zoom*.8)};tween={from:{...camera},to:target,time:root.performance.now(),duration:1600};}}
      request();
    }
    svg.addEventListener("click",event=>{
      if(suppressClick){event.preventDefault();suppressClick=false;return;}
      const target=event.target.closest?.("[data-string][data-fret]");if(target)onPick(Number(target.dataset.string),Number(target.dataset.fret));
    });
    svg.addEventListener('pointerover',event=>{if(!currentState?.activeChord)return;const target=event.target.closest?.('.hit-cell');if(target)root.GBMotionWorkspace?.inspectPosition(Number(target.dataset.string),Number(target.dataset.fret));});
    svg.addEventListener('focusin',event=>{if(!currentState?.activeChord)return;const target=event.target.closest?.('.hit-cell');if(target)root.GBMotionWorkspace?.inspectPosition(Number(target.dataset.string),Number(target.dataset.fret));});
    svg.addEventListener("keydown",event=>{
      const target=event.target.closest?.("[data-string][data-fret]");if(!target||!currentState)return;
      if(event.key==="Enter"||event.key===" "){event.preventDefault();onPick(Number(target.dataset.string),Number(target.dataset.fret));return;}
      if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();
      const row=Number(target.dataset.row),fret=Number(target.dataset.fret),first=range===0?currentState.capo:Math.max(range,currentState.capo);
      const nextRow=clamp(row+(event.key==="ArrowDown"?1:event.key==="ArrowUp"?-1:0),0,currentState.tuning.notes.length-1);
      const nextFret=clamp(fret+(event.key==="ArrowRight"?1:event.key==="ArrowLeft"?-1:0),first,range+12);
      const next=svg.querySelector('[data-row="'+nextRow+'"][data-fret="'+nextFret+'"]');
      if(next){hits.forEach(h=>h.g.setAttribute("tabindex","-1"));next.setAttribute("tabindex","0");next.focus();}
    });
    stage.addEventListener("pointerdown",event=>{
      if(mobile()||!event.isPrimary||event.target.closest?.("button,input"))return;stopTween();pointer={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,drag:false};
    });
    root.addEventListener("pointermove",event=>{
      if(mobile()){pointer=null;suppressClick=false;return;}if(!pointer||event.pointerId!==pointer.id)return;
      if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>8)pointer.drag=true;
      if(pointer.drag){event.preventDefault();suppressClick=true;camera.yaw=clamp(camera.yaw+(event.clientX-pointer.lastX)*.22,-28,28);camera.elevation=clamp(camera.elevation-(event.clientY-pointer.lastY)*.18,32,88);request();}
      pointer.lastX=event.clientX;pointer.lastY=event.clientY;
    },{passive:false});
    const finish=event=>{if(!pointer||event.pointerId!==pointer.id)return;if(pointer.drag)setTimeout(()=>{suppressClick=false;},220);pointer=null;request();};
    root.addEventListener("pointerup",finish);root.addEventListener("pointercancel",finish);
    stage.addEventListener('wheel',event=>{if(mobile()||event.target.closest?.('input,button'))return;event.preventDefault();zoomBy(Math.exp(-clamp(event.deltaY,-150,150)*.0015));},{passive:false});
    stage.addEventListener("dblclick",event=>{if(!event.target.closest?.("button")&&!event.target.closest?.("[data-string]"))setCamera("reset");});
    if(root.ResizeObserver)new root.ResizeObserver(request).observe(stage);else root.addEventListener("resize",request);
    root.matchMedia?.("(max-width: 940px), (pointer: coarse)").addEventListener?.('change',()=>{pointer=null;suppressClick=false;request();});
    canvas?.addEventListener("webglcontextlost",event=>{event.preventDefault();gpu=null;svg.classList.remove("webgl-overlay");request();});
    canvas?.addEventListener("webglcontextrestored",()=>{try{gpu=renderer(canvas);meshKey="";svg.classList.toggle("webgl-overlay",Boolean(gpu));if(currentState)update(currentState);}catch(_){gpu=null;request();}});
    return Object.freeze({update,setPlayback,setCamera,setZoom,zoomBy,getCamera:effectiveCamera,element:svg,is3D:()=>Boolean(gpu)});
  }
  const API=Object.freeze({create,fretX,fretCenter,stringY,bounds,project,cameraMatrix,geometry});root.MBS2Scene=API;
  if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
