/* Motion is a separate workspace and store; the stable studio remains untouched. */
(function(root){
  'use strict';
  const E=root.GBMotionEngine,T=root.MBS2Theory,G=root.MBS2Guitar,A=root.MBS2Audio,D=root.MBS2Diagram,V=root.MBS2Voicings;
  const STORE='guitar-brain-motion-routes-v1',LIBRARY='guitar-brain-motion-library-v1';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const defaults={chords:[{root:'G',typeId:'dominant7'},{root:'C',typeId:'major7'}],profile:'flow',melody:'free',region:'0-12',completeness:'full',routeIndex:0,step:0,context:true,startShape:null,routeLimit:12,loop:false,metronome:false,countIn:false,pattern:'block'};
  const fresh=()=>JSON.parse(JSON.stringify(defaults));
  let settings=fresh(),context=null,viewModel=null,viewKey='',instrumentKey='',cacheKey='',result=null,selectedNote=null,notify=()=>{},playFrame=0,playToken=null,ownedToken=null,requestId=0,playing=false,composer=false,draftRoot='C',draftType='major7',editIndex=-1,draftSlash='',draftModifiers={add:[],alter:[],omit:[]},draftRecord=null,draftFrets=null,editViewRange=0,gripGallery=false,gripPoolKey='',gripPool=[],draftTop=null,library=[],libraryOpen=false,draftName='',pendingShare=null;
  const roleNames={en:{root:'Root',guide:'Guide tone',foundation:'Fifth',extension:'Chord colour',tension:'Context tension',outside:'Outside chord'},tr:{root:'Kök',guide:'Yön veren ses',foundation:'Beşli',extension:'Akor rengi',tension:'Bağlam gerilimi',outside:'Akor dışı'}};
  function text(en,tr){return context?.language==='tr'?tr:en;}
  const BEATS=[1,2,4,8],TRANSPORT=['loop','metronome','countIn'];
  const beatsAt=i=>BEATS.includes(settings.chords[i]?.beats)?settings.chords[i].beats:4;
  function transportMarkup(){
    const toggle=(id,en,tr)=>'<button data-motion="transport" data-value="'+id+'" aria-pressed="'+settings[id]+'" class="'+(settings[id]?'active':'')+'">'+text(en,tr)+'</button>';
    const rhythm=[['block',text('Block','Blok')],['strum','Strum ↓'],['downup','Strum ↓↑']];
    return '<div class="motion-transport"><label>Tempo · BPM<input type="number" min="40" max="220" inputmode="numeric" value="'+Number(context.bpm)+'" data-bpm></label><label>'+text('Rhythm','Ritim')+'<select data-motion-change="pattern">'+rhythm.map(([id,label])=>'<option value="'+id+'"'+(settings.pattern===id?' selected':'')+'>'+label+'</option>').join('')+'</select></label>'+toggle('loop','Loop','Döngü')+toggle('metronome','Metronome','Metronom')+toggle('countIn','Count-in','Sayım')+'</div>';
  }
  // Hand position per chord, scaled against every visible route so cards compare at a glance.
  function handTrack(routes,route){
    const all=routes.flatMap(r=>r.nodes.map(n=>n.shape.position)),low=Math.min(...all),span=Math.max(1,Math.max(...all)-low);
    const count=route.nodes.length,w=76,h=24,pad=3;
    const points=route.nodes.map((node,i)=>[count<2?w/2:pad+i*(w-2*pad)/(count-1),pad+(1-(node.shape.position-low)/span)*(h-2*pad)]);
    const [from,to]=route.positionSpan;
    return '<span class="hand-track"><svg viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><polyline points="'+points.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')+'"/>'+points.map(([x,y])=>'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.2"/>').join('')+'</svg><small>'+text('Frets ','Perde ')+from+'–'+to+'</small></span>';
  }
  function restore(data){if(!data||!Array.isArray(data.chords)||data.chords.length<2||data.chords.length>8)return;settings={...fresh(),...JSON.parse(JSON.stringify(data))};settings.chords=settings.chords.filter(c=>T.parseNote(c.root)!==null&&(T.CHORD_TYPES.some(t=>t.id===c.typeId)||c.record?.pitchClasses?.length));if(settings.chords.length<2)settings=fresh();for(const c of settings.chords){if(!BEATS.includes(c.beats))delete c.beats;if(!(Number.isFinite(c.top)&&c.top>=36&&c.top<=96))delete c.top;}for(const key of TRANSPORT)settings[key]=settings[key]===true;for(const [key,values] of Object.entries({profile:['flow','anchor'],melody:['free','hold','up','down'],region:['0-12','5-12','12-24','0-24'],completeness:['full','practical'],pattern:['block','strum','downup']}))if(!values.includes(settings[key]))settings[key]=defaults[key];settings.routeLimit=[6,12,24].includes(Number(settings.routeLimit))?Number(settings.routeLimit):12;settings.routeIndex=Math.max(0,Number(settings.routeIndex)||0);settings.step=Math.max(0,Math.min(settings.chords.length-1,Number(settings.step)||0));cacheKey='';}
  function read(){try{restore(JSON.parse(root.localStorage.getItem(STORE)||'null'));}catch(_){}libraryRead();}
  function save(){try{root.localStorage.setItem(STORE,JSON.stringify(settings));}catch(_){}}
  function chords(){return settings.chords.map(c=>c.record||T.buildChord(c.root,c.typeId));}
  function compute(ctx=context){
    if(ctx)context=ctx;if(!context)return null;
    const instrument=JSON.stringify([context.tuning.notes,context.capo]);if(instrumentKey&&instrumentKey!==instrument){settings.startShape=null;draftFrets=null;};instrumentKey=instrument;
    const [minFret,maxFret]=settings.region.split('-').map(Number),records=chords(),tops=settings.chords.map(c=>Number.isFinite(c.top)?c.top:null);
    const key=JSON.stringify([records,context.tuning.notes,context.capo,settings.profile,settings.melody,settings.region,settings.completeness,settings.startShape?.frets,settings.routeLimit,tops]);
    if(key!==cacheKey){
      stop();cacheKey=key;settings.routeIndex=0;settings.step=0;
      result=E.routes(records,context.tuning,context.capo,{minFret:Math.max(context.capo,minFret),maxFret,profile:settings.profile,melody:settings.melody,completeness:settings.completeness,startShape:settings.startShape,limit:settings.routeLimit,melodyMidis:tops});
      selectedNote=null;
    }
    settings.routeIndex=Math.min(settings.routeIndex,Math.max(0,result.routes.length-1));settings.step=Math.min(settings.step,records.length-1);return result;
  }
  function activeRoute(){return result?.routes[settings.routeIndex]||null;}
  function activeNode(){return activeRoute()?.nodes[settings.step]||null;}
  function activeEdge(){const r=activeRoute();return r?.edges[Math.min(settings.step,r.edges.length-1)]||null;}
  function update(){save();notify();}
  function init(onChange){notify=onChange;read();}
  function sceneState(ctx){
    compute(ctx);const node=draftFrets?{chord:chords()[0],shape:{frets:draftFrets}}:activeNode(),edge=draftFrets?null:activeEdge(),scale=settings.context?T.scaleNotes(context.scaleRoot,context.scaleId):null;
    return {activeChord:node?.chord||chords()[settings.step],activeVoicing:node?.shape||null,activeScale:null,sceneRange:draftFrets?editViewRange:settings.region==='12-24'?12:0,sceneToneView:true,selectedPositions:[],motion:{enabled:true,edge,step:settings.step,lastStep:settings.step===chords().length-1,contextPcs:scale?.pcs||[],selectedNote,playing,editing:!!draftFrets}};
  }
  function badge(role,name){return '<span class="role-badge" style="--role:'+role.color+'"><i></i>'+escape(name||role.label)+'</span>';}
  function pairRow(pair,index){
    const a=pair.from,b=pair.to,delta=pair.delta;return '<div class="voice-pair'+(pair.common?' held':'')+'"><span class="voice-note"><b>'+escape(a.role.note)+'</b><small>'+escape(a.role.label)+'</small><em>'+ (Math.floor(a.midi/12)-1)+'</em></span><span class="voice-delta">'+(delta===0?text('held','sabit'):(delta>0?'↗ +':'↘ ')+delta)+'</span><span class="voice-note"><b>'+escape(b.role.note)+'</b><small>'+escape(b.role.label)+'</small><em>'+ (Math.floor(b.midi/12)-1)+'</em></span><button data-motion="voice" data-index="'+index+'" data-from="'+a.midi+'" data-to="'+b.midi+'" aria-label="'+escape(a.role.note+' → '+b.role.note)+'">▷</button></div>';
  }
  function draftChord(){
    if(draftType==='custom'&&draftRecord)return draftRecord;
    const chord=T.buildChord(draftRoot,draftType,draftModifiers);if(!draftSlash)return chord;
    const pc=T.parseNote(draftSlash);return {...chord,symbol:chord.symbol+'/'+draftSlash,slashBassPc:pc,pitchClasses:[...new Set([...chord.pitchClasses,pc])],notes:[{pc,name:draftSlash,degree:1,label:'bass',semitones:T.mod(pc-chord.rootPc)},...chord.notes]};
  }
  function openEditor(index=-1){
    stop();editIndex=index;const item=settings.chords[index],record=item?.record;
    draftRoot=record?.root||item?.root||'C';draftType=record?.typeId||item?.typeId||'major';
    if(!T.CHORD_TYPES.some(t=>t.id===draftType))draftType='custom';draftRecord=record||null;draftTop=Number.isFinite(item?.top)?item.top:null;
    draftSlash=record?.slashBassPc!==undefined?T.noteName(record.slashBassPc):'';draftModifiers=JSON.parse(JSON.stringify(record?.modifiers||{add:[],alter:[],omit:[]}));composer=true;
  }
  function editorMarkup(){
    if(!composer)return '';const notes=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'],title=editIndex<0?text('Add chord','Akor ekle'):text(editIndex===0?'Starting chord':editIndex===settings.chords.length-1?'Target chord':'Chord '+(editIndex+1),editIndex===0?'Başlangıç akoru':editIndex===settings.chords.length-1?'Hedef akor':(editIndex+1)+'. akor');
    return '<div class="chord-editor-backdrop"><section class="chord-editor" role="dialog" aria-modal="true" aria-label="'+title+'"><header><span>'+title+'</span><button data-motion="close-editor" aria-label="'+text('Close chord editor','Akor seçiciyi kapat')+'">×</button></header><div class="editor-preview"><strong>'+escape(draftChord().symbol)+'</strong><span>'+draftChord().notes.map(n=>escape(n.name)).join(' · ')+'</span></div><div class="composer-roots">'+notes.map(n=>'<button data-motion="draft-root" data-value="'+n+'" class="'+(T.parseNote(n)===T.parseNote(draftRoot)?'active':'')+'">'+n+'</button>').join('')+'</div><label class="editor-search">'+text('Search chord types','Akor türü ara')+'<input type="search" data-motion-search placeholder="maj7 · m9 · sus · altered"></label><div class="editor-types">'+(draftType==='custom'?'<button class="active" data-motion="draft-type" data-value="custom">'+text('Current custom chord','Mevcut özel akor')+'</button>':'')+T.CHORD_TYPES.map(t=>'<button data-motion="draft-type" data-value="'+t.id+'" data-search="'+escape((t.id+' '+t.name+' '+t.symbol).toLowerCase())+'" class="'+(draftType===t.id?'active':'')+'"><strong>'+escape(draftRoot+(t.symbol||''))+'</strong><small>'+escape(root.MBS2I18n?.t(t.name)||t.name)+'</small></button>').join('')+'</div><div class="editor-extra"><label>'+text('Bass / inversion','Bas / çevrim')+'<select data-draft-slash><option value="">'+text('Any bass','Serbest bas')+'</option>'+notes.map(n=>'<option value="'+n+'"'+(T.parseNote(n)===T.parseNote(draftSlash)&&draftSlash?' selected':'')+'>'+n+'</option>').join('')+'</select></label><label>'+text('Top note','Üst nota')+'<select data-draft-top><option value="">'+text('Free','Serbest')+'</option>'+topOptions().map(o=>'<option value="'+o.midi+'"'+(draftTop===o.midi?' selected':'')+'>'+o.label+'</option>').join('')+'</select></label><details><summary>'+text('Add / alter / omit','Add / alter / omit')+'</summary><div class="editor-modifiers">'+T.MODIFIERS.map(m=>'<button data-motion="draft-modifier" data-value="'+m.id+'" class="'+(draftModifiers[m.kind==='add'?'add':'alter'].includes(m.id)?'active':'')+'">'+escape(m.label||m.id)+'</button>').join('')+[3,5,7].map(n=>'<button data-motion="draft-omit" data-value="'+n+'" class="'+(draftModifiers.omit.includes(n)?'active':'')+'">omit '+n+'</button>').join('')+'</div></details></div><footer><button data-motion="close-editor">'+text('Cancel','İptal')+'</button><button class="primary" data-motion="apply-editor">'+text(editIndex<0?'Add chord':'Use this chord',editIndex<0?'Akoru ekle':'Bu akoru kullan')+'</button></footer></section></div>';
  }
  function gripValidation(){const [minFret,maxFret]=settings.region.split('-').map(Number);return E.validateGrip({frets:draftFrets,manual:true},chords()[0],context.tuning,context.capo,{minFret:Math.max(context.capo,minFret),maxFret,completeness:settings.completeness});}
  function firstGripMarkup(){
    const chord=chords()[0],shape=draftFrets?{frets:draftFrets}:settings.startShape||activeRoute()?.nodes[0]?.shape;
    const validation=draftFrets?gripValidation():null,events=shape?E.eventsFor(shape,chord,context.tuning,context.capo):[],notes=events.map(e=>escape(e.role.note)+(Math.floor(e.midi/12)-1));
    const reasons={frets:text('Use integer frets 0–24.','0–24 arasında tamsayı perde seç.'),region:text('A fret is outside the search region/capo. Try 0–24.','Perde, arama bölgesi veya capo dışında. 0–24 seçebilirsin.'),outside:text('Notes outside the selected chord: ','Akor dışındaki sesler: ')+(validation?.outside||[]).map(pc=>T.noteName(pc)).join(' · '),missing:text('Missing chord tones: ','Eksik akor sesleri: ')+(validation?.missing||[]).map(pc=>T.noteName(pc)).join(' · '),voices:text('More sounding strings are required.','Daha fazla çalınan tel gerekiyor.'),bass:text('The lowest pitch must match the slash bass.','En kalın ses slash basla eşleşmeli.'),reach:text('The pressed frets exceed the hand-reach model.','Basılı perdeler el açıklığı modelini aşıyor.'),fingers:text('More than four pressing actions would be needed.','Dörtten fazla basma eylemi gerekiyor.'),ergonomics:text('This grip could not be validated.','Bu tutuş doğrulanamadı.')};
    let html='<section class="motion-first-grip"><div class="motion-section-title"><span>'+text('FIRST VOICING','İLK AKOR TUTUŞU')+'</span><small>'+escape(chord.symbol)+(settings.startShape?' · '+text('fixed','sabit'):'')+'</small></div><div class="first-grip-preview">'+(shape?D.render(shape,chord,context.tuning,context.capo,{labels:'degrees',compact:true}):'')+'<div><strong>'+escape(chord.symbol)+'</strong><span>'+notes.join(' · ')+'</span><div class="grip-editor-actions"><button data-motion="grip-gallery">'+text('Choose voicing','Tutuş seç')+'</button><button data-motion="grip-edit">'+text('Choose notes','Sesleri seç')+'</button></div></div></div>';
    if(draftFrets)html+='<div class="grip-instruction">'+text('Click frets · one note per string · click again to mute.','Perdelere tıkla · her telde bir ses · tekrar tıklayınca sustur.')+'</div><div class="draft-strings">'+context.tuning.notes.map((n,i)=>'<div><span>'+escape(n)+'</span><button data-motion="grip-mute" data-index="'+i+'" aria-label="'+escape(n)+' '+text('mute','sustur')+'">×</button><button data-motion="grip-open" data-index="'+i+'" aria-label="'+escape(n)+' '+text('open / capo','açık / capo')+'">○</button><input type="number" min="'+context.capo+'" max="24" step="1" data-grip-string="'+i+'" value="'+(draftFrets[i]<0?'':draftFrets[i])+'" aria-label="'+escape(n)+' '+text('fret','perde')+'"></div>').join('')+'</div><p class="grip-validation '+(validation.valid?'valid':'invalid')+'">'+(validation.valid?text('Valid grip','Geçerli tutuş'):reasons[validation.reason])+(validation.warnings?.includes('fingerpicking')?' · '+text('Use fingerpicking for skipped strings.','Atlanan teller için parmakla çal.'):validation.warnings?.includes('open-high')?' · '+text('Open string with a high position.','Açık tel ve yüksek pozisyon.'):'')+'</p><div class="grip-editor-actions"><button data-motion="grip-clear">'+text('Clear','Temizle')+'</button><button data-motion="grip-cancel">'+text('Cancel','İptal')+'</button><button class="primary" data-motion="grip-apply"'+(validation.valid?'':' disabled')+'>'+text('Apply voicing','Tutuşu uygula')+'</button></div>';
    if(gripGallery){const [minFret,maxFret]=settings.region.split('-').map(Number),key=JSON.stringify([chord,context.tuning.notes,context.capo,minFret,maxFret,settings.completeness]);if(key!==gripPoolKey){gripPoolKey=key;gripPool=V.generate(chord,context.tuning,context.capo,{minFret:Math.max(minFret,context.capo),maxFret,maxResults:48,completeness:settings.completeness});}html+='<div class="first-grip-gallery">'+gripPool.map((v,i)=>'<button data-motion="grip-pick" data-index="'+i+'" aria-label="'+text('Start voicing ','İlk tutuş ')+(i+1)+'">'+D.render(v,chord,context.tuning,context.capo,{labels:'degrees',compact:true})+'<span>'+escape(v.frets.map(f=>f<0?'×':f).join(' · '))+'</span></button>').join('')+'</div>';}
    return html+'</section>';
  }
  function render(host,ctx){
    compute(ctx);const contextScale=T.SCALES.find(s=>s.id===context.scaleId),r=activeRoute(),node=activeNode(),edge=activeEdge(),list=chords(),roles=roleNames[context.language]||roleNames.en;
    host.innerHTML='<div class="motion-console">'+
      '<section class="motion-sequence"><div class="motion-section-title"><span>'+text('CHORDS','AKORLAR')+'</span><button data-motion="composer" aria-expanded="'+composer+'"'+(!composer&&settings.chords.length>=8?' disabled title="'+text('Up to 8 chords','En fazla 8 akor')+'"':'')+'>'+(composer?'×':'+')+'</button></div>'+shareBannerMarkup()+
      '<div class="sequence-cards">'+list.map((c,i)=>'<div class="sequence-item'+(i===settings.step?' active':'')+'"><button class="sequence-pick" data-motion="step" data-index="'+i+'"><small>'+text(i===0?'FROM':i===list.length-1?'TO':String(i+1).padStart(2,'0'),i===0?'BAŞLANGIÇ':i===list.length-1?'HEDEF':String(i+1).padStart(2,'0'))+'</small><strong>'+escape(c.symbol)+'</strong><span>'+(r?escape(r.nodes[i].shape.frets.map(f=>f<0?'×':f).join(' · ')):'—')+'</span>'+topBadge(i)+'</button><button class="sequence-edit" data-motion="edit" data-index="'+i+'" aria-label="'+escape(text('Change chord ','Akoru değiştir ')+c.symbol)+'">'+text('Edit','Değiştir')+'</button><button class="sequence-remove" data-motion="remove" data-index="'+i+'" aria-label="'+text('Remove chord','Akoru kaldır')+'"'+(list.length<=2?' disabled':'')+'>×</button><label class="sequence-beats" title="'+text('Beats','Vuruş')+'"><select data-beats="'+i+'" aria-label="'+escape(text('Beats for ','Vuruş: ')+c.symbol)+'">'+BEATS.map(n=>'<option value="'+n+'"'+(beatsAt(i)===n?' selected':'')+'>'+n+' ♩</option>').join('')+'</select></label></div>').join('')+'</div><button class="motion-swap" data-motion="swap">⇄ '+text('Reverse chord order','Akor sırasını ters çevir')+'</button>'+
      '<div class="motion-presets"><button data-motion="preset" data-value="two">G7 → Cmaj7</button><button data-motion="preset" data-value="jazz">Dm7 → G7 → Cmaj7</button><button data-motion="preset" data-value="minor">Am → F → C → G</button></div>'+libraryMarkup()+
      '<div class="motion-options"><label>'+text('Fret region','Perde bölgesi')+'<select data-motion-change="region">'+[['0-12','0–12'],['5-12','5–12'],['12-24','12–24'],['0-24','0–24']].map(([id,l])=>'<option value="'+id+'"'+(settings.region===id?' selected':'')+'>'+l+'</option>').join('')+'</select></label><label>'+text('Top voice','Üst ses')+'<select data-motion-change="melody">'+[['free',text('Free','Serbest')],['hold',text('Keep exact pitch','Aynı sesi koru')],['up',text('Strictly ascending','Her akorda yükselsin')],['down',text('Strictly descending','Her akorda alçalsın')]].map(([id,l])=>'<option value="'+id+'"'+(settings.melody===id?' selected':'')+'>'+l+'</option>').join('')+'</select></label></div>'+
      '<div class="motion-toggle-row"><button data-motion="profile" class="'+(settings.profile==='anchor'?'active':'')+'">'+text('Keep hand position','El pozisyonunu koru')+'</button><button data-motion="lock" class="'+(settings.startShape?'active':'')+'"'+(!r&&!settings.startShape?' disabled':'')+'>'+text(settings.startShape?'Release first grip':'Lock first grip',settings.startShape?'İlk tutuşu serbest bırak':'İlk tutuşu sabitle')+'</button></div>'+transportMarkup()+'</section>'+
      firstGripMarkup()+'<section class="motion-routes"><div class="route-count-control">'+text('Routes','Rotalar')+' '+[6,12,24].map(n=>'<button data-motion="count" data-value="'+n+'" aria-pressed="'+(settings.routeLimit===n)+'" class="'+(settings.routeLimit===n?'active':'')+'">'+n+'</button>').join('')+'</div><div class="motion-section-title"><span>'+text('VOICE ROUTES','SES ROTALARI')+'</span><small>'+result.routes.length+' '+text('alternatives','alternatif')+'</small></div>'+
      (result.routes.length?'<div class="route-list">'+result.routes.map((route,i)=>'<button class="route-card'+(settings.routeIndex===i?' active':'')+'" data-motion="route" data-index="'+i+'" aria-pressed="'+(settings.routeIndex===i)+'"><span class="route-number">'+String(i+1).padStart(2,'0')+'</span><span class="route-card-body"><strong>'+text(i===0?'Balanced movement':'Alternative '+String(i+1).padStart(2,'0'),i===0?'Dengeli hareket':'Alternatif '+String(i+1).padStart(2,'0'))+'</strong><span>'+route.nodes.map(n=>escape(n.chord.symbol)).join(' <i>→</i> ')+'</span><small>'+route.totalSemitones+' '+text('semitones moved','yarım ses hareket')+' · '+route.commonCount+' '+text('held voices','sabit ses')+'</small><small class="route-upper">'+text('Top: ','Üst: ')+route.nodes.map(n=>escape(n.events.at(-1).role.note)+(Math.floor(n.events.at(-1).midi/12)-1)).join(' → ')+'</small></span>'+handTrack(result.routes,route)+'<span class="route-meter" style="--meter:'+Math.min(100,20+route.totalSemitones*2)+'%"><i></i></span></button>').join('')+'</div>':'<div class="motion-empty"><span>∅</span><p>'+text('No playable route satisfies these constraints.','Bu koşulları sağlayan çalınabilir rota bulunamadı.')+'</p><button data-motion="relax">'+text('Reset constraints','Koşulları sıfırla')+'</button></div>')+
      '<div class="motion-context"><button data-motion="context" aria-pressed="'+settings.context+'" class="'+(settings.context?'active':'')+'"><i></i>'+text('Scale context','Gam bağlamı')+' · '+escape(context.scaleRoot)+' '+escape(context.scaleName||context.scaleId)+'</button><button data-motion="completeness" class="'+(settings.completeness==='practical'?'active':'')+'">'+text(settings.completeness==='full'?'All chord tones':'Practical omissions',settings.completeness==='full'?'Bütün akor sesleri':'Pratik eksiltmeler')+'</button></div>'+
      '<div class="role-key">'+Object.entries(roles).filter(([id])=>id!=='outside').map(([id,label])=>badge({color:E.COLORS[id]},label)).join('')+'</div></section>'+
      '<section class="motion-inspector"><div class="motion-section-title"><span>'+text('INSIDE THE CHANGE','GEÇİŞİN İÇİNDE')+'</span><small>'+escape(edge?edge.from.chord.symbol+' → '+edge.to.chord.symbol:'')+'</small></div>'+
      (edge?'<div class="voice-pairs">'+edge.pairs.map(pairRow).join('')+'</div>'+(edge.enters.length||edge.exits.length?'<p class="route-footnote">'+edge.enters.length+' '+text('entering','giren')+' · '+edge.exits.length+' '+text('leaving voices','çıkan ses')+'</p>':'')+'<div class="route-facts"><span>'+edge.physicalHoldCount+' '+text('same positions','aynı konum')+'</span><span>'+text('Largest leap','En büyük sıçrama')+' '+edge.largestLeap+'</span></div>':'')+
      (node?'<div class="motion-grip">'+D.render(node.shape,node.chord,context.tuning,context.capo,{labels:'degrees',compact:true})+'<div><strong>'+escape(node.chord.symbol)+'</strong><span>'+node.events.map(e=>escape(e.role.note)).join(' · ')+'</span><span class="motion-register">'+text('Bass: ','Bas: ')+escape(node.events[0].role.note)+(Math.floor(node.events[0].midi/12)-1)+' · '+text('Top: ','Üst: ')+escape(node.events.at(-1).role.note)+(Math.floor(node.events.at(-1).midi/12)-1)+'</span>'+(node.shape.omittedLabels?.length?'<small>'+text('Omitted','Eksik')+': '+escape(node.shape.omittedLabels.join(', '))+'</small>':'')+'<button data-motion="audition">▷ '+text('Hear this grip','Tutuşu dinle')+'</button></div></div>':'')+'</section></div>';
    if(root.MBS2I18n)host.innerHTML=root.MBS2I18n.html(host.innerHTML,context.language);
    host.querySelectorAll('[data-grip-string]').forEach(input=>{const commit=()=>{if(!draftFrets)return;const value=input.value===''?-1:Number(input.value),index=Number(input.dataset.gripString);if(draftFrets[index]!==value){draftFrets[index]=value;update();}};input.addEventListener('change',commit);input.addEventListener('blur',commit);input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();commit();}});});
    host.insertAdjacentHTML('beforeend',editorMarkup());
    host.querySelector('[data-motion-search]')?.addEventListener('input',event=>{const q=event.target.value.toLowerCase();host.querySelectorAll('[data-search]').forEach(button=>button.hidden=!button.dataset.search.includes(q));});
    host.querySelector('[data-draft-top]')?.addEventListener('change',event=>{draftTop=event.target.value===''?null:Number(event.target.value);update();});
    host.querySelector('[data-draft-slash]')?.addEventListener('change',event=>{draftSlash=event.target.value;update();});
    const dialog=host.querySelector('.chord-editor');if(dialog){dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){composer=false;update();return;}if(event.key==='Tab'){const controls=Array.from(dialog.querySelectorAll('button:not([disabled]):not([hidden]),input,select,summary')).filter(el=>el.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&root.document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&root.document.activeElement===last){event.preventDefault();first.focus();}}});dialog.querySelector('input')?.focus();}
    host.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.motion,b)));
    host.querySelectorAll('[data-motion-change]').forEach(c=>c.addEventListener('change',()=>{stop();settings[c.dataset.motionChange]=c.value;update();}));
    host.querySelectorAll('[data-beats]').forEach(c=>c.addEventListener('change',()=>{stop();const chord=settings.chords[Number(c.dataset.beats)],value=Number(c.value);if(chord&&BEATS.includes(value))chord.beats=value;update();}));
    host.querySelectorAll('[data-lib-name]').forEach(c=>c.addEventListener('input',()=>{draftName=c.value;}));
    host.querySelectorAll('.motion-library').forEach(d=>d.addEventListener('toggle',()=>{libraryOpen=d.open;}));
    host.querySelectorAll('[data-bpm]').forEach(c=>c.addEventListener('change',()=>{stop();context.setBpm?.(Number(c.value));update();}));
    stageInfo();
  }
  function action(action,b){
    if(action==='voice'){const pair=activeEdge()?.pairs[Number(b.dataset.index)];if(pair)hearNodes([{events:[pair.from],beats:1},{events:[pair.to],beats:1}]).catch(reportError);return;}
    if(action==='audition'){audition().catch(reportError);return;}
    if(action==='share'){shareLink();return;}
    stop();
    if(action==='count')settings.routeLimit=Number(b.dataset.value);
    if(action==='transport'&&TRANSPORT.includes(b.dataset.value))settings[b.dataset.value]=!settings[b.dataset.value];
    if(action.startsWith('lib-'))libraryOpen=true;
    if(action==='lib-save'){saveToLibrary(draftName);draftName='';}
    if(action==='lib-open'){const item=library.find(i=>i.id===b.dataset.id);if(item)applyProgression(item.chords,item.options);}
    if(action==='lib-delete'){library=library.filter(i=>i.id!==b.dataset.id);libraryWrite();}
    if(action==='lib-rename'){const item=library.find(i=>i.id===b.dataset.id),next=item&&root.prompt?.(text('New name','Yeni ad'),item.name);if(next&&next.trim()){item.name=next.trim().slice(0,40);libraryWrite();}}
    if(action==='lib-preset'){const list=presetChords(b.dataset.value,context?.scaleRoot||'C');if(list)applyProgression(list,{});}
    if(action==='share-open'&&pendingShare){applyProgression(pendingShare.chords,pendingShare.options);if(pendingShare.bpm)context.setBpm?.(pendingShare.bpm);pendingShare=null;clearHash();}
    if(action==='share-dismiss'){pendingShare=null;clearHash();}
    if(action==='grip-gallery')gripGallery=!gripGallery;
    if(action==='grip-edit'){draftFrets=[...(settings.startShape?.frets||activeRoute()?.nodes[0]?.shape.frets||Array(context.tuning.notes.length).fill(-1))];settings.step=0;editViewRange=settings.region==='12-24'?12:0;gripGallery=false;}
    if(action==='grip-clear'&&draftFrets)draftFrets.fill(-1);
    if(action==='grip-mute'&&draftFrets)draftFrets[Number(b.dataset.index)]=-1;
    if(action==='grip-open'&&draftFrets)draftFrets[Number(b.dataset.index)]=context.capo;
    if(action==='grip-cancel')draftFrets=null;
    if(action==='grip-apply'){const valid=gripValidation();if(valid.valid){settings.startShape=valid.shape;draftFrets=null;cacheKey='';}}
    if(action==='grip-pick'){settings.startShape=gripPool[Number(b.dataset.index)]||null;draftFrets=null;gripGallery=false;cacheKey='';}
    if(['composer','edit','swap','preset','remove','apply-editor'].includes(action))draftFrets=null;
    if(action==='composer')openEditor();
    if(action==='edit')openEditor(Number(b.dataset.index));
    if(action==='close-editor')composer=false;
    if(action==='apply-editor'){const record=draftChord(),ok=topOptions().some(o=>o.midi===draftTop),item={root:record.root,typeId:record.typeId,record,...(ok?{top:draftTop}:{})};if(editIndex<0){if(settings.chords.length<8)settings.chords.push(item);}else{const kept=settings.chords[editIndex]?.beats;if(kept)item.beats=kept;settings.chords[editIndex]=item;}settings.startShape=null;composer=false;cacheKey='';}
    if(action==='swap'){settings.chords.reverse();settings.startShape=null;settings.step=0;cacheKey='';}
    if(action==='draft-modifier'){const m=T.MODIFIERS.find(m=>m.id===b.dataset.value),key=m.kind==='add'?'add':'alter',had=draftModifiers[key].includes(m.id);draftModifiers[key]=draftModifiers[key].filter(id=>id!==m.id&&(key!=='alter'||T.MODIFIERS.find(x=>x.id===id)?.degree!==m.degree));if(!had)draftModifiers[key].push(m.id);}
    if(action==='draft-omit'){const degree=Number(b.dataset.value);draftModifiers.omit=draftModifiers.omit.includes(degree)?draftModifiers.omit.filter(n=>n!==degree):[...draftModifiers.omit,degree];}
    if(action==='draft-root'){draftRoot=b.dataset.value;if(draftType==='custom'){draftType='major';draftModifiers={add:[],alter:[],omit:[]};}}
    if(action==='draft-type')draftType=b.dataset.value;
    if(action==='remove'&&settings.chords.length>2){settings.chords.splice(Number(b.dataset.index),1);settings.startShape=null;}
    if(action==='step'){settings.step=Number(b.dataset.index);selectedNote=null;}
    if(action==='route'){settings.routeIndex=Number(b.dataset.index);settings.step=0;selectedNote=null;}
    if(action==='profile')settings.profile=settings.profile==='flow'?'anchor':'flow';
    if(action==='lock')settings.startShape=settings.startShape?null:activeRoute()?.nodes[0].shape;
    if(action==='context')settings.context=!settings.context;
    if(action==='completeness')settings.completeness=settings.completeness==='full'?'practical':'full';
    if(action==='relax'){settings.melody='free';settings.region='0-12';settings.profile='flow';settings.startShape=null;settings.completeness='practical';for(const c of settings.chords)delete c.top;}
    if(action==='preset'){settings.chords=b.dataset.value==='jazz'?[{root:'D',typeId:'minor7'},{root:'G',typeId:'dominant7'},{root:'C',typeId:'major7'}]:b.dataset.value==='minor'?[{root:'A',typeId:'minor'},{root:'F',typeId:'major'},{root:'C',typeId:'major'},{root:'G',typeId:'major'}]:fresh().chords;settings.startShape=null;settings.step=0;settings.melody='free';}
    update();
  }
  function setSequence(records){if(!Array.isArray(records)||records.length<2||records.length>8||records.some(c=>T.parseNote(c.root)===null||!c.pitchClasses?.length))return false;stop();settings.chords=records.map(record=>({root:record.root,typeId:record.typeId,record:JSON.parse(JSON.stringify(record))}));settings.startShape=null;draftFrets=null;gripGallery=false;settings.step=0;cacheKey='';save();return true;}
  function addChord(chord){stop();if(settings.chords.length>=8)return false;settings.chords.push({root:chord.root,typeId:chord.typeId,record:chord});settings.startShape=null;cacheKey='';save();return true;}
  function setRegion(region){if(!['0-12','5-12','12-24','0-24'].includes(region))return;if(draftFrets){editViewRange=region==='12-24'?12:0;update();return;}stop();settings.region=region;update();}
  function inspectPosition(stringIndex,fret,{audition:hear=false}={}){
    const model=viewModel||sceneState(context),midi=G.positionMidi(model.tuning||context.tuning,stringIndex,fret,model.capo??context.capo);if(midi===null)return;
    if(draftFrets){if(!hear)return;draftFrets[stringIndex]=draftFrets[stringIndex]===fret?-1:fret;update();hearNodes([{events:[{stringIndex,fret,midi}],beats:1}]).catch(reportError);return;}
    const chord=model.activeChord||activeNode()?.chord,pcs=model.motion?.contextPcs||model.activeScale?.pcs||[];
    selectedNote={stringIndex,fret,midi,role:E.roleFor(midi,chord,pcs)};stageInfo();
    if(hear)hearNodes([{events:[{stringIndex,fret,midi}],beats:1}]).catch(reportError);
  }
  function setView(model,language){const key=JSON.stringify([model.activeChord?.symbol,model.tuning.notes,model.capo,model.motion?.step]);if(key!==viewKey){selectedNote=null;viewKey=key;const stage=root.document.getElementById('sceneStage');stage.classList.remove('harmonic-switch');void stage.offsetWidth;stage.classList.add('harmonic-switch');}viewModel=model;context={...(context||{}),language,mode:model.mode};}
  function stageInfo(){
    const hud=root.document?.getElementById('motionHud');if(!hud)return;
    const node=viewModel?.motion?.enabled?activeNode():viewModel?.activeChord&&viewModel.activeVoicing?{chord:viewModel.activeChord,events:E.eventsFor(viewModel.activeVoicing,viewModel.activeChord,viewModel.tuning,viewModel.capo)}:null,edge=viewModel?.motion?.enabled?activeEdge():null,roles=roleNames[context?.language]||roleNames.en;
    hud.hidden=!node||context?.mode==='project';
    const selected=selectedNote||node?.events.find(e=>e.role.kind==='guide')||node?.events[0];
    hud.innerHTML='<div class="tone-lens" style="--role:'+(selected?.role.color||E.COLORS.guide)+'"><span class="lens-orbit"></span><div><small>'+text('TONE / ROLE','SES / GÖREV')+'</small><strong>'+escape(selected?.role.note||'—')+' <em>'+escape(selected?.role.label||'')+'</em></strong><span>'+escape(roles[selected?.role.kind]||'')+' · '+escape(node?.chord.symbol||'')+'</span></div></div>'+(edge?'<div class="motion-stage-metrics"><span><b>'+edge.commonCount+'</b>'+text('held voices','sabit ses')+'</span><span><b>'+edge.totalSemitones+'</b>'+text('semitones','yarım ses')+'</span></div>':'');
    root.document.querySelectorAll('.sequence-item').forEach((el,i)=>el.classList.toggle('active',i===settings.step));
    const transport=root.document.getElementById('playMainText');if(context?.mode==='motion'&&transport)transport.textContent=playing?text('Playing route','Rota çalınıyor'):text('Play route','Rotayı çal');
  }
  function reportError(error){playing=false;const toast=root.document.getElementById('toast');toast.textContent=error.message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200);notify();}
  async function hearNodes(nodes){stop();const request=requestId;notify();const pending=A.playVoicingRoute(nodes,{bpm:context.bpm});ownedToken=A.getPlayback().token;await pending;if(request!==requestId)return;context.scene?.setPlayback(A.getPlayback,nodes.flatMap(n=>n.events));}
  function stop(){requestId++;if(playFrame)root.cancelAnimationFrame(playFrame);playFrame=0;if(ownedToken===A.getPlayback().token||playing)A.stop();playing=false;playToken=null;ownedToken=null;}
  async function audition(){const n=activeNode();if(n)return hearNodes([{events:n.events,beats:3}]);}
  async function play(arpeggio=false){
    compute();const route=activeRoute();if(!route)return;stop();const request=requestId;settings.step=0;selectedNote=null;playing=true;notify();
    const pending=A.playVoicingRoute(route.nodes.map((n,i)=>({events:n.events,beats:beatsAt(i)})),{bpm:context.bpm,arpeggio,loop:settings.loop,metronome:settings.metronome,countIn:settings.countIn,pattern:settings.pattern});ownedToken=A.getPlayback().token;await pending;if(request!==requestId)return;
    const clock=A.getPlayback();playToken=clock.token;context.scene?.setPlayback(A.getPlayback,route.nodes.flatMap(n=>n.events));
    function tick(){
      const snapshot=A.getPlayback();if(request!==requestId)return;if(!playing||snapshot.token!==playToken){playing=false;notify();return;}
      const events=snapshot.events.filter(e=>e.stepStart<=snapshot.time&&e.stepEnd>snapshot.time),step=events[0]?.stepIndex;
      if(Number.isInteger(step)&&step!==settings.step){settings.step=step;selectedNote=null;notify();}
      stageInfo();if(snapshot.events.some(e=>e.stepEnd>snapshot.time))playFrame=root.requestAnimationFrame(tick);else{playing=false;settings.step=route.nodes.length-1;notify();}
    }
    playFrame=root.requestAnimationFrame(tick);
  }

  // ---- Top note, presets, library and share links
  const OPTION_VALUES={profile:['flow','anchor'],melody:['free','hold','up','down'],region:['0-12','5-12','12-24','0-24'],completeness:['full','practical'],pattern:['block','strum','downup']};
  const PRESETS=[
    ['pop-1564','Pop','I–V–vi–IV',[[0,1,'major'],[7,5,'major'],[9,6,'minor'],[5,4,'major']]],
    ['pop-1645','Pop','I–vi–IV–V',[[0,1,'major'],[9,6,'minor'],[5,4,'major'],[7,5,'major']]],
    ['pop-6415','Pop','vi–IV–I–V',[[9,6,'minor'],[5,4,'major'],[0,1,'major'],[7,5,'major']]],
    ['jazz-251','Jazz','ii7–V7–Imaj7',[[2,2,'minor7'],[7,5,'dominant7'],[0,1,'major7']]],
    ['jazz-251m','Jazz','iiø7–V7–i7',[[2,2,'halfDim7'],[7,5,'dominant7'],[0,1,'minor7']]],
    ['jazz-turn','Jazz','Imaj7–vi7–ii7–V7',[[0,1,'major7'],[9,6,'minor7'],[2,2,'minor7'],[7,5,'dominant7']]],
    ['jazz-3625','Jazz','iii7–VI7–ii7–V7–Imaj7',[[4,3,'minor7'],[9,6,'dominant7'],[2,2,'minor7'],[7,5,'dominant7'],[0,1,'major7']]],
    ['jazz-sub','Jazz','ii7–♭II7–Imaj7',[[2,2,'minor7'],[1,2,'dominant7'],[0,1,'major7']]],
    ['blues-major','Blues','I7–IV7–I7–V7',[[0,1,'dominant7'],[5,4,'dominant7'],[0,1,'dominant7'],[7,5,'dominant7']]],
    ['blues-minor','Blues','i7–iv7–i7–V7',[[0,1,'minor7'],[5,4,'minor7'],[0,1,'minor7'],[7,5,'dominant7']]],
    ['andalusian-1','Andalusian','i–♭VII–♭VI–V',[[0,1,'minor'],[10,7,'major'],[8,6,'major'],[7,5,'major']]],
    ['andalusian-2','Andalusian','i–♭VI–♭III–♭VII',[[0,1,'minor'],[8,6,'major'],[3,3,'major'],[10,7,'major']]],
    ['modal-dorian','Modal','i7–IV7 (Dorian)',[[0,1,'minor7'],[5,4,'dominant7']]],
    ['modal-mixo','Modal','I–♭VII–IV (Mixolydian)',[[0,1,'major'],[10,7,'major'],[5,4,'major']]],
    ['modal-lydian','Modal','Imaj7–II (Lydian)',[[0,1,'major7'],[2,2,'major']]],
    ['modal-phrygian','Modal','i–♭II (Phrygian)',[[0,1,'minor'],[1,2,'major']]]
  ].map(([id,category,name,chords])=>({id,category:category.toLowerCase(),name,chords}));
  function presetChords(id,rootText='C'){
    const preset=PRESETS.find(p=>p.id===id),rootPc=T.parseNote(rootText);if(!preset||rootPc===null)return null;
    return preset.chords.map(([offset,degree,typeId])=>({root:T.spelling(rootText,degree,T.mod(rootPc+offset)),typeId}));
  }
  function topOptions(){
    const record=draftChord(),names=new Map(record.notes.map(n=>[n.pc,n.name])),list=[];
    for(let midi=55;midi<=88;midi++)if(names.has(T.mod(midi)))list.push({midi,label:names.get(T.mod(midi))+(Math.floor(midi/12)-1)});
    return list;
  }
  function topBadge(i){
    const c=settings.chords[i];if(!Number.isFinite(c?.top))return '';
    const name=chords()[i]?.notes.find(n=>n.pc===T.mod(c.top))?.name||T.noteName(T.mod(c.top));
    return '<em class="sequence-top" title="'+text('Top note','Üst nota')+'">↑'+escape(name+(Math.floor(c.top/12)-1))+'</em>';
  }
  function cleanChord(c){
    if(!c||T.parseNote(c.root)===null||!(T.CHORD_TYPES.some(t=>t.id===c.typeId)||c.record?.pitchClasses?.length))return null;
    const out={root:c.root,typeId:c.typeId};
    if(c.record)out.record=c.record;if(BEATS.includes(c.beats))out.beats=c.beats;if(Number.isFinite(c.top)&&c.top>=36&&c.top<=96)out.top=c.top;
    return out;
  }
  function cleanItem(it){
    if(!it||typeof it.name!=='string'||!Array.isArray(it.chords))return null;
    const list=it.chords.map(cleanChord);if(list.length<2||list.length>8||list.some(c=>!c))return null;
    const options={};for(const [key,values] of Object.entries(OPTION_VALUES))if(values.includes(it.options?.[key]))options[key]=it.options[key];
    return {id:String(it.id||'').slice(0,40)||'p'+Math.random().toString(36).slice(2,8),name:it.name.trim().slice(0,40)||'—',savedAt:Number(it.savedAt)||0,chords:list,options};
  }
  function libraryRead(){try{const data=JSON.parse(root.localStorage.getItem(LIBRARY)||'null');library=Array.isArray(data?.items)?data.items.map(cleanItem).filter(Boolean).slice(0,50):[];}catch(_){library=[];}}
  function libraryWrite(){try{root.localStorage.setItem(LIBRARY,JSON.stringify({version:1,items:library}));}catch(_){}}
  function saveToLibrary(name){
    const symbols=chords().map(c=>c.symbol).join(' → '),item={id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:String(name||'').trim().slice(0,40)||symbols.slice(0,40),savedAt:Date.now(),chords:settings.chords.map(c=>JSON.parse(JSON.stringify(c))),options:Object.fromEntries(Object.keys(OPTION_VALUES).map(key=>[key,settings[key]]))};
    library=[item,...library].slice(0,50);libraryWrite();return item;
  }
  function applyProgression(list,options){
    settings.chords=list.map(c=>JSON.parse(JSON.stringify(c)));
    for(const [key,value] of Object.entries(options||{}))if(OPTION_VALUES[key]?.includes(value))settings[key]=value;
    settings.startShape=null;settings.step=0;settings.routeIndex=0;draftFrets=null;gripGallery=false;cacheKey='';
  }
  function libraryMarkup(){
    const groups=[['pop','Pop','Pop'],['jazz','Jazz','Caz'],['blues','Blues','Blues'],['andalusian','Andalusian','Endülüs'],['modal','Modal','Modal']];
    const symbol=c=>escape(c.record?.symbol||c.root+(T.CHORD_TYPES.find(t=>t.id===c.typeId)?.symbol||''));
    const saved=library.map(it=>'<li class="lib-item"><div><strong>'+escape(it.name)+'</strong><small>'+it.chords.map(symbol).join(' → ')+'</small></div><button data-motion="lib-open" data-id="'+escape(it.id)+'">'+text('Open','Aç')+'</button><button data-motion="lib-rename" data-id="'+escape(it.id)+'">'+text('Rename','Ad')+'</button><button data-motion="lib-delete" data-id="'+escape(it.id)+'" aria-label="'+text('Delete','Sil')+' '+escape(it.name)+'">×</button></li>').join('');
    return '<details class="motion-library"'+(libraryOpen?' open':'')+'><summary>'+text('Library','Kütüphane')+' <small>'+library.length+'</small></summary><div class="lib-save"><input type="text" maxlength="40" data-lib-name placeholder="'+text('Name this progression','Progresyona ad ver')+'" value="'+escape(draftName)+'"><button data-motion="lib-save">'+text('Save','Kaydet')+'</button><button data-motion="share">'+text('Copy link','Bağlantıyı kopyala')+'</button></div>'+(saved?'<ul class="lib-list">'+saved+'</ul>':'<p class="lib-empty">'+text('Nothing saved yet.','Henüz kayıt yok.')+'</p>')+groups.map(([id,en,tr])=>'<div class="lib-group"><h4>'+text(en,tr)+'</h4><div>'+PRESETS.filter(p=>p.category===id).map(p=>'<button data-motion="lib-preset" data-value="'+p.id+'">'+escape(p.name)+'</button>').join('')+'</div></div>').join('')+'</details>';
  }
  // Share links carry only validated data: every field is rebuilt through the theory module.
  const b64=json=>root.btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const unb64=code=>decodeURIComponent(Array.from(root.atob(String(code).replace(/-/g,'+').replace(/_/g,'/')),ch=>'%'+ch.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
  function encodeShare(){
    const list=[];
    for(const c of settings.chords){
      const record=c.record,typeId=c.typeId||record?.typeId;if(!T.CHORD_TYPES.some(t=>t.id===typeId))return null;
      const mods=record?.modifiers||{},spec={r:record?.root||c.root,t:typeId};
      if(mods.add?.length||mods.alter?.length||mods.omit?.length)spec.m={a:[...(mods.add||[])],l:[...(mods.alter||[])],o:[...(mods.omit||[])]};
      if(Number.isInteger(record?.slashBassPc))spec.s=record.slashBassPc;
      if(BEATS.includes(c.beats))spec.b=c.beats;if(Number.isFinite(c.top))spec.k=c.top;list.push(spec);
    }
    return b64(JSON.stringify({v:1,c:list,o:Object.fromEntries(Object.keys(OPTION_VALUES).map(key=>[key,settings[key]])),b:Number(context?.bpm)||undefined}));
  }
  function decodeShare(code){
    try{
      if(typeof code!=='string'||code.length>4000)return null;
      const data=JSON.parse(unb64(code));if(data?.v!==1||!Array.isArray(data.c)||data.c.length<2||data.c.length>8)return null;
      const list=data.c.map(spec=>{
        if(!spec||typeof spec.r!=='string'||T.parseNote(spec.r)===null||!T.CHORD_TYPES.some(t=>t.id===spec.t))return null;
        const ids=value=>Array.isArray(value)&&value.length<=8?value.filter(x=>typeof x==='string'&&x.length<16):[],mods={add:ids(spec.m?.a),alter:ids(spec.m?.l),omit:Array.isArray(spec.m?.o)?spec.m.o.map(Number).filter(n=>[3,5,7].includes(n)):[]};
        let record=T.buildChord(spec.r,spec.t,mods);
        if(Number.isInteger(spec.s)&&spec.s>=0&&spec.s<12){const name=T.noteName(spec.s);record={...record,symbol:record.symbol+'/'+name,slashBassPc:spec.s,pitchClasses:[...new Set([...record.pitchClasses,spec.s])],notes:[{pc:spec.s,name,degree:1,label:'bass',semitones:T.mod(spec.s-record.rootPc)},...record.notes]};}
        const out={root:spec.r,typeId:spec.t,record};if(BEATS.includes(spec.b))out.beats=spec.b;if(Number.isFinite(spec.k)&&spec.k>=36&&spec.k<=96)out.top=spec.k;return out;
      });
      if(list.some(c=>!c))return null;
      const options={};for(const [key,values] of Object.entries(OPTION_VALUES))if(values.includes(data.o?.[key]))options[key]=data.o[key];
      return {chords:list,options,bpm:Number.isFinite(data.b)?Math.max(40,Math.min(220,Math.round(data.b))):null};
    }catch(_){return null;}
  }
  function shareUrl(){const code=encodeShare();return code?root.location.origin+root.location.pathname+'#m='+code:null;}
  function offerShare(code){const data=decodeShare(code);if(!data)return false;pendingShare=data;if(context)notify();return true;}
  function clearHash(){try{root.history.replaceState(null,'',root.location.pathname+root.location.search);}catch(_){}}
  function notice(message){const el=root.document?.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600);}
  async function shareLink(){
    const url=shareUrl();if(!url){notice(text('A custom chord cannot be shared as a link.','Özel bir akor bağlantıyla paylaşılamaz.'));return;}
    try{if(root.navigator?.share){await root.navigator.share({title:'Guitar Brain Motion',url});return;}}catch(error){if(error?.name==='AbortError')return;}
    try{await root.navigator.clipboard.writeText(url);notice(text('Link copied','Bağlantı kopyalandı'));}catch(_){notice(url);}
  }
  function shareBannerMarkup(){
    if(!pendingShare)return '';
    const names=pendingShare.chords.map(c=>escape(c.record.symbol)).join(' → ');
    return '<div class="share-banner" role="status"><span>'+text('Shared progression','Paylaşılan progresyon')+' · <strong>'+names+'</strong></span><button data-motion="share-open">'+text('Open','Aç')+'</button><button data-motion="share-dismiss">'+text('Dismiss','Kapat')+'</button></div>';
  }
  function stepBy(delta){const last=settings.chords.length-1;stop();settings.step=Math.max(0,Math.min(last,settings.step+delta));selectedNote=null;update();}
  // One block chord per sequence step, timed by each chord's beats; used for MIDI export.
  function midiNotes(){const route=activeRoute();if(!route)return [];let beat=0;return route.nodes.flatMap((node,i)=>{const beats=beatsAt(i),start=beat;beat+=beats;return node.events.map(e=>({midi:e.midi,startBeat:start,durationBeats:beats*.95}));});}
  root.GBMotionWorkspace=Object.freeze({init,render,stepBy,midiNotes,isPlaying:()=>playing,presets:()=>PRESETS.map(p=>({id:p.id,category:p.category,name:p.name})),presetChords,saveToLibrary,library:()=>JSON.parse(JSON.stringify(library)),shareUrl,encodeShare,decodeShare,offerShare,pendingShare:()=>pendingShare&&JSON.parse(JSON.stringify(pendingShare)),sceneState,play,stop,audition,inspectPosition,stageInfo,setView,addChord,setSequence,restore,setRegion,midis:()=>activeNode()?.events.map(e=>e.midi)||[],snapshot:()=>({settings:JSON.parse(JSON.stringify(settings)),route:activeRoute(),playing})});
})(typeof window!=='undefined'?window:globalThis);
