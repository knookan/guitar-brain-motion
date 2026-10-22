/* Embedded module checks; this does not render a browser or play sound. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'..');require('../build-standalone.js');const html=fs.readFileSync(path.join(base,'Guitar_Brain_Motion.html'),'utf8');
const names=['scale-catalog','makam-catalog','makam-tuning','i18n','theory','chord-pool','voicing-catalog','guitar','voicing-engine','chord-diagram','guitar-samples','audio','harmony-engine','harmony-atlas','orbit-engine','orbit-view','harmony-diagram','harmony-map','export','scene','pwa','motion-engine','motion-workspace','app'];
const checks=[];function check(name,fn){fn();checks.push(name);}
check('Dağıtılan Motion HTML tüm kaynak modüllerini, Orbit tasarımını ve gitar kayıtlarını taşır',()=>{
  for(const name of names)assert(html.includes(fs.readFileSync(path.join(base,name+'.js'),'utf8')),name);
  assert(html.includes(fs.readFileSync(path.join(base,'orbit.css'),'utf8')));assert(!/<script defer src=/.test(html));assert(!/<link rel="stylesheet"/.test(html));
});
check('Gömülü modüller birlikte yüklenir: 144 yaklaşım, minör V7 ve bilinen C tutuşu korunur',()=>{
  const context={document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=>null},console};
  vm.createContext(context);for(const [,code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(code,context);
  assert.equal(context.MBS2Theory.SCALES.length,144);assert.equal(context.MBS2App.getState().language,'en');
  assert(context.MBS2Harmony.buildGraph('C','naturalMinor',{primary:true}).nodes.some(n=>n.kind==='primary'&&n.symbol==='G7'&&n.outside.includes('B')));
  const c=context.MBS2Theory.buildChord('C','major'),shape=context.MBS2Guitar.generateVoicings(c,context.MBS2Guitar.TUNINGS[0],0,{maxResults:12})[0];
  assert.deepEqual(Array.from(shape.frets),[-1,3,2,0,1,0]);assert.equal(context.MBS2App.getState().mode,'explore');
});
check('Tek dosya sürümü 48 gitar örneğini gömülü PCM olarak taşır ve ağ istemeden çalar',()=>{
  const context={document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=>null},console};
  vm.createContext(context);for(const [,code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(code,context);
  const bank=context.MBS2GuitarSamples;assert.equal(bank.records.length,48);
  for(const r of bank.records){assert.equal(r.pcm,fs.readFileSync(path.join(base,r.url)).toString('base64'),r.name);}
  assert(!/fetch\(/.test(fs.readFileSync(path.join(base,'guitar-samples.js'),'utf8')));
});
module.exports=checks;
