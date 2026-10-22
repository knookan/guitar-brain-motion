/* Presets, saved progressions, share links and per-chord top notes in the real Motion workspace. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../theory.js'),G=require('../guitar.js'),V=require('../voicing-engine.js'),E=require('../motion-engine.js');
const checks=[];function check(name,fn){fn();checks.push(name);}
const standard=G.TUNINGS[0],LIB='guitar-brain-motion-library-v1';
const json=value=>JSON.parse(JSON.stringify(value));
const code=value=>Buffer.from(JSON.stringify(value),'utf8').toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

function workspace(initial={}){
  const store=new Map(Object.entries(initial)),history=[];
  const context={MBS2Theory:T,MBS2Guitar:G,MBS2Voicings:V,MBS2Diagram:require('../chord-diagram.js'),GBMotionEngine:E,
    MBS2Audio:{getPlayback:()=>({token:'idle',events:[],time:0}),stop(){},playVoicingRoute:()=>Promise.resolve(0)},
    requestAnimationFrame:()=>1,cancelAnimationFrame(){},btoa,atob,
    location:{origin:'https://example.test',pathname:'/app/',search:'',hash:''},history:{replaceState:(...args)=>history.push(args)},
    localStorage:{getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value))},console};
  vm.createContext(context);vm.runInContext(fs.readFileSync('motion-workspace.js','utf8'),context);
  const w=context.GBMotionWorkspace,bpm=[],ctx={tuning:standard,capo:0,language:'en',scaleRoot:'C',scaleId:'major',bpm:96,setBpm:value=>bpm.push(value)};
  let controls=[];
  const host={set innerHTML(html){this.html=html;controls=[];for(const m of html.matchAll(/<button\b([^>]*)>/g)){const dataset={};for(const d of m[1].matchAll(/data-([\w-]+)="([^"]*)"/g))dataset[d[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=d[2];controls.push({dataset});}},
    get innerHTML(){return this.html;},querySelector:()=>null,
    querySelectorAll(selector){return selector==='[data-motion]'?controls.map(c=>({...c,addEventListener:(_,fn)=>{c.click=()=>fn({target:c});}})):[];},insertAdjacentHTML(){}};
  w.init(()=>w.render(host,ctx));w.render(host,ctx);
  const click=(action,match={})=>{const b=controls.find(n=>n.dataset.motion===action&&Object.entries(match).every(([k,v])=>n.dataset[k]===v));assert(b,action+' '+JSON.stringify(match));b.click();};
  return {w,ctx,host,store,history,bpm,click,symbols:()=>Array.from(w.snapshot().settings.chords.map(c=>c.record?.symbol||c.root+(T.CHORD_TYPES.find(t=>t.id===c.typeId)?.symbol||'')))};
}

check('On altı hazır örnek beş kategoride, her tonda doğru yazımla kurulur',()=>{
  const f=workspace(),list=f.w.presets();
  assert(list.length>=15);assert.deepEqual([...new Set(list.map(p=>p.category))].sort(),['andalusian','blues','jazz','modal','pop']);
  assert.equal(new Set(list.map(p=>p.id)).size,list.length);
  for(const rootText of ['C','F♯','B♭','E','A♭'])for(const p of list){
    const chords=f.w.presetChords(p.id,rootText);assert(chords.length>=2&&chords.length<=8,p.id);
    for(const c of chords){assert.notEqual(T.parseNote(c.root),null,p.id+' '+c.root);assert.doesNotThrow(()=>T.buildChord(c.root,c.typeId));}
  }
  const roots=(id,key)=>Array.from(f.w.presetChords(id,key).map(c=>c.root));
  assert.deepEqual(roots('pop-1564','C'),['C','G','A','F']);assert.deepEqual(roots('pop-1564','F♯'),['F♯','C♯','D♯','B']);
  assert.deepEqual(roots('andalusian-1','A'),['A','G','F','E']);assert.deepEqual(roots('jazz-sub','C'),['D','D♭','C']);
  assert.equal(f.w.presetChords('nope','C'),null);assert.equal(f.w.presetChords('pop-1564','H'),null);
});

check('Hazır örnek düğmesi seçili tonda progresyonu kurar ve vuruşları sıfırlar',()=>{
  const f=workspace();f.w.restore({chords:[{root:'G',typeId:'dominant7',beats:2,top:71},{root:'C',typeId:'major7'}]});f.w.render(f.host,f.ctx);
  f.ctx.scaleRoot='D';f.w.render(f.host,f.ctx);f.click('lib-preset',{value:'pop-1564'});
  assert.deepEqual(f.symbols(),['D','A','Bm','G']);assert(f.w.snapshot().settings.chords.every(c=>c.beats===undefined&&c.top===undefined));
  assert.equal(f.w.snapshot().settings.step,0);
});

check('Kütüphane kaydet, aç, yeniden adlandır ve sil işlemlerini kalıcı yapar',()=>{
  const f=workspace();
  f.w.restore({chords:[{root:'G',typeId:'dominant7',beats:2,top:71},{root:'C',typeId:'major7',beats:8}],region:'5-12',pattern:'strum'});
  const item=f.w.saveToLibrary('  Cadence practice  ');
  assert.equal(item.name,'Cadence practice');assert.equal(f.w.library().length,1);
  const stored=JSON.parse(f.store.get(LIB));assert.equal(stored.version,1);assert.equal(stored.items[0].options.region,'5-12');assert.equal(stored.items[0].chords[0].top,71);
  f.click('lib-preset',{value:'pop-1645'});assert.deepEqual(f.symbols(),['C','Am','F','G']);
  f.w.render(f.host,f.ctx);f.click('lib-open',{id:item.id});
  const s=f.w.snapshot().settings;assert.deepEqual(Array.from(s.chords.map(c=>[c.root,c.beats,c.top])),[['G',2,71],['C',8,undefined]]);assert.equal(s.region,'5-12');assert.equal(s.pattern,'strum');
  f.w.render(f.host,f.ctx);assert(f.host.innerHTML.includes('Cadence practice'));
  f.w.render(f.host,f.ctx);f.click('lib-delete',{id:item.id});assert.equal(f.w.library().length,0);assert.equal(JSON.parse(f.store.get(LIB)).items.length,0);
  assert.equal(f.w.saveToLibrary('').name.length>0,true);
});

check('Kütüphane bozuk ya da fazla kayıtla bile geçerli kalır ve elliyle sınırlanır',()=>{
  const bad=workspace({[LIB]:'{not json'});assert.equal(bad.w.library().length,0);
  const good={id:'a',name:'Fine',savedAt:1,chords:[{root:'C',typeId:'major'},{root:'G',typeId:'major',beats:4,top:67}],options:{region:'0-12',melody:'sideways'}};
  const mixed=workspace({[LIB]:JSON.stringify({version:1,items:[good,{name:'one chord',chords:[{root:'C',typeId:'major'}]},{name:'bad root',chords:[{root:'H',typeId:'major'},{root:'C',typeId:'major'}]},{name:'bad type',chords:[{root:'C',typeId:'nonsense'},{root:'D',typeId:'major'}]},null,{name:7}]})});
  const items=mixed.w.library();assert.equal(items.length,1);assert.equal(items[0].name,'Fine');assert.equal(items[0].options.region,'0-12');assert.equal(items[0].options.melody,undefined);
  const many=workspace({[LIB]:JSON.stringify({version:1,items:Array.from({length:80},(_,i)=>({...good,id:'i'+i,name:'n'+i}))})});assert.equal(many.w.library().length,50);
  many.w.saveToLibrary('x');assert.equal(many.w.library().length,50);assert.equal(many.w.library()[0].name,'x');
});

check('Paylaşım bağlantısı akorları, vuruşları, üst notaları, değiştiricileri ve bası kaybetmeden taşır',()=>{
  const f=workspace(),c9=T.buildChord('C','major7',{add:['add9'],omit:[],alter:[]});
  f.w.restore({chords:[{root:'G',typeId:'dominant7',beats:2,top:71},{root:'C',typeId:'major7',record:Object.freeze({...c9,symbol:'Cmaj7(add9)/E',slashBassPc:4}),beats:8}],region:'5-12',pattern:'downup'});
  const url=f.w.shareUrl();assert(url.startsWith('https://example.test/app/#m='));
  const data=f.w.decodeShare(url.split('#m=')[1]);
  assert.deepEqual(Array.from(data.chords.map(c=>[c.root,c.typeId,c.beats,c.top])),[['G','dominant7',2,71],['C','major7',8,undefined]]);
  assert.deepEqual(Array.from(data.chords[1].record.modifiers.add),['add9']);assert.equal(data.chords[1].record.slashBassPc,4);assert(data.chords[1].record.symbol.endsWith('/E'));
  assert.equal(data.options.region,'5-12');assert.equal(data.options.pattern,'downup');assert.equal(data.bpm,96);
});

check('Paylaşım bağlantısı geçersiz, aşırı büyük ya da kötü niyetli içeriği reddeder',()=>{
  const f=workspace(),ok=[{r:'C',t:'major'},{r:'G',t:'major'}],decode=value=>f.w.decodeShare(value);
  assert.notEqual(decode(code({v:1,c:ok})),null);
  for(const bad of ['!!not base64!!','','e30',code({v:2,c:ok}),code({v:1,c:[ok[0]]}),code({v:1,c:Array.from({length:9},()=>ok[0])}),code({v:1,c:[ok[0],{r:'C',t:'nonsense'}]}),code({v:1,c:[ok[0],{r:'<img src=x onerror=alert(1)>',t:'major'}]}),code({v:1,c:[ok[0],{r:'H',t:'major'}]}),code({v:1,c:[ok[0],null]}),code({v:1,c:'C G'}),'A'.repeat(5000)])
    assert.equal(decode(bad),null,String(bad).slice(0,30));
  const odd=decode(code({v:1,c:[{...ok[0],b:3,k:5,s:99,m:{a:['add9',{x:1},'z'.repeat(40)],l:[],o:[1,3,'x']}},ok[1]],o:{region:'0-99',melody:'up'},b:9999}));
  assert.equal(odd.chords[0].beats,undefined);assert.equal(odd.chords[0].top,undefined);assert.equal(odd.chords[0].record.slashBassPc,undefined);
  assert.deepEqual(Array.from(odd.chords[0].record.modifiers.omit),[3]);assert.equal(odd.options.region,undefined);assert.equal(odd.options.melody,'up');assert.equal(odd.bpm,220);
});

check('Gelen paylaşım önce bildirim olarak görünür; Aç uygular ve adresi temizler, Kapat vazgeçirir',()=>{
  const f=workspace(),sample={v:1,c:[{r:'D',t:'minor7',b:2},{r:'G',t:'dominant7',k:71},{r:'C',t:'major7'}],o:{pattern:'strum'},b:120};
  assert.equal(f.w.offerShare('garbage!!'),false);assert.equal(f.w.pendingShare(),null);
  assert.equal(f.w.offerShare(code(sample)),true);f.w.render(f.host,f.ctx);
  assert(f.host.innerHTML.includes('share-banner'));assert(f.host.innerHTML.includes('Dm7 → G7 → Cmaj7'));
  const before=f.symbols().join();f.click('share-dismiss');assert.equal(f.w.pendingShare(),null);assert.equal(f.symbols().join(),before);assert(!f.host.innerHTML.includes('share-banner'));assert(f.history.length>=1);
  f.w.offerShare(code(sample));f.w.render(f.host,f.ctx);f.click('share-open');
  assert.deepEqual(f.symbols(),['Dm7','G7','Cmaj7']);assert.equal(f.w.snapshot().settings.chords[1].top,71);assert.equal(f.w.snapshot().settings.pattern,'strum');
  assert.deepEqual(f.bpm,[120]);assert.equal(f.w.pendingShare(),null);assert(f.history.length>=2);
});

check('Üst nota hedefi rotaya uygulanır, kartta görünür ve koşullar sıfırlanınca temizlenir',()=>{
  const f=workspace();f.w.restore({chords:[{root:'G',typeId:'dominant7',top:71},{root:'C',typeId:'major7',top:76}]});f.w.render(f.host,f.ctx);
  const route=f.w.snapshot().route;assert.deepEqual(Array.from(route.nodes.map(n=>n.events.at(-1).midi)),[71,76]);
  assert(f.host.innerHTML.includes('sequence-top')&&f.host.innerHTML.includes('↑B4')&&f.host.innerHTML.includes('↑E5'));
  f.w.restore({chords:[{root:'G',typeId:'dominant7',top:77},{root:'C',typeId:'major7',top:76}]});f.w.render(f.host,f.ctx);
  assert.equal(f.w.snapshot().route,null);assert(f.host.innerHTML.includes('data-motion="relax"'));
  f.click('relax');assert(f.w.snapshot().settings.chords.every(c=>c.top===undefined));assert(f.w.snapshot().route);
  f.w.restore({chords:[{root:'G',typeId:'dominant7',top:5},{root:'C',typeId:'major7',top:'x'}]});assert(f.w.snapshot().settings.chords.every(c=>c.top===undefined));
});

module.exports=checks;
