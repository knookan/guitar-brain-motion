/* Node unit fixtures exercise the actual SVG event handlers without a browser. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const T=require("../theory.js"),G=require("../guitar.js"),source=fs.readFileSync(path.join(__dirname,"../scene.js"),"utf8");
const checks=[];function check(name,fn){fn();checks.push(name);}
class NodeFixture{
  constructor(name){this.name=name;this.attributes={};this.dataset={};this.style={};this.children=[];this.events={};this.textContent="";
    this.classList={toggle:(value,enabled)=>{const list=new Set((this.attributes.class||"").split(" ").filter(Boolean));if(enabled)list.add(value);else list.delete(value);this.attributes.class=[...list].join(" ");},remove:value=>this.classList.toggle(value,false)};
  }
  setAttribute(key,value){this.attributes[key]=String(value);if(key.startsWith("data-"))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value);}
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  addEventListener(key,listener){(this.events[key]||=[]).push(listener);}
  emit(key,event){event.preventDefault||=()=>{};(this.events[key]||[]).forEach(listener=>listener(event));}
  matches(selector){if(selector==="button")return this.name==="button";const attrs=[...selector.matchAll(/\[([^=\]]+)(?:="([^"]+)")?\]/g)];return attrs.length>0&&attrs.every(([,key,value])=>this.attributes[key]!==undefined&&(value===undefined||this.attributes[key]===value));}
  closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
  querySelector(selector){for(const child of this.children){if(child.matches(selector))return child;const found=child.querySelector(selector);if(found)return found;}return null;}
  focus(){this.focused=true;}
  getBoundingClientRect(){return {width:900,height:480};}
}
function fixture(mobile=false){
  const svg=new NodeFixture("svg"),stage=new NodeFixture("div"),canvas=new NodeFixture("canvas"),picked=[],frames=new Map();let nextFrame=1;
  stage.append(svg,canvas);canvas.getContext=()=>null;
  const root=new NodeFixture("window");Object.assign(root,{MBS2Theory:T,MBS2Guitar:G,matchMedia:query=>({matches:query.includes('prefers-reduced')||mobile}),performance:{now:()=>0},requestAnimationFrame:fn=>{const id=nextFrame++;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)});
  const context={window:root,document:{createElementNS:(_,name)=>new NodeFixture(name)},console,setTimeout,clearTimeout};
  vm.createContext(context);vm.runInContext(source,context);
  const scene=root.MBS2Scene.create(svg,(string,fret)=>picked.push([string,fret]),{canvas,stage});
  const state={tuning:G.TUNINGS[0],capo:0,sceneRange:0,selectedPositions:[],activeChord:null,activeVoicing:null,activeScale:null,sceneToneView:false,diagramLabels:"notes"};
  function flush(){const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn(100));}
  return {svg,stage,scene,state,picked,flush,root};
}
check("Sahne modülü WebGL olmadan boş bırakmaz; vektör yedeği ve 78 perde/tel hedefi kurar",()=>{
  const f=fixture();f.scene.update(f.state);f.flush();assert.equal(f.scene.is3D(),false);
  const hitLayer=f.svg.children.find(n=>n.attributes.class==="hit-layer"),fallback=f.svg.children.find(n=>n.attributes.class==="fallback-layer");
  assert.equal(hitLayer.children.length,78);assert(fallback.children.length>30);
});
check("Gerçek tıklama ve Enter handler'ları aynı fiziksel tel/perdeyi seçer",()=>{
  const f=fixture();f.scene.update(f.state);f.flush();
  const cell=f.svg.querySelector('[data-string="1"][data-fret="3"]');
  f.svg.emit("click",{target:cell.children[0]});f.svg.emit("keydown",{target:cell,key:"Enter"});
  assert.deepEqual(f.picked,[[1,3],[1,3]]);
  f.svg.emit("keydown",{target:cell,key:"ArrowRight"});assert.equal(f.svg.querySelector('[data-string="1"][data-fret="4"]').focused,true);
});
check("Kamera değişimi hit hücrelerini yeniden hizalar, seçili nota hedefi aynı kalır",()=>{
  const f=fixture();f.state.selectedPositions=[{stringIndex:1,fret:3}];f.scene.update(f.state);f.scene.setCamera('perspective');f.flush();
  const cell=f.svg.querySelector('[data-string="1"][data-fret="3"]'),points=cell.children[0].attributes.points;
  assert.equal(cell.children[4].textContent,"C");f.scene.setCamera("top");f.flush();
  assert.notEqual(cell.children[0].attributes.points,points);assert.equal(cell.children[4].textContent,"C");
  f.svg.emit("click",{target:cell.children[0]});assert.deepEqual(f.picked,[[1,3]]);
});
check("12–24 perde modunun ilk ve son hedefleri 12 ile 24'tür; capo altı hedef oluşturulmaz",()=>{
  const f=fixture();f.state.sceneRange=12;f.scene.update(f.state);f.flush();
  assert(f.svg.querySelector('[data-string="0"][data-fret="12"]'));assert(f.svg.querySelector('[data-string="5"][data-fret="24"]'));assert.equal(f.svg.querySelector('[data-fret="11"]'),null);
  f.state.sceneRange=0;f.state.capo=2;f.scene.update(f.state);f.flush();assert.equal(f.svg.querySelector('[data-fret="1"]'),null);assert(f.svg.querySelector('[data-fret="2"]'));
});
check('Klavye üstten açılır; yakınlaştırma kadraj tarafından geri alınmaz ve tıklama hedefini korur',()=>{
  const f=fixture();f.scene.update(f.state);f.flush();assert.equal(f.scene.getCamera().preset,'top');assert.equal(f.scene.getCamera().elevation,88);
  const cell=f.svg.querySelector('[data-string="1"][data-fret="3"]'),before=cell.children[0].attributes.points;
  f.scene.setZoom(1.6);f.flush();assert.equal(f.scene.getCamera().zoom,1.6);assert.notEqual(cell.children[0].attributes.points,before);f.svg.emit('click',{target:cell.children[0]});assert.deepEqual(f.picked,[[1,3]]);
  f.scene.setZoom(99);assert.equal(f.scene.getCamera().zoom,2.5);f.scene.setZoom(.01);assert.equal(f.scene.getCamera().zoom,.55);f.scene.setCamera('reset');assert.equal(f.scene.getCamera().preset,'top');assert.equal(f.scene.getCamera().zoom,1);
});
check('Fare tekerleği gerçek zoom olayını çalıştırır ve sahne üstünde sayfa kaymasını engeller',()=>{
  const f=fixture();f.scene.update(f.state);f.flush();let prevented=false;f.stage.emit('wheel',{target:f.svg,deltaY:-100,preventDefault(){prevented=true;}});assert(prevented);assert(f.scene.getCamera().zoom>1);
});
module.exports=checks;
module.exports.fixture=fixture;
