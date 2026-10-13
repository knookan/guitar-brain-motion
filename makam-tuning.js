/* 53-EDO reference engine. Comma counts model AEU interval diagrams approximately;
   they are neither exact Pythagorean AEU ratios nor a universal performance tuning.
   Source-backed optional examples remain explicit, never inferred from a scale. */
(function(root){
  'use strict';
  const COMMA_CENTS=1200/53;
  const labels={1:['Koma','Comma'],3:['Eksik bakiye','Reduced bakiye'],4:['Bakiye','Bakiye'],5:['Küçük mücennep','Small mucennep'],8:['Büyük mücennep','Large mucennep'],9:['Tanini','Tanini'],12:['Artık ikili','Augmented second'],13:['Artık ikili','Augmented second']};
  const SOURCE_USSAK='https://islamansiklopedisi.org.tr/ussak',SOURCE_HUZZAM='https://islamansiklopedisi.org.tr/huzzam';
  const example=(id,nameTr,nameEn,index,delta,source)=>Object.freeze({id,nameTr,nameEn,index,delta,source});
  const examples=Object.freeze({
    'makam-ussak':Object.freeze([example('ussak-1','İniş örneği · II −1 koma','Descending example · II −1 comma',1,-1,SOURCE_USSAK),example('ussak-2','İniş örneği · II −2 koma','Descending example · II −2 commas',1,-2,SOURCE_USSAK)]),
    'makam-huzzam':Object.freeze([example('huzzam-1','Hisar örneği · IV +1 koma','Hisar example · IV +1 comma',3,1,SOURCE_HUZZAM),example('huzzam-1.5','Hisar örneği · IV +1,5 koma','Hisar example · IV +1.5 commas',3,1.5,SOURCE_HUZZAM)])
  });
  // Names are written traditional positions, not a claim about concert register/ahenk.
  const perdeNames={
    'makam-rast':['Rast','Dügâh','Segâh','Çargâh','Nevâ','Hüseynî','Eviç','Gerdâniye'],
    'makam-acemli-rast':['Rast','Dügâh','Segâh','Çargâh','Nevâ','Hüseynî','Acem','Gerdâniye'],
    'makam-ussak':['Dügâh','Segâh','Çargâh','Nevâ','Hüseynî','Acem','Gerdâniye','Muhayyer'],
    'makam-bayati':['Dügâh','Segâh','Çargâh','Nevâ','Hüseynî','Acem','Gerdâniye','Muhayyer'],
    'makam-huseyni':['Dügâh','Segâh','Çargâh','Nevâ','Hüseynî','Eviç','Gerdâniye','Muhayyer'],
    'makam-acemli-huseyni':['Dügâh','Segâh','Çargâh','Nevâ','Hüseynî','Acem','Gerdâniye','Muhayyer'],
    'makam-neva':['Dügâh','Segâh','Çargâh','Nevâ','Hüseynî','Eviç','Gerdâniye','Muhayyer'],
    'makam-hicaz':['Dügâh','Dik-kürdî','Nîm-hicaz','Nevâ','Hüseynî','Eviç','Gerdâniye','Muhayyer'],
    'makam-humayun':['Dügâh','Dik-kürdî','Nîm-hicaz','Nevâ','Hüseynî','Acem','Gerdâniye','Muhayyer'],
    'makam-uzzal':['Dügâh','Dik-kürdî','Nîm-hicaz','Nevâ','Hüseynî','Eviç','Gerdâniye','Muhayyer'],
    'makam-suzinak':['Rast','Dügâh','Segâh','Çargâh','Nevâ','Hisar','Eviç','Gerdâniye'],
    'makam-karcigar':['Dügâh','Segâh','Çargâh','Nevâ','Hisar','Eviç','Gerdâniye','Muhayyer'],
    'makam-huzzam':['Segâh','Çargâh','Nevâ','Hisar','Eviç',null,null,'Tiz segâh'],
    'makam-segah':['Segâh','Çargâh','Nevâ','Dik-hisar','Eviç',null,null,'Tiz segâh'],
    'makam-saba':['Dügâh','Segâh','Çargâh','Hicaz']
  };
  // Only source-supported written accidentals are listed. These are notation,
  // not cents measured from a 12-TET note and not transposed concert spellings.
  const writtenNotes={
    'makam-rast':['G','A','B ↓1','C','D','E','F ↑4','G'],
    'makam-acemli-rast':['G','A','B ↓1','C','D','E','F','G'],
    'makam-ussak':['A','B ↓1','C','D','E','F','G','A'],
    'makam-huseyni':['A','B ↓1','C','D','E','F ↑4','G','A'],
    'makam-acemli-huseyni':['A','B ↓1','C','D','E','F','G','A'],
    'makam-neva':['A','B ↓1','C','D','E','F ↑4','G','A'],
    'makam-hicaz':['A','B ↓4','C ↑4','D','E','F ↑4','G','A'],
    'makam-karcigar':['A','B ↓1','C','D','E ↓4','F ↑4','G','A'],
    'makam-suzinak':['G','A','B ↓1','C','D','E ↓4','F ↑4','G'],
    'makam-huzzam':['B ↓1','C','D','E ↓4','F ↑4',null,null,'B ↓1'],
    'makam-segah':['B ↓1','C','D','E ↓1','F ↑4',null,null,'B ↓1'],
    'makam-saba':['A','B ↓1','C','D ↓4']
  };
  function options(scale){return examples[scale?.id]||[];}
  function intervalName(commas,language='en'){const l=labels[commas];return l?l[language==='tr'?0:1]:(language==='tr'?'İcra aralığı':'Example interval');}
  function frequency(midi,referenceA=440){return referenceA*Math.pow(2,(midi-69)/12);}
  function analyze(scale,tonicMidi,settings={}){
    const m=scale?.makam;if(!m||!Number.isFinite(tonicMidi))return null;
    const mode=settings.mode==='equal'?'equal':'comma',referenceA=Number(settings.referenceA)||440;
    if(referenceA<400||referenceA>480)throw new RangeError('Reference A must be 400–480 Hz');
    const preset=options(scale).find(x=>x.id===settings.example)||null;
    const coordinates=m.commas.slice();if(preset&&mode==='comma')coordinates[preset.index]+=preset.delta;
    const tonicOffset=settings.notationAnchor&&mode==='comma'?(m.tonicOffsetCommas||0):0;
    const anchorMidi=tonicMidi+tonicOffset*12/53;
    const steps=coordinates.map((c,i)=>i?c-coordinates[i-1]:null);
    const closed=!m.partial&&coordinates.length===7;
    const full=settings.includeOctave===false||!closed?coordinates:[...coordinates,53];
    const rows=full.map((commas,i)=>{
      const referenceCents=commas*COMMA_CENTS,projection=Math.round(m.commas[i]===undefined?12:m.commas[i]*12/53);
      const midi=mode==='equal'?tonicMidi+projection:anchorMidi+referenceCents/100;
      const nearestMidi=Math.round(midi),offsetCents=(midi-nearestMidi)*100;
      const stepCommas=i?commas-full[i-1]:null;
      return Object.freeze({degree:i+1,commas,baseCommas:m.commas[i]??53,stepCommas,referenceCents,cents:(midi-tonicMidi)*100,midi,nearestMidi,offsetCents,offsetCommas:offsetCents/COMMA_CENTS,frequency:frequency(midi,referenceA),perde:perdeNames[scale.id]?.[i]||null,writtenNote:writtenNotes[scale.id]?.[i]||null,exampleDelta:mode==='comma'&&preset?.index===i?preset.delta:0});
    });
    return Object.freeze({model:mode==='equal'?'12-TET':'53-EDO · AEU interval approximation',mode,referenceA,tonicMidi,anchorMidi,tonicOffset,tonicHz:frequency(anchorMidi,referenceA),partial:!!m.partial,closed,rows:Object.freeze(rows),steps:Object.freeze(steps),example:mode==='comma'?preset:null,source:m.source});
  }
  function midis(scale,tonicMidi,settings={}){const a=analyze(scale,tonicMidi,settings);return a?a.rows.map(r=>r.midi+12*Math.log2(a.referenceA/440)):[];}
  const API=Object.freeze({COMMA_CENTS,intervalName,frequency,analyze,midis,options});root.MBS2MakamTuning=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
