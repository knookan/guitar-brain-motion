/* Layout controller behaviour in a minimal Node DOM fixture; not browser QA. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const checks=[];function check(name,fn){fn();checks.push(name);}
const KEY='guitar-brain-motion-layout-v1';

class Stub{
  constructor(attributes={}){this.attributes={...attributes};this.dataset={};this.style={setProperty:(k,v)=>{this.style[k]=v;}};this.hidden=false;this.disabled=false;this.title='';this.textContent='';this.listeners={};this.classes=new Set();this.path={setAttribute(){}};
    for(const [key,value] of Object.entries(attributes))if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
    this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c),toggle(){}};
  }
  setAttribute(key,value){this.attributes[key]=String(value);}
  getAttribute(key){return this.attributes[key];}
  addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
  emit(type,event={}){for(const fn of this.listeners[type]||[])fn({preventDefault(){},isPrimary:true,button:0,pointerId:1,...event});}
  click(){this.emit('click');}
  querySelector(selector){return selector==='path'?this.path:selector==='.layout-focus'?this.focusGroup:null;}
  focus(){}
  setPointerCapture(){}
  releasePointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0,width:this.viewport.width,height:this.viewport.height};}
}

function fixture({width=390,height=800,saved=null,lang='en'}={}){
  const storage=new Map(saved===null?[]:[[KEY,saved]]);
  const frames=[];
  const ids=['appShell','workspaceDivider','layoutControls','studioNavigation','studioToolbar','layoutArrangement','layoutReset','toggleFretboard','modeNav'];
  const byId=Object.fromEntries(ids.map(id=>[id,new Stub({id})]));
  const bench=new Stub({class:'workbench'});bench.viewport={width,height};
  byId.appShell.querySelector=selector=>selector==='.workbench'?bench:null;
  byId.layoutControls.focusGroup=new Stub();
  byId.layoutControls.querySelectorAll=selector=>selector==='[data-layout-focus]'?buttons:[];
  const buttons=['balanced','guitar','workspace'].map(id=>new Stub({'data-layout-focus':id}));
  byId.studioNavigation.append=()=>{};byId.studioToolbar.insertBefore=()=>{};
  const context={
    document:{readyState:'complete',documentElement:{lang},getElementById:id=>byId[id]||null,querySelector:()=>null,addEventListener(){}},
    localStorage:{getItem:key=>storage.has(key)?storage.get(key):null,setItem:(key,value)=>storage.set(key,value)},
    requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},
    getComputedStyle:()=>({paddingLeft:'0px',paddingRight:'0px',paddingTop:'0px',paddingBottom:'0px'}),
    addEventListener(){},
    console,
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('workspace-layout.js','utf8'),context);
  const flush=()=>{while(frames.length)frames.splice(0).forEach(fn=>fn());};
  return {bench,byId,buttons,storage,flush,
    divider:byId.workspaceDivider,reset:byId.layoutReset,arrangement:byId.layoutArrangement,
    saved:()=>JSON.parse(storage.get(KEY)||'null'),
    key:(name,options={})=>{byId.workspaceDivider.emit('keydown',{key:name,shiftKey:false,...options});flush();},
    layout:()=>({size:bench.style['--guitar-size'],value:byId.workspaceDivider.attributes['aria-valuenow'],arrangement:byId.appShell.dataset.layout,orientation:byId.workspaceDivider.attributes['aria-orientation']}),
  };
}

check('Boş depolamada yığın yerleşimi ve dengeli oran ilk açılışta uygulanır',()=>{
  const f=fixture();f.flush();
  assert.deepEqual(f.layout(),{size:'267.9px',value:'34',arrangement:'stack',orientation:'horizontal'});
  assert.equal(f.byId.appShell.dataset.layoutFocus,'balanced');
  assert.equal(f.buttons[0].attributes['aria-pressed'],'true');
});

check('Bozuk kayıt hata vermez ve varsayılanlara döner',()=>{
  const f=fixture({saved:'{not json'});f.flush();
  assert.equal(f.layout().size,'267.9px');
  assert.equal(f.layout().value,'34');
});

check('Aşırı kayıtlı oranlar kıstırılır; sahne alanı kendi minimum ve maksimumunda kalır',()=>{
  const f=fixture({saved:JSON.stringify({arrangement:'auto',phone:9,focus:'custom'})});f.flush();
  assert.equal(f.layout().size,'598.0px');
  assert.equal(f.layout().value,'76');
});

check('Ok tuşu oranı değiştirir, odağı özel yapar ve kaydeder',()=>{
  const f=fixture();f.flush();
  f.key('ArrowDown');
  const saved=f.saved();
  assert.equal(saved.focus,'custom');
  assert(Math.abs(saved.phone-(0.34+0.025))<1e-9,String(saved.phone));
  assert.equal(f.buttons[0].attributes['aria-pressed'],'false');
});

check('Home ve End tuşları minimum ve maksimuma gider',()=>{
  const f=fixture();f.flush();
  f.key('Home');assert.equal(f.layout().size,'174.0px');assert.equal(f.layout().value,'22');
  f.key('End');assert.equal(f.layout().size,'598.0px');
});

check('Enter ve çift tıklama dengeli yerleşime döndürür',()=>{
  const f=fixture();f.flush();
  f.key('End');f.key('Enter');
  assert.equal(f.saved().focus,'balanced');assert.equal(f.layout().size,'267.9px');
  f.key('End');f.divider.emit('dblclick');
  assert.equal(f.saved().focus,'balanced');
});

check('Gitar odağı ve araç odağı hazır oranları uygular',()=>{
  const f=fixture();f.flush();
  f.buttons[1].click();assert.equal(f.layout().size,'472.8px');assert.equal(f.saved().focus,'guitar');
  f.buttons[2].click();assert.equal(f.saved().focus,'workspace');assert.equal(f.saved().phone,.24);
});

check('Geniş ekranda kayıtlı yan yana yerleşim uygulanır ve ayırıcı dikey olur',()=>{
  const f=fixture({width:1200,height:700,saved:JSON.stringify({arrangement:'side'})});f.flush();
  const layout=f.layout();
  assert.equal(layout.arrangement,'side');assert.equal(layout.orientation,'vertical');
  assert.equal(f.arrangement.disabled,false);
});

check('Dar ekranda yan yana tercih edilse de yığın yerleşimine düşer ve geçiş kilitlenir',()=>{
  const f=fixture({width:800,height:700,saved:JSON.stringify({arrangement:'side'})});f.flush();
  assert.equal(f.layout().arrangement,'stack');
  assert.equal(f.arrangement.disabled,true);
  assert.equal(f.arrangement.title,'Widen the window for side-by-side view');
});

check('Yerleşim düğmesi geniş ekranda yığın ile yan yana arasında geçer ve tercihi saklar',()=>{
  const f=fixture({width:1200,height:700});f.flush();
  f.arrangement.click();
  assert.equal(f.saved().arrangement,'side');assert.equal(f.layout().arrangement,'side');
  f.arrangement.click();
  assert.equal(f.saved().arrangement,'stack');
});

check('Sıfırlama düğmesi yerleşim tercihlerini varsayılana döndürür',()=>{
  const f=fixture({saved:JSON.stringify({arrangement:'side',phone:.8,focus:'custom'})});f.flush();
  f.reset.click();
  assert.deepEqual(f.saved(),{arrangement:'auto',stack:.44,phone:.34,side:.55,focus:'balanced'});
  assert.equal(f.layout().size,'267.9px');
});

check('Türkçe arayüz yerleşim etiketlerini Türkçe verir',()=>{
  const f=fixture({lang:'tr'});f.flush();
  assert.equal(f.buttons[2].textContent,'Araçlar');
  assert.equal(f.reset.title,'Yerleşimi sıfırla');
});

module.exports=checks;
