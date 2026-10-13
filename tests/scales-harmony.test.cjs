const assert=require('node:assert/strict'),T=require('../theory.js'),C=require('../scale-catalog.js'),H=require('../harmony-engine.js'),M=require('../harmony-map.js'),G=require('../guitar.js');
const checks=[];function check(name,fn){fn();checks.push(name);}
const roots=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'],same=(a,b)=>assert.deepEqual([...a].sort((x,y)=>x-y),[...b].sort((x,y)=>x-y));
check('Gam kataloğu 92 kaynak kaydından ve mod rotasyonlarından 117 yaklaşım, 116 koleksiyon üretir',()=>{
  assert.equal(C.metadata.importedRows,92);assert.equal(C.records.length,117);assert.equal(new Set(C.records.map(s=>s.mask)).size,116);assert.equal(new Set(C.records.map(s=>s.id)).size,117);
  for(const s of C.records){assert.equal(s.intervals[0],0);assert.equal(s.intervals.length,new Set(s.intervals).size);assert.equal(s.intervals.length,s.steps.length);assert(s.aliases.every(a=>typeof a==='string'));}
});
check('Sekiz ana ailenin yedişer modu kayıpsız rotasyonla kaydedilir',()=>{
  const refs=C.records.flatMap(s=>s.parents.map(p=>[s,p]));assert.equal(refs.length,56);assert.equal(new Set(refs.map(([,p])=>p.parentId)).size,8);
  for(const [s,p] of refs){const expected=p.parentIntervals.map((_,j)=>T.mod(p.parentIntervals[(p.mode-1+j)%7]-p.parentIntervals[p.mode-1]));same(s.intervals,expected);assert.equal(s.tertian,true);}
});
check('117 gamın 12 tondaki bütün nota yazımları gerçek ses sınıflarıyla eşleşir',()=>{
  for(const root of roots)for(const s of T.SCALES){const scale=T.scaleNotes(root,s.id);same(scale.spellings.map(T.parseNote),scale.pcs);assert(scale.notes.every(n=>n.label));}
});
check('117 gamın 12 tondaki üçlü/yedili analizlerinde gam dışı derece sesi üretilmez',()=>{
  for(const root of roots)for(const s of T.SCALES)for(const size of [3,4]){
    const a=H.analyze(root,s.id,{chordSize:size});for(const c of a.chords){assert(c.pitchClasses.every(pc=>a.scale.pcs.includes(pc)),root+' '+s.id+' '+c.symbol);assert(c.record.notes.every(n=>T.parseNote(n.name)===n.pc));}
  }
});
check('Harmonik minörün bilinmeyen artmış maj7 akoru düz majör etiketiyle gizlenmez',()=>{
  const a=H.analyze('C','harmonicMinor',{chordSize:4}),third=a.chords[2];same(third.pitchClasses,[3,7,11,2]);assert.match(third.symbol,/\[1,3,♯5,7\]/);assert.match(third.roman,/\+/);
});
check('Melodik minörün altered modu ve armonisi enharmonik Fb yazımını korur',()=>{
  assert.deepEqual(T.scaleNotes('C','altered').spellings,['C','D♭','E♭','F♭','G♭','A♭','B♭']);const a=H.analyze('C','altered',{chordSize:4});same(a.chords[0].pitchClasses,[0,3,6,10]);assert.equal(a.chords[0].record.typeId,'halfDim7');
});
check('Bebop geçiş sesi sekizinci tonal dereceye dönüşmez; iskelet armonisi korunur',()=>{
  const a=H.analyze('C','majorBebop',{chordSize:4});assert.equal(a.chords.length,7);same(a.passing.map(n=>n.pc),[8]);assert.equal(a.chords[0].symbol,'Cmaj7');assert(a.chords.every(c=>!c.pitchClasses.includes(8)));
});
check('Aynı majör bebop koleksiyonu altılı–eksik yaklaşımda C6 ve Ddim7 olarak ele alınır',()=>{
  const a=H.analyze('C','majorSixDiminished');assert.deepEqual(a.chords.map(c=>c.symbol),['C6','Ddim7']);same([...new Set(a.chords.flatMap(c=>c.pitchClasses))],a.scale.pcs);assert.equal(a.profile.context,'sixthDiminished');
});
check('Tam ton/eksik ve Messiaen koleksiyonlarının sınırlı transpozisyon sayıları hesaplanır',()=>{
  const expected=[["wholeTone",2],["diminishedHW",3],["diminishedWH",3]];for(const [id,count] of expected)assert.equal(T.SCALES.find(s=>s.id===id).transpositionCount,count);
  for(const [mode,count] of [[3,4],[4,6],[5,6],[6,6],[7,6]]){const s=T.SCALES.find(s=>s.name==='Messiaen · Mod '+mode);assert(s);assert.equal(s.transpositionCount,count);}
});
check('Pentatonik/tam ton analizinde üyelik temelli akorlar bulunur, klasik işlev atanmaz',()=>{
  for(const id of ['majorPentatonic','wholeTone']){const g=H.buildGraph('C',id);assert.equal(g.functional,false);assert(g.nodes.length>0);assert(g.nodes.every(n=>n.kind==='diatonic'));assert(g.nodes.every(n=>n.pitchClasses.every(pc=>g.analysis.scale.pcs.includes(pc))));}
});
check('Modun ana gam kökü aynı ses kümesini yeniden üretir',()=>{
  for(const root of roots)for(const s of T.SCALES)for(const p of H.analyze(root,s.id).parents){const parent=T.scaleNotes(p.root,p.parentId);assert(parent,p.parentId);same(parent.pcs,T.scaleNotes(root,s.id).pcs);}
});
check('Doğal minör v ile yükseltilmiş öncü sesli V7 farklı ve görünür katmanlardır',()=>{
  const g=H.buildGraph('C','naturalMinor');assert.equal(g.nodes.find(n=>n.id==='diatonic-5').symbol,'Gm');const dom=g.nodes.find(n=>n.id==='primary-dominant');assert.equal(dom.symbol,'G7');assert.equal(dom.degree,'V7');assert.deepEqual(dom.outside,['B']);assert.equal(dom.functionLabel,'Tonik dominantı');
});
check('Majör ve minörde ikincil dominant hedefleri kökün beşli aralığıyla doğrulanır',()=>{
  for(const root of roots)for(const id of ['major','naturalMinor','harmonicMinor','melodicMinor','dorian']){const g=H.buildGraph(root,id);for(const n of g.nodes.filter(n=>n.kind==='secondary')){const target=g.nodes.find(t=>t.id===n.targetId);assert.equal(T.mod(n.rootPc-target.rootPc),7);assert.equal(n.record.typeId,'dominant7');assert(!['diminished','augmented'].includes(target.record.typeId));}}
});
check('İkincil öncü ses dim7 hedefin yarım ses altındadır; etiket hedef akorun yedilisini tekrarlamaz',()=>{
  const g=H.buildGraph('C','major',{leading:true,sevenths:true});for(const n of g.nodes.filter(n=>n.kind==='leading')){const target=g.nodes.find(t=>t.id===n.targetId);assert.equal(T.mod(n.rootPc-target.rootPc),11);assert.equal(n.record.typeId,'dim7');assert.doesNotMatch(n.degree,/\/.*7$/);}
});
check('Triton vekilleri hedefin yarım ses üstündedir ve V7 ile guide tone tritonunu paylaşır',()=>{
  const g=H.buildGraph('C','major',{tritone:true});for(const n of g.nodes.filter(n=>n.kind==='tritone')){const target=g.nodes.find(t=>t.id===n.targetId),v=T.buildChord(T.noteName(target.rootPc+7),'dominant7');assert.equal(T.mod(n.rootPc-target.rootPc),1);same(n.record.notes.filter(t=>[3,7].includes(t.degree)).map(t=>t.pc),v.notes.filter(t=>[3,7].includes(t.degree)).map(t=>t.pc));}
});
check('İlgili ii–V majör hedefte minör7, minör hedefte yarı eksik7 kullanır',()=>{
  const g=H.buildGraph('C','major',{relatedII:true});assert.equal(g.nodes.find(n=>n.id==='relatedII-1').symbol,'Dm7');assert.equal(g.nodes.find(n=>n.id==='relatedII-6').symbol,'Bm7♭5');assert(g.edges.some(e=>e.from==='relatedII-6'&&e.to==='relatedII-V-6'));
});
check('Paralel gam seçimi majör/minör/diğer modlar arasında gerçek kaynak ve değişen sesler taşır',()=>{
  const g=H.buildGraph('C','naturalMinor',{borrowSource:'major'});assert(g.nodes.some(n=>n.kind==='borrowed'&&n.symbol==='F'));assert(g.nodes.filter(n=>n.kind==='borrowed').every(n=>n.sourceScaleId==='major'));
  const d=H.buildGraph('C','major',{borrowSource:'dorian'});assert(d.nodes.some(n=>n.kind==='borrowed'&&n.symbol==='Cm'));assert(d.nodes.filter(n=>n.kind==='borrowed').every(n=>n.sourceScaleId==='dorian'));
});
check('Napoliten Db/F ve artmış altılılar doğru ses yazımı ve gerçek hedefle üretilir',()=>{
  const g=H.buildGraph('C','major',{chromatic:true}),n=g.nodes.find(n=>n.id==='neapolitan');assert.equal(n.symbol,'D♭/F');assert.equal(n.record.slashBassPc,5);
  assert(G.generateVoicings(n.record,G.TUNINGS[0],0,{maxResults:12}).every(v=>v.bassPc===5));
  const ger=g.nodes.find(n=>n.id==='aug-sixth-ger');assert.deepEqual(ger.record.notes.map(n=>n.name),['A♭','C','E♭','F♯']);same(ger.pitchClasses,[8,0,3,6]);assert.equal(ger.record.typeId,null);assert.equal(ger.record.notes.at(-1).label,'♯6');assert(g.edges.some(e=>e.from===ger.id&&e.to==='primary-dominant'));
});
check('Blues eşliğinde C7/F7/G7 melodik blues kümesinden ayrı etiketlenir',()=>{
  const g=H.buildGraph('C','blues',{bluesHarmony:true});assert.deepEqual(g.nodes.filter(n=>n.kind==='bluesHarmony').map(n=>n.symbol),['C7','F7','G7']);assert(g.nodes.filter(n=>n.kind==='bluesHarmony').some(n=>n.outside.includes('E')));assert.equal(g.functional,false);
});
check('Kromatik medyanlar aynı kalite, üçlü uzaklığı ve tek ortak sesle seçilir',()=>{
  const g=H.buildGraph('C','major',{mediants:true}),tonic=g.nodes.find(n=>n.id==='diatonic-1');assert.equal(g.nodes.filter(n=>n.kind==='mediants').length,4);for(const n of g.nodes.filter(n=>n.kind==='mediants')){assert([3,4,8,9].includes(T.mod(n.rootPc-tonic.rootPc)));assert.equal(n.pitchClasses.filter(pc=>tonic.pitchClasses.includes(pc)).length,1);}
});
check('Renk gerilimleri akor dışı gam seslerini gösterir; yarım ses çakışması bağlama bağlı işaretlenir',()=>{
  const a=H.analyze('C','major',{chordSize:4}),t=H.tensionInfo(T.buildChord('C','major7'),a.scale);assert.deepEqual(t.tensions.map(n=>n.label),['9','11','13']);assert.deepEqual(t.cautionNotes.map(n=>n.name),['F']);
});
check('Kültürel katalog adları 12-TET yaklaşımı olarak belirtilir; makam/raga icrası vaat edilmez',()=>{
  const s=T.SCALES.find(s=>s.id==='pelog');assert(s.culturalApproximation);assert.match(s.name,/12-TET/);assert(H.analyze('C',s.id).notices.some(n=>n.includes('mikroton')));
});
check('Harita yerleşimi 240–720 genişlikte 12 görünür akoru kenara taşırmaz veya çakıştırmaz',()=>{
  for(const width of [240,280,339,340,370,720]){const nodes=H.buildGraph('C','chromatic').nodes.filter(n=>n.kind==='diatonic').slice(0,12),l=M.layout(nodes,width);for(const p of l.positions){assert(p.x-l.cardWidth/2>=0&&p.x+l.cardWidth/2<=width);assert(p.y+52<l.height);}for(let i=0;i<l.positions.length;i++)for(let j=i+1;j<l.positions.length;j++){const a=l.positions[i],b=l.positions[j];assert(Math.abs(a.x-b.x)>=l.cardWidth||Math.abs(a.y-b.y)>=104);}}
});
check('Doryen tam dörtlü yapıları gerçek C-F-Bb-Eb seslerinden kurulur, tonal işlev uydurulmaz',()=>{
  const a=H.analyze('C','dorian',{chordSize:4,grammar:'quartal'});same(a.chords[0].pitchClasses,[0,5,10,3]);assert.equal(a.chords[0].symbol,'C Q4');assert.equal(a.profile.functional,false);for(const c of a.chords)assert(c.pitchClasses.every(pc=>a.scale.pcs.includes(pc)));
});
check('Ses üyeliği modu majör gamın sus akorlarını içerir; otomatik derecelerden farklıdır',()=>{
  const a=H.analyze('C','major',{grammar:'contained'});assert(a.chords.some(c=>c.symbol==='Csus2'));assert(a.chords.length>7);assert.equal(a.profile.functional,false);
});
check('Minör pentatonik birden fazla armonik bağlama genişleyebilir; ek sesler açıkça gösterilir',()=>{
  const a=H.analyze('C','minorPentatonic');assert(a.supersets.some(s=>s.id==='dorian'));assert(a.supersets.some(s=>s.id==='naturalMinor'));for(const s of a.supersets){const p=T.scaleNotes('C',s.id);assert(a.scale.pcs.every(pc=>p.pcs.includes(pc)));assert(s.added.every(n=>!a.scale.pcs.includes(n.pc)));}
});
module.exports=checks;
