/* Practice controls in the real Motion workspace: per-chord beats, loop/metronome/count-in, MIDI route timing. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../theory.js'),G=require('../guitar.js'),V=require('../voicing-engine.js'),E=require('../motion-engine.js');
const checks=[];function check(name,fn){fn();checks.push(name);}
const standard=G.TUNINGS[0];

function workspace(){
  let stored;const calls=[];
  const context={MBS2Theory:T,MBS2Guitar:G,MBS2Voicings:V,MBS2Diagram:require('../chord-diagram.js'),GBMotionEngine:E,
    MBS2Audio:{getPlayback:()=>({token:'idle',events:[],time:0}),stop(){},playVoicingRoute:(nodes,options)=>{calls.push({nodes,options});return Promise.resolve(0);}},
    requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    localStorage:{getItem:()=>null,setItem:(_,s)=>{stored=s;}},console};
  vm.createContext(context);vm.runInContext(fs.readFileSync('motion-workspace.js','utf8'),context);
  const w=context.GBMotionWorkspace,ctx={tuning:standard,capo:0,language:'en',scaleRoot:'C',scaleId:'major',bpm:96};
  let controls=[];
  const host={set innerHTML(html){this.html=html;controls=[];for(const m of html.matchAll(/<button\b([^>]*)>/g)){const dataset={};for(const d of m[1].matchAll(/data-([\w-]+)="([^"]*)"/g))dataset[d[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=d[2];controls.push({dataset});}},
    get innerHTML(){return this.html;},querySelector:()=>null,
    querySelectorAll(selector){return selector==='[data-motion]'?controls.map(c=>({...c,addEventListener:(_,fn)=>{c.click=()=>fn({target:c});}})):[];},insertAdjacentHTML(){}};
  w.init(()=>w.render(host,ctx));w.render(host,ctx);
  const click=(action,value)=>{const b=controls.find(n=>n.dataset.motion===action&&(value===undefined||n.dataset.value===value));assert(b,action);b.click();};
  return {w,ctx,host,calls,click,saved:()=>JSON.parse(stored||'null')};
}

check('Akor başına vuruş, bozuk değerler atılarak geri yüklenir; çalma ayarları yalnızca true ile açılır',()=>{
  const f=workspace();
  f.w.restore({chords:[{root:'G',typeId:'dominant7',beats:2},{root:'C',typeId:'major7',beats:3},{root:'A',typeId:'minor',beats:'x'},{root:'F',typeId:'major',beats:8}],loop:'yes',metronome:true,countIn:1,pattern:'banjo'});
  const {settings}=f.w.snapshot();
  assert.deepEqual(Array.from(settings.chords.map(c=>c.beats)),[2,undefined,undefined,8]);
  assert.equal(settings.loop,false);assert.equal(settings.metronome,true);assert.equal(settings.countIn,false);assert.equal(settings.pattern,'block');
});

check('Düğmeler döngü, metronom ve sayımı açıp kapatır ve kaydeder; bilinmeyen anahtar yok sayılır',()=>{
  const f=workspace();
  assert.equal(f.w.snapshot().settings.loop,false);
  f.click('transport','loop');assert.equal(f.w.snapshot().settings.loop,true);assert.equal(f.saved().loop,true);
  f.click('transport','metronome');f.click('transport','countIn');
  assert.deepEqual([f.saved().loop,f.saved().metronome,f.saved().countIn],[true,true,true]);
  f.click('transport','loop');assert.equal(f.saved().loop,false);
  assert(f.host.innerHTML.includes('aria-pressed="true"'));
});

check('Çal, akor başına vuruşu ve döngü/metronom/sayım seçeneklerini ses motoruna aktarır',()=>{
  const f=workspace();
  f.w.restore({chords:[{root:'G',typeId:'dominant7',beats:2},{root:'C',typeId:'major7'}],loop:true,metronome:true,countIn:true,pattern:'downup'});
  f.w.render(f.host,f.ctx);
  f.w.play(false);
  assert.equal(f.calls.length,1);
  const {nodes,options}=f.calls[0];
  assert.deepEqual(Array.from(nodes.map(n=>n.beats)),[2,4]);
  assert.equal(options.bpm,96);assert.equal(options.loop,true);assert.equal(options.metronome,true);assert.equal(options.countIn,true);assert.equal(options.arpeggio,false);assert.equal(options.pattern,'downup');
  assert.equal(f.w.isPlaying(),true);f.w.stop();assert.equal(f.w.isPlaying(),false);
});

check('Varsayılan çalma döngü, metronom ve sayım olmadan her akorda dört vuruş kullanır',()=>{
  const f=workspace();f.w.play(true);
  const {nodes,options}=f.calls[0];
  assert.deepEqual(Array.from(nodes.map(n=>n.beats)),[4,4]);
  assert.deepEqual([options.loop,options.metronome,options.countIn,options.arpeggio,options.pattern],[false,false,false,true,'block']);
  f.w.stop();
});

check('MIDI rota notaları her akorun vuruşuna göre art arda dizilir',()=>{
  const f=workspace();
  f.w.restore({chords:[{root:'G',typeId:'dominant7',beats:2},{root:'C',typeId:'major7',beats:8}]});f.w.render(f.host,f.ctx);
  const route=f.w.snapshot().route,notes=f.w.midiNotes();
  assert.equal(notes.length,route.nodes[0].events.length+route.nodes[1].events.length);
  const first=notes.slice(0,route.nodes[0].events.length),second=notes.slice(route.nodes[0].events.length);
  assert(first.every(n=>n.startBeat===0&&Math.abs(n.durationBeats-1.9)<1e-9));
  assert(second.every(n=>n.startBeat===2&&Math.abs(n.durationBeats-7.6)<1e-9));
  assert(notes.every(n=>Number.isFinite(n.midi)));
  assert.deepEqual(Array.from(first.map(n=>n.midi)),Array.from(route.nodes[0].events.map(e=>e.midi)));
});

check('Ok tuşu adımı akor sınırları içinde tutar ve çalmayı durdurur',()=>{
  const f=workspace();
  f.w.stepBy(1);assert.equal(f.w.snapshot().settings.step,1);
  f.w.stepBy(1);assert.equal(f.w.snapshot().settings.step,1);
  f.w.stepBy(-5);assert.equal(f.w.snapshot().settings.step,0);
  f.w.play(false);assert.equal(f.w.isPlaying(),true);f.w.stepBy(1);assert.equal(f.w.isPlaying(),false);
});

check('Sekizinci akordan sonra Akor ekle düğmesi devre dışıdır',()=>{
  const f=workspace();
  const chords=['C','D','E','F','G','A','B','C'].map(root=>({root,typeId:'major'}));
  f.w.restore({chords});f.w.render(f.host,f.ctx);
  assert(/data-motion="composer"[^>]*disabled/.test(f.host.innerHTML));
  f.w.restore({chords:chords.slice(0,4)});f.w.render(f.host,f.ctx);
  assert(!/data-motion="composer"[^>]*disabled/.test(f.host.innerHTML));
});

module.exports=checks;
