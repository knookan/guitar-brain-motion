/* Harmonic grammar and pitch calculations; independent of DOM and guitar voicings. */
(function(root){
  'use strict';
  const T=root.MBS2Theory||(typeof require!=='undefined'?require('./theory.js'):null);
  const SOURCES={tonal:'https://viva.pressbooks.pub/openmusictheory/chapter/tonicization/',mixture:'https://viva.pressbooks.pub/openmusictheory/chapter/modal-mixture/',jazz:'https://viva.pressbooks.pub/openmusictheorycopy/chapter/chord-scale-theory/',modal:'https://viva.pressbooks.pub/openmusictheory/chapter/modal-schemas/',collection:'https://viva.pressbooks.pub/openmusictheory/chapter/analyzing-with-collections-scales-and-modes/',substitution:'https://viva.pressbooks.pub/openmusictheory/chapter/substitutions/',chromatic:'https://milnepublishing.geneseo.edu/fundamentals-function-form/chapter/32-augmented-sixth-sonorities/',sixth:'https://www.youtube.com/watch?v=_n0vuuKdUyM'};
  const LAYERS=Object.freeze([
    {id:'primary',name:'Tonik dominantı',explanation:'Merkeze V7 yaklaşımı. Doğal minörde yükseltilmiş 7. sesi gerektirir.'},
    {id:'secondary',name:'İkincil dominantlar',explanation:'Majör/minör hedefleri geçici merkez olarak vurgulayan V7 akorları.'},
    {id:'borrowed',name:'Paralelden ödünç',explanation:'Aynı tonikten başlayan farklı gamın akorları.'},
    {id:'leading',name:'Öncü ses eksik 7',explanation:'Hedefin yarım ses altındaki vii°7; enharmonik hedefler farklı olabilir.'},
    {id:'tritone',name:'Triton vekilleri',explanation:'Hedefin yarım ses üstünden subV7; dominantın tritonunu paylaşır.'},
    {id:'relatedII',name:'İlgili ii–V',explanation:'Majör hedef için ii7–V7; minör hedef için iiø7–V7.'},
    {id:'chromatic',name:'Napoliten / +6',explanation:'Tonal bağlamda ♭II6 ve İtalyan/Fransız/Alman artmış altılı yaklaşımı.'},
    {id:'commonTone',name:'Ortak ses eksik 7',explanation:'Tonik kökünü tutan dim7 renk/süsleme akoru.'},
    {id:'mediants',name:'Kromatik medyanlar',explanation:'Üçlü uzaklıktaki, aynı kaliteli ve ortak sesli renk ilişkileri.'},
    {id:'bluesHarmony',name:'Blues armonisi',explanation:'I7 / IV7 / V7 akorları blues melodik kümesinin dışına çıkabilir.'}
  ]);
  const modeColors={major:[11],dorian:[9],phrygian:[1],lydian:[6],mixolydian:[10],naturalMinor:[8,10],locrian:[1,6],harmonicMinor:[8,11],melodicMinor:[9,11],harmonicMajor:[8,11],altered:[1,3,6,8],'lydian-dominant':[6,10],'lydian-augmented':[6,8],'phrygian-dominant':[1,4,8]};
  const bebopBase={majorBebop:'major',dominantBebop:'mixolydian','bebop-minor':'dorian','minor-bebop':'naturalMinor','bebop-locrian':'locrian'};
  function profile(scale){
    const functional=['major','naturalMinor','harmonicMinor','melodicMinor','harmonicMajor'].includes(bebopBase[scale.id]||scale.id);
    if(scale.makam)return {context:'makam',label:'Makam armonisi · gitar yaklaşımı',description:'Makamın teorik koma seslerine klasik dominant/ödünç kuralları otomatik atanmaz.',functional:false,baseScaleId:null,source:scale.makam.source};
    const context=scale.harmony==='sixthDiminished'?'sixthDiminished':scale.harmony==='bebop'?'bebop':scale.harmony==='blues'?'blues':scale.harmony==='symmetric'?'symmetric':functional?'tonal':scale.tertian?'modal':'collection';
    const labels={tonal:'Tonal armoni',modal:'Modal armoni',bebop:'İskelet gam + geçiş sesleri',blues:'Blues melodisi ve eşlik',symmetric:'Simetrik koleksiyon',collection:'Gam içindeki akorlar',sixthDiminished:'Altılı / eksik dönüşümü'};
    const descriptions={tonal:'Derece akorları, merkez ve hedefe yönelen kromatik bağlantılar.',modal:'Karakteristik sesler ve modal merkez; klasik işlevler otomatik atanmaz.',bebop:'Geçiş sesleri yeni tonal dereceler oluşturmaz. Akorlar yedi sesli iskeletten kurulur.',blues:'Blue note ile eşlik akorları farklı ses kümeleri kullanabilir.',symmetric:'Birden fazla eşdeğer transpozisyon merkezi olabilir. Tonik, müzikal bağlamla belirlenir.',collection:'Akorlar bütün sesleri bu koleksiyonun içinde kaldığında gösterilir; Roma rakamıyla işlev uydurulmaz.',sixthDiminished:'Altılı akor ile aradaki eksik yedili birbirini tamamlar; sekiz ayrı tonal derece değildir.'};
    return {context,label:labels[context],description:descriptions[context],functional,baseScaleId:bebopBase[scale.id]||null,source:SOURCES[functional?'tonal':context==='modal'?'modal':context==='bebop'?'jazz':context==='sixthDiminished'?'sixth':'collection']};
  }
  function chordRecord(item){
    if(item.record)return item.record;
    if(item.chordId)return T.buildChord(item.root,item.chordId);
    const pcs=item.pitchClasses,intervals=item.intervals||[];
    return {root:item.root,rootPc:item.rootPc,typeId:null,symbol:item.symbol,typeName:item.chordName,pitchClasses:pcs,notes:pcs.map((pc,i)=>({pc,name:item.noteNames[i],degree:intervals[i]?.degree||i+1,label:intervals[i]?.label||String(i+1),semitones:T.mod(pc-item.rootPc)})),modifiers:{add:[],alter:[],omit:[]}};
  }
  function tensionInfo(chord,scale){
    const notes=scale.notes.filter(n=>!chord.pitchClasses.includes(n.pc));
    const tensions=notes.map(n=>{const semitones=T.mod(n.pc-chord.rootPc),label=({1:'♭9',2:'9',3:'♯9',5:'11',6:'♯11',8:'♭13',9:'13'})[semitones]||n.label;
      const caution=chord.notes.some(t=>[3,5].includes(t.degree)&&T.mod(n.pc-t.pc)===1);
      return {...n,label,caution};});
    return {tensions,cautionNotes:tensions.filter(n=>n.caution)};
  }
  function analyze(rootText,scaleId,{chordSize=3,grammar='auto'}={}){
    const scale=T.scaleNotes(rootText,scaleId);if(!scale)return null;const p=profile(scale.scale);
    let chords=p.baseScaleId?T.harmonizeScale(rootText,p.baseScaleId,chordSize):T.harmonizeScale(rootText,scaleId,chordSize);
    if(p.context==='sixthDiminished'){
      const base=T.buildChord(rootText,scale.scale.baseChord||'minor6'),dim=T.buildChord(T.spelling(rootText,2,scale.rootPc+2),'dim7');
      chords=[base,dim].map((c,i)=>({degree:i+1,root:c.root,rootPc:c.rootPc,symbol:c.symbol,chordId:c.typeId,noteNames:c.notes.map(n=>n.name),pitchClasses:c.pitchClasses,intervals:c.intervals,roman:i?'dim7':'6',construction:'sixthDiminished',record:c}));
    }
    if(grammar==='contained'){
      chords=T.harmonizeScale(rootText,scaleId,chordSize,{contained:true});p.context='collection';p.label='Ses üyeliğine göre akorlar';p.description='Tanınan akor türlerinin bütün sesleri seçili koleksiyonun içinde kalır; burada tonal işlev atanmaz.';p.functional=false;p.baseScaleId=null;
    }
    if(grammar==='quartal'){
      chords=[];p.context='quartal';p.label='Tam dörtlü armoni';p.description='Üst üste tam dörtlüler; yalnız bütün sesleri bu gama sığan yapılar gösterilir.';p.functional=false;p.baseScaleId=null;p.source='https://williamflynnguitar.github.io/music-tools/quartal-voicings/index.html';
      scale.notes.forEach((tone,index)=>{
        const notes=Array.from({length:chordSize},(_,i)=>{const semitones=i*5,degree=i*3+1;return {pc:T.mod(tone.pc+semitones),name:T.spelling(tone.name,degree,tone.pc+semitones),degree,semitones,label:['1','4','♭7','♭10'][i]};});
        if(!notes.every(n=>scale.pcs.includes(n.pc)))return;
        const record={root:tone.name,rootPc:tone.pc,typeId:null,symbol:tone.name+' Q'+chordSize,typeName:'Tam dörtlü yapı',notes,pitchClasses:notes.map(n=>n.pc),modifiers:{add:[],alter:[],omit:[]}};
        chords.push({degree:index+1,root:tone.name,rootPc:tone.pc,symbol:record.symbol,record,pitchClasses:record.pitchClasses,noteNames:notes.map(n=>n.name),intervals:notes,roman:tone.label,construction:'quartal'});
      });
    }
    chords=chords.map(c=>({...c,record:chordRecord(c),...tensionInfo(chordRecord(c),scale)}));
    const colors=(modeColors[scaleId]||scale.scale.intervals.filter((n,i)=>n!==[0,2,4,5,7,9,11][scale.scale.steps[i]]));
    const characteristic=scale.notes.filter(n=>colors.includes(n.interval));
    const base=p.baseScaleId?T.scaleNotes(rootText,p.baseScaleId):null,passing=base?scale.notes.filter(n=>!base.pcs.includes(n.pc)):[];
    const parents=scale.scale.parents.map(parent=>({...parent,root:T.spelling(rootText,8-(parent.mode-1)%7,scale.rootPc-parent.parentIntervals[parent.mode-1])}));
    const supersets=scale.pcs.length<7?T.SCALES.filter(s=>s.tertian&&s.intervals.every(Number.isFinite)&&scale.scale.intervals.every(pc=>s.intervals.includes(pc))).slice(0,6).map(s=>({id:s.id,name:s.name,added:T.scaleNotes(rootText,s.id).notes.filter(n=>!scale.pcs.includes(n.pc))})):[];
    return {scale,profile:p,chords,characteristic,passing,parents,supersets,makam:scale.scale.makam||null,notices:[...(scale.scale.makam?['Standart gitar haritası en yakın 12-TET perdeleri kullanır. Koma modeli teorik bir referanstır; icra entonasyonu değildir.',...(scale.scale.makam.partial?['Bu makam için yalnız alt dörtlü modellenmiştir; üst bölge ve tam seyir uygulanmaz.']:[])]:scale.scale.culturalApproximation?['Bu kayıt 12 eşit aralıklı ses koleksiyonudur; makam/raga seyri, mikrotonları ve geleneksel icrası modellenmez.']:[]),...(scaleId==='melodicMinor'?['Jazz biçimi iki yönde de aynı sesleri kullanır. Klasik inişte doğal minöre dönüş bu haritada uygulanmaz.']:[])]};
  }
  function buildGraph(rootText,scaleId,options={}){
    const analysis=analyze(rootText,scaleId,{chordSize:options.sevenths?4:3,grammar:options.grammar||'auto'});if(!analysis)return {nodes:[],edges:[],functional:false,scale:null,layers:[]};
    const {scale,profile:p}=analysis,effectiveId=p.baseScaleId||scaleId,nodes=[],edges=[],byId=new Map(),signature=c=>[...c.pitchClasses].sort((a,b)=>a-b).join(',');
    function add(record,id,kind,label,extra={}){
      const node={id,kind,role:kind,root:record.root,rootPc:record.rootPc,symbol:record.symbol,chordId:record.typeId,pitchClasses:record.pitchClasses,notes:record.pitchClasses,noteNames:record.notes.map(n=>n.name),intervals:record.intervals||record.notes,functionLabel:label,record,...extra};nodes.push(node);byId.set(id,node);return node;
    }
    function link(a,b,kind,label){if(a&&b)edges.push({from:a.id,to:b.id,kind,label});}
    const primaries=analysis.chords.map((item,i)=>{
      let role='color',label=p.context==='tonal'?'Derece akoru':'Gam içi';
      if(p.functional){if([1,3,6].includes(item.degree)){role='tonic';label='Tonik / renk';}else if([2,4].includes(item.degree)){role='prep';label='Hazırlık';}else if((effectiveId!=='naturalMinor')&&[5,7].includes(item.degree)){role='dominant';label='Dominant alanı';}}
      return add(item.record,'diatonic-'+(i+1),'diatonic',label,{degree:item.roman,degreeNumber:item.degree,role,roman:item.roman,tensions:item.tensions,x:25+(i%3)*25,y:18+Math.floor(i/3)*29});
    });
    const targetOf=d=>primaries.find(n=>n.degreeNumber===d),tonic=primaries.find(n=>n.rootPc===scale.rootPc)||null;
    if(p.functional){link(targetOf(2),targetOf(5),'prep-dom',effectiveId==='naturalMinor'?'ii° → v':'ii → V');link(targetOf(4),targetOf(5),'prep-dom',effectiveId==='naturalMinor'?'iv → v':'IV → V');link(targetOf(5),tonic,effectiveId==='naturalMinor'?'modal':'dom-tonic',effectiveId==='naturalMinor'?'v → i':'V → tonik');link(targetOf(5),targetOf(6),effectiveId==='naturalMinor'?'modal':'deceptive',effectiveId==='naturalMinor'?'Modal v → VI':'Aldatıcı hareket');}
    if(p.context==='sixthDiminished'){link(primaries[0],primaries[1],'color','6 → dim7');link(primaries[1],primaries[0],'color','dim7 → 6');}
    const eligible=primaries.filter(n=>['major','minor','major7','minor7','minorMajor7','major6','minor6','dominant7'].includes(n.record.typeId));
    const targetList=[...new Map(eligible.map(n=>[n.rootPc,n])).values()],relatedAllowed=['tonal','modal','bebop'].includes(p.context);
    const enabled=id=>options[id]??['primary','secondary','borrowed'].includes(id);
    const outside=record=>record.notes.filter(n=>!scale.pcs.includes(n.pc)).map(n=>n.name);
    function approach(target,type,offset,degree,id,kind){
      const name=T.spelling(target.root,degree,target.rootPc+offset),record=T.buildChord(name,type);
      const roman=String(target.degree).replace(/7$/,''),functionLabel=kind==='primary'?'Tonik dominantı':kind==='secondary'?'İkincil dominant':kind==='tritone'?'Triton vekili':'Öncü ses eksik yedili',symbol=kind==='primary'?'V7':(kind==='secondary'?'V7/':kind==='tritone'?'subV7/':'vii°7/')+roman;
      const n=add(record,id,kind,functionLabel,{degree:symbol,targetId:target.id,targetLabel:target.symbol,outside:outside(record),source:SOURCES[kind==='tritone'?'substitution':'tonal']});link(n,target,kind+'-edge','→ '+target.symbol);return n;
    }
    let primary=null;
    if(p.functional&&tonic&&enabled('primary'))primary=approach(tonic,'dominant7',7,5,'primary-dominant','primary');
    if(relatedAllowed){
      if(enabled('secondary'))for(const target of targetList.filter(n=>n.rootPc!==scale.rootPc))approach(target,'dominant7',7,5,'secondary-'+target.degreeNumber,'secondary');
      if(enabled('leading'))for(const target of targetList)approach(target,'dim7',-1,7,'leading-'+target.degreeNumber,'leading');
      if(enabled('tritone'))for(const target of targetList)approach(target,'dominant7',1,2,'tritone-'+target.degreeNumber,'tritone');
      if(enabled('relatedII'))for(const target of targetList){
        const minor=['minor','minor7','minorMajor7','minor6'].includes(target.record.typeId),name=T.spelling(target.root,2,target.rootPc+2),record=T.buildChord(name,minor?'halfDim7':'minor7'),roman=String(target.degree).replace(/7$/,'');
        const ii=add(record,'relatedII-'+target.degreeNumber,'relatedII','İlgili ii–V',{degree:(minor?'iiø7/':'ii7/')+roman,targetLabel:target.symbol,targetId:target.id,outside:outside(record),source:SOURCES.jazz});
        const dominantRecord=T.buildChord(T.spelling(target.root,5,target.rootPc+7),'dominant7');
        const v=add(dominantRecord,'relatedII-V-'+target.degreeNumber,'relatedII','İlgili ii–V dominantı',{degree:'V7/'+roman,targetLabel:target.symbol,targetId:target.id,outside:outside(dominantRecord),source:SOURCES.jazz});
        link(ii,v,'relatedII-edge','ii → V');link(v,target,'relatedII-edge','V → '+target.symbol);
      }
      if(enabled('borrowed')){
        const minor=scale.scale.intervals.includes(3)&&!scale.scale.intervals.includes(4),sourceId=options.borrowSource&&options.borrowSource!=='auto'?options.borrowSource:minor?'major':'naturalMinor';
        if(sourceId!==scaleId&&T.SCALES.some(s=>s.id===sourceId)){
          const source=T.scaleNotes(rootText,sourceId),original=new Set(primaries.map(n=>signature(n.record)));
          for(const item of T.harmonizeScale(rootText,sourceId,options.sevenths?4:3)){
            const record=chordRecord(item);if(original.has(signature(record)))continue;
            const n=add(record,'borrowed-'+item.degree,'borrowed',source.scale.name+' gamından ödünç',{degree:item.roman,targetLabel:rootText+' merkezi',targetId:tonic?.id,sourceScaleId:sourceId,sourceScaleName:source.scale.name,outside:outside(record),source:SOURCES.mixture});
            if(tonic)link(n,tonic,'borrowed-edge','Olası merkeze dönüş · zorunlu çözülme değil');
          }
        }
      }
      if(enabled('commonTone')&&tonic){const record=T.buildChord(rootText,'dim7'),n=add(record,'common-tone','commonTone','Ortak köklü komşu renk',{degree:'CT°7',targetLabel:tonic.symbol,outside:outside(record),source:'https://viva.pressbooks.pub/openmusictheory/chapter/jazz-embellishing-chords/'});link(n,tonic,'color','Ortak '+rootText+' sesi');}
      if(enabled('mediants')&&tonic){const quality=tonic.record.pitchClasses.includes(T.mod(scale.rootPc+4))?'major':'minor';for(const [offset,degree] of [[3,3],[4,3],[8,6],[9,6]]){
        const record=T.buildChord(T.spelling(rootText,degree,scale.rootPc+offset),quality),shared=record.pitchClasses.filter(pc=>tonic.pitchClasses.includes(pc));
        if(shared.length!==1||primaries.some(n=>signature(n.record)===signature(record)))continue;
        const n=add(record,'mediant-'+offset,'mediants','Kromatik üçlü uzaklığı',{degree:'Renk',targetLabel:tonic.symbol,outside:outside(record),source:'https://viva.pressbooks.pub/openmusictheory/chapter/mediants/'});link(n,tonic,'color','Ortak ses ilişkisi');
      }}
    }
    if(p.functional&&enabled('chromatic')){
      if(!primary&&tonic)primary=approach(tonic,'dominant7',7,5,'primary-dominant','primary');
      const db=T.buildChord(T.spelling(rootText,2,scale.rootPc+1),'major'),bass=T.spelling(rootText,4,scale.rootPc+5),n6={...db,symbol:db.symbol+'/'+bass,slashBassPc:T.mod(scale.rootPc+5)};
      const n=add(n6,'neapolitan','chromatic','Napoliten altılı · ♭II6',{degree:'N6',targetLabel:primary?.symbol,outside:outside(n6),source:'https://milnepublishing.geneseo.edu/fundamentals-function-form/chapter/31-the-neapolitan-chord/'});link(n,primary,'chromatic-edge','Hazırlık → V');
      for(const [id,label,tones] of [['it','It+6',[[8,6],[0,1],[6,4]]],['fr','Fr+6',[[8,6],[0,1],[2,2],[6,4]]],['ger','Ger+6',[[8,6],[0,1],[3,3],[6,4]]]]){
        const notes=tones.map(([pc,degree])=>({pc:T.mod(scale.rootPc+pc),name:T.spelling(rootText,degree,scale.rootPc+pc),degree,label:degree===4?'♯4':degree===6?'♭6':degree===3?'♭3':String(degree),semitones:T.mod(pc-8)}));
        const letters=['C','D','E','F','G','A','B'],bassPc=notes[0].pc,bassLetter=notes[0].name[0];
        const chordNotes=notes.map(n=>{const degree=(letters.indexOf(n.name[0])-letters.indexOf(bassLetter)+7)%7+1,semitones=T.mod(n.pc-bassPc),diff=T.mod(semitones-[0,2,4,5,7,9,11][degree-1]+6)-6;return {...n,globalDegree:n.degree,globalLabel:n.label,degree,semitones,label:(diff<0?'♭'.repeat(-diff):'♯'.repeat(diff))+degree};});
        const record={root:notes[0].name,rootPc:bassPc,typeId:null,symbol:label,typeName:'Artmış altılı',notes:chordNotes,pitchClasses:notes.map(t=>t.pc),slashBassPc:bassPc,modifiers:{add:[],alter:[],omit:[]}};
        const node=add(record,'aug-sixth-'+id,'chromatic','♭6 ve ♯4 → dominant kökü',{degree:label,targetLabel:primary?.symbol,outside:outside(record),source:SOURCES.chromatic,caution:id==='ger'?'Klasik ses yürüyüşünde kadans 6/4 üzerinden çözülme paralel beşlileri önleyebilir.':null});link(node,primary,'chromatic-edge','Artmış altılı açılır → V');
      }
    }
    if(p.context==='blues'&&enabled('bluesHarmony'))for(const [offset,degree,label] of [[0,1,'I7'],[5,4,'IV7'],[7,5,'V7']]){const record=T.buildChord(T.spelling(rootText,degree,scale.rootPc+offset),'dominant7');add(record,'blues-'+degree,'bluesHarmony','Blues eşliği · gam dışı sesler normaldir',{degree:label,outside:outside(record),source:'https://viva.pressbooks.pub/openmusictheory/chapter/blues-harmony/'});}
    const modalAnchors={dorian:[4,2],phrygian:[2],lydian:[2],mixolydian:[7,4],naturalMinor:[7,6],locrian:[2]};
    for(const d of modalAnchors[scaleId]||[])if(targetOf(d)&&tonic)link(targetOf(d),tonic,'modal','Modal merkez / renk');
    const layers=LAYERS.map(layer=>({...layer,enabled:enabled(layer.id),available:layer.id==='bluesHarmony'?p.context==='blues':layer.id==='primary'||layer.id==='chromatic'?p.functional:relatedAllowed,count:nodes.filter(n=>n.kind===layer.id).length}));
    return {root:rootText,scale:scale.scale,scaleId,nodes,edges,functional:p.functional,sevenths:!!options.sevenths,analysis,layers};
  }
  const API=Object.freeze({profile,analyze,buildGraph,chordRecord,tensionInfo,LAYERS,SOURCES});root.MBS2Harmony=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
