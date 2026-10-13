/* Embedded module checks; this does not render a browser or play sound. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'..'),html=fs.readFileSync(path.join(base,'Muzik_Beyni_Studio_V2.html'),'utf8');
const names=['scale-catalog','makam-catalog','makam-tuning','i18n','theory','chord-pool','voicing-catalog','guitar','voicing-engine','chord-diagram','guitar-samples','audio','harmony-engine','harmony-map','export','scene','pwa','app'];
const checks=[];function check(name,fn){fn();checks.push(name);}
check('Dağıtılan tek HTML gerçek gitar kayıtlarıyla on beş kaynak modülünü eksiksiz taşır',()=>{
  for(const name of names)assert(html.includes(fs.readFileSync(path.join(base,name+'.js'),'utf8')),name);
});
check('Gömülü modüller birlikte yüklenir: 144 yaklaşım, minör V7 ve bilinen C tutuşu korunur',()=>{
  const context={document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=>null},console};
  vm.createContext(context);for(const [,code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(code,context);
  assert.equal(context.MBS2Theory.SCALES.length,144);assert.equal(context.MBS2App.getState().language,'en');
  assert(context.MBS2Harmony.buildGraph('C','naturalMinor',{primary:true}).nodes.some(n=>n.kind==='primary'&&n.symbol==='G7'&&n.outside.includes('B')));
  const c=context.MBS2Theory.buildChord('C','major'),shape=context.MBS2Guitar.generateVoicings(c,context.MBS2Guitar.TUNINGS[0],0,{maxResults:12})[0];
  assert.deepEqual(Array.from(shape.frets),[-1,3,2,0,1,0]);assert.equal(context.MBS2App.getState().mode,'explore');
});
module.exports=checks;
