const assert=require('node:assert/strict'),T=require('../theory.js'),G=require('../guitar.js'),P=require('../chord-pool.js');
const checks=[];function check(name,fn){fn();checks.push(name);}
check('Dm7/G7/Cmaj7 havuzunun birleşimi C majörü kapsar, tonik filtresi gerçek kökü sınırlar',()=>{
  const chords=[T.buildChord('D','minor7'),T.buildChord('G','dominant7'),T.buildChord('C','major7')],r=P.analyze(chords,{tonic:'C'});
  assert.deepEqual(r.union,[0,2,4,5,7,9,11]);assert(r.results.some(s=>s.scaleId==='major'));assert(r.results.every(s=>s.rootPc===0));
  for(const s of r.results)for(const c of chords)assert(c.pitchClasses.every(pc=>s.pcs.includes(pc)));
});
check('Bütün 12 ses için kromatik seçenek kapalıyken ortak gam uydurulmaz, per-chord seçenekler korunur',()=>{
  const chords=['C','C#','D','D#'].map(n=>T.buildChord(n,'dim7')),r=P.analyze(chords);
  assert.equal(r.union.length,12);assert.equal(r.hasCommon,false);assert.equal(r.perChord.length,4);assert(r.perChord.every(c=>c.results.length>0));
  assert(P.analyze(chords,{includeChromatic:true}).results.every(s=>s.total===12));
});
check('Havuz normalizasyonu bozuk veriyi eler, boş havuz sonuç üretmez',()=>{
  assert.deepEqual(P.normalize([{symbol:'C',pitchClasses:[0,0,4,7,99,NaN,'G']}]),[{symbol:'C',pitchClasses:[0,4,7]}]);assert.equal(P.analyze([]).results.length,0);
});
check('Armoni havuzunun gerçek olayları ekleme, silme, tonik, çalma ve gama geçişi çalıştırır',()=>{
  const f=require('./harmony-ui.test.cjs').fixture(true);f.action('scaleHarmony');f.action('poolExample');assert.equal(f.app.getState().chordPool.length,3);assert(f.host.innerHTML.includes('Common scales'));
  f.change('poolTonic','C');assert(f.app.getState()._poolAnalysis.results.every(s=>s.rootPc===0));
  const button=(action,extra=()=>true)=>f.host.controls.find(b=>b.dataset.action===action&&extra(b));
  button('playPoolScale',b=>b.dataset.scale==='major').emit('click');assert.equal(f.audio.at(-1).arp,true);
  button('usePoolScale',b=>b.dataset.scale==='major').emit('click');assert.equal(f.app.getState().harmonyScale,'major');assert.equal(f.app.getState().mode,'harmony');
  button('removePool',b=>b.dataset.index==='0').emit('click');assert.equal(f.app.getState().chordPool.length,2);f.action('clearPool');assert.equal(f.app.getState().chordPool.length,0);
});
check('Gerçek derece kartından ekleme, kayıt yükleme ve gam karşılaştırma olayları çalışır',()=>{
  const F=require('./harmony-ui.test.cjs').fixture,f=F();f.host.controls.find(b=>b.dataset.cardAction==='poolDegree').emit('click');assert.equal(f.app.getState().chordPool.length,1);
  const loaded=F(false,f.preferences.saved);assert.equal(loaded.app.getState().chordPool.length,1);
  f.change('compareScale','naturalMinor');f.change('positionFocus','5-9');assert.deepEqual(Array.from(f.app.sceneState().comparisonPcs),[0,2,3,5,7,8,10]);assert.deepEqual(Array.from(f.app.sceneState().positionWindow),[5,9]);
});
check('High/Low G ve bariton ukulele oktavlarını ve reentrant bası doğru korur',()=>{
  const high=G.TUNINGS.find(t=>t.id==='ukuleleHighG'),low=G.TUNINGS.find(t=>t.id==='ukuleleLowG'),baritone=G.TUNINGS.find(t=>t.id==='ukuleleBaritone');
  assert.deepEqual(high.notes.map(G.midiFromNote),[67,60,64,69]);assert.deepEqual(low.notes.map(G.midiFromNote),[55,60,64,69]);assert.deepEqual(baritone.notes.map(G.midiFromNote),[50,55,59,64]);
  const chord=T.buildChord('C','major'),voices=G.generateVoicings(chord,high,0,{maxResults:24});assert(voices.length>2);for(const v of voices){assert.equal(v.frets.length,4);assert.equal(v.bassMidi,Math.min(...v.midis));assert(v.pcs.every(pc=>chord.pitchClasses.includes(pc)));}
});
check('Playback sahnesi yalnız çalan fiziksel perdeyi aydınlatır, sonraki nota ve Stop temizlenir',()=>{
  const f=require('./scene.test.cjs').fixture();f.scene.update(f.state);f.flush();let time=0,token=1;
  const events=[{midi:48,start:.1,end:.5},{midi:52,start:.6,end:1}];f.scene.setPlayback(()=>({events,time,token}),[{midi:48,stringIndex:1,fret:3},{midi:52,stringIndex:2,fret:2}]);
  const layer=()=>f.svg.children.find(n=>n.attributes.class==='playback-layer');f.flush();assert.equal(layer().children.length,0);
  time=.2;f.flush();assert.equal(layer().children[0].attributes['data-fret'],'3');assert.equal(layer().children[0].attributes['data-string'],'1');
  time=.7;f.flush();assert.equal(layer().children.length,1);assert.equal(layer().children[0].attributes['data-fret'],'2');token++;f.flush();assert.equal(layer().children.length,0);
});
module.exports=checks;
