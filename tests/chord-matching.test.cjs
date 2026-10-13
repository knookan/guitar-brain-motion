const assert=require('node:assert/strict'),T=require('../theory.js'),G=require('../guitar.js'),{fixture}=require('./harmony-ui.test.cjs');
const checks=[];function check(name,fn){fn();checks.push(name);}
check('Do/Do♯ çifti reddedilmez: add♭9 ve maj7 alternatifleri eksik notaları taşır',()=>{
  const a=T.findChordMatches([0,1],{bassPc:0});assert(a.some(c=>c.symbol==='C(add♭9)'&&c.matchKind==='partial'&&c.missingNotes.some(n=>n.pc===4)));assert(a.some(c=>c.symbol==='C♯maj7/C'));assert(a.some(c=>c.typeId==='dominantB9'&&c.rootPc===0));assert(a.every(c=>c.matchKind!=='exact'));
});
check('12 kökte ♭9 akorları tam tanınır, seçilmiş kromatik nota kaybolmaz',()=>{
  for(let root=0;root<12;root++){const pcs=[0,1,4,7,10].map(n=>T.mod(root+n)),a=T.findChordMatches(pcs,{bassPc:root});assert.equal(a[0].typeId,'dominantB9');assert.equal(a[0].rootPc,root);assert.equal(a[0].matchKind,'exact');assert.equal(a[0].missingNotes.length,0);}
});
check('Bütün iki/üç ses kombinasyonlarında öneriler seçili bütün sesleri kapsar',()=>{
  for(let a=0;a<12;a++)for(let b=a+1;b<12;b++)for(const pcs of [[a,b],...Array.from({length:11-b},(_,i)=>[a,b,b+i+1])]){const result=T.findChordMatches(pcs,{bassPc:a,limit:20});assert(result.length);for(const c of result){assert(pcs.every(pc=>c.pitchClasses.includes(pc)));assert.deepEqual(c.missingNotes.map(n=>n.pc).sort((x,y)=>x-y),c.notes.filter(n=>!pcs.includes(n.pc)).map(n=>n.pc).sort((x,y)=>x-y));if(c.matchKind==='exact')assert.equal(c.pitchClasses.length,pcs.length);}}
});
check('Temel üçlüler önce tam tanınır; beşlisi eksik ve köksüz yorumlar açıkça ayrılır',()=>{
  assert.equal(T.findChordMatches([0,4,7],{bassPc:0})[0].symbol,'C');const a=T.findChordMatches([0,4,10],{bassPc:0}).find(c=>c.typeId==='dominant7'&&c.rootPc===0);assert.equal(a.matchKind,'omitted');assert.deepEqual(a.missingNotes.map(n=>n.label),['5']);const rootless=T.findChordMatches([4,10,2],{bassPc:4,rootHint:'C'})[0];assert.equal(rootless.symbol,'C9/E');assert.equal(rootless.rootPresent,false);assert(rootless.missingNotes.some(n=>n.label==='1'));
});
check('Aynı kök/ses kümesi yinelenmez; add♭9 ile add♯9 birlikte korunur',()=>{
  const a=T.findChordMatches([0,1,3,4,7],{bassPc:0});assert(a.some(c=>c.rootPc===0&&c.matchKind==='exact'&&c.symbol.includes('add♭9,add♯9')));assert.equal(a.length,new Set(a.map(c=>c.rootPc+'|'+[...c.pitchClasses].sort().join())).size);
});
check('Kromatik on iki ses kümesi geleneksel akor diye uydurulmaz',()=>{
  const a=T.findChordMatches(Array.from({length:12},(_,i)=>i),{bassPc:0});assert.equal(a.length,1);assert.equal(a[0].matchKind,'collection');assert.equal(a[0].pitchClasses.length,12);
});
check('Notes gerçek kartları eksik ses/bas gösterir, daha fazla öneri ve Seç/Çal/Arpej çalışır',()=>{
  const f=fixture(true,JSON.stringify({version:1,selectedPositions:[{stringIndex:1,fret:3},{stringIndex:1,fret:4}]}));f.app.setMode('explore');assert(f.host.innerHTML.includes('Possible chord'));assert(f.host.innerHTML.includes('Missing tones:'));assert(f.host.innerHTML.includes('C(add♭9)'));assert(!f.host.innerHTML.includes('No exact chord match'));
  assert.equal((f.host.innerHTML.match(/class="degree-card match-card"/g)||[]).length,6);f.action('moreChordMatches');assert.equal((f.host.innerHTML.match(/class="degree-card match-card"/g)||[]).length,12);f.action('playMatch');f.action('arpMatch');assert.equal(f.audio.length,2);assert.equal(f.audio[1].arp,true);for(const e of f.audio)assert([0,1].every(pc=>Array.from(e.notes).some(n=>T.mod(n)===pc)));
  f.action('useChordMatch');assert.equal(f.app.getState().mode,'chord');assert.deepEqual(Array.from(f.app.getState().chordEvidence),[0,1]);assert(f.app.sceneState().activeVoicing.pcs.includes(1));
});
check('Pratik gitar tutuşu seçilmiş doğal beşliyi veya iç gerilimi çıkarmayabilir',()=>{
  const chord=T.findChordMatches([0,2,4,7,10],{bassPc:0})[0],shapes=G.generateVoicings(chord,G.TUNINGS[0],0,{maxResults:24});assert(shapes.length);for(const shape of shapes)assert(chord.inputPitchClasses.every(pc=>shape.pcs.includes(pc)));
});
check('Tek ses akor diye sunulmaz; tam eşlemenin eski anlamı korunur',()=>{
  assert.deepEqual(T.findChordMatches([0]),[]);assert.deepEqual(T.exactChordMatch([0,1]),[]);assert(T.exactChordMatch([0,4,7]).some(c=>c.typeId==='major'&&c.rootPc===0));
});
module.exports=checks;
