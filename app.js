/* One musical state drives chord cards, the persistent instrument and playback. */
(function(root){
  "use strict";
  const T=root.MBS2Theory,G=root.MBS2Guitar,Audio=root.MBS2Audio,MapView=root.MBS2HarmonyMap,H=root.MBS2Harmony,Export=root.MBS2Export,Diagram=root.MBS2Diagram;
  const I18n=root.MBS2I18n,MT=root.MBS2MakamTuning;
  const tr=text=>I18n?I18n.t(text,state.language):text;
  const localHtml=text=>I18n?I18n.html(text,state.language):text;
  const scaleName=scale=>I18n?I18n.scaleName(scale,state.language):scale.name;
  const FONTS={manrope:['Manrope, "Segoe UI", sans-serif','"Space Grotesk", Manrope, sans-serif'],space:['"Space Grotesk", sans-serif','"Space Grotesk", sans-serif'],system:['"Segoe UI", system-ui, sans-serif','"Segoe UI", system-ui, sans-serif'],serif:['Georgia, serif','Georgia, serif'],mono:['Consolas, monospace','Consolas, monospace']};
  const THEMES=['graphite','midnight','cyberpunk','light','auto'],THEME_COLORS={graphite:'#080a10',midnight:'#080e20',cyberpunk:'#0b0714',light:'#e9eef2'};
  const $=selector=>document.querySelector(selector);
  const SHARP=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"],FLAT=["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
  const MODES=["explore","chord","scale","harmony","motion","project"],STORE_KEY="guitar-brain-motion-v1-project";
  const defaults={version:1,language:"en",theme:"graphite",font:"manrope",cameraView:"top",cameraZoom:1,mode:"explore",lastMusicMode:"explore",selectedPositions:[],chordRoot:"C",chordType:"major",customChord:null,slashBass:null,modifiers:{add:[],alter:[],omit:[]},scaleRoot:"C",scaleId:"major",harmonyRoot:"C",harmonyScale:"major",harmonySize:3,harmonyGrammar:"auto",harmonyFocus:"diatonic",mapLayers:{primary:true,secondary:true,borrowed:true,leading:false,tritone:false,relatedII:false,chromatic:false,commonTone:false,mediants:false,bluesHarmony:true},borrowSource:"auto",scaleFamily:"all",harmonyFamily:"all",scaleQuery:"",harmonyQuery:"",scaleChordLimit:12,mapNodeLimit:12,sceneRange:0,tuningId:"standard",customTuning:null,capo:0,spelling:"sharp",color:"#7ee5e0",bpm:92,arpeggioDirection:"up",activeVoicingId:null,diagramLabels:"notes",sceneToneView:false,advancedOpen:false,showAllTypes:false,voicingFamily:"all",voicingDifficulty:"all",voicingPosition:"all",voicingBass:"all",voicingCompleteness:"practical",voicingLimit:12};
  defaults.chordEvidence=[];
  Object.assign(defaults,{mode:'explore',lastMusicMode:'explore',harmonyLens:'map',orbitAnchor:null,orbitHistory:[],orbitContext:'',orbitStarted:false,orbitScope:'context',orbitSound:true,plrRoot:'C',plrType:'major',color:'#d9f87b',font:'space',motionPreference:'system',orbitVersion:1,mapVersion:1,harmonyLabels:'roman',mapZoom:1,showFingers:true,leftHanded:false});
  Object.assign(defaults,{chordPool:[],poolTonic:'any',poolChromatic:false,fretboardCollapsed:false,compareScale:'none',positionFocus:'all',exportRange:'visible'});
  Object.assign(defaults,{makamPlayback:'comma',makamExample:'theory',makamNotationAnchor:false,makamReferenceA:440});
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function safeParse(text){try{return JSON.parse(text);}catch(_){return null;}}
  function normalize(data){
    const out=clone(defaults);if(!data||data.version!==1)return out;
    for(const key of Object.keys(defaults))if(data[key]!==undefined)out[key]=data[key];
    if(!MODES.includes(out.mode))out.mode="explore";
    if(!MODES.includes(out.lastMusicMode)||out.lastMusicMode==="project")out.lastMusicMode="explore";
    if(out.mode!=="project")out.lastMusicMode=out.mode;
    out.selectedPositions=Array.isArray(out.selectedPositions)?out.selectedPositions.filter(p=>Number.isInteger(p?.stringIndex)&&p.stringIndex>=0&&p.stringIndex<8&&Number.isInteger(p?.fret)&&p.fret>=0&&p.fret<=24):[];
    out.chordEvidence=Array.isArray(out.chordEvidence)?[...new Set(out.chordEvidence.filter(n=>Number.isInteger(n)&&n>=0&&n<12))]:[];
    out.chordPool=root.MBS2ChordPool?.normalize(out.chordPool)||[];
    if(out.poolTonic!=='any'&&T.parseNote(out.poolTonic)===null)out.poolTonic='any';
    out.poolChromatic=!!out.poolChromatic;out.fretboardCollapsed=!!out.fretboardCollapsed;
    out.makamPlayback=out.makamPlayback==='equal'?'equal':'comma';out.makamNotationAnchor=!!out.makamNotationAnchor;
    out.makamReferenceA=Math.max(400,Math.min(480,Number(out.makamReferenceA)||440));
    if(!MT?.options(T.SCALES.find(s=>s.id===(out.mode==='harmony'?out.harmonyScale:out.scaleId))).some(x=>x.id===out.makamExample))out.makamExample='theory';
    if(!['visible','0-12','12-24','0-24'].includes(out.exportRange))out.exportRange='visible';
    if(out.compareScale!=='none'&&!T.SCALES.some(s=>s.id===out.compareScale))out.compareScale='none';
    if(!['all','0-5','5-9','9-12','12-17','17-24'].includes(out.positionFocus))out.positionFocus='all';
    out.modifiers={add:[],alter:[],omit:[],...(out.modifiers||{})};
    for(const key of ["add","alter","omit"])if(!Array.isArray(out.modifiers[key]))out.modifiers[key]=[];
    out.mapLayers={...defaults.mapLayers,...out.mapLayers};
    for(const key of Object.keys(defaults.mapLayers))out.mapLayers[key]=!!out.mapLayers[key];
    out.capo=Math.max(0,Math.min(12,Number(out.capo)||0));out.sceneRange=out.sceneRange===12?12:0;
    if(!/^(#[0-9a-f]{6})$/i.test(out.color||""))out.color=defaults.color;
    if(!T.SCALES.some(s=>s.id===out.scaleId))out.scaleId="major";
    if(!T.SCALES.some(s=>s.id===out.harmonyScale))out.harmonyScale="major";
    if(out.mode==="harmony"){out.scaleRoot=out.harmonyRoot;out.scaleId=out.harmonyScale;}else{out.harmonyRoot=out.scaleRoot;out.harmonyScale=out.scaleId;}
    for(const key of ["scaleFamily","harmonyFamily"])if(out[key]!=="all"&&!T.SCALES.some(s=>s.family===out[key]))out[key]="all";
    for(const key of ["scaleQuery","harmonyQuery"])out[key]=String(out[key]||"").slice(0,120);
    for(const key of ["scaleChordLimit","mapNodeLimit"])out[key]=Math.max(12,Math.min(144,Number(out[key])||12));
    if(out.borrowSource!=="auto"&&!T.SCALES.some(s=>s.id===out.borrowSource))out.borrowSource="auto";
    out.harmonySize=out.harmonySize===4?4:3;
    const validRecord=c=>c&&T.parseNote(c.root)===c.rootPc&&Array.isArray(c.pitchClasses)&&c.pitchClasses.length>1&&c.pitchClasses.length<=12&&c.pitchClasses.every(pc=>Number.isInteger(pc)&&pc>=0&&pc<12)&&Array.isArray(c.notes)&&c.notes.every(n=>Number.isInteger(n.pc)&&n.pc>=0&&n.pc<12);
    if(!validRecord(out.orbitAnchor))out.orbitAnchor=null;out.orbitHistory=Array.isArray(out.orbitHistory)?out.orbitHistory.filter(validRecord).slice(-64):[];out.orbitScope=out.orbitScope==='all'?'all':'context';out.orbitSound=out.orbitSound!==false;out.orbitStarted=!!out.orbitStarted;
    if(!data.orbitVersion)out.harmonyLens="orbit";if(!data.mapVersion)out.harmonyLens="map";if(!["map","orbit","functions","fifths","plr"].includes(out.harmonyLens))out.harmonyLens="map";out.harmonyLabels=out.harmonyLabels==="names"?"names":"roman";out.showFingers=out.showFingers!==false;out.leftHanded=out.leftHanded===true;out.mapZoom=[1,1.25,1.5,1.75,2].includes(Number(out.mapZoom))?Number(out.mapZoom):1;if(T.parseNote(out.plrRoot)===null)out.plrRoot="C";out.plrType=out.plrType==="minor"?"minor":"major";
    if(!['auto','contained','quartal'].includes(out.harmonyGrammar))out.harmonyGrammar='auto';
    if(!['all','diatonic',...Object.keys(defaults.mapLayers)].includes(out.harmonyFocus))out.harmonyFocus='diatonic';
    for(const key of ["chordRoot","scaleRoot","harmonyRoot"])if(T.parseNote(out[key])===null)out[key]="C";
    if(!T.CHORD_TYPES.some(c=>c.id===out.chordType)&&!out.customChord)out.chordType="major";
    out.diagramLabels=out.diagramLabels==="degrees"?"degrees":"notes";
    if(!["all","open","barre","triad","drop2","drop3","shell"].includes(out.voicingFamily))out.voicingFamily="all";
    if(!["all","easy","medium","advanced"].includes(out.voicingDifficulty))out.voicingDifficulty="all";
    if(!["all","low","middle","high"].includes(out.voicingPosition))out.voicingPosition="all";
    if(!["all","root","inversion"].includes(out.voicingBass))out.voicingBass="all";
    out.voicingCompleteness=out.voicingCompleteness==="full"?"full":"practical";
    if(!['en','tr'].includes(out.language))out.language='en';
    if(!['system','full','reduced'].includes(out.motionPreference))out.motionPreference='system';
    if(!THEMES.includes(out.theme))out.theme='graphite';
    if(!Object.hasOwn(FONTS,out.font))out.font='manrope';
    if(!['top','perspective','close'].includes(out.cameraView))out.cameraView='top';
    out.cameraZoom=Math.max(.55,Math.min(2.5,Number(out.cameraZoom)||1));
    out.voicingLimit=Math.max(12,Math.min(144,Number(out.voicingLimit)||12));return out;
  }
  function loadLocal(){try{return normalize(safeParse(root.localStorage.getItem(STORE_KEY)||"null"));}catch(_){return clone(defaults);}}
  let state=loadLocal();state.mode=state.lastMusicMode="explore";
  let scene=null,toastTimer=null,activeChord=null,activeVoicing=null,degreePreview=false;
  const voicesCache=new Map();
  let playbackRequest=0;
  function persistentState(){const stored={};for(const key of Object.keys(defaults))stored[key]=state[key];return stored;}
  function saveLocal(){try{root.localStorage.setItem(STORE_KEY,JSON.stringify(persistentState()));}catch(_){}}
  function escapeHtml(text){return String(text??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function names(){return state.spelling==="flat"?FLAT:SHARP;}
  function currentTuning(){
    if(state.tuningId==="custom"&&Array.isArray(state.customTuning)&&state.customTuning.length>=4&&state.customTuning.length<=8&&state.customTuning.every(n=>G.midiFromNote(n)!==null))return {id:"custom",name:"Özel akort",notes:state.customTuning};
    return G.TUNINGS.find(t=>t.id===state.tuningId)||G.TUNINGS[0];
  }
  function motionContext(){return {tuning:currentTuning(),capo:state.capo,bpm:state.bpm,language:state.language,mode:state.mode,scene,scaleRoot:state.scaleRoot,scaleId:state.scaleId,scaleName:scaleName(T.SCALES.find(s=>s.id===state.scaleId)),diagram:handOptions(),setBpm:value=>{state.bpm=Math.max(40,Math.min(220,Math.round(Number(value))||92));saveLocal();}};}
  function chordFromState(){
    if(state.customChord)return state.customChord;
    let chord;try{chord=T.buildChord(state.chordRoot,state.chordType||"major",state.modifiers);}catch(_){chord=T.buildChord("C","major");}
    chord={...chord,requiredPitchClasses:state.chordEvidence.filter(pc=>chord.pitchClasses.includes(pc))};
    if(state.slashBass===null||state.slashBass===undefined)return chord;
    const bassPc=T.parseNote(state.slashBass);if(bassPc===null)return chord;
    let semitones=T.mod(bassPc-chord.rootPc);if(semitones>6)semitones-=12;
    const bassName=names()[bassPc],bass={degree:1,label:"bas",semitones,pc:bassPc,name:bassName};
    return {...chord,symbol:chord.symbol+"/"+bassName,notes:[bass,...chord.notes],pitchClasses:[...new Set([...chord.pitchClasses,bassPc])],slashBassPc:bassPc};
  }
  function getVoicings(chord,maxResults=144){
    const tuning=currentTuning(),key=JSON.stringify([chord.symbol,chord.pitchClasses,chord.slashBassPc,chord.requiredPitchClasses,tuning.notes,state.capo,state.voicingCompleteness]);
    if(!voicesCache.has(key)){if(voicesCache.size>120)voicesCache.clear();voicesCache.set(key,G.generateVoicings(chord,tuning,state.capo,{maxFret:24,maxResults:144,completeness:state.voicingCompleteness}));}
    return voicesCache.get(key).slice(0,maxResults);
  }
  function filterVoicings(voices,chord){return voices.filter(shape=>
    (state.voicingFamily==="all"||shape.tags.includes(state.voicingFamily))&&
    (state.voicingDifficulty==="all"||shape.difficulty===state.voicingDifficulty)&&
    (state.voicingPosition==="all"||(state.voicingPosition==="low"?shape.position<=5:state.voicingPosition==="middle"?shape.position>5&&shape.position<=12:shape.position>12))&&
    (chord.slashBassPc!==undefined||state.voicingBass==="all"||(state.voicingBass==="root"?shape.bassPc===chord.rootPc:shape.bassPc!==chord.rootPc))
  );}
  function ensureVoicing(chord,filtered=false){
    const voices=filtered?filterVoicings(getVoicings(chord),chord):getVoicings(chord);
    activeVoicing=voices.find(v=>v.id===activeVoicing?.id)||voices.find(v=>v.id===state.activeVoicingId)||voices[0]||null;
    state.activeVoicingId=activeVoicing?.id||null;return voices;
  }
  function setActiveChord(chord,{setMode=false,preview=false}={}){
    activeChord=chord;state.chordRoot=chord.root;state.chordType=chord.typeId||null;state.customChord=chord.typeId?null:chord;
    state.slashBass=chord.slashBassPc??null;state.modifiers=chord.modifiers?clone(chord.modifiers):{add:[],alter:[],omit:[]};
    state.chordEvidence=clone(chord.requiredPitchClasses||[]);
    activeVoicing=null;state.activeVoicingId=null;ensureVoicing(chord);degreePreview=preview;
    if(setMode){state.mode="chord";state.lastMusicMode="chord";}
    fitVoicing();renderPanel();renderScene();saveLocal();
  }
  function chordRecordFromNode(node){
    if(!node)return null;
    if(node.record)return node.record;
    if(node.chordId)return T.buildChord(node.root,node.chordId);
    const pcs=[...new Set((node.pitchClasses||node.notes||[]).map(n=>T.parseNote(n)).filter(n=>n!==null))],rootPc=T.parseNote(node.root);
    const notes=pcs.map((pc,i)=>({pc,semitones:T.mod(pc-rootPc),degree:i+1,label:T.noteName(pc,state.spelling),name:node.noteNames?.[i]||T.noteName(pc,state.spelling)}));
    return {root:node.root,rootPc,typeId:null,typeName:node.chordName||"Gam içi akor",symbol:node.symbol||node.root,pitchClasses:pcs,notes,intervals:notes,modifiers:{add:[],alter:[],omit:[]}};
  }
  function resetHarmonyChord(){
    const first=H.analyze(state.harmonyRoot,state.harmonyScale,{chordSize:state.harmonySize,grammar:state.harmonyGrammar}).chords[0];
    activeChord=chordRecordFromNode(first);activeVoicing=null;state.activeVoicingId=null;state.mapActiveId=first?'diatonic-1':null;
    if(activeChord)ensureVoicing(activeChord);
  }
  function chordMidis(chord=activeChord,voicing=activeVoicing){
    if(!chord)return selectedMidis();
    if(voicing?.frets?.length===currentTuning().notes.length){
      const pitches=voicing.frets.map((f,s)=>f<0?null:G.positionMidi(currentTuning(),s,f,state.capo)).filter(Number.isFinite);
      if(pitches.length)return pitches.sort((a,b)=>a-b);
    }
    let midis=chord.notes.map(n=>60+chord.rootPc+Number(n.semitones)).filter(Number.isFinite);
    if(chord.slashBassPc!==undefined)midis=[48+chord.slashBassPc,...midis.filter(n=>T.mod(n)!==chord.slashBassPc)];
    return midis.sort((a,b)=>a-b);
  }
  function midiForChord(chord){return chordMidis(chord,getVoicings(chord,1)[0]||null);}
  function selectedMidis(){return state.selectedPositions.map(p=>G.positionMidi(currentTuning(),p.stringIndex,p.fret,state.capo)).filter(Number.isFinite);}
  function scaleMidi(rootText,scaleId,mode=state.makamPlayback){const scale=T.scaleNotes(rootText,scaleId);if(scale?.scale.makam&&MT)return MT.midis(scale.scale,60+scale.rootPc,{mode,example:state.makamExample,notationAnchor:state.makamNotationAnchor,referenceA:state.makamReferenceA});return scale?scale.pcs.map(pc=>60+scale.rootPc+T.mod(pc-scale.rootPc)).sort((a,b)=>a-b):[];}
  function makamAnalysis(){const harmony=musicMode()==='harmony',id=harmony?state.harmonyScale:state.scaleId,key=harmony?state.harmonyRoot:state.scaleRoot;return MT?.analyze(T.SCALES.find(s=>s.id===id),60+T.parseNote(key),{mode:state.makamPlayback,example:state.makamExample,notationAnchor:state.makamNotationAnchor,referenceA:state.makamReferenceA});}
  // Motion exports the whole route timed by each chord's beats; a scale exports as a sequence; anything else as one block.
  function midiExportNotes(){
    const mode=musicMode();
    if(mode==='motion'){const notes=root.GBMotionWorkspace.midiNotes();if(notes.length)return notes;}
    const sequential=mode==='scale'&&!degreePreview;
    return currentMidis().map((midi,i)=>sequential?{midi,startBeat:i*.5,durationBeats:.5}:{midi,startBeat:0,durationBeats:3.6});
  }
  // Space plays/stops, Escape stops, and in Motion the arrows change chord; controls keep their own keys.
  function onShortcut(event){
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;
    const target=event.target,interactive=target?.closest?.('button,input,select,textarea,summary,a,dialog,[role="button"],[role="separator"],[contenteditable]'),inDock=target?.closest?.('#playbackDock');
    if(interactive&&!inDock)return;
    const motion=musicMode()==='motion';
    if(event.key===' '){event.preventDefault();if(motion&&root.GBMotionWorkspace.isPlaying())$("#stopPlayback").click();else playCurrent();return;}
    if(event.key==='Escape'&&!interactive){$("#stopPlayback").click();return;}
    if(motion&&!interactive&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();root.GBMotionWorkspace.stepBy(event.key==='ArrowLeft'?-1:1);}
  }
  function musicMode(){return state.mode==="project"?state.lastMusicMode:state.mode;}
  function currentMidis(){const mode=musicMode();if(mode==="motion")return root.GBMotionWorkspace.midis();if(mode==="explore")return selectedMidis();if(mode==="scale"&&!degreePreview)return scaleMidi(state.scaleRoot,state.scaleId);if(mode==='harmony'&&!activeChord)return scaleMidi(state.harmonyRoot,state.harmonyScale);return chordMidis();}
  function toast(message){const el=$("#toast");if(!el)return;el.textContent=tr(message);el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2000);}
  function playbackPositions(midis,preferred=null){
    const tuning=currentTuning(),used=new Set(),result=[],positions=preferred||(musicMode()==='explore'?state.selectedPositions:shapePositions(activeVoicing));
    for(const midi of [...new Set(midis)]){
      const physicalMidi=Math.round(midi),offsetCents=(midi-physicalMidi)*100;
      let choices=positions.filter(p=>G.positionMidi(tuning,p.stringIndex,p.fret,state.capo)===physicalMidi);
      if(!choices.length)for(let s=0;s<tuning.notes.length;s++){const f=physicalMidi-G.midiFromNote(tuning.notes[s]);if(Number.isInteger(f)&&f>=state.capo&&f<=24)choices.push({stringIndex:s,fret:f});}
      choices.sort((a,b)=>Number(used.has(a.stringIndex))-Number(used.has(b.stringIndex))||Number(b.fret>=state.sceneRange&&b.fret<=state.sceneRange+12)-Number(a.fret>=state.sceneRange&&a.fret<=state.sceneRange+12)||a.fret-b.fret);
      if(choices[0]){used.add(choices[0].stringIndex);result.push({...choices[0],midi,physicalMidi,offsetCents});}
    }
    return result;
  }
  function shapePositions(shape){return (shape?.frets||[]).flatMap((f,s)=>f<0?[]:[{stringIndex:s,fret:f}]);}
  function playChordRecord(chord,arpeggio=false,shape=null){const voice=shape||getVoicings(chord,1)[0]||null;play(chordMidis(chord,voice),arpeggio,shapePositions(voice));}
  function play(midis,arpeggio=false,preferred=null,options={}){
    if(!midis.length){toast("Önce bir nota veya akor seç.");return;}
    const positions=playbackPositions(midis,preferred),request=++playbackRequest;
    try{const result=options.sequence?Audio.playSequence(midis,options):arpeggio?Audio.playArpeggio(midis,{bpm:state.bpm,direction:state.arpeggioDirection,...options}):Audio.playNotes(midis);Promise.resolve(result).then(()=>{if(request===playbackRequest&&Audio.getPlayback){scene?.setPlayback?.(Audio.getPlayback,positions);highlightMakamPlayback(request);}}).catch(error=>toast(error.message||"Ses başlatılamadı."));}catch(error){toast(error.message||"Ses başlatılamadı.");}
  }
  function highlightMakamPlayback(request){
    if(!root.requestAnimationFrame)return;
    const tick=()=>{const clock=Audio.getPlayback(),now=clock.time;if(request!==playbackRequest)return;const sounding=clock.events.filter(e=>now>=e.start&&now<e.end);document.querySelectorAll('[data-makam-midi]').forEach(row=>row.classList.toggle('sounding',sounding.some(e=>Math.abs(e.midi-Number(row.dataset.makamMidi))<.001)));if(clock.events.some(e=>e.end>now))root.requestAnimationFrame(tick);};root.requestAnimationFrame(tick);
  }
  function addToPool(chord){
    if(!chord?.pitchClasses?.length)return;
    const item={symbol:chord.symbol,pitchClasses:[...chord.pitchClasses]},key=item.pitchClasses.slice().sort((a,b)=>a-b).join(',');
    if(state.chordPool.some(c=>c.symbol===item.symbol&&c.pitchClasses.join(',')===key)){toast('Akor havuzda mevcut.');return;}
    if(state.chordPool.length>=24){toast('Havuzda en fazla 24 akor olabilir.');return;}
    state.chordPool=root.MBS2ChordPool.normalize([...state.chordPool,item]);state._poolLimit=8;saveLocal();toast('Havuza eklendi.');
  }
  function poolPanel(){
    const result=root.MBS2ChordPool.analyze(state.chordPool,{tonic:state.poolTonic==='any'?null:state.poolTonic,preference:state.spelling,includeChromatic:state.poolChromatic});state._poolAnalysis=result;
    const scaleRows=matches=>matches.map(hit=>'<div class="pool-scale"><div><strong>'+escapeHtml(hit.root+' '+scaleName(T.SCALES.find(s=>s.id===hit.scaleId)))+'</strong><small>'+hit.pcs.map(pc=>escapeHtml(names()[pc])).join(' · ')+'</small>'+(T.SCALES.find(s=>s.id===hit.scaleId)?.makam?'<small>'+tr('Gitar yaklaşımı')+' · 12-TET</small>':'')+'</div><div class="pool-result-actions">'+button('usePoolScale','Aç','data-root="'+hit.root+'" data-scale="'+hit.scaleId+'"')+button('playPoolScale','Çal','data-root="'+hit.root+'" data-scale="'+hit.scaleId+'"')+'</div></div>').join('');
    let html='<section class="chord-pool">'+sectionLabel('Akor havuzu','<span>'+result.chords.length+' / 24</span>')+'<div class="pool-chips">'+result.chords.map((c,i)=>'<span class="pool-chip"><strong>'+escapeHtml(c.symbol)+'</strong><button data-action="removePool" data-index="'+i+'" aria-label="Akoru havuzdan kaldır">×</button></span>').join('')+'</div><div class="action-row">'+(activeChord?button('poolCurrent','+ Seçili akor'):'')+(result.chords.length?button('clearPool','Temizle','','text-button'):button('poolExample','Dm7 · G7 · Cmaj7','','text-button'))+'</div>';
    if(!result.chords.length)return html+'<p class="helper">Akor kartlarından havuza ekle.</p></section>';
    html+='<div class="pool-controls"><label class="field">Tonik bağlamı<select class="select-control" data-change="poolTonic"><option value="any">Her tonik</option>'+names().map(n=>'<option value="'+n+'"'+(T.parseNote(n)===T.parseNote(state.poolTonic)?' selected':'')+'>'+n+'</option>').join('')+'</select></label><label class="inline-check"><input type="checkbox" data-change="poolChromatic"'+(state.poolChromatic?' checked':'')+'> Kromatik dahil</label></div><div class="pool-tones"><span>'+tr('Akorların bütün sesleri')+'</span><strong>'+result.union.map(pc=>escapeHtml(names()[pc])).join(' · ')+'</strong></div>';
    if(result.shared.length)html+='<p class="helper">Ortak sesler: '+result.shared.map(pc=>escapeHtml(names()[pc])).join(' · ')+'</p>';
    html+='<div class="section-label">'+tr('Ortak gamlar')+' <span>'+result.results.length+'</span></div><p class="helper">Ses üyeliği eşleşmesidir; tek başına tonalite belirlemez.</p>';
    if(result.hasCommon){html+=scaleRows(result.results.slice(0,state._poolLimit||8));if(result.results.length>(state._poolLimit||8))html+=button('morePoolScales','Daha fazla gam','','more-voicings');}
    else{html+='<p class="harmony-notice">Bu koşullarda ortak gam bulunamadı.</p>';for(const entry of result.perChord)html+='<details class="pool-per-chord"><summary>'+escapeHtml(entry.chord.symbol)+' · '+tr('Akora göre seçenekler')+'</summary>'+scaleRows(entry.results.slice(0,6))+'</details>';}
    return html+'</section>';
  }
  function scaleSceneControls(){
    return '<details class="advanced-panel scale-scene-controls"><summary>Klavyede karşılaştır / pozisyon</summary><label class="field">Karşılaştırılacak gam<select class="select-control" data-change="compareScale"><option value="none">Karşılaştırma yok</option>'+T.SCALES.map(s=>'<option value="'+s.id+'"'+(state.compareScale===s.id?' selected':'')+'>'+escapeHtml(scaleName(s))+'</option>').join('')+'</select></label><label class="field">Pozisyon<select class="select-control" data-change="positionFocus">'+['all','0-5','5-9','9-12','12-17','17-24'].map(id=>'<option value="'+id+'"'+(id===state.positionFocus?' selected':'')+'>'+(id==='all'?'Tüm klavye':id+' · perde')+'</option>').join('')+'</select></label>'+(state.compareScale!=='none'?'<p class="helper">Halka: ortak ses · Mor: karşılaştırılan gam</p>':'')+'</details>';
  }
  function renderPanel({keepScroll=true}={}){
    applyPreferences();const host=$("#panelContent");if(!host)return;const oldScroll=host.scrollTop;syncNav();
    for(const [selector,key] of [['.harmony-picker','_harmonyPickerOpen'],['.harmony-layer-controls','_harmonyLayersOpen']]){const detail=host.querySelector(selector);if(detail)state[key]=detail.open;}
    MapView?.dispose?.();
    const renderers={motion:host=>root.GBMotionWorkspace.render(host,motionContext()),explore:renderExplore,chord:renderChord,scale:renderScale,harmony:renderHarmony,project:renderProject};
    (renderers[state.mode]||renderExplore)(host);
    if(state.mode==='harmony')for(const [selector,key] of [['.harmony-picker','_harmonyPickerOpen'],['.harmony-layer-controls','_harmonyLayersOpen']])if(state[key])host.querySelector(selector)?.setAttribute('open','');
    host.scrollTop=keepScroll?Math.min(oldScroll,host.scrollHeight):0;bindPanel();updatePlayLabels();
  }
  function syncNav(){document.documentElement?.setAttribute?.("data-workspace",state.mode);document.querySelectorAll(".mode-tab").forEach(tab=>{const active=tab.dataset.mode===state.mode;tab.classList.toggle("active",active);tab.setAttribute("aria-pressed",String(active));});root.GBWorkspaceLayout?.sync();}
  function panelHeader(title){return '<h2 class="panel-title">'+escapeHtml(title)+'</h2>';}
  function sectionLabel(title,extra=""){return '<div class="section-label"><span>'+title+'</span>'+extra+'</div>';}
  function button(action,label,attrs="",className="secondary-button"){return '<button class="'+className+'" data-action="'+action+'" '+attrs+'>'+label+'</button>';}
  function selectedPitchClasses(){return [...new Set(selectedMidis().map(n=>T.mod(n)))];}
  function matchesForPitchSet(pcs){
    const lowest=selectedMidis().sort((a,b)=>a-b)[0],bassPc=lowest===undefined?null:T.mod(lowest);
    return T.findChordMatches(pcs,{bassPc,preference:state.spelling});
  }
  function renderExplore(host){
    const pcs=selectedPitchClasses(),matches=pcs.length>=2?matchesForPitchSet(pcs):[],scales=pcs.length?T.findScales(pcs,state.spelling).slice(0,6):[];
    state._visibleMatches=matches;
    const chips=state.selectedPositions.map(p=>{const n=G.noteOnPosition(currentTuning(),p.stringIndex,p.fret,state.capo);return n?'<span class="selected-chip">'+escapeHtml(n.name)+' · '+(p.fret===state.capo?"açık":p.fret+".p")+'<button data-action="removePosition" data-string="'+p.stringIndex+'" data-fret="'+p.fret+'" aria-label="Seçimi kaldır">×</button></span>':"";}).join("");
    let html=panelHeader("Notalar")+'<div class="panel-section">'+sectionLabel("Seçili sesler",'<span>'+pcs.length+' farklı nota</span>')+'<div class="selected-chips">'+(chips||'<span class="helper">Henüz nota seçilmedi</span>')+'</div></div>';
    if(pcs.length<2)html+='<div class="empty-state"><div><div class="empty-symbol" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><strong>Klavye üzerinde sesleri seç</strong>Akor ve gam eşleşmeleri burada görünür.</div></div>';
    if(matches.length)html+='<div class="panel-section">'+sectionLabel("Akorlar",'<span>'+matches.length+' eşleşme</span>')+'<div class="match-context">Bas: '+escapeHtml(names()[T.mod(Math.min(...selectedMidis()))])+(pcs.length===2?' · İki ses tek bir akoru belirlemez.':'')+'</div><div class="degree-grid">'+matches.slice(0,state._chordMatchLimit||6).map((chord,i)=>{
      const voice=getVoicings(chord,1)[0],notes=chord.notes.filter(n=>!voice||voice.pcs.includes(n.pc));
      const kind={exact:'Tam eşleşme',omitted:'Beşlisi eksik',partial:'Olası akor',collection:'Ses kümesi'}[chord.matchKind];
      const evidence='<div class="match-kind '+chord.matchKind+'">'+kind+'</div><div class="match-evidence">Seçilen: '+chord.matchedNotes.map(n=>escapeHtml(n.name)+' <small>'+escapeHtml(n.label)+'</small>').join(' · ')+'</div>'+(chord.missingNotes.length?'<div class="match-missing">Eksik sesler: '+chord.missingNotes.map(n=>escapeHtml(n.name)+' <small>'+escapeHtml(n.label)+'</small>').join(' · ')+'</div>':'')+(!chord.rootPresent?'<div class="match-missing">Kök seçilmedi</div>':'');
      return '<article class="degree-card match-card"><div class="degree-top"><span class="degree-symbol">'+escapeHtml(chord.symbol)+'</span></div>'+evidence+Diagram.render(voice,chord,currentTuning(),state.capo,{...handOptions(),labels:state.diagramLabels,compact:true})+'<div class="degree-notes">'+notes.map(n=>escapeHtml(n.name)).join(" · ")+'</div>'+(voice?.omittedLabels.length?'<span class="voicing-omissions">'+omissionLabel(voice)+'</span>':'')+'<div class="card-actions"><button data-action="useChordMatch" data-index="'+i+'">Seç</button><button data-action="playMatch" data-index="'+i+'">Çal</button><button data-action="arpMatch" data-index="'+i+'">Arpej</button><button data-action="poolMatch" data-index="'+i+'">+ Havuz</button></div></article>';
    }).join("")+'</div>'+(matches.length>(state._chordMatchLimit||6)?button('moreChordMatches','Daha fazla akor'):'')+'</div>';
    if(scales.length)html+='<div class="panel-section">'+sectionLabel("Bu sesleri içeren gamlar")+'<div class="result-list">'+scales.map(scale=>'<div class="result-row"><div><strong>'+escapeHtml(scale.root)+" "+escapeHtml(scaleName(T.SCALES.find(s=>s.id===scale.scaleId)))+'</strong><small>'+escapeHtml(scale.family)+'</small></div>'+button("useScaleMatch","Aç",'data-root="'+escapeHtml(scale.root)+'" data-scale="'+scale.scaleId+'"')+'</div>').join("")+'</div></div>';
    html+='<div class="action-row">'+button("clearSelection","Temizle")+button("goChord","Akor kurucu")+'</div>';host.innerHTML=localHtml(html);
  }
  function labelsControl(){return '<div class="segmented-control" aria-label="Diyagram gösterimi">'+["notes","degrees"].map(mode=>'<button class="'+(state.diagramLabels===mode?"active":"")+'" data-action="diagramLabels" data-value="'+mode+'">'+(mode==="notes"?"Nota":"Derece")+'</button>').join("")+'</div>';}
  function omissionLabel(shape){return (shape?.omittedLabels||[]).map(label=>escapeHtml(label)+" yok").join(" · ");}
  function voicingDescription(shape){
    if(!shape)return "";
    return '<div class="voicing-description"><span>'+escapeHtml(shape.familyLabel)+' · '+escapeHtml(shape.bassLabel)+'</span><span>'+escapeHtml(shape.difficultyLabel)+(shape.internalMutes?' · Parmakla':'')+'</span>'+(shape.omittedLabels.length?'<span class="voicing-omissions">'+omissionLabel(shape)+'</span>':"")+'</div>';
  }
  function voicingFilters(){
    const families=[["all","Hepsi"],["open","Açık"],["barre","Bare"],["triad","Üçlü"],["drop2","Drop 2"],["drop3","Drop 3"],["shell","Shell"]];
    let html='<div class="voicing-families" aria-label="Tutuş ailesi">'+families.map(([id,label])=>'<button class="'+(state.voicingFamily===id?'active':'')+'" data-action="voicingFamily" data-value="'+id+'" aria-pressed="'+(state.voicingFamily===id)+'">'+label+'</button>').join("")+'</div>';
    const filters=[['voicingDifficulty','Zorluk',[["all","Her seviye"],["easy","Kolay"],["medium","Orta"],["advanced","İleri"]]],['voicingPosition','Perde alanı',[["all","Tüm klavye"],["low","0–5. perde"],["middle","6–12. perde"],["high","13–24. perde"]]],['voicingBass','Bas',[["all","Bas: hepsi"],["root","Kök bas"],["inversion","Çevrimler"]]]];
    html+='<div class="voicing-filter-row">'+filters.map(([key,label,options])=>'<select class="select-control" aria-label="'+label+'" data-change="'+key+'"'+(key==='voicingBass'&&activeChord?.slashBassPc!==undefined?' disabled':'')+'>'+options.map(([id,text])=>'<option value="'+id+'"'+(state[key]===id?' selected':'')+'>'+text+'</option>').join("")+'</select>').join("")+'</div>';
    return html+'<div class="voicing-filter-footer"><label class="inline-check"><input type="checkbox" data-change="voicingCompleteness"'+(state.voicingCompleteness==='full'?' checked':'')+'> Tüm akor sesleri</label>'+button("resetVoicingFilters","Filtreleri sıfırla","","text-button")+'</div>';
  }
  function chordFocus(chord,shape,showActions=true){
    const notes=chord.notes.filter((n,i,a)=>a.findIndex(other=>other.pc===n.pc)===i),min=shape?.frets.filter(f=>f>state.capo);
    const position=shape?.openStrings?"Açık pozisyon":min?.length?Math.min(...min)+". perde":"Açık teller";
    return '<div class="chord-focus"><div class="chord-summary"><div class="chord-symbol">'+escapeHtml(chord.symbol)+'</div><div class="chord-type-label">'+escapeHtml(chord.typeName||"Gam içi akor")+'</div><div class="chord-notes">'+notes.map(n=>'<span class="chord-tone'+(shape?.omitted?.includes(n.pc)?' omitted':'')+'"'+(shape?.omitted?.includes(n.pc)?' title="Bu tutuşta çalınmıyor"':'')+'>'+escapeHtml(n.name)+'<small>'+escapeHtml(n.label)+'</small></span>').join("")+'</div>'+voicingDescription(shape)+(showActions?'<div class="action-row">'+button("playChord","Çal","","action-button primary")+button("arpeggiateChord","Arpej","","action-button")+button("poolCurrent","+ Havuz","","action-button")+button("motionCurrent","+ Motion","","action-button")+button("orbitCurrent",state.language==='tr'?"Keşfet":"Explore","","action-button")+'</div>':"")+'</div><div class="active-diagram">'+Diagram.render(shape,chord,currentTuning(),state.capo,{...handOptions(),labels:state.diagramLabels})+'<div class="diagram-caption"><strong>'+(state.capo?'Capo '+state.capo+' · ':'')+escapeHtml(position)+'</strong></div></div></div>';
  }
  function renderChord(host){
    const chord=chordFromState();activeChord=chord;const all=ensureVoicing(chord,true),voices=all.slice(0,state.voicingLimit);state._visibleVoicings=voices;
    const quick=["major","minor","dominant7","major7","minor7","diminished","sus2","sus4","augmented"],types=T.CHORD_TYPES.filter(t=>state.showAllTypes||quick.includes(t.id));
    let html=sectionLabel("Akor",labelsControl())+chordFocus(chord,activeVoicing);
    html+='<div class="panel-section">'+sectionLabel("Kök nota",button("toggleSpelling",state.spelling==="sharp"?"♯ / ♭":"♭ / ♯","","text-button"))+'<div class="note-grid">'+names().map((n,pc)=>'<button class="note-choice'+(T.parseNote(state.chordRoot)===pc?" active":"")+'" data-action="root" data-value="'+n+'" aria-pressed="'+(T.parseNote(state.chordRoot)===pc)+'">'+n+'</button>').join("")+'</div></div>';
    html+='<div class="panel-section">'+sectionLabel("Akor tipi",button("toggleTypes",state.showAllTypes?"Daha az":"Tüm tipler","","text-button"))+'<div class="quality-grid">'+types.map(type=>'<button class="quality-choice'+(state.chordType===type.id?" active":"")+'" data-action="quality" data-value="'+type.id+'">'+escapeHtml(type.name)+'<small>'+escapeHtml(type.symbol||"maj")+'</small></button>').join("")+'</div></div>';
    html+='<div class="panel-section">'+sectionLabel("Tutuşlar",'<span>'+voices.length+' / '+all.length+'</span>')+voicingFilters()+'<div class="voicing-grid">'+voices.map((shape,i)=>{
      const active=shape.id===activeVoicing?.id;
      return '<article class="voicing-card'+(active?" active":"")+'"><button class="voicing-pick" data-action="selectVoicing" data-index="'+i+'" aria-pressed="'+active+'" aria-label="'+escapeHtml(chord.symbol)+' '+(i+1)+'. tutuşu seç"><span class="voicing-title"><span class="shape-number">'+String(i+1).padStart(2,"0")+'</span><span class="shape-kind">'+escapeHtml(shape.familyLabel)+'</span><span class="shape-check">'+(active?"●":"")+'</span></span>'+Diagram.render(shape,chord,currentTuning(),state.capo,{...handOptions(),labels:state.diagramLabels,compact:true})+'<span class="fret-notation">'+escapeHtml(shape.frets.map(f=>f<0?"×":f===state.capo?"○":f).join(" · "))+'</span><span class="voicing-meta">'+escapeHtml(shape.bassLabel)+' · '+escapeHtml(shape.difficultyLabel)+'</span>'+(shape.internalMutes?'<span class="voicing-picking">Parmakla çal</span>':'')+(shape.omittedLabels.length?'<span class="voicing-omissions">'+omissionLabel(shape)+'</span>':'')+'</button><div class="card-actions"><button data-action="playVoicing" data-index="'+i+'">Çal</button><button data-action="arpeggioVoicing" data-index="'+i+'">Arpej</button></div></article>';
    }).join("")+(voices.length?"":'<div class="notice">Bu filtrelerde uygun tutuş bulunamadı. '+button("resetVoicingFilters","Filtreleri sıfırla")+'</div>')+'</div>'+(voices.length<all.length?'<div class="load-voicings">'+button("moreVoicings","12 tutuş daha")+'</div>':'')+'</div>';
    html+='<div class="action-row">'+button("sceneTones",state.sceneToneView?"Klavyede: tüm akor sesleri":"Klavyede: seçili tutuş")+'</div>';
    html+='<details class="advanced-panel" data-details="advanced"'+(state.advancedOpen?" open":"")+'><summary>Ek sesler ve bas</summary>';
    if(!state.customChord){
      html+='<div class="panel-section">'+sectionLabel("Bas notası")+'<select class="select-control" data-change="slashBass"><option value="">Kök bas</option>'+names().map((n,pc)=>'<option value="'+pc+'"'+(state.slashBass===pc?" selected":"")+'>'+n+' bas</option>').join("")+'</select></div>';
      html+='<div class="panel-section">'+sectionLabel("Ek ve altere sesler")+'<div class="chip-grid">'+T.MODIFIERS.map(m=>'<button class="chip-choice'+((state.modifiers.add||[]).includes(m.id)||(state.modifiers.alter||[]).includes(m.id)?" active":"")+'" data-action="modifier" data-value="'+m.id+'">'+escapeHtml(m.label)+'</button>').join("")+'</div></div>';
      html+='<div class="panel-section">'+sectionLabel("Ses çıkar")+'<div class="chip-grid">'+[1,3,5,7,9,11,13].map(n=>'<button class="chip-choice'+(state.modifiers.omit.includes(n)?" active":"")+'" data-action="omit" data-value="'+n+'">omit '+n+'</button>').join("")+'</div></div>';
    }else html+='<div class="notice">'+(state.customChord.matchKind==='collection'?'Seçili ses kümesi gösteriliyor.':'Bu akorun gam içindeki gerçek ses kümesi gösteriliyor.')+'</div>';
    html+='</details>';host.innerHTML=localHtml(html);
  }
  function degreeCard(item,index){
    const chord=chordRecordFromNode(item),voice=getVoicings(chord,1)[0],notes=chord.notes.filter(n=>!voice||voice.pcs.includes(n.pc)).map(n=>n.name);
    return '<article class="degree-card"><div class="degree-top"><span class="degree-roman">'+escapeHtml(item.roman)+'</span><span class="degree-symbol">'+escapeHtml(item.symbol)+'</span></div>'+Diagram.render(voice,chord,currentTuning(),state.capo,{...handOptions(),labels:state.diagramLabels,compact:true})+'<div class="degree-notes">'+notes.map(escapeHtml).join(" · ")+'</div>'+(voice?.omittedLabels.length?'<span class="voicing-omissions">'+omissionLabel(voice)+'</span>':'')+'<div class="card-actions"><button data-card-action="playDegree" data-index="'+index+'">Çal</button><button data-card-action="arpeggioDegree" data-index="'+index+'">Arpej</button><button data-card-action="showDegree" data-index="'+index+'">Klavyede</button><button data-card-action="poolDegree" data-index="'+index+'">+ Havuz</button></div></article>';
  }
  function rootSelect(key,selected){return '<label class="field">Tonik<select class="select-control" data-change="'+key+'">'+names().map(n=>'<option value="'+n+'"'+(T.parseNote(n)===T.parseNote(selected)?" selected":"")+'>'+n+'</option>').join("")+'</select></label>';}
  function searchFold(text){return String(text).normalize('NFD').replace(/\p{M}/gu,'').replace(/ı/g,'i').toLowerCase();}
  function scaleSelect(key,selected){
    const prefix=key==="scaleId"?"scale":"harmony",family=state[prefix+"Family"],query=searchFold(state[prefix+"Query"]),groups=new Map();
    const filtered=T.SCALES.filter(s=>(family==="all"||s.family===family)&&(!query||[s.name,s.nameTr,s.nameEn,s.id,...s.aliases].filter(Boolean).some(n=>searchFold(n).includes(query))));
    for(const scale of filtered){if(!groups.has(scale.family))groups.set(scale.family,[]);groups.get(scale.family).push(scale);}
    let options=filtered.some(s=>s.id===selected)?"":'<option value="'+selected+'" selected>'+escapeHtml(scaleName(T.SCALES.find(s=>s.id===selected)))+' · seçili</option>';
    for(const [name,scales] of groups)options+='<optgroup label="'+escapeHtml(name)+'">'+scales.map(s=>'<option value="'+s.id+'"'+(s.id===selected?" selected":"")+'>'+escapeHtml(scaleName(s))+'</option>').join("")+'</optgroup>';
    return '<label class="field">Gam · '+filtered.length+' sonuç<select class="select-control" data-change="'+key+'">'+options+'</select></label>';
  }
  function scalePicker(prefix){
    const families=[...new Set(T.SCALES.map(s=>s.family))],rootKey=prefix+"Root",scaleKey=prefix==="scale"?"scaleId":"harmonyScale";
    return '<div class="field-row">'+rootSelect(rootKey,state[rootKey])+'<label class="field">Aile<select class="select-control" data-change="'+prefix+'Family"><option value="all">Tüm aileler</option>'+families.map(f=>'<option value="'+escapeHtml(f)+'"'+(state[prefix+"Family"]===f?" selected":"")+'>'+escapeHtml(f)+'</option>').join("")+'</select></label></div><label class="field scale-search">Gam ara<input type="search" data-change="'+prefix+'Query" value="'+escapeHtml(state[prefix+"Query"])+'" placeholder="Ad veya alternatif ad · Enter"></label>'+scaleSelect(scaleKey,state[scaleKey]);
  }
  function analysisSummary(analysis,compact=false){
    const scale=analysis.scale;
    const details='<p>'+escapeHtml(analysis.profile.description)+'</p>'+(analysis.characteristic.length?'<div class="profile-line">Karakter: '+analysis.characteristic.map(n=>escapeHtml(n.name)+' <small>'+escapeHtml(n.label)+'</small>').join(' · ')+'</div>':'')+(analysis.passing.length?'<div class="profile-line passing">Geçiş: '+analysis.passing.map(n=>escapeHtml(n.name)).join(' · ')+'</div>':'')+(analysis.parents.length?'<details class="profile-details"><summary>Mod ailesi</summary>'+analysis.parents.map(p=>'<p>'+escapeHtml(p.root)+' '+escapeHtml(p.parentName)+' · '+p.mode+'. mod</p>').join('')+'</details>':'')+(scale.scale.transpositionCount<12?'<div class="profile-line">'+scale.scale.transpositionCount+' farklı transpozisyon · simetrik yapı</div>':'')+'<a class="theory-source" href="'+analysis.profile.source+'" target="_blank" rel="noopener noreferrer">Teori kaynağı ↗</a>';
    const contexts=analysis.supersets.length?'<details class="profile-details"><summary>Bu koleksiyonu içeren armonik bağlamlar</summary><p>Ek sesler bir bağlam seçimidir; tek bir tonalite sonucu değildir.</p><div class="context-choices">'+analysis.supersets.map(s=>'<button data-action="useParentScale" data-value="'+s.id+'" data-root="'+escapeHtml(scale.root)+'">'+escapeHtml(s.name)+'<small>Ek: '+s.added.map(n=>escapeHtml(n.name)).join(' · ')+'</small></button>').join('')+'</div></details>':'';
    return '<div class="harmonic-profile"><div class="profile-heading"><strong>'+escapeHtml(analysis.profile.label)+'</strong><span>'+scale.pcs.length+' ses</span></div><div class="scale-formula">'+scale.scale.formula.map(escapeHtml).join(' · ')+'</div>'+(compact?'<details class="profile-details"><summary>Armonik özellikler</summary>'+details+'</details>':details)+contexts+makamSummary(analysis)+analysis.notices.map(n=>'<p class="harmony-notice">'+escapeHtml(n)+'</p>').join('')+'</div>';
  }
  function makamSummary(analysis){
    const m=analysis.makam;if(!m)return '';
    const name=state.language==='tr'?m.nameTr:m.nameEn,other=state.language==='tr'?m.nameEn:m.nameTr;
    const focus=m.focusDegree===8?analysis.scale.root:analysis.scale.notes[m.focusDegree-1]?.name;
    const direction={ascending:'Çıkıcı',descending:'İnici',mixed:'İnici–çıkıcı'}[m.seyir];
    const L=(tr,en)=>state.language==='tr'?tr:en,tuning=MT.analyze(analysis.scale.scale,60+analysis.scale.rootPc,{mode:state.makamPlayback,example:state.makamExample,notationAnchor:state.makamNotationAnchor,referenceA:state.makamReferenceA}),presets=MT.options(analysis.scale.scale),signed=n=>(n>0?'+':'')+n.toFixed(1),shift=12*Math.log2(state.makamReferenceA/440);
    const rows=tuning.rows.map((r,i)=>'<div class="intonation-row" data-makam-midi="'+(r.midi+shift)+'"><div class="intonation-degree"><span>'+r.degree+'</span><div><strong>'+escapeHtml(names()[T.mod(r.nearestMidi)])+(Math.floor(r.nearestMidi/12)-1)+'</strong><small>'+escapeHtml(r.perde||L('Derece','Degree')+' '+r.degree)+'</small>'+(r.writtenNote?'<small class="written-note" title="'+L('Geleneksel yazım · koma arızası','Traditional notation · comma accidental')+'">'+escapeHtml(r.writtenNote)+'</small>':'')+'</div></div><div class="intonation-step" data-caption="'+L('Aralık','Step')+'"><b>'+(r.stepCommas===null?'—':r.stepCommas)+'</b><small>'+escapeHtml(r.stepCommas===null?L('Durak','Tonic'):MT.intervalName(r.stepCommas,state.language))+'</small></div><div class="intonation-total" data-caption="Σ '+L('koma','commas')+'"><b>'+r.commas+'</b><small>'+r.referenceCents.toFixed(1)+' ¢</small></div><div class="intonation-offset"><b>'+signed(r.offsetCents)+' ¢</b><small>'+signed(r.offsetCommas)+' '+L('koma','commas')+'</small></div><div class="intonation-hz"><b>'+r.frequency.toFixed(2)+'</b><small>Hz</small></div><div class="intonation-actions">'+button('playMakamDegree','▶','data-index="'+i+'" aria-label="'+L('Dereceyi dinle','Listen to degree')+' '+r.degree+'" title="'+L('Dereceyi dinle','Listen to degree')+'"')+button('compareMakamDegree','A/B','data-index="'+i+'" aria-label="'+L('12-TET sonra koma','12-TET then comma')+' · '+r.degree+'" title="'+L('12-TET sonra koma','12-TET then comma')+'"')+'</div></div>').join('');
    let html='<section class="makam-profile koma-profile"><h3>'+escapeHtml(name)+' <small>'+escapeHtml(other)+'</small><span class="koma-badge">KOMA · 1.0</span></h3><dl><dt>Durak</dt><dd>'+escapeHtml(analysis.scale.root)+' · '+tuning.tonicHz.toFixed(2)+' Hz</dd><dt>Güçlü</dt><dd>'+escapeHtml(focus)+' · '+m.focusDegree+'</dd><dt>Seyir</dt><dd>'+direction+'</dd><dt>Geleneksel durak</dt><dd>'+escapeHtml(m.tonicName)+' · '+m.traditionalRoot+(m.tonicOffsetCommas?' −1 koma':'')+'</dd></dl><p>'+escapeHtml(L(m.structureTr,m.structureEn))+'</p>';
    html+='<div class="intonation-controls"><label class="field">'+L('Dinleme sistemi','Playback tuning')+'<select data-change="makamPlayback" class="select-control"><option value="comma"'+(state.makamPlayback==='comma'?' selected':'')+'>'+L('Koma · 53-EDO referansı','Comma · 53-EDO reference')+'</option><option value="equal"'+(state.makamPlayback==='equal'?' selected':'')+'>12-TET · '+L('standart gitar','standard guitar')+'</option></select></label>'+(presets.length?'<label class="field">'+L('Entonasyon örneği','Intonation example')+'<select data-change="makamExample" class="select-control"'+(state.makamPlayback==='equal'?' disabled':'')+'><option value="theory"'+(state.makamExample==='theory'?' selected':'')+'>'+L('Teorik aralıklar','Theoretical intervals')+'</option>'+presets.map(p=>'<option value="'+p.id+'"'+(state.makamExample===p.id?' selected':'')+'>'+escapeHtml(L(p.nameTr,p.nameEn))+'</option>').join('')+'</select></label>':'')+'</div>';
    html+='<div class="intonation-head"><span>'+L('Derece / yaklaşık nota','Degree / nearest note')+'</span><span>'+L('Önceki sesten','From previous')+'</span><span>'+L('Duraktan · koma','From tonic · commas')+'</span><span>'+L('12-TET farkı','12-TET offset')+'</span><span>Hz</span><span></span></div><div class="intonation-rows">'+rows+'</div>';
    html+='<p class="intonation-caption">'+L('Toplam koma ve cent sütunu 53-EDO modelini gösterir. Fark, en yakın 12-TET notasına göredir; nota adları yaklaşık konumdur. Perde adları ve ↓/↑ koma arızaları geleneksel yazımdır; transpoze nota adları değildir. 12-TET farkı notasyondaki arıza sayısı değildir.','Total commas and cents describe the 53-EDO reference. Offset is from the nearest 12-TET note; note labels are approximate. Perde names and ↓/↑ comma accidentals are traditional notation, not transposed note names. The 12-TET offset is not the written accidental count.')+'</p>';
    if(tuning.example)html+='<p class="intonation-example">'+escapeHtml(L('Seçilen sabit değer yalnız kaynakta anlatılan icra farkını dinlemek içindir; otomatik seyir veya evrensel entonasyon değildir.','The selected fixed value demonstrates a documented performance difference; it is not automatic seyir or universal intonation.'))+' <a href="'+tuning.example.source+'" target="_blank" rel="noopener">'+L('Kaynak','Source')+' ↗</a></p>';
    if(m.partial)html+='<p class="intonation-example">'+L('Saba: yalnız 18 komalık alt dörtlü. Üst ağ ve gerçek seyir modellenmemiştir; oktav eklenmez.','Saba: lower 18-comma tetrachord only. The upper network and actual seyir are not modeled; no octave is appended.')+'</p>';
    if(['makam-rast','makam-huseyni','makam-neva','makam-huzzam','makam-saba','makam-ussak','makam-bayati'].includes(analysis.scale.scale.id))html+='<details class="intonation-notes"><summary>'+L('Seyir ve değişken perdeler','Seyir and variable pitches')+'</summary><p>'+escapeHtml(m.performanceNote?.[state.language]||L('Bu koleksiyon seyri, asma kararları ve icracıya bağlı entonasyonu tek başına belirlemez.','This collection alone does not establish seyir, resting points or performer-specific intonation.'))+'</p><a href="'+m.source+'" target="_blank" rel="noopener">'+L('Makam kaynağı','Makam source')+' ↗</a></details>';
    html+='<details class="intonation-notes"><summary>'+L('Referans ve model','Reference and model')+'</summary><p>53-EDO · 1 '+L('koma','comma')+' = '+MT.COMMA_CENTS.toFixed(5)+' ¢. '+L('AEU oranlarının yaklaşımı; tam Pisagor sistemi değildir. Dinleme bir gam egzersizidir, makam taksimi değildir.','Approximation of AEU ratios; not exact Pythagorean tuning. Playback is a scale exercise, not a makam improvisation.')+'</p><label class="field">A4 · Hz<input type="number" data-change="makamReferenceA" min="400" max="480" step="0.1" value="'+state.makamReferenceA+'"></label>'+(m.tonicOffsetCommas?'<label class="check-label"><input type="checkbox" data-change="makamNotationAnchor"'+(state.makamNotationAnchor?' checked':'')+'>'+L('Yazılı kökü −1 koma kaydır (Segâh durağı)','Shift written root −1 comma (Segah tonic)')+'</label>':'')+'<p>'+L('A4 seçimi yalnız makam dinlemesini etkiler. Hz sütunu seçilen referansa göredir.','The A4 setting applies only to makam playback. Frequencies use the selected reference.')+'</p><p>Teorik koma sesleri standart MIDI dışa aktarımında korunmaz.</p><a href="Makam_Arastirmasi.html" target="_blank" rel="noopener">'+L('Araştırma ve kapsam','Research and scope')+' ↗</a></details>';
    return html+'<div class="action-row">'+button('playMakamTuning','Koma modelini dinle')+button('playMakamEqual',L('12-TET dinle','Listen to 12-TET'))+button('makamRoot','Geleneksel durakla aç')+'</div><p class="intonation-caption">'+L('Gitar klavyesindeki halkalar en yakın perdeleri gösterir. Turuncu çalma halkası: elektronik olarak kaydırılmış ses.','Fretboard rings mark nearest frets. Orange playback ring: electronically retuned pitch.')+'</p></section>';
  }
  function degreeSizeControl(){return '<select class="select-control" data-change="harmonySize" aria-label="'+(state.language==='tr'?'Akor boyutu':'Chord size')+'"><option value="3"'+(state.harmonySize===3?' selected':'')+'>'+(state.harmonyGrammar==='quartal'?'3 ses':'Üçlüler / sus')+'</option><option value="4"'+(state.harmonySize===4?' selected':'')+'>'+(state.harmonyGrammar==='quartal'?'4 ses':'Yedililer / altılılar')+'</option></select>';}
  function grammarControl(){return '<div class="panel-section">'+sectionLabel('Armonik kurulum')+'<div class="voicing-families">'+[['auto','Gama göre'],['contained','Ses üyeliği'],['quartal','Tam dörtlüler']].map(([value,label])=>'<button data-action="harmGrammar" data-value="'+value+'" class="'+(state.harmonyGrammar===value?'active':'')+'">'+label+'</button>').join('')+'</div></div>';}
  function renderScale(host){
    const analysis=H.analyze(state.scaleRoot,state.scaleId,{chordSize:state.harmonySize,grammar:state.harmonyGrammar}),scale=analysis.scale,degrees=analysis.chords;state._visibleDegrees=degrees;
    let html=panelHeader("Gam")+scalePicker("scale")+scaleSceneControls()+grammarControl();
    html+='<div class="chord-result scale-result"><div class="scale-name">'+escapeHtml(scale.root)+" "+escapeHtml(scaleName(scale.scale))+'</div><div class="chord-notes">'+scale.notes.map(n=>'<span class="chord-tone'+(analysis.characteristic.some(c=>c.pc===n.pc)?' characteristic':'')+(analysis.passing.some(c=>c.pc===n.pc)?' passing':'')+'">'+escapeHtml(n.name)+'<small>'+escapeHtml(n.label)+'</small></span>').join("")+'</div><div class="action-row">'+button("playScale","Çal","","action-button primary")+button("arpeggiateScale","Arpej","","action-button")+button("scaleHarmony","Armoniyi aç")+(degreePreview?button("showScale","Tüm gam"):"")+'</div></div>'+analysisSummary(analysis);
    const titles={makam:'Gitar yaklaşımının akorları',quartal:'Tam dörtlü yapılar',sixthDiminished:'Altılı / eksik çifti',bebop:'İskeletin derece akorları'};
    const chordTitle=titles[analysis.profile.context]||(degrees[0]?.construction==='tertian'?'Derece akorları':'Gam içindeki akorlar');
    html+='<div class="panel-section">'+sectionLabel(chordTitle,degreeSizeControl())+'<div class="degree-grid">'+degrees.slice(0,state.scaleChordLimit).map(degreeCard).join("")+'</div>'+(degrees.length>state.scaleChordLimit?button('moreScaleChords','12 akor daha','','more-voicings'):'')+(!degrees.length?'<p class="harmony-notice">Bu koleksiyonda seçilen türden tanınmış akor bulunamadı.</p>':'')+'</div>';host.innerHTML=localHtml(html);
  }
  function mapControls(L){
    const zooms=[1,1.25,1.5,1.75,2],index=Math.max(0,zooms.indexOf(Number(state.mapZoom))),roman=state.harmonyLabels==='roman';
    const sources=['major','naturalMinor','harmonicMinor','melodicMinor','dorian','phrygian','lydian','mixolydian','harmonicMajor'];
    return '<div class="hmap-bar"><button data-action="mapLabels" aria-pressed="'+roman+'">'+(roman?L('Roma rakamı','Roman numerals'):L('Akor adı','Chord names'))+'</button><button data-action="mapZoom" data-value="out" aria-label="'+L('Uzaklaştır','Zoom out')+'"'+(index===0?' disabled':'')+'>−</button><button data-action="mapZoom" data-value="in" aria-label="'+L('Yakınlaştır','Zoom in')+'"'+(index===zooms.length-1?' disabled':'')+'>+</button><button data-action="mapExpand" title="'+L('Araçlar alanını genişlet','Give the map more room')+'">⤢ '+L('Genişlet','Expand')+'</button><label>'+L('Ödünç gam','Borrowed from')+' <select data-change="borrowSource"><option value="auto">'+L('Bağlama göre','By context')+'</option>'+sources.map(id=>'<option value="'+id+'"'+(state.borrowSource===id?' selected':'')+'>'+escapeHtml(scaleName(T.SCALES.find(s=>s.id===id)))+'</option>').join('')+'</select></label></div>';
  }
  function renderHarmony(host){
    const L=(tr,en)=>state.language==='tr'?tr:en,Atlas=root.MBS2HarmonyAtlas,graph=MapView.buildGraph(state.harmonyRoot,state.harmonyScale,state.harmonyLens==='map'?{primary:true,borrowed:true,chromatic:true,leading:true,tritone:true,commonTone:true,sevenths:true,borrowSource:state.borrowSource,grammar:state.harmonyGrammar}:{...state.mapLayers,sevenths:state.harmonySize===4,borrowSource:state.borrowSource,grammar:state.harmonyGrammar});if(state.harmonyLens==='map')root.MBS2HarmonyDiagram?.augment(graph);state._visibleGraph=graph;state._visibleDegrees=graph.analysis.chords;
    const views=[{id:'diatonic',name:'Gam içi',count:graph.nodes.filter(n=>n.kind==='diatonic').length},...graph.layers.filter(l=>l.enabled&&l.count>0),{id:'all',name:'Tam harita',count:graph.nodes.length}];
    if(!views.some(v=>v.id===state.harmonyFocus))state.harmonyFocus='diatonic';
    const orbitKey=JSON.stringify([state.harmonyRoot,state.harmonyScale,state.harmonySize,state.harmonyGrammar]);if(state.harmonyLens==='orbit'&&state.orbitContext!==orbitKey){state.orbitContext=orbitKey;state.orbitAnchor=graph.nodes[0]?.record||null;state.orbitHistory=state.orbitAnchor?[state.orbitAnchor]:[];state.orbitStarted=false;root.GBOrbitView?.reset();if(state.orbitAnchor){activeChord=state.orbitAnchor;activeVoicing=null;ensureVoicing(activeChord);}}
    const selected=graph.nodes.find(n=>state.harmonyLens==='orbit'?root.GBOrbitEngine.key(n.record)===root.GBOrbitEngine.key(state.orbitAnchor||{}):n.id===(state.harmonyLens==='map'&&!graph.nodes.some(m=>m.id===state.mapActiveId)?'diatonic-1':state.mapActiveId)),plrChord=T.buildChord(state.plrRoot,state.plrType),record=state.harmonyLens==='orbit'?state.orbitAnchor:state.harmonyLens==='plr'?plrChord:chordRecordFromNode(selected)||activeChord,tension=record?H.tensionInfo(record,graph.analysis.scale):null;state._atlasSelected=record;
    const layers='<div class="harmony-layer-grid">'+graph.layers.map(layer=>'<label class="harmony-layer'+(!layer.available?' unavailable':'')+'" title="'+escapeHtml(layer.available?layer.explanation:'Bu armonik yaklaşım için uygulanmaz')+'"><input type="checkbox" data-change="'+layer.id+'"'+(state.mapLayers[layer.id]?' checked':'')+(!layer.available?' disabled':'')+'><span>'+escapeHtml(layer.name)+'</span><small>'+layer.count+'</small></label>').join('')+'</div>';
    const borrow=graph.layers.find(l=>l.id==='borrowed').available&&state.mapLayers.borrowed?'<label class="field borrow-source">Ödünç alınacak paralel gam<select class="select-control" data-change="borrowSource"><option value="auto">Bağlama göre · majör / doğal minör</option>'+['major','naturalMinor','harmonicMinor','melodicMinor','dorian','phrygian','lydian','mixolydian','harmonicMajor'].map(id=>'<option value="'+id+'"'+(state.borrowSource===id?' selected':'')+'>'+escapeHtml(scaleName(T.SCALES.find(s=>s.id===id)))+'</option>').join('')+'</select></label>':'';
    let html='<div class="harmony-atlas" data-lens="'+state.harmonyLens+'"><header class="atlas-toolbar"><details class="harmony-picker"><summary><strong>'+escapeHtml(state.harmonyRoot)+'</strong> '+escapeHtml(scaleName(graph.scale))+' <span>⌄</span></summary><div class="atlas-picker-popover">'+scalePicker('harmony')+'</div></details><div class="atlas-lenses">'+[['map',L('Harita','Map')],['orbit',L('Keşif','Orbit')],['functions',L('İşlevler','Functions')],['fifths',L('Beşliler','Fifths')],['plr','PLR']].map(([id,name])=>button('harmonyLens',name,'data-value="'+id+'" aria-pressed="'+(state.harmonyLens===id)+'"',state.harmonyLens===id?'active':'')).join('')+'</div></header><div class="atlas-desk"><section class="atlas-main">';
    if(state.harmonyLens==='map')html+=mapControls(L);
    else if(state.harmonyLens==='orbit')html+='<div class="orbit-controls"><button data-action="orbitScope" data-value="context" class="'+(state.orbitScope==='context'?'active':'')+'">'+L('Ton / bağlantılar','Key / connections')+'</button><button data-action="orbitScope" data-value="all" class="'+(state.orbitScope==='all'?'active':'')+'">'+L('Tüm akorlar','All chords')+'</button><button data-action="orbitReset">↺ '+L('Merkez','Centre')+'</button><button data-action="orbitSound" aria-pressed="'+state.orbitSound+'">'+(state.orbitSound?'♫':'♩')+' '+L('Dinlet','Audition')+'</button>'+degreeSizeControl()+'</div>';
    else if(state.harmonyLens!=='plr')html+='<div class="atlas-focus"><label>'+L('Bağlantılar','Relationships')+'<select data-change="atlasFocus">'+views.map(v=>'<option value="'+v.id+'"'+(state.harmonyFocus===v.id?' selected':'')+'>'+escapeHtml(tr(v.name))+' · '+v.count+'</option>').join('')+'</select></label>'+degreeSizeControl()+'</div>';
    else html+='<div class="atlas-focus"><label>'+L('PLR merkezi','PLR centre')+'<select data-change="plrRoot">'+names().map(n=>'<option value="'+n+'"'+(T.parseNote(n)===T.parseNote(state.plrRoot)?' selected':'')+'>'+n+'</option>').join('')+'</select></label><select data-change="plrType" aria-label="'+L('Üçlü türü','Triad quality')+'"><option value="major"'+(state.plrType==='major'?' selected':'')+'>'+L('Majör','Major')+'</option><option value="minor"'+(state.plrType==='minor'?' selected':'')+'>'+L('Minör','Minor')+'</option></select></div>';
    html+='<div id="mapHost"></div></section><section class="atlas-inspector" aria-label="'+(state.language==='tr'?'Seçili akor':'Selected chord')+'">';
    if(record){const voice=getVoicings(record,1)[0]||null;html+='<div class="atlas-selected"><small>'+L('SEÇİLİ AKOR','SELECTED CHORD')+'</small><strong>'+escapeHtml(record.symbol)+'</strong><span>'+escapeHtml(selected?.degree||(state.harmonyLens==='plr'?'PLR':record.typeName||''))+'</span><div class="atlas-notes">'+record.notes.map(n=>'<span>'+escapeHtml(n.name)+'</span>').join('')+'</div>'+(voice?Diagram.render(voice,record,currentTuning(),state.capo,{...handOptions(),labels:'degrees',compact:true}):'<p>'+L('Bu bölgede tutuş yok.','No grip in this region.')+'</p>')+'<div class="atlas-hear">'+button('atlasPlay',L('Dinle','Listen'),'data-value="block"')+button('atlasPlay',L('Arpej','Arpeggio'),'data-value="arp"')+'</div>'+(state.harmonyLens==='orbit'?button('orbitToMotion',L('İlerlemeyi Motion’da aç','Open progression in Motion'),'','atlas-to-motion'):button('motionPair',L('Merkez → bu akor','Centre → this chord'),'','atlas-to-motion'))+'</div>';}
    if(tension?.tensions.length)html+='<div class="atlas-tensions"><small>'+L('GAM RENKLERİ','SCALE COLOURS')+'</small>'+tension.tensions.map(n=>'<span class="'+(n.caution?'caution':'')+'">'+escapeHtml(n.name)+' <small>'+escapeHtml(n.label)+'</small></span>').join('')+'</div>';
    html+='</section></div>'+(state.harmonyLens==='orbit'?'<section id="orbitLower" class="orbit-lower"></section>':'')+'<div class="atlas-settings"><details class="harmony-layer-controls"><summary>'+L('Katmanlar','Layers')+'</summary>'+layers+borrow+'</details><details><summary>'+L('Kurulum','Construction')+'</summary>'+grammarControl()+'</details><details><summary>'+L('Akorlardan gam bul','Find scale from chords')+'</summary>'+poolPanel()+'</details><details><summary>'+L('Teori / koma','Theory / commas')+'</summary>'+analysisSummary(graph.analysis,true)+'<a class="theory-source" href="'+Atlas.SOURCES[state.harmonyLens==='plr'?'plr':state.harmonyLens==='fifths'?'fifths':'functions']+'" target="_blank" rel="noopener noreferrer">'+L('Harita yaklaşımının kaynağı ↗','Map approach source ↗')+'</a></details></div></div>';
    host.innerHTML=localHtml(html);
    MapView.render(host.querySelector('#mapHost'),graph,state.mapActiveId,{lowerHost:host.querySelector('#orbitLower'),language:state.language,scope:state.orbitScope,initial:!state.orbitStarted,history:state.orbitHistory,focus:!!state._orbitFocus,onExpand:()=>{state.orbitStarted=true;state._orbitFocus=true;renderPanel();},onHistory:index=>{if(index<0)return;state.orbitHistory=state.orbitHistory.slice(0,index+1);state.orbitAnchor=state.orbitHistory.at(-1);state._orbitFocus=true;setActiveChord(state.orbitAnchor);},lens:state.harmonyLens,labels:state.harmonyLabels,zoom:state.mapZoom,anchor:state.harmonyLens==='orbit'?state.orbitAnchor:plrChord,limit:state.mapNodeLimit,focusKind:state.harmonyFocus,onMore:()=>{state.mapNodeLimit=Math.min(144,state.mapNodeLimit+12);renderPanel();},onSelect:node=>{if(state.harmonyLens==='orbit'){state.orbitAnchor=node.record;state.orbitHistory=[...state.orbitHistory,node.record].slice(-64);state.orbitStarted=true;state._orbitFocus=true;setActiveChord(node.record);if(state.orbitSound)playChordRecord(node.record);return;}if(node.kind==='plr'){state.plrRoot=node.record.root;state.plrType=node.record.typeId;}else state.mapActiveId=node.id;setActiveChord(chordRecordFromNode(node));},onAction:(node,action)=>playChordRecord(chordRecordFromNode(node),action==='arpeggio')});state._orbitFocus=false;
  }
  function preferencesPanel(){
    const selectors=[['language','Dil',[['en','English'],['tr','Türkçe']]],['theme','Tema',[['graphite','Grafit'],['midnight','Gece mavisi'],['cyberpunk','Cyberpunk'],['light','Açık tema'],['auto','Sistem']]],['font','Yazı tipi',[['manrope','Manrope'],['space','Space Grotesk'],['system','Sistem'],['serif','Georgia'],['mono','Consolas']]]];
    selectors.push(['motionPreference',state.language==='tr'?'Animasyon':'Animation',[['system',state.language==='tr'?'Sistem tercihi':'System preference'],['full',state.language==='tr'?'Tam animasyon':'Full motion'],['reduced',state.language==='tr'?'Azaltılmış hareket':'Reduced motion']]]);
    return '<div class="panel-section preferences-panel">'+sectionLabel('Görünüm ve dil')+selectors.map(([key,label,options])=>'<label class="field">'+label+'<select class="select-control" data-change="'+key+'">'+options.map(([id,name])=>'<option value="'+id+'"'+(state[key]===id?' selected':'')+'>'+name+'</option>').join('')+'</select></label>').join('')+'</div>';
  }
  // "Auto" follows the operating system's light or dark preference.
  function effectiveTheme(){return state.theme!=='auto'?state.theme:root.matchMedia?.('(prefers-color-scheme: light)')?.matches?'light':'graphite';}
  // Finger numbers and mirroring are passed to every diagram explicitly, so rendering has no hidden shared state.
  function handOptions(){return {fingers:state.showFingers,mirror:state.leftHanded};}
  function applyPreferences(){
    I18n?.setLocale(state.language);const element=document.documentElement;
    element?.setAttribute?.('lang',state.language);const theme=effectiveTheme();element?.setAttribute?.('data-theme',theme);document.querySelector?.('meta[name="theme-color"]')?.setAttribute('content',THEME_COLORS[theme]);element?.setAttribute?.('data-font',state.font);element?.setAttribute?.('data-hand',state.leftHanded?'left':'right');
    element?.setAttribute?.('data-motion-preference',state.motionPreference);
    element?.style?.setProperty('--font-ui',FONTS[state.font][0]);element?.style?.setProperty('--font-display',FONTS[state.font][1]);element?.style?.setProperty('--cyan',state.color);
    document.title='Guitar Brain · Motion';
    $('#guitarScene')?.setAttribute?.('aria-label',state.language==='tr'?'Tıklanabilir 3D gitar klavyesi':'Interactive 3D guitar fretboard');
    if(I18n)for(const selector of ['.scene-tools','.scene-camera','.scene-hint','.scene-hint-mobile','#sceneLegend','#modeNav','#helpDialog','#playbackDock'])I18n.dom($(selector),state.language);
  }
  function renderProject(host){
    const tuning=currentTuning();
    let html=panelHeader("Ayarlar")+preferencesPanel()+'<div class="panel-section">'+sectionLabel("Enstrüman",'<span>'+tuning.notes.length+' tel</span>')+'<label class="field">Akort<select class="select-control" data-change="tuning">'+G.TUNINGS.map(t=>'<option value="'+t.id+'"'+(t.id===state.tuningId?" selected":"")+'>'+escapeHtml(t.name)+'</option>').join("")+'<option value="custom"'+(state.tuningId==="custom"?" selected":"")+'>Özel akort</option></select></label><label class="field" style="margin-top:12px">Özel akort · fiziksel tel sırasıyla<input type="text" data-change="customTuning" value="'+escapeHtml(state._customTuningDraft??(state.customTuning||[]).join(" "))+'" placeholder="E2 A2 D3 G3 B3 E4"></label><div class="action-row">'+button("applyCustomTuning","Özel akordu uygula")+'</div><label class="field" style="margin-top:14px">Capo<input type="number" data-change="capo" min="0" max="12" value="'+state.capo+'"></label></div>';
    html+='<div class="panel-section">'+sectionLabel("Gitar")+'<div class="action-row">'+button("toggleHand","Solak",'aria-pressed="'+state.leftHanded+'"',"secondary-button")+button("toggleFingers","Parmak numaraları",'aria-pressed="'+state.showFingers+'"',"secondary-button")+'</div><p class="settings-note">Solak modda klavye, diyagramlar ve dışa aktarımlar yansıtılır. Önerilen parmaklar diyagramlarda tellerin altında görünür.</p></div>';
    html+='<div class="panel-section">'+sectionLabel("Ses")+'<div class="field-row"><label class="field">Tempo · BPM<input type="number" min="40" max="220" value="'+state.bpm+'" data-change="bpm"></label><label class="field">Arpej yönü<select class="select-control" data-change="arpeggioDirection">'+["up","down","up-down"].map((key,i)=>'<option value="'+key+'"'+(state.arpeggioDirection===key?" selected":"")+'>'+["Yukarı","Aşağı","Yukarı – aşağı"][i]+'</option>').join("")+'</select></label></div></div>';
    html+='<div class="panel-section">'+sectionLabel("Renk")+'<label class="field">Vurgu<input type="color" data-change="color" value="'+state.color+'"></label></div>';
    html+='<div class="panel-section">'+sectionLabel("Proje")+'<div class="action-row">'+button("exportProject","JSON indir")+'<label class="secondary-button file-label">JSON aç<input type="file" accept="application/json,.json" data-change="importProject" hidden></label></div></div>';
    html+='<div class="panel-section">'+sectionLabel("Dışa aktar")+'<label class="field">Çıktı perde aralığı<select class="select-control" data-change="exportRange">'+[['visible','Ekrandaki aralık'],['0-12','0–12'],['12-24','12–24'],['0-24','0–24 · tüm klavye']].map(([id,label])=>'<option value="'+id+'"'+(state.exportRange===id?' selected':'')+'>'+label+'</option>').join('')+'</select></label><div class="action-row">'+button("exportSvg","SVG")+button("exportPng","PNG")+button("print","PDF / Yazdır")+button("exportMidi","MIDI")+'</div></div>';
    const pwa=root.MBS2PWA?.status();if(pwa){html+='<div class="panel-section">'+sectionLabel('Uygulama','<span>Motion '+escapeHtml(document.documentElement.dataset.release||'')+'</span>')+'<div class="action-row">'+(pwa.installed?'<span class="helper">Uygulama yüklü</span>':pwa.canInstall?button('installApp','Uygulamayı yükle','','action-button primary'):'')+button('fullscreen','Tam ekran')+(pwa.update?button('updateApp','Yeni sürümü aç'): '')+'</div><p class="helper">'+(pwa.offline?'Çevrimdışı kullanıma hazır':pwa.failed?'Çevrimdışı hazırlık başarısız; bağlantıyı kontrol edip yenile.':'Çevrimdışı kullanım hazırlanıyor…')+'</p>'+(!pwa.installed?'<p class="helper">Android / Chrome: tarayıcı menüsü → Uygulamayı yükle. iPhone / iPad: Safari → Paylaş → Ana Ekrana Ekle → Web uygulaması olarak aç.</p>':'')+'</div>';}
    host.innerHTML=localHtml(html);
  }
  function invalidateChord(){state.chordEvidence=[];activeChord=chordFromState();activeVoicing=null;state.activeVoicingId=null;state.voicingLimit=12;if(["drop2","drop3"].includes(state.voicingFamily)&&activeChord.pitchClasses.length!==4||state.voicingFamily==="shell"&&activeChord.pitchClasses.length<4)state.voicingFamily="all";ensureVoicing(activeChord);}
  function bindPanel(){
    const host=$("#panelContent");
    host.querySelectorAll('input[type="search"]').forEach(control=>control.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();control.dispatchEvent(new Event('change',{bubbles:true}));}}));
    host.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>handleAction(b.dataset.action,b)));
    host.querySelectorAll("[data-card-action]").forEach(b=>b.addEventListener("click",()=>handleCardAction(b.dataset.cardAction,Number(b.dataset.index))));
    host.querySelectorAll("[data-details]").forEach(detail=>detail.addEventListener("toggle",()=>{if(detail.isConnected){state.advancedOpen=detail.open;saveLocal();}}));
    host.querySelectorAll("[data-change]").forEach(control=>control.addEventListener("change",()=>{
      const key=control.dataset.change;
      if(key==='exportRange'&&['visible','0-12','12-24','0-24'].includes(control.value))state.exportRange=control.value;
      if(key==='makamPlayback'&&['comma','equal'].includes(control.value)){state.makamPlayback=control.value;Audio.stop?.();}
      if(key==='makamExample'){state.makamExample=control.value;Audio.stop?.();}
      if(key==='makamNotationAnchor'){state.makamNotationAnchor=control.checked;Audio.stop?.();}
      if(key==='makamReferenceA'){state.makamReferenceA=Math.max(400,Math.min(480,Number(control.value)||440));Audio.stop?.();}
      if(key==='language'&&['en','tr'].includes(control.value))state.language=control.value;
      if(key==='motionPreference'&&['system','full','reduced'].includes(control.value))state.motionPreference=control.value;
      if(key==='theme'&&THEMES.includes(control.value)){state.theme=control.value;state.color={graphite:'#7ee5e0',midnight:'#80b6ff',cyberpunk:'#00f5df',light:'#166f78'}[control.value==='auto'?effectiveTheme():control.value];}
      if(key==='font'&&Object.hasOwn(FONTS,control.value))state.font=control.value;
      if(["voicingDifficulty","voicingPosition","voicingBass"].includes(key)){state[key]=control.value;state.voicingLimit=12;}
      if(key==="voicingCompleteness"){state.voicingCompleteness=control.checked?"full":"practical";activeVoicing=null;state.activeVoicingId=null;state.voicingLimit=12;}
      if(["scaleRoot","scaleId","harmonyRoot","harmonyScale"].includes(key)){
        state.makamExample='theory';state.makamNotationAnchor=false;
        state[key]=control.value;degreePreview=false;state.scaleChordLimit=12;state.mapNodeLimit=12;
        if(key==='scaleRoot'||key==='harmonyRoot')state.scaleRoot=state.harmonyRoot=control.value;
        else state.scaleId=state.harmonyScale=control.value;
        const picker=host.querySelector('.harmony-picker');if(picker)picker.open=false;
        if(state.mode==='harmony')resetHarmonyChord();
      }
      if(Object.keys(defaults.mapLayers).includes(key)){state.mapLayers[key]=control.checked;if(control.checked)state.harmonyFocus=key;}
      if(['scaleFamily','harmonyFamily','scaleQuery','harmonyQuery','borrowSource'].includes(key))state[key]=control.value;
      if(key==='atlasFocus')state.harmonyFocus=control.value;
      if(['plrRoot','plrType'].includes(key)){state[key]=control.value;activeChord=T.buildChord(state.plrRoot,state.plrType);activeVoicing=null;ensureVoicing(activeChord);}
      if(key==="harmonySize"){state.harmonySize=Number(control.value);state.scaleChordLimit=12;degreePreview=false;if(state.mode==='harmony')resetHarmonyChord();}
      if(key==='poolTonic'){state.poolTonic=control.value;state._poolLimit=8;}
      if(key==='poolChromatic'){state.poolChromatic=control.checked;state._poolLimit=8;}
      if(key==='compareScale')state.compareScale=control.value;
      if(key==='positionFocus'){state.positionFocus=control.value;if(control.value!=='all')state.sceneRange=Number(control.value.split('-')[0])>=12?12:0;}
      if(key==="bpm")state.bpm=Math.max(40,Math.min(220,Number(control.value)||92));
      if(key==="arpeggioDirection")state.arpeggioDirection=control.value;
      if(key==="slashBass"){state.slashBass=control.value===""?null:Number(control.value);state.customChord=null;invalidateChord();}
      if(key==="capo")state.capo=Math.max(0,Math.min(12,Number(control.value)||0));
      if(key==="tuning"){state.tuningId=control.value;state.customTuning=control.value==="custom"?(state.customTuning||[...G.TUNINGS[0].notes]):null;state.selectedPositions=state.selectedPositions.filter(p=>p.stringIndex<currentTuning().notes.length);}
      if(key==="capo"||key==="tuning"){voicesCache.clear();state.selectedPositions=state.selectedPositions.filter(p=>p.fret>=state.capo);activeVoicing=null;state.activeVoicingId=null;if(activeChord)ensureVoicing(activeChord);}
      if(key==="customTuning")state._customTuningDraft=control.value;
      if(key==="color"){state.color=control.value;document.documentElement.style.setProperty("--cyan",state.color);}
      if(key==="importProject"){const file=control.files?.[0];if(file)file.text().then(text=>importProject(safeParse(text))).catch(()=>toast("JSON okunamadı."));return;}
      renderPanel();renderScene();saveLocal();
    }));
  }
  function handleAction(action,b){
    const value=b.dataset.value,index=Number(b.dataset.index);
    if(action==='orbitCurrent'){const chord=activeChord||chordFromState();state.harmonyLens='orbit';state.orbitAnchor=chord;state.orbitHistory=[chord];state.orbitStarted=true;state.orbitContext=JSON.stringify([state.harmonyRoot,state.harmonyScale,state.harmonySize,state.harmonyGrammar]);setMode('harmony');setActiveChord(chord);return;}
    if(action==='orbitScope')state.orbitScope=value;
    if(action==='orbitSound')state.orbitSound=!state.orbitSound;
    if(action==='orbitReset'){const chord=state._visibleGraph?.nodes[0]?.record;if(chord){state.orbitAnchor=chord;state.orbitHistory=[chord];state.orbitStarted=false;root.GBOrbitView?.reset();setActiveChord(chord);}return;}
    if(action==='orbitToMotion'){const list=state.orbitHistory.slice(-8);if(list.length<2){toast(state.language==='tr'?'Önce bir sonraki akoru seç.':'Choose the next chord first.');return;}if(root.GBMotionWorkspace.setSequence(list))setMode('motion');return;}
    if(action==='atlasPlay'){playChordRecord(state._atlasSelected,value==='arp');return;}
    if(action==='motionPair'){const source=state._visibleGraph?.nodes.find(n=>n.rootPc===T.parseNote(state.harmonyRoot)&&n.kind==='diatonic')?.record||T.buildChord(state.harmonyRoot,'major'),target=state._atlasSelected||activeChord;if(target&&root.GBMotionWorkspace.setSequence([source,target]))setMode('motion');return;}
    if(action==='toggleHand'||action==='toggleFingers'){if(action==='toggleHand')state.leftHanded=!state.leftHanded;else state.showFingers=!state.showFingers;applyPreferences();renderScene();}
    if(action==='mapExpand'){document.querySelector('button[data-layout-focus="workspace"]')?.click();return;}
    if(action==='mapLabels')state.harmonyLabels=state.harmonyLabels==='names'?'roman':'names';
    if(action==='mapZoom'){const zooms=[1,1.25,1.5,1.75,2],next=Math.max(0,zooms.indexOf(Number(state.mapZoom)))+(value==='in'?1:-1);state.mapZoom=zooms[Math.max(0,Math.min(zooms.length-1,next))];}
    if(action==='harmonyLens'){state.harmonyLens=value;if(value==='orbit')root.GBOrbitView?.reset();if(value==='plr'){const core=root.MBS2HarmonyAtlas.triadCore(activeChord);if(core){state.plrRoot=core.root;state.plrType=core.typeId;}}}
    else if(action==='motionCurrent'){if(root.GBMotionWorkspace.addChord(activeChord||chordFromState()))setMode('motion');else toast(tr('En fazla 8 akor'));return;}
    if(action==='poolCurrent'){addToPool(activeChord||chordFromState());renderPanel();return;}
    else if(action==='poolMatch'){addToPool(state._visibleMatches?.[index]);return;}
    else if(action==='removePool'){state.chordPool.splice(index,1);state._poolLimit=8;}
    else if(action==='clearPool'){state.chordPool=[];state._poolLimit=8;}
    else if(action==='poolExample'){state.chordPool=root.MBS2ChordPool.normalize([T.buildChord('D','minor7'),T.buildChord('G','dominant7'),T.buildChord('C','major7')]);state._poolLimit=8;}
    else if(action==='morePoolScales')state._poolLimit=(state._poolLimit||8)+16;
    else if(action==='usePoolScale'){state.scaleRoot=state.harmonyRoot=b.dataset.root;state.scaleId=state.harmonyScale=b.dataset.scale;state.makamExample='theory';state.makamNotationAnchor=false;resetHarmonyChord();}
    else if(action==='playPoolScale'){play(scaleMidi(b.dataset.root,b.dataset.scale),true);return;}
    else if(action==="root"){state.chordRoot=value;state.customChord=null;state.chordType=state.chordType||"major";invalidateChord();}
    else if(action==="quality"){state.customChord=null;state.chordType=value;invalidateChord();}
    else if(action==="modifier"){
      const mod=T.MODIFIERS.find(m=>m.id===value);if(mod){const key=mod.kind==="add"?"add":"alter",had=state.modifiers[key].includes(value);state.modifiers[key]=state.modifiers[key].filter(x=>x!==value);if(!had){if(key==="alter")state.modifiers.alter=state.modifiers.alter.filter(id=>T.MODIFIERS.find(m=>m.id===id)?.degree!==mod.degree);state.modifiers[key].push(value);}invalidateChord();}
    }
    else if(action==="omit"){const n=Number(value);state.modifiers.omit=state.modifiers.omit.includes(n)?state.modifiers.omit.filter(x=>x!==n):[...state.modifiers.omit,n];invalidateChord();}
    else if(action==="toggleTypes")state.showAllTypes=!state.showAllTypes;
    else if(action==="voicingFamily"){state.voicingFamily=value;state.voicingLimit=12;}
    else if(action==="moreVoicings")state.voicingLimit=Math.min(144,state.voicingLimit+12);
    else if(action==="resetVoicingFilters"){state.voicingFamily="all";state.voicingDifficulty="all";state.voicingPosition="all";state.voicingBass="all";state.voicingCompleteness="practical";state.voicingLimit=12;}
    else if(action==="diagramLabels")state.diagramLabels=value==="degrees"?"degrees":"notes";
    else if(action==="sceneTones")state.sceneToneView=!state.sceneToneView;
    else if(action==="toggleSpelling"){state.spelling=state.spelling==="sharp"?"flat":"sharp";for(const key of ["chordRoot","scaleRoot","harmonyRoot"])state[key]=names()[T.parseNote(state[key])];if(!state.customChord)invalidateChord();}
    else if(action==="selectVoicing"){activeVoicing=state._visibleVoicings?.[index]||null;state.activeVoicingId=activeVoicing?.id||null;fitVoicing();}
    else if(action==="playVoicing"||action==="arpeggioVoicing"){playChordRecord(chordFromState(),action==="arpeggioVoicing",state._visibleVoicings?.[index]);return;}
    else if(action==="playChord"||action==="arpeggiateChord"){play(chordMidis(activeChord||chordFromState()),action==="arpeggiateChord");return;}
    else if(action==="clearSelection")state.selectedPositions=[];
    else if(action==="removePosition"){togglePosition(Number(b.dataset.string),Number(b.dataset.fret),true);return;}
    else if(action==="goChord"){setMode("chord");return;}
    else if(action==="useChordMatch"){const chord=state._visibleMatches?.[index];if(chord)setActiveChord(chord,{setMode:true});return;}
    else if(action==="playMatch"||action==="arpMatch"){const chord=state._visibleMatches?.[index];if(chord)playChordRecord(chord,action==='arpMatch');return;}
    else if(action==="moreChordMatches")state._chordMatchLimit=Math.min(96,(state._chordMatchLimit||6)+6);
    else if(action==="useScaleMatch"){state.scaleRoot=b.dataset.root;state.scaleId=b.dataset.scale;setMode("scale");return;}
    else if(action==="scaleHarmony"){state.harmonyRoot=state.scaleRoot;state.harmonyScale=state.scaleId;setMode('harmony');return;}
    else if(action==="moreScaleChords")state.scaleChordLimit=Math.min(144,state.scaleChordLimit+12);
    else if(action==="harmGrammar"){state.harmonyGrammar=value;state.scaleChordLimit=12;state.mapNodeLimit=12;degreePreview=false;if(state.mode==='harmony')resetHarmonyChord();}
    else if(action==="useParentScale"){state.scaleRoot=state.harmonyRoot=b.dataset.root;state.scaleId=state.harmonyScale=value;state.makamExample='theory';state.makamNotationAnchor=false;state.harmonyGrammar='auto';state.harmonyFocus='diatonic';setMode('harmony');return;}
    else if(action==="playScale"||action==="arpeggiateScale"){play(scaleMidi(state.scaleRoot,state.scaleId),true,null,T.SCALES.find(s=>s.id===state.scaleId)?.makam?{noteDuration:.5}:{});return;}
    else if(action==="showScale")degreePreview=false;
    else if(action==='playMakamTuning'||action==='playMakamEqual'){const id=musicMode()==='harmony'?state.harmonyScale:state.scaleId,key=musicMode()==='harmony'?state.harmonyRoot:state.scaleRoot;state.makamPlayback=action==='playMakamEqual'?'equal':'comma';renderPanel();renderScene();saveLocal();play(scaleMidi(key,id),true,null,{noteDuration:.5});return;}
    else if(action==='playMakamDegree'){const a=makamAnalysis(),r=a?.rows[index];if(r)play([r.midi+12*Math.log2(a.referenceA/440)]);return;}
    else if(action==='compareMakamDegree'){const id=musicMode()==='harmony'?state.harmonyScale:state.scaleId,key=musicMode()==='harmony'?state.harmonyRoot:state.scaleRoot,scale=T.SCALES.find(s=>s.id===id),settings={example:state.makamExample,notationAnchor:state.makamNotationAnchor,referenceA:state.makamReferenceA},a=MT.analyze(scale,60+T.parseNote(key),{...settings,mode:'comma'}),b=MT.analyze(scale,60+T.parseNote(key),{...settings,mode:'equal'}),shift=12*Math.log2(state.makamReferenceA/440);if(a?.rows[index]&&b?.rows[index])play([b.rows[index].midi+shift,a.rows[index].midi+shift],true,null,{sequence:true,spacing:.7,noteDuration:.55});return;}
    else if(action==='makamRoot'){const id=musicMode()==='harmony'?state.harmonyScale:state.scaleId,m=T.SCALES.find(s=>s.id===id)?.makam;if(m){state.scaleRoot=state.harmonyRoot=m.traditionalRoot;state.makamNotationAnchor=!!m.tonicOffsetCommas;if(state.mode==='harmony')resetHarmonyChord();}}
    else if(action==="exportProject"){Export.saveJSON(projectSnapshot());return;}
    else if(action==='installApp'){root.MBS2PWA?.install().catch(()=>toast('Yükleme başlatılamadı. Tarayıcı menüsünü kullan.'));return;}
    else if(action==='fullscreen'){root.MBS2PWA?.fullscreen().catch(()=>toast('Bu tarayıcı tam ekranı desteklemiyor. Ana ekrana ekleyerek aç.'));return;}
    else if(action==='updateApp'){saveLocal();root.MBS2PWA?.update();return;}
    else if(action==="exportSvg"){Export.saveSvg($("#guitarScene"),sceneState(),state.exportRange);return;}
    else if(action==="exportPng"){Export.savePng($("#guitarScene"),sceneState(),state.exportRange);return;}
    else if(action==="print"){Export.print(sceneState(),state.exportRange);return;}
    else if(action==="exportMidi"){Export.saveMidi(midiExportNotes(),{bpm:state.bpm});return;}
    else if(action==="applyCustomTuning"){applyCustomTuning();return;}
    renderPanel();renderScene();saveLocal();
  }
  function handleCardAction(action,index){
    const item=state._visibleDegrees?.[index];if(!item)return;const chord=chordRecordFromNode(item);
    if(action==='poolDegree'){addToPool(chord);return;}
    if(action==="showDegree"){setActiveChord(chord,{preview:true});return;}
    playChordRecord(chord,action==="arpeggioDegree");
  }
  function togglePosition(stringIndex,fret,removeOnly=false){
    if(musicMode()==='motion'&&!removeOnly){root.GBMotionWorkspace.inspectPosition(stringIndex,fret,{audition:true});renderScene();return;}
    const switchToNotes=!removeOnly&&state.mode!=="explore";
    if(switchToNotes){state.mode="explore";state.lastMusicMode="explore";degreePreview=false;}
    const ix=state.selectedPositions.findIndex(p=>p.stringIndex===stringIndex&&p.fret===fret);
    if(ix>=0)state.selectedPositions.splice(ix,1);else if(!removeOnly&&G.positionMidi(currentTuning(),stringIndex,fret,state.capo)!==null)state.selectedPositions.push({stringIndex,fret});
    state._chordMatchLimit=6;state.selectedPositions=[...state.selectedPositions];renderPanel({keepScroll:!switchToNotes});renderScene();saveLocal();
  }
  function fitVoicing(){const pressed=activeVoicing?.frets.filter(f=>f>=0)||[];state.sceneRange=pressed.length&&Math.max(...pressed)>12?12:0;}
  function sceneState(){
    const mode=musicMode(),scaleChoice=mode==="harmony"?{root:state.harmonyRoot,id:state.harmonyScale}:mode==="scale"?{root:state.scaleRoot,id:state.scaleId}:null;
    if(mode==='motion')return {...state,...root.GBMotionWorkspace.sceneState(motionContext()),tuning:currentTuning()};
    let activeScale=scaleChoice?T.scaleNotes(scaleChoice.root,scaleChoice.id):null;
    if(activeScale?.scale.makam&&MT){const a=MT.analyze(activeScale.scale,60+activeScale.rootPc,{mode:state.makamPlayback,example:state.makamExample,notationAnchor:state.makamNotationAnchor,referenceA:state.makamReferenceA,includeOctave:false}),shift=12*Math.log2(state.makamReferenceA/440),pcs=a.rows.map(r=>T.mod(Math.round(r.midi+shift)));activeScale={...activeScale,pcs,rootPc:pcs[0],spellings:pcs.map(pc=>names()[pc]),approximate:true};}
    const showChord=mode==="chord"||mode==="harmony"||mode==="scale"&&degreePreview;
    return {...state,selectedPositions:mode==="explore"?state.selectedPositions:[],tuning:currentTuning(),activeChord:showChord?activeChord:null,activeVoicing:showChord?activeVoicing:null,activeScale:activeScale?{...activeScale,degreeLabels:activeScale.notes.map(n=>n.label)}:null,comparisonPcs:activeScale&&state.compareScale!=='none'?T.scaleNotes(scaleChoice.root,state.compareScale)?.pcs:[],positionWindow:activeScale&&state.positionFocus!=='all'?state.positionFocus.split('-').map(Number):null};
  }
  function renderScene(){
    updateFretboardVisibility();const model=sceneState();scene?.update(model);
    $('#appShell')?.setAttribute('data-workspace-mode',state.mode);root.GBMotionWorkspace?.setView?.(model,state.language);root.GBMotionWorkspace?.stageInfo?.();
    $("#tuningLabel").textContent=currentTuning().notes.map(x=>x.replace(/-?\d+$/,"")).join(" ");$("#capoLabel").textContent=tr(state.capo?"CAPO "+state.capo:"CAPO YOK");$("#selectedCount").textContent=tr(model.selectedPositions.length+" NOTA");
    const mode=musicMode(),title=model.activeChord?model.activeChord.symbol:model.activeScale?model.activeScale.root+" "+scaleName(model.activeScale.scale):state.selectedPositions.length?selectedPitchClasses().length+" ses seçili":"Notaları seç";
    $("#sceneTitle").textContent=model.motion?.enabled&&model.motion.edge&&!model.motion.lastStep?model.motion.edge.from.chord.symbol+" → "+model.motion.edge.to.chord.symbol:tr(title);$("#sceneEyebrow").textContent=model.motion?.enabled?"MOTION / VOICE LEADING":tr(model.activeChord?"AKOR / "+(state.sceneToneView?"TÜM SESLER":"TUTUŞ"):mode==="scale"?"GAM":"KLAVYE");
    document.querySelectorAll("[data-range]").forEach(b=>{const active=Number(b.dataset.range)===model.sceneRange;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
    if(root.GBMotionEngine&&$('#sceneLegend')){if(model.activeChord){const labels=state.language==='tr'?[['root','Kök'],['guide','3 / 7'],['foundation','5'],['tension','Gerilim'],['common','Sabit']]:[['root','Root'],['guide','3 / 7'],['foundation','5'],['tension','Tension'],['common','Held']];$('#sceneLegend').innerHTML=labels.map(([key,label])=>'<span><i class="legend-dot" style="background:'+root.GBMotionEngine.COLORS[key]+'"></i>'+label+'</span>').join('');$('#selectedCount').textContent=(model.activeVoicing?.frets.filter(f=>f>=0).length||0)+(state.language==='tr'?' SES':' VOICES');}else $('#sceneLegend').innerHTML=localHtml('<span><i class="legend-dot selected"></i>Seçili</span><span><i class="legend-dot chord"></i>Akor</span><span><i class="legend-dot scale"></i>Gam</span><span><i class="legend-dot root"></i>Kök</span>');}
  }
  function setMode(mode){
    if(mode!=='motion')root.GBMotionWorkspace?.stop?.();
    if(!MODES.includes(mode))return;state.mode=mode;if(mode!=="project")state.lastMusicMode=mode;degreePreview=false;
    if(mode==='scale'){state.harmonyRoot=state.scaleRoot;state.harmonyScale=state.scaleId;}
    if(mode==="chord"){activeChord=chordFromState();ensureVoicing(activeChord);fitVoicing();}
    if(mode==="harmony"){root.GBOrbitView?.reset();state.harmonyRoot=state.scaleRoot;state.harmonyScale=state.scaleId;resetHarmonyChord();if(state.harmonyLens==='orbit'&&state.orbitAnchor){activeChord=state.orbitAnchor;activeVoicing=null;ensureVoicing(activeChord);}}
    renderPanel({keepScroll:false});renderScene();saveLocal();announce(document.querySelector?.('#modeNav [data-mode="'+mode+'"]')?.textContent?.trim());
  }
  // Screen readers hear which workspace opened; focus stays on the tab so keyboard navigation is not interrupted.
  function announce(message){const el=document.getElementById?.('srStatus');if(!el||!message)return;el.textContent='';root.setTimeout?.(()=>{el.textContent=message;},40);}
  function updatePlayLabels(){const mode=musicMode();$("#playMainText").textContent=tr(mode==="explore"?"Seçili notaları çal":mode==="scale"&&!degreePreview?"Gamı çal":"Seçili akoru çal");}
  function playCurrent(){if(musicMode()==='motion')return root.GBMotionWorkspace.play(false).catch(error=>toast(error.message));const scalePlayback=musicMode()==='scale'&&!degreePreview||musicMode()==='harmony'&&!activeChord;return play(currentMidis(),scalePlayback,null,scalePlayback&&makamAnalysis()?{noteDuration:.5}:{});}
  function applyCustomTuning(){
    const raw=state._customTuningDraft||$("[data-change='customTuning']")?.value||"",notes=raw.trim().split(/[ ,;]+/).filter(Boolean);
    if(notes.length<4||notes.length>8||notes.some(n=>G.midiFromNote(n)===null)){toast("4–8 oktavlı nota gir. Örnek: E2 A2 D3 G3 B3 E4");return;}
    state.customTuning=notes;state.tuningId="custom";state.selectedPositions=state.selectedPositions.filter(p=>p.stringIndex<notes.length);voicesCache.clear();activeVoicing=null;
    if(activeChord)ensureVoicing(activeChord);renderPanel();renderScene();saveLocal();toast("Akort uygulandı.");
  }
  function projectSnapshot(){return {schema:"mbs-studio",version:1,savedAt:new Date().toISOString(),state:persistentState(),motion:root.GBMotionWorkspace.snapshot().settings};}
  function importProject(data){
    const incoming=data?.state||data;if(!incoming||incoming.version!==1){toast("Proje dosyası tanınmadı.");return;}
    state=normalize(incoming);if(data?.motion)root.GBMotionWorkspace.restore(data.motion);voicesCache.clear();degreePreview=false;activeChord=chordFromState();activeVoicing=null;ensureVoicing(activeChord);document.documentElement.style.setProperty("--cyan",state.color);
    renderPanel({keepScroll:false});renderScene();saveLocal();toast("Proje açıldı.");
  }
  function cameraChanged(camera){state.cameraZoom=camera.zoom;state.cameraView=camera.preset;const slider=$('#cameraZoom');if(slider)slider.value=String(Math.round(camera.zoom*100));document.querySelectorAll('[data-camera]').forEach(button=>{const active=button.dataset.camera===camera.preset;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});saveLocal();}
  function updateFretboardVisibility(){
    const shell=$('#appShell'),button=$('#toggleFretboard');shell?.classList.toggle('fretboard-collapsed',state.fretboardCollapsed);
    if(button){button.setAttribute('aria-expanded',String(!state.fretboardCollapsed));button.innerHTML=escapeHtml(tr(state.fretboardCollapsed?'Klavyeyi göster':'Klavyeyi gizle'))+' <span aria-hidden="true">'+(state.fretboardCollapsed?'⌄':'⌃')+'</span>';}
    root.GBWorkspaceLayout?.sync();
  }
  function bindStatic(){
    $('#toggleFretboard')?.addEventListener('click',()=>{state.fretboardCollapsed=!state.fretboardCollapsed;updateFretboardVisibility();saveLocal();scene?.update(sceneState());});
    $("#modeNav").addEventListener("click",event=>{const tab=event.target.closest("[data-mode]");if(tab)setMode(tab.dataset.mode);});
    document.querySelectorAll("[data-range]").forEach(b=>b.addEventListener("click",()=>{if(musicMode()==='motion'){root.GBMotionWorkspace.setRegion(Number(b.dataset.range)===12?'12-24':'0-12');return;}state.sceneRange=Number(b.dataset.range);renderScene();saveLocal();}));
    document.querySelectorAll("[data-camera]").forEach(b=>b.addEventListener("click",()=>{scene?.setCamera(b.dataset.camera);document.querySelectorAll("[data-camera]").forEach(item=>{const active=item.dataset.camera===(b.dataset.camera==="reset"?"top":b.dataset.camera);item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));});}));
    document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>scene?.zoomBy(button.dataset.zoom==='in'?1.15:1/1.15)));
    $('#cameraZoom')?.addEventListener('input',event=>scene?.setZoom(Number(event.target.value)/100));
    if($('#cameraZoom'))$('#cameraZoom').value=String(Math.round(state.cameraZoom*100));
    $("#clearNotes").addEventListener("click",()=>{state.selectedPositions=[];renderPanel();renderScene();saveLocal();});
    $("#playMain").addEventListener("click",playCurrent);$("#playArpeggio").addEventListener("click",()=>musicMode()==='motion'?root.GBMotionWorkspace.play(true).catch(error=>toast(error.message)):play(currentMidis(),true));$("#stopPlayback").addEventListener("click",()=>{root.GBMotionWorkspace.stop();Audio.stop();renderScene();root.GBMotionWorkspace.stageInfo();});
    root.addEventListener('mbs-pwa-change',()=>{if(state.mode==='project')renderPanel({keepScroll:true});});
    root.matchMedia?.('(prefers-color-scheme: light)')?.addEventListener?.('change',()=>{if(state.theme==='auto'){applyPreferences();renderScene();}});
    root.addEventListener('hashchange',()=>{const share=/[#&]m=([A-Za-z0-9_-]+)/.exec(root.location?.hash||'');if(share&&root.GBMotionWorkspace.offerShare(share[1]))setMode('motion');});
    document.addEventListener('keydown',onShortcut);
    // A focused dock button would otherwise also click on Space release, restarting playback.
    document.addEventListener('keyup',event=>{if(event.key===' '&&event.target?.closest?.('#playbackDock'))event.preventDefault();});
    $("#helpButton").addEventListener("click",()=>$("#helpDialog").showModal());$("#helpDialog").addEventListener("click",event=>{if(event.target===$("#helpDialog"))$("#helpDialog").close();});
  }
  function init(){
    try{
      root.GBMotionWorkspace.init(()=>{renderPanel();renderScene();});
      {const share=/[#&]m=([A-Za-z0-9_-]+)/.exec(root.location?.hash||'');if(share&&root.GBMotionWorkspace.offerShare(share[1])){state.mode='motion';state.lastMusicMode='motion';}}
      applyPreferences();document.documentElement.style.setProperty("--cyan",state.color||defaults.color);activeChord=chordFromState();ensureVoicing(activeChord);
      if(musicMode()==="harmony")resetHarmonyChord();
      scene=root.MBS2Scene.create($("#guitarScene"),(stringIndex,fret)=>togglePosition(stringIndex,fret),{canvas:$("#guitarCanvas"),stage:$("#sceneStage"),initialCamera:{preset:state.cameraView,zoom:state.cameraZoom},onCameraChange:cameraChanged});
      bindStatic();renderPanel({keepScroll:false});renderScene();
      // Warm the common sample range once the page is idle; failures only mean the first chord loads on demand.
      if(typeof root.setTimeout==='function')root.setTimeout(()=>{try{Promise.resolve(Audio.preload?.()).catch(()=>{});}catch(_){}},2500);
    }catch(error){
      console.error("Müzik Beyni Studio açılış hatası:",error);
      const panel=$("#panelContent");if(panel)panel.innerHTML=localHtml('<div class="notice startup-error"><strong>Uygulama başlatılamadı</strong><code>'+escapeHtml(error?.message||String(error))+'</code></div>');
      const stage=$("#sceneStage");if(stage){const note=document.createElement("div");note.className="startup-error-scene";note.textContent=tr("Gitar sahnesi yüklenemedi");stage.append(note);}
    }
  }
  if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();}
  root.MBS2App=Object.freeze({getState:()=>clone(state),getScene:()=>scene,sceneState,setMode,playCurrent,applyChord:(rootNote,type,modifiers)=>{state.chordRoot=rootNote;state.chordType=type;state.customChord=null;state.slashBass=null;state.modifiers=modifiers||{add:[],alter:[],omit:[]};invalidateChord();renderPanel();renderScene();}});
})(typeof window!=="undefined"?window:globalThis);
