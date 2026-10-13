const assert=require('node:assert/strict'),T=require('../theory.js'),G=require('../guitar.js'),V=require('../voicing-engine.js'),C=require('../voicing-catalog.js');
const checks=[];function check(name,fn){fn();checks.push(name);}
const standard=G.TUNINGS[0],roots=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const actual=(shape,tuning=standard,capo=0)=>shape.frets.flatMap((f,s)=>f<0?[]:[G.positionMidi(tuning,s,f,capo)]);
const pcs=notes=>[...new Set(notes.map(n=>T.mod(n)))].sort((a,b)=>a-b);
check('33 temel şablon akor kimliğini korur; C7 beşli eksikliği belirtilir ve capo altı şablon reddedilir',()=>{
  assert.equal(G.STANDARD_SHAPES.length,33);
  for(const shape of G.STANDARD_SHAPES){
    const root=shape.symbol.match(/^[A-G]/)[0],chord=T.CHORD_TYPES.map(type=>T.buildChord(root,type.id)).find(c=>c.symbol===shape.symbol);
    assert(chord,shape.symbol);const inspected=V.inspectShape(shape,chord);assert(inspected,shape.id);
    assert(pcs(actual(shape)).every(pc=>chord.pitchClasses.includes(pc)),shape.id);
    if(shape.symbol==='C7')assert.deepEqual(inspected.omittedLabels,['5']);else assert(G.shapeIsChord(shape,chord),shape.id);
  }
  assert.deepEqual(G.generateVoicings(T.buildChord('C','dominant7'))[0].frets,[-1,3,2,3,1,0]);
  assert.deepEqual(G.generateVoicings(T.buildChord('C','major'),standard,0,{family:'barre'})[0].frets,[-1,3,5,5,5,3]);
  assert.equal(G.shapePitchClasses({frets:[0,2,2,1,0,0]},standard,2),null);
});
check('Katalog 3.212 benzersiz fiziksel konum içerir; tüm konumlar 0–24 ve gerçek MIDI aralığındadır',()=>{
  assert.equal(C.records.length,3212);const seen=new Set();
  for(const [root,frets,barres] of C.records){assert(root>=0&&root<12);assert.equal(frets.length,6);assert(frets.every(f=>Number.isInteger(f)&&f>=-1&&f<=24));const key=root+':'+frets;assert(!seen.has(key));seen.add(key);for(const [f,a,b] of barres){assert(f>0&&a>=0&&b<6&&a<b);}}
});
check('Beş ayrı basma eylemi isteyen tutuş, dört perde açıklığına sığsa da elenir',()=>{
  assert.equal(V.fingering([7,8,9,10,11,7]).playable,false);assert.equal(V.fingering([7,8,9,10,11,7]).reason,'fingers');
});
check('Bare açık telin üstünden geçemez; F bareyle, C üç bağımsız basmayla modellenir',()=>{
  const blocked=V.fingering([1,0,1,0,1,-1]);assert(blocked.playable);assert.equal(blocked.barres.length,0);assert.equal(blocked.fingerCount,3);
  const f=V.fingering([1,3,3,2,1,1]);assert(f.playable);assert(f.fingerCount<=4);assert(f.barres.some(b=>b.fret===1&&b.fromString===0&&b.toString===5));
  assert.equal(V.fingering([-1,3,2,0,1,0]).fingerCount,3);
});
check('Düşük pozisyondaki geniş gerilme reddedilir, aynı fret farkının yüksek pozisyonu ayrı hesaplanır',()=>{
  assert.equal(V.fingering([1,5,-1,-1,-1,-1]).playable,false);assert.equal(V.fingering([13,17,-1,-1,-1,-1]).playable,true);
});
check('Eski C ve F♯7 aramasının açık tel + uzak fret şekilleri yeniden ortaya çıkmaz',()=>{
  assert.equal(V.inspectShape({frets:[0,-1,-1,0,-1,8]},T.buildChord('C','major')),null);
  assert.equal(V.inspectShape({frets:[-1,-1,23,23,23,0],known:true},T.buildChord('F♯','dominant7')),null);
});
check('12 tonda majör/minör/7/maj7/m7/sus/eksik akorlar çok sayıda tam ve benzersiz alternatif üretir',()=>{
  for(const root of roots)for(const type of ['major','minor','dominant7','major7','minor7','sus2','diminished']){
    const chord=T.buildChord(root,type),shapes=G.generateVoicings(chord,standard,0,{maxFret:24,maxResults:72,completeness:'full'});
    assert(shapes.length>=20,chord.symbol+' alternatives: '+shapes.length);assert.equal(new Set(shapes.map(s=>s.frets.join(','))).size,shapes.length);
    for(const shape of shapes){assert.deepEqual(pcs(actual(shape)),[...chord.pitchClasses].sort((a,b)=>a-b));assert.deepEqual(actual(shape),shape.midis);assert(shape.ergonomics.fingerCount<=4);assert(shape.internalMutes<=1);assert.equal(shape.bassMidi,Math.min(...actual(shape)));}
  }
});
check('C/Am/G/F ilk önerileri alışılmış tam tutuşlardır; C kolay olarak gösterilir',()=>{
  for(const [root,type,frets] of [['C','major',[-1,3,2,0,1,0]],['A','minor',[-1,0,2,2,1,0]],['G','major',[3,2,0,0,0,3]],['F','major',[1,3,3,2,1,1]]])assert.deepEqual(G.generateVoicings(T.buildChord(root,type),standard,0,{maxFret:24,maxResults:12})[0].frets,frets);
  assert.equal(G.generateVoicings(T.buildChord('C','major'))[0].difficulty,'easy');
});
check('Drop 2 Cmaj7 x3545x ve Drop 3 Cmaj7 8x998x gerçek dört sesli yapıyla bulunur',()=>{
  const chord=T.buildChord('C','major7');
  for(const [family,frets] of [['drop2',[-1,3,5,4,5,-1]],['drop3',[8,-1,9,9,8,-1]]]){
    const shapes=G.generateVoicings(chord,standard,0,{maxFret:24,maxResults:120,family,completeness:'full'});assert(shapes.some(s=>s.frets.join(',')===frets.join(',')),family);
    for(const s of shapes){assert.equal(s.midis.length,4);assert.equal(new Set(pcs(s.midis)).size,4);assert.equal(V.dropFamily(s.midis),family);}
  }
});
check('Shell G7 3x34xx kök/üçlü/yediliyi korur ve yalnız doğal beşliyi çıkarır',()=>{
  const chord=T.buildChord('G','dominant7'),shapes=G.generateVoicings(chord,standard,0,{maxFret:24,maxResults:120,family:'shell'});
  assert(shapes.some(s=>s.frets.join(',')==='3,-1,3,4,-1,-1'));
  for(const s of shapes){assert.deepEqual(pcs(s.midis),[5,7,11]);assert.deepEqual(s.omittedLabels,['5']);assert.equal(s.family,'shell');}
});
check('C13 gitar voicing’leri C/E/B♭/A kimlik seslerini korur; çıkan sesler etiketlenir',()=>{
  const chord=T.buildChord('C','dominant13'),shapes=G.generateVoicings(chord,standard,0,{maxFret:24,maxResults:96});assert(shapes.length>=20);
  for(const s of shapes){const p=pcs(actual(s));for(const pc of [0,4,10,9])assert(p.includes(pc));assert(s.omittedLabels.every(label=>['5','9','11'].includes(label)));assert.equal(s.complete,false);}
  assert.equal(G.generateVoicings(chord,standard,0,{maxFret:24,maxResults:96,completeness:'full'}).length,0);
});
check('add9/alterasyon açıkça istenen renkleri korur; 7alt en az bir altered 5 ve 9 içerir',()=>{
  const fixtures=[T.buildChord('C','major',{add:['add9']}),T.buildChord('C','dominant13',{alter:['b9','sharp11','b13']}),T.buildChord('C','altered')];
  for(const chord of fixtures){const shapes=G.generateVoicings(chord,standard,0,{maxFret:24,maxResults:72});assert(shapes.length>0,chord.symbol);for(const s of shapes){const p=pcs(actual(s));if(chord.typeId==='altered'){assert(p.includes(4)&&p.includes(10)&&p.includes(0));assert(p.includes(6)||p.includes(8));assert(p.includes(1)||p.includes(3));}else for(const n of chord.notes.filter(n=>chord.modifiers.add.includes('add9')&&n.degree===9||[9,11,13].includes(n.degree)&&/[♭♯]/.test(n.label)))assert(p.includes(n.pc));}}
});
check('Capo 2’de D akoru C şekli x54232 ile bulunur; capo altı ses veya çift transpozisyon yoktur',()=>{
  const chord=T.buildChord('D','major'),shapes=G.generateVoicings(chord,standard,2,{maxFret:24,maxResults:144,completeness:'full'});
  assert(shapes.some(s=>s.frets.join(',')==='-1,5,4,2,3,2'));
  for(const s of shapes){assert(s.frets.every(f=>f<0||f>=2&&f<=24));assert.deepEqual(pcs(actual(s,standard,2)),[2,6,9]);}
});
check('Alternatif akort ve 4/7/8 telli akortlar gerçek tel notalarına göre aranır',()=>{
  const custom=[{id:'custom',notes:['E2','A2','D3','G3']},{id:'custom',notes:['B1','E2','A2','D3','G3','B3','E4']},{id:'custom',notes:['F♯1','B1','E2','A2','D3','G3','B3','E4']}];
  for(const tuning of [...G.TUNINGS.slice(1),...custom]){const chord=T.buildChord('D','minor7'),shapes=G.generateVoicings(chord,tuning,0,{maxFret:24,maxResults:48,completeness:'full'});assert(shapes.length>0,tuning.id);for(const s of shapes){assert.equal(s.frets.length,tuning.notes.length);assert.deepEqual(pcs(actual(s,tuning)),[0,2,5,9]);}}
});
check('Slash bası ilk telden değil gerçek en düşük MIDI sesinden doğrulanır',()=>{
  const tuning={id:'custom',notes:['E4','A2','D3','G3','B3','E4']},chord=T.buildChord('C','major'),shape={frets:[0,3,2,0,1,0]};
  assert.equal(V.inspectShape(shape,chord,tuning).bassPc,0);assert.equal(V.inspectShape(shape,{...chord,slashBassPc:4},tuning),null);
});
check('Zorluk, aile ve bas filtreleri sonuçları gerçekten sınırlar; sıralama deterministiktir',()=>{
  const chord=T.buildChord('C','major7'),options={maxFret:24,maxResults:48,family:'drop2',difficulty:'easy',bass:'root',completeness:'full'};
  const a=G.generateVoicings(chord,standard,0,options),b=G.generateVoicings(chord,standard,0,options);assert(a.length>0);assert.deepEqual(a,b);
  assert(a.every(s=>s.tags.includes('drop2')&&s.difficulty==='easy'&&s.bassPc===0));
});
module.exports=checks;
