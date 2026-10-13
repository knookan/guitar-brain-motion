/* Render-string and event-binding integration in Node, without browser rendering. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const T=require('../theory.js'),G=require('../guitar.js'),D=require('../chord-diagram.js');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),checks=[];
function check(name,fn){fn();checks.push(name);}
class Control{
  constructor(attributes={}){this.dataset={};this.attributes=attributes;this.events={};this.value='';this.checked=false;this.style={};this.textContent='';this.scrollTop=0;this.scrollHeight=8000;this.isConnected=true;this.classList={add(){},remove(){},toggle(){}};
    for(const [key,value] of Object.entries(attributes))if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
  }
  addEventListener(event,fn){(this.events[event]||=[]).push(fn);}
  setAttribute(key,value){this.attributes[key]=value;}
  emit(event){(this.events[event]||[]).forEach(fn=>fn({target:this}));}
  set innerHTML(html){this.html=html;this.controls=[];for(const match of html.matchAll(/<(?:button|select|input|details)\b([^>]*)>/g)){
    const attrs={};for(const a of match[1].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];this.controls.push(new Control(attrs));
  }}
  get innerHTML(){return this.html||'';}
  querySelectorAll(selector){const attr=selector.match(/^\[([^\]]+)\]$/)?.[1];return attr?this.controls.filter(c=>c.attributes[attr]!==undefined):[];}
  querySelector(){return null;}
}
function fixture(saved=null){
  const nodes=new Map(),audio=[];for(const id of ['panelContent','playMainText','tuningLabel','capoLabel','selectedCount','sceneTitle','sceneEyebrow','toast'])nodes.set('#'+id,new Control());
  const document={readyState:'loading',querySelector:id=>nodes.get(id)||null,querySelectorAll:()=>[],addEventListener(){},documentElement:{style:{setProperty(){}}}};
  const context={document,MBS2Theory:T,MBS2Guitar:G,MBS2Diagram:D,MBS2Audio:{playNotes:notes=>audio.push({notes,arpeggio:false}),playArpeggio:(notes,options)=>audio.push({notes,arpeggio:true,options})},localStorage:{getItem:()=>saved,setItem(){}},console,setTimeout,clearTimeout};
  vm.createContext(context);vm.runInContext(source,context);const app=context.MBS2App;app.setMode('chord');
  const host=nodes.get('#panelContent');
  const action=(name,index)=>{const node=host.controls.find(c=>c.dataset.action===name&&(index===undefined||c.dataset.index===String(index)));assert(node,'Missing action '+name);node.emit('click');};
  const change=(key,value,checked=false)=>{const node=host.controls.find(c=>c.dataset.change===key);assert(node,'Missing field '+key);node.value=value;node.checked=checked;node.emit('change');};
  return {app,host,audio,action,change};
}
check('Akor ekranı 12 kartla açılır; daha fazla tutuş düğmesi gerçekten 24 karta genişletir',()=>{
  const f=fixture();assert.equal(f.app.getState()._visibleVoicings.length,12);assert.equal((f.host.innerHTML.match(/class="voicing-card/g)||[]).length,12);
  f.action('moreVoicings');assert.equal(f.app.getState()._visibleVoicings.length,24);assert.equal((f.host.innerHTML.match(/class="voicing-card/g)||[]).length,24);
});
check('Tutuşu seç/çal/arpej eylemleri aynı seçilen gitar seslerini kullanır',()=>{
  const f=fixture();f.action('selectVoicing',1);const shape=f.app.getState()._visibleVoicings[1];assert.equal(f.app.getState().activeVoicingId,shape.id);
  f.action('playVoicing',1);f.action('arpeggioVoicing',1);
  for(const event of f.audio)assert.deepEqual(Array.from(event.notes),[...shape.midis].sort((a,b)=>a-b));assert.equal(f.audio[0].arpeggio,false);assert.equal(f.audio[1].arpeggio,true);
});
check('Drop 2, kolay seviye ve kök bas filtreleri gerçek kart listesini daraltır',()=>{
  const f=fixture();f.app.applyChord('C','major7');const family=f.host.controls.find(c=>c.dataset.action==='voicingFamily'&&c.dataset.value==='drop2');family.emit('click');
  f.change('voicingDifficulty','easy');f.change('voicingBass','root');const shapes=f.app.getState()._visibleVoicings;assert(shapes.length>0);
  assert(shapes.every(s=>s.tags.includes('drop2')&&s.difficulty==='easy'&&s.bassPc===0));
});
check('C13 kartı eksik 5/9/11 bilgisini gösterir; tam ses filtresi boş sonucu dürüstçe açıklar',()=>{
  const f=fixture();f.app.applyChord('C','dominant13');assert.match(f.host.innerHTML,/voicing-omissions/);assert.match(f.host.innerHTML,/(5|9|11) yok/);
  f.change('voicingCompleteness','',true);assert.equal(f.app.getState()._visibleVoicings.length,0);assert.match(f.host.innerHTML,/uygun tutuş bulunamadı/);
  f.action('resetVoicingFilters');assert(f.app.getState()._visibleVoicings.length>0);
});
check('Üst pozisyondaki bir kartı seçmek gitarı 12–24 aralığına getirir ve seçim korunur',()=>{
  const f=fixture();f.change('voicingPosition','high');const shape=f.app.getState()._visibleVoicings[0];assert(shape&&shape.position>12);
  f.action('selectVoicing',0);assert.equal(f.app.getState().sceneRange,12);assert.equal(f.app.getState().activeVoicingId,shape.id);
});
module.exports=checks;
