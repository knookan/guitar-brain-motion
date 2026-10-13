/* Actual renderers and handlers executed in a minimal Node DOM fixture; not browser QA. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../theory.js'),G=require('../guitar.js'),D=require('../chord-diagram.js'),H=require('../harmony-engine.js');
const checks=[];function check(name,fn){fn();checks.push(name);}
class Element{
  constructor(tag='div',attrs={}){this.tag=tag;this.attributes=attrs;this.dataset={};this.style={};this.children=[];this.controls=[];this.events={};this.clientWidth=370;this.scrollTop=0;this.scrollHeight=10000;this.classList={add(){},remove(){},toggle(){}};for(const [key,value] of Object.entries(attrs))if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
  setAttribute(key,value){this.attributes[key]=String(value);}
  addEventListener(event,fn){(this.events[event]||=[]).push(fn);}
  emit(event){(this.events[event]||[]).forEach(fn=>fn({target:this}));}
  dispatchEvent(event){event.target=this;(this.events[event.type]||[]).forEach(fn=>fn(event));return true;}
  set innerHTML(html){this.html=html;this.children=[];this.controls=[];for(const match of html.matchAll(/<(button|select|input|details|div)\b([^>]*)>/g)){
    const attrs={};for(const a of match[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];if(/\bdisabled\b/.test(match[2]))attrs.disabled='';
    const el=new Element(match[1],attrs);this.controls.push(el);if(attrs.id)this.children.push(el);
  }}
  get innerHTML(){return this.html||'';}
  matches(selector){if(selector[0]==='#')return this.attributes.id===selector.slice(1);const m=selector.match(/^(\w+)?\[([^=\]]+)(?:="([^"]*)")?\]$/);return m&&(!m[1]||this.tag===m[1])&&this.attributes[m[2]]!==undefined&&(m[3]===undefined||this.attributes[m[2]]===m[3]);}
  querySelectorAll(selector){return [...this.controls,...this.children].filter(n=>n.matches(selector));}
  querySelector(selector){for(const n of [...this.controls,...this.children]){if(n.matches(selector))return n;const found=n.querySelector(selector);if(found)return found;}return null;}
}
function fixture(localized=false,saved=null){
  const nodes=new Map(),audio=[],exports=[];for(const id of ['panelContent','playMainText','tuningLabel','capoLabel','selectedCount','sceneTitle','sceneEyebrow','toast'])nodes.set('#'+id,new Element());
  const preferences={attributes:{},styles:{}},document={readyState:'loading',querySelector:id=>nodes.get(id)||null,querySelectorAll:()=>[],createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),addEventListener(){},documentElement:{setAttribute:(k,v)=>preferences.attributes[k]=v,style:{setProperty:(k,v)=>preferences.styles[k]=v}}};
  const context={document,Event:class{constructor(type,options){this.type=type;Object.assign(this,options);}},MBS2Theory:T,MBS2MakamTuning:require('../makam-tuning.js'),MBS2ChordPool:require('../chord-pool.js'),MBS2Guitar:G,MBS2Diagram:D,MBS2Harmony:H,MBS2Export:{saveSvg:(...args)=>exports.push({type:'svg',args}),savePng:(...args)=>exports.push({type:'png',args}),print:(...args)=>exports.push({type:'pdf',args})},MBS2Audio:{playSequence:n=>audio.push({notes:n,arp:true,sequence:true}),playNotes:n=>audio.push({notes:n,arp:false}),playArpeggio:n=>audio.push({notes:n,arp:true})},localStorage:{getItem:()=>saved,setItem:(_,value)=>preferences.saved=value},console,setTimeout,clearTimeout};
  vm.createContext(context);if(localized)vm.runInContext(fs.readFileSync('i18n.js','utf8'),context);vm.runInContext(fs.readFileSync('harmony-map.js','utf8'),context);vm.runInContext(fs.readFileSync('app.js','utf8'),context);
  const app=context.MBS2App,host=nodes.get('#panelContent');app.setMode('scale');
  const change=(key,value,checked=false)=>{const n=host.controls.find(n=>n.dataset.change===key);assert(n,key);n.value=value;n.checked=checked;n.emit('change');};
  const action=(key)=>{const n=host.controls.find(n=>n.dataset.action===key);assert(n,key);n.emit('click');};
  const descendants=(node,fn)=>node.children.flatMap(child=>[...(fn(child)?[child]:[]),...descendants(child,fn)]);
  const card=id=>descendants(host.querySelector('#mapHost'),n=>n.dataset.nodeId===id)[0];
  const focus=id=>{const button=host.controls.find(n=>n.dataset.action==='harmonyFocus'&&n.dataset.value===id);assert(button,id);button.emit('click');};
  return {app,host,change,action,audio,card,descendants,focus,preferences,document,exports};
}
check('Gam araması alternatif adlarla çalışır, aile filtresi doğru seçenekleri getirir',()=>{
  const f=fixture();f.change('scaleQuery','super locrian');assert(f.host.innerHTML.includes('Gam · 2 sonuç'));assert(f.host.innerHTML.includes('value="altered"'));assert(f.host.innerHTML.includes('value="super-locrian-pentatonic"'));f.change('scaleQuery','');f.change('scaleFamily','Melodik minör modları');assert(f.host.innerHTML.includes('Gam · 7 sonuç'));
});
check('Gam seçimi Armoni ve kalıcı gitar görünümüyle aynı ton/gamı korur',()=>{
  const f=fixture();f.change('scaleRoot','F♯');f.change('scaleId','dorian');f.action('scaleHarmony');const s=f.app.getState();assert.equal(s.mode,'harmony');assert.equal(s.harmonyRoot,'F♯');assert.equal(s.harmonyScale,'dorian');assert.equal(s._visibleGraph.analysis.profile.context,'modal');assert.equal(f.app.sceneState().activeScale.scale.id,'dorian');
});
check('İkincil dominantlar ve paralel minör ayrı görünür gruplardır; katman seçimi gerçek düğümleri değiştirir',()=>{
  const f=fixture();f.action('scaleHarmony');assert(f.host.innerHTML.includes('data-value="secondary"'));assert(f.host.innerHTML.includes('data-value="borrowed"'));f.focus('secondary');assert(f.descendants(f.host.querySelector('#mapHost'),n=>n.dataset.layer==='secondary').length);f.focus('borrowed');assert(f.descendants(f.host.querySelector('#mapHost'),n=>n.dataset.layer==='borrowed').length);
  f.change('secondary','',false);assert(!f.app.getState()._visibleGraph.nodes.some(n=>n.kind==='secondary'));f.change('leading','',true);assert(f.app.getState()._visibleGraph.nodes.some(n=>n.kind==='leading'));
});
check('Armoni kartlarının Seç/Çal/Arpej olayları hedef akorun gerçek gitar tutuşunu kullanır',()=>{
  const f=fixture();f.action('scaleHarmony');f.focus('secondary');f.card('secondary-2').children[0].emit('click');assert.equal(f.app.sceneState().activeChord.symbol,'A7');assert.equal(f.app.getState().mapActiveId,'secondary-2');
  const c=f.card('secondary-2');c.children[1].children[0].emit('click');c.children[1].children[1].emit('click');const voice=G.generateVoicings(T.buildChord('A','dominant7'),G.TUNINGS[0],0,{maxResults:144})[0];for(const e of f.audio)assert.deepEqual(Array.from(e.notes),[...voice.midis].sort((a,b)=>a-b));assert.equal(f.audio[1].arp,true);
});
check('Yedili seçimi haritaya uygulanır; Napoliten çevrimi seçildiğinde F bası korunur',()=>{
  const f=fixture();f.action('scaleHarmony');f.change('harmonySize','4');assert.equal(f.app.getState()._visibleGraph.nodes[0].symbol,'Cmaj7');f.change('chromatic','',true);f.card('neapolitan').children[0].emit('click');assert.equal(f.app.sceneState().activeChord.symbol,'D♭/F');assert.equal(f.app.sceneState().activeChord.slashBassPc,5);assert.equal(f.app.sceneState().activeVoicing.bassPc,5);
});
check('Simetrik gamda uygulanmayan katmanlar devre dışıdır; boş yedili koleksiyonu hata vermez',()=>{
  const f=fixture();f.change('scaleId','wholeTone');f.action('scaleHarmony');const secondary=f.host.controls.find(n=>n.dataset.change==='secondary');assert.equal(secondary.attributes.disabled,'');assert.equal(f.app.getState()._visibleGraph.functional,false);
  const empty=T.SCALES.find(s=>H.analyze('C',s.id,{chordSize:4}).chords.length===0);assert(empty);f.change('harmonySize','4');f.change('harmonyScale',empty.id);assert.equal(f.app.sceneState().activeChord,null);assert(f.app.getState()._visibleGraph.analysis);
});
check('Tam dörtlü düğmesi gerçek armoni yapısını ve ilk seçili akoru değiştirir',()=>{
  const f=fixture();f.change('scaleId','dorian');f.action('scaleHarmony');const control=f.host.controls.find(n=>n.dataset.action==='harmGrammar'&&n.dataset.value==='quartal');control.emit('click');assert.equal(f.app.getState()._visibleGraph.analysis.profile.context,'quartal');assert.equal(f.app.sceneState().activeChord.symbol,'C Q3');
});
check('Gam arama alanında Enter gerçek değişim olayını gönderir ve alternatif adı filtreler',()=>{
  const f=fixture(),input=f.host.querySelector('input[type="search"]');input.value='super locrian';let prevented=false;input.dispatchEvent({type:'keydown',key:'Enter',preventDefault(){prevented=true;}});assert(prevented);assert.equal(f.app.getState().scaleQuery,'super locrian');assert(f.host.innerHTML.includes('Gam · 2 sonuç'));
});
module.exports=checks;
module.exports.fixture=fixture;
