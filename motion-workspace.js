/* Motion is a separate workspace and store; the stable studio remains untouched. */
(function(root){
  'use strict';
  const E=root.GBMotionEngine,T=root.MBS2Theory,G=root.MBS2Guitar,A=root.MBS2Audio,D=root.MBS2Diagram,V=root.MBS2Voicings;
  const STORE='guitar-brain-motion-routes-v1';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const defaults={chords:[{root:'G',typeId:'dominant7'},{root:'C',typeId:'major7'}],profile:'flow',melody:'free',region:'0-12',completeness:'full',routeIndex:0,step:0,context:true,startShape:null,routeLimit:12};
  const fresh=()=>JSON.parse(JSON.stringify(defaults));
  let settings=fresh(),context=null,viewModel=null,viewKey='',instrumentKey='',cacheKey='',result=null,selectedNote=null,notify=()=>{},playFrame=0,playToken=null,ownedToken=null,requestId=0,playing=false,composer=false,draftRoot='C',draftType='major7',editIndex=-1,draftSlash='',draftModifiers={add:[],alter:[],omit:[]},draftRecord=null,draftFrets=null,editViewRange=0,gripGallery=false,gripPoolKey='',gripPool=[];
  const roleNames={en:{root:'Root',guide:'Guide tone',foundation:'Fifth',extension:'Chord colour',tension:'Context tension',outside:'Outside chord'},tr:{root:'Kök',guide:'Yön veren ses',foundation:'Beşli',extension:'Akor rengi',tension:'Bağlam gerilimi',outside:'Akor dışı'}};
  function text(en,tr){return context?.language==='tr'?tr:en;}
  function restore(data){if(!data||!Array.isArray(data.chords)||data.chords.length<2||data.chords.length>8)return;settings={...fresh(),...JSON.parse(JSON.stringify(data))};settings.chords=settings.chords.filter(c=>T.parseNote(c.root)!==null&&(T.CHORD_TYPES.some(t=>t.id===c.typeId)||c.record?.pitchClasses?.length));if(settings.chords.length<2)settings=fresh();for(const [key,values] of Object.entries({profile:['flow','anchor'],melody:['free','hold','up','down'],region:['0-12','5-12','12-24','0-24'],completeness:['full','practical']}))if(!values.includes(settings[key]))settings[key]=defaults[key];settings.routeLimit=[6,12,24].includes(Number(settings.routeLimit))?Number(settings.routeLimit):12;settings.routeIndex=Math.max(0,Number(settings.routeIndex)||0);settings.step=Math.max(0,Math.min(settings.chords.length-1,Number(settings.step)||0));cacheKey='';}
  function read(){try{restore(JSON.parse(root.localStorage.getItem(STORE)||'null'));}catch(_){}}
  function save(){try{root.localStorage.setItem(STORE,JSON.stringify(settings));}catch(_){}}
  function chords(){return settings.chords.map(c=>c.record||T.buildChord(c.root,c.typeId));}
  function compute(ctx=context){
    if(ctx)context=ctx;if(!context)return null;
    const instrument=JSON.stringify([context.tuning.notes,context.capo]);if(instrumentKey&&instrumentKey!==instrument){settings.startShape=null;draftFrets=null;};instrumentKey=instrument;
    const [minFret,maxFret]=settings.region.split('-').map(Number),records=chords();
    const key=JSON.stringify([records,context.tuning.notes,context.capo,settings.profile,settings.melody,settings.region,settings.completeness,settings.startShape?.frets,settings.routeLimit]);
    if(key!==cacheKey){
      stop();cacheKey=key;settings.routeIndex=0;settings.step=0;
      result=E.routes(records,context.tuning,context.capo,{minFret:Math.max(context.capo,minFret),maxFret,profile:settings.profile,melody:settings.melody,completeness:settings.completeness,startShape:settings.startShape,limit:settings.routeLimit});
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
    if(!T.CHORD_TYPES.some(t=>t.id===draftType))draftType='custom';draftRecord=record||null;
    draftSlash=record?.slashBassPc!==undefined?T.noteName(record.slashBassPc):'';draftModifiers=JSON.parse(JSON.stringify(record?.modifiers||{add:[],alter:[],omit:[]}));composer=true;
  }
  function editorMarkup(){
    if(!composer)return '';const notes=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'],title=editIndex<0?text('Add chord','Akor ekle'):text(editIndex===0?'Starting chord':editIndex===settings.chords.length-1?'Target chord':'Chord '+(editIndex+1),editIndex===0?'Başlangıç akoru':editIndex===settings.chords.length-1?'Hedef akor':(editIndex+1)+'. akor');
    return '<div class="chord-editor-backdrop"><section class="chord-editor" role="dialog" aria-modal="true" aria-label="'+title+'"><header><span>'+title+'</span><button data-motion="close-editor" aria-label="'+text('Close chord editor','Akor seçiciyi kapat')+'">×</button></header><div class="editor-preview"><strong>'+escape(draftChord().symbol)+'</strong><span>'+draftChord().notes.map(n=>escape(n.name)).join(' · ')+'</span></div><div class="composer-roots">'+notes.map(n=>'<button data-motion="draft-root" data-value="'+n+'" class="'+(T.parseNote(n)===T.parseNote(draftRoot)?'active':'')+'">'+n+'</button>').join('')+'</div><label class="editor-search">'+text('Search chord types','Akor türü ara')+'<input type="search" data-motion-search placeholder="maj7 · m9 · sus · altered"></label><div class="editor-types">'+(draftType==='custom'?'<button class="active" data-motion="draft-type" data-value="custom">'+text('Current custom chord','Mevcut özel akor')+'</button>':'')+T.CHORD_TYPES.map(t=>'<button data-motion="draft-type" data-value="'+t.id+'" data-search="'+escape((t.id+' '+t.name+' '+t.symbol).toLowerCase())+'" class="'+(draftType===t.id?'active':'')+'"><strong>'+escape(draftRoot+(t.symbol||''))+'</strong><small>'+escape(root.MBS2I18n?.t(t.name)||t.name)+'</small></button>').join('')+'</div><div class="editor-extra"><label>'+text('Bass / inversion','Bas / çevrim')+'<select data-draft-slash><option value="">'+text('Any bass','Serbest bas')+'</option>'+notes.map(n=>'<option value="'+n+'"'+(T.parseNote(n)===T.parseNote(draftSlash)&&draftSlash?' selected':'')+'>'+n+'</option>').join('')+'</select></label><details><summary>'+text('Add / alter / omit','Add / alter / omit')+'</summary><div class="editor-modifiers">'+T.MODIFIERS.map(m=>'<button data-motion="draft-modifier" data-value="'+m.id+'" class="'+(draftModifiers[m.kind==='add'?'add':'alter'].includes(m.id)?'active':'')+'">'+escape(m.label||m.id)+'</button>').join('')+[3,5,7].map(n=>'<button data-motion="draft-omit" data-value="'+n+'" class="'+(draftModifiers.omit.includes(n)?'active':'')+'">omit '+n+'</button>').join('')+'</div></details></div><footer><button data-motion="close-editor">'+text('Cancel','İptal')+'</button><button class="primary" data-motion="apply-editor">'+text(editIndex<0?'Add chord':'Use this chord',editIndex<0?'Akoru ekle':'Bu akoru kullan')+'</button></footer></section></div>';
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
      '<section class="motion-sequence"><div class="motion-section-title"><span>'+text('CHORDS','AKORLAR')+'</span><button data-motion="composer" aria-expanded="'+composer+'">'+(composer?'×':'+')+'</button></div>'+
      '<div class="sequence-cards">'+list.map((c,i)=>'<div class="sequence-item'+(i===settings.step?' active':'')+'"><button class="sequence-pick" data-motion="step" data-index="'+i+'"><small>'+text(i===0?'FROM':i===list.length-1?'TO':String(i+1).padStart(2,'0'),i===0?'BAŞLANGIÇ':i===list.length-1?'HEDEF':String(i+1).padStart(2,'0'))+'</small><strong>'+escape(c.symbol)+'</strong><span>'+(r?escape(r.nodes[i].shape.frets.map(f=>f<0?'×':f).join(' · ')):'—')+'</span></button><button class="sequence-edit" data-motion="edit" data-index="'+i+'" aria-label="'+escape(text('Change chord ','Akoru değiştir ')+c.symbol)+'">'+text('Edit','Değiştir')+'</button><button class="sequence-remove" data-motion="remove" data-index="'+i+'" aria-label="'+text('Remove chord','Akoru kaldır')+'"'+(list.length<=2?' disabled':'')+'>×</button></div>').join('')+'</div><button class="motion-swap" data-motion="swap">⇄ '+text('Reverse chord order','Akor sırasını ters çevir')+'</button>'+
      '<div class="motion-presets"><button data-motion="preset" data-value="two">G7 → Cmaj7</button><button data-motion="preset" data-value="jazz">Dm7 → G7 → Cmaj7</button><button data-motion="preset" data-value="minor">Am → F → C → G</button></div>'+
      '<div class="motion-options"><label>'+text('Fret region','Perde bölgesi')+'<select data-motion-change="region">'+[['0-12','0–12'],['5-12','5–12'],['12-24','12–24'],['0-24','0–24']].map(([id,l])=>'<option value="'+id+'"'+(settings.region===id?' selected':'')+'>'+l+'</option>').join('')+'</select></label><label>'+text('Top voice','Üst ses')+'<select data-motion-change="melody">'+[['free',text('Free','Serbest')],['hold',text('Keep exact pitch','Aynı sesi koru')],['up',text('Strictly ascending','Her akorda yükselsin')],['down',text('Strictly descending','Her akorda alçalsın')]].map(([id,l])=>'<option value="'+id+'"'+(settings.melody===id?' selected':'')+'>'+l+'</option>').join('')+'</select></label></div>'+
      '<div class="motion-toggle-row"><button data-motion="profile" class="'+(settings.profile==='anchor'?'active':'')+'">'+text('Keep hand position','El pozisyonunu koru')+'</button><button data-motion="lock" class="'+(settings.startShape?'active':'')+'"'+(!r&&!settings.startShape?' disabled':'')+'>'+text(settings.startShape?'Release first grip':'Lock first grip',settings.startShape?'İlk tutuşu serbest bırak':'İlk tutuşu sabitle')+'</button></div></section>'+
      firstGripMarkup()+'<section class="motion-routes"><div class="route-count-control">'+text('Routes','Rotalar')+' '+[6,12,24].map(n=>'<button data-motion="count" data-value="'+n+'" aria-pressed="'+(settings.routeLimit===n)+'" class="'+(settings.routeLimit===n?'active':'')+'">'+n+'</button>').join('')+'</div><div class="motion-section-title"><span>'+text('VOICE ROUTES','SES ROTALARI')+'</span><small>'+result.routes.length+' '+text('alternatives','alternatif')+'</small></div>'+
      (result.routes.length?'<div class="route-list">'+result.routes.map((route,i)=>'<button class="route-card'+(settings.routeIndex===i?' active':'')+'" data-motion="route" data-index="'+i+'" aria-pressed="'+(settings.routeIndex===i)+'"><span class="route-number">'+String(i+1).padStart(2,'0')+'</span><span class="route-card-body"><strong>'+text(i===0?'Balanced movement':'Alternative '+String(i+1).padStart(2,'0'),i===0?'Dengeli hareket':'Alternatif '+String(i+1).padStart(2,'0'))+'</strong><span>'+route.nodes.map(n=>escape(n.chord.symbol)).join(' <i>→</i> ')+'</span><small>'+route.totalSemitones+' '+text('semitones moved','yarım ses hareket')+' · '+route.commonCount+' '+text('held voices','sabit ses')+'</small><small class="route-upper">'+text('Top: ','Üst: ')+route.nodes.map(n=>escape(n.events.at(-1).role.note)+(Math.floor(n.events.at(-1).midi/12)-1)).join(' → ')+'</small></span><span class="route-meter" style="--meter:'+Math.min(100,20+route.totalSemitones*2)+'%"><i></i></span></button>').join('')+'</div>':'<div class="motion-empty"><span>∅</span><p>'+text('No playable route satisfies these constraints.','Bu koşulları sağlayan çalınabilir rota bulunamadı.')+'</p><button data-motion="relax">'+text('Reset constraints','Koşulları sıfırla')+'</button></div>')+
      '<div class="motion-context"><button data-motion="context" aria-pressed="'+settings.context+'" class="'+(settings.context?'active':'')+'"><i></i>'+text('Scale context','Gam bağlamı')+' · '+escape(context.scaleRoot)+' '+escape(context.scaleName||context.scaleId)+'</button><button data-motion="completeness" class="'+(settings.completeness==='practical'?'active':'')+'">'+text(settings.completeness==='full'?'All chord tones':'Practical omissions',settings.completeness==='full'?'Bütün akor sesleri':'Pratik eksiltmeler')+'</button></div>'+
      '<div class="role-key">'+Object.entries(roles).filter(([id])=>id!=='outside').map(([id,label])=>badge({color:E.COLORS[id]},label)).join('')+'</div></section>'+
      '<section class="motion-inspector"><div class="motion-section-title"><span>'+text('INSIDE THE CHANGE','GEÇİŞİN İÇİNDE')+'</span><small>'+escape(edge?edge.from.chord.symbol+' → '+edge.to.chord.symbol:'')+'</small></div>'+
      (edge?'<div class="voice-pairs">'+edge.pairs.map(pairRow).join('')+'</div>'+(edge.enters.length||edge.exits.length?'<p class="route-footnote">'+edge.enters.length+' '+text('entering','giren')+' · '+edge.exits.length+' '+text('leaving voices','çıkan ses')+'</p>':'')+'<div class="route-facts"><span>'+edge.physicalHoldCount+' '+text('same positions','aynı konum')+'</span><span>'+text('Largest leap','En büyük sıçrama')+' '+edge.largestLeap+'</span></div>':'')+
      (node?'<div class="motion-grip">'+D.render(node.shape,node.chord,context.tuning,context.capo,{labels:'degrees',compact:true})+'<div><strong>'+escape(node.chord.symbol)+'</strong><span>'+node.events.map(e=>escape(e.role.note)).join(' · ')+'</span><span class="motion-register">'+text('Bass: ','Bas: ')+escape(node.events[0].role.note)+(Math.floor(node.events[0].midi/12)-1)+' · '+text('Top: ','Üst: ')+escape(node.events.at(-1).role.note)+(Math.floor(node.events.at(-1).midi/12)-1)+'</span>'+(node.shape.omittedLabels?.length?'<small>'+text('Omitted','Eksik')+': '+escape(node.shape.omittedLabels.join(', '))+'</small>':'')+'<button data-motion="audition">▷ '+text('Hear this grip','Tutuşu dinle')+'</button></div></div>':'')+'</section></div>';
    if(root.MBS2I18n)host.innerHTML=root.MBS2I18n.html(host.innerHTML,context.language);
    host.querySelectorAll('[data-grip-string]').forEach(input=>{const commit=()=>{if(!draftFrets)return;const value=input.value===''?-1:Number(input.value),index=Number(input.dataset.gripString);if(draftFrets[index]!==value){draftFrets[index]=value;update();}};input.addEventListener('change',commit);input.addEventListener('blur',commit);input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();commit();}});});
    host.insertAdjacentHTML('beforeend',editorMarkup());
    host.querySelector('[data-motion-search]')?.addEventListener('input',event=>{const q=event.target.value.toLowerCase();host.querySelectorAll('[data-search]').forEach(button=>button.hidden=!button.dataset.search.includes(q));});
    host.querySelector('[data-draft-slash]')?.addEventListener('change',event=>{draftSlash=event.target.value;update();});
    const dialog=host.querySelector('.chord-editor');if(dialog){dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){composer=false;update();return;}if(event.key==='Tab'){const controls=Array.from(dialog.querySelectorAll('button:not([disabled]):not([hidden]),input,select,summary')).filter(el=>el.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&root.document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&root.document.activeElement===last){event.preventDefault();first.focus();}}});dialog.querySelector('input')?.focus();}
    host.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.motion,b)));
    host.querySelectorAll('[data-motion-change]').forEach(c=>c.addEventListener('change',()=>{stop();settings[c.dataset.motionChange]=c.value;update();}));
    stageInfo();
  }
  function action(action,b){
    if(action==='voice'){const pair=activeEdge()?.pairs[Number(b.dataset.index)];if(pair)hearNodes([{events:[pair.from],beats:1},{events:[pair.to],beats:1}]).catch(reportError);return;}
    if(action==='audition'){audition().catch(reportError);return;}
    stop();
    if(action==='count')settings.routeLimit=Number(b.dataset.value);
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
    if(action==='apply-editor'){const record=draftChord(),item={root:record.root,typeId:record.typeId,record};if(editIndex<0){if(settings.chords.length<8)settings.chords.push(item);}else settings.chords[editIndex]=item;settings.startShape=null;composer=false;cacheKey='';}
    if(action==='swap'){settings.chords.reverse();settings.startShape=null;settings.step=0;cacheKey='';}
    if(action==='draft-modifier'){const m=T.MODIFIERS.find(m=>m.id===b.dataset.value),key=m.kind==='add'?'add':'alter',had=draftModifiers[key].includes(m.id);draftModifiers[key]=draftModifiers[key].filter(id=>id!==m.id&&(key!=='alter'||T.MODIFIERS.find(x=>x.id===id)?.degree!==m.degree));if(!had)draftModifiers[key].push(m.id);}
    if(action==='draft-omit'){const degree=Number(b.dataset.value);draftModifiers.omit=draftModifiers.omit.includes(degree)?draftModifiers.omit.filter(n=>n!==degree):[...draftModifiers.omit,degree];}
    if(action==='draft-root'){draftRoot=b.dataset.value;if(draftType==='custom'){draftType='major';draftModifiers={add:[],alter:[],omit:[]};}}
    if(action==='draft-type')draftType=b.dataset.value;
    if(action==='append'&&settings.chords.length<8){settings.chords.push({root:draftRoot,typeId:draftType});settings.startShape=null;composer=false;}
    if(action==='remove'&&settings.chords.length>2){settings.chords.splice(Number(b.dataset.index),1);settings.startShape=null;}
    if(action==='step'){settings.step=Number(b.dataset.index);selectedNote=null;}
    if(action==='route'){settings.routeIndex=Number(b.dataset.index);settings.step=0;selectedNote=null;}
    if(action==='profile')settings.profile=settings.profile==='flow'?'anchor':'flow';
    if(action==='lock')settings.startShape=settings.startShape?null:activeRoute()?.nodes[0].shape;
    if(action==='context')settings.context=!settings.context;
    if(action==='completeness')settings.completeness=settings.completeness==='full'?'practical':'full';
    if(action==='relax'){settings.melody='free';settings.region='0-12';settings.profile='flow';settings.startShape=null;settings.completeness='practical';}
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
    const pending=A.playVoicingRoute(route.nodes.map(n=>({events:n.events,beats:4})),{bpm:context.bpm,arpeggio});ownedToken=A.getPlayback().token;await pending;if(request!==requestId)return;
    const clock=A.getPlayback();playToken=clock.token;context.scene?.setPlayback(A.getPlayback,route.nodes.flatMap(n=>n.events));
    function tick(){
      const snapshot=A.getPlayback();if(request!==requestId)return;if(!playing||snapshot.token!==playToken){playing=false;notify();return;}
      const events=snapshot.events.filter(e=>e.stepStart<=snapshot.time&&e.stepEnd>snapshot.time),step=events[0]?.stepIndex;
      if(Number.isInteger(step)&&step!==settings.step){settings.step=step;selectedNote=null;notify();}
      stageInfo();if(snapshot.events.some(e=>e.stepEnd>snapshot.time))playFrame=root.requestAnimationFrame(tick);else{playing=false;settings.step=route.nodes.length-1;notify();}
    }
    playFrame=root.requestAnimationFrame(tick);
  }
  root.GBMotionWorkspace=Object.freeze({init,render,sceneState,play,stop,audition,inspectPosition,stageInfo,setView,addChord,setSequence,restore,setRegion,midis:()=>activeNode()?.events.map(e=>e.midi)||[],snapshot:()=>({settings:JSON.parse(JSON.stringify(settings)),route:activeRoute(),playing})});
})(typeof window!=='undefined'?window:globalThis);
