/* Catalog + four-finger constraints + idiomatic musical families. No UI dependencies. */
(function(root){
  "use strict";
  const T=root.MBS2Theory||(typeof require!=="undefined"?require("./theory.js"):null);
  const G=root.MBS2Guitar||(typeof require!=="undefined"?require("./guitar.js"):null);
  const Catalog=root.MBS2Catalog||(typeof require!=="undefined"?require("./voicing-catalog.js"):null);
  const FAMILY_NAMES={open:"Açık",barre:"Bare",triad:"Üçlü",drop2:"Drop 2",drop3:"Drop 3",shell:"Shell",compact:"Kompakt",power:"Beşli"};
  const DIFFICULTIES={easy:"Kolay",medium:"Orta",advanced:"İleri"};
  const positionMm=(f,scale=648)=>scale*(1-Math.pow(2,-(f-.5)/12));
  function fingering(frets,capo=0,{scaleLength=648,maxReach=112,maxSpan=4}={}){
    if(!Array.isArray(frets)||frets.length<4||frets.length>8||frets.some(f=>!Number.isInteger(f)||f< -1||f>24||f>=0&&f<capo))return {playable:false,reason:"geometry"};
    const pressed=frets.flatMap((f,s)=>f>capo?[{f,s}]:[]);
    if(!pressed.length)return {playable:true,fingerCount:0,barres:[],span:0,reach:0,effort:0};
    const min=Math.min(...pressed.map(p=>p.f)),max=Math.max(...pressed.map(p=>p.f));
    if(max-min>maxSpan)return {playable:false,reason:"span"};
    let reach=0;
    for(const a of pressed)for(const b of pressed)reach=Math.max(reach,Math.hypot(positionMm(a.f,scaleLength)-positionMm(b.f,scaleLength),(a.s-b.s)*7.2));
    if(reach>maxReach)return {playable:false,reason:"reach"};
    const actions=pressed.map((p,i)=>({mask:1<<i,fret:p.f,fromString:p.s,toString:p.s,barre:false}));
    for(let i=0;i<pressed.length;i++)for(let j=i+1;j<pressed.length;j++){
      const a=pressed[i],b=pressed[j];if(a.f!==b.f)continue;
      if(frets.slice(a.s,b.s+1).some(f=>f>=0&&f<a.f))continue;
      let mask=0;pressed.forEach((p,k)=>{if(p.s>=a.s&&p.s<=b.s&&p.f===a.f)mask|=1<<k;});
      actions.push({mask,fret:a.f,fromString:a.s,toString:b.s,barre:true});
    }
    const target=(1<<pressed.length)-1,memo=new Map();
    function cover(mask,barres){
      if(mask===target)return {cost:0,actions:[]};const key=mask+":"+barres;if(memo.has(key))return memo.get(key);
      let first=0;while(mask&(1<<first))first++;
      let best=null;
      for(const action of actions){
        if(!(action.mask&(1<<first))||action.mask&mask||barres+Number(action.barre)>2)continue;
        const rest=cover(mask|action.mask,barres+Number(action.barre));if(!rest)continue;
        const cost=100+Number(action.barre)*(4+action.toString-action.fromString)+rest.cost;
        if(!best||cost<best.cost)best={cost,actions:[action,...rest.actions]};
      }
      memo.set(key,best);return best;
    }
    const result=cover(0,0);if(!result||result.actions.length>4)return {playable:false,reason:"fingers"};
    const barres=result.actions.filter(a=>a.barre).map(a=>({fret:a.fret,fromString:a.fromString,toString:a.toString}));
    const effort=result.actions.length*2+(max-min)*1.4+reach/22+barres.reduce((sum,b)=>sum+1.5+(b.toString-b.fromString)*.65,0);
    return {playable:true,fingerCount:result.actions.length,barres,span:max-min,reach,effort};
  }
  function policyFor(chord,{completeness="practical",allowRootless=false}={}){
    const tones=chord.notes||[],allowed=[...new Set(chord.pitchClasses||[])],required=new Set(allowed),groups=[];
    const explicit=new Set((chord.modifiers?.add||[]).concat(chord.modifiers?.alter||[]).map(id=>T.MODIFIERS.find(m=>m.id===id)?.interval.degree));
    const maxExtension=Math.max(0,...tones.map(n=>n.degree>=9?n.degree:0));
    if(completeness!=="full"&&chord.typeId&&tones.length>3){
      for(const tone of tones){
        if(tone.degree===5&&T.mod(tone.semitones)===7&&!explicit.has(5))required.delete(tone.pc);
        if([9,11].includes(tone.degree)&&tone.degree<maxExtension&&!explicit.has(tone.degree)&&!/[♭♯]/.test(tone.label))required.delete(tone.pc);
      }
      if(chord.typeId==="altered")for(const degree of [5,9]){
        const pcs=tones.filter(n=>n.degree===degree).map(n=>n.pc);
        if(!explicit.has(degree)){pcs.forEach(pc=>required.delete(pc));groups.push(pcs);}
      }
    }
    if(allowRootless&&tones.length>=4&&chord.slashBassPc===undefined)required.delete(chord.rootPc);
    if(chord.slashBassPc!==undefined)required.add(chord.slashBassPc);
    // Notes-mode evidence must survive practical fifth/inner-extension omissions.
    for(const pc of chord.requiredPitchClasses||[])if(allowed.includes(pc))required.add(pc);
    return {allowed,required:[...required],groups,completeness,allowRootless};
  }
  function musicalMatch(frets,chord,tuning,capo,policy){
    const midis=frets.flatMap((f,s)=>f<0?[]:[G.positionMidi(tuning,s,f,capo)]);
    if(midis.some(n=>n===null||!Number.isFinite(n))||midis.length<Math.min(3,policy.required.length))return null;
    const pcs=[...new Set(midis.map(n=>T.mod(n)))];
    if(pcs.some(pc=>!policy.allowed.includes(pc))||policy.required.some(pc=>!pcs.includes(pc))||policy.groups.some(group=>!group.some(pc=>pcs.includes(pc))))return null;
    const bassMidi=Math.min(...midis),bassPc=T.mod(bassMidi);
    if(chord.slashBassPc!==undefined&&bassPc!==chord.slashBassPc)return null;
    return {midis,pcs,bassMidi,bassPc,omitted:policy.allowed.filter(pc=>!pcs.includes(pc))};
  }
  function dropFamily(midis){
    const notes=[...midis].sort((a,b)=>a-b);if(notes.length!==4||new Set(notes.map(n=>T.mod(n))).size!==4)return null;
    const raised=notes[0]+12,closed=[raised,...notes.slice(1)].sort((a,b)=>a-b);
    if(closed[3]-closed[0]>=12)return null;
    const index=closed.indexOf(raised);return index===2?"drop2":index===1?"drop3":null;
  }
  function inspectShape(shape,chord,tuning=G.TUNINGS[0],capo=0,options={}){
    const frets=shape.frets;if(!frets||frets.length!==tuning.notes.length)return null;
    if(frets.some(f=>f>=0&&(f<capo||f>(options.maxFret??24))))return null;
    const policy=options.policy||policyFor(chord,options),music=musicalMatch(frets,chord,tuning,capo,policy);if(!music)return null;
    const hand=fingering(frets,capo,options);if(!hand.playable)return null;
    const played=frets.flatMap((f,s)=>f>=0?[s]:[]),first=played[0],last=played.at(-1),internalMutes=frets.slice(first,last+1).filter(f=>f<0).length;
    if(internalMutes>1&&!options.manual)return null;
    const openStrings=frets.filter(f=>f===capo).length,pressed=frets.filter(f=>f>capo),position=pressed.length?Math.min(...pressed):capo;
    if(!options.manual&&openStrings&&pressed.length&&Math.max(...pressed)>capo+(shape.known?7:5))return null;
    const sourceBarres=shape.barres?.filter(b=>b.fret>capo&&b.fromString>=0&&b.toString<frets.length&&b.fromString<b.toString&&frets[b.fromString]===b.fret&&frets[b.toString]===b.fret&&!frets.slice(b.fromString,b.toString+1).some(f=>f>=0&&f<b.fret));
    const barres=sourceBarres?.length?sourceBarres:shape.fingers?[]:hand.barres;
    const tags=[];if(openStrings)tags.push("open");if(barres.length)tags.push("barre");
    if(music.pcs.length===3&&played.length===3&&music.omitted.length===0)tags.push("triad");
    if(music.pcs.length===2&&music.omitted.length===0)tags.push("power");
    const drop=dropFamily(music.midis);if(drop==="drop2"&&internalMutes===0||drop==="drop3"&&internalMutes===1&&frets[first+1]<0)tags.push(drop);
    const shell=music.pcs.length===3&&music.omitted.length===1&&chord.notes.some(n=>n.degree===7||n.degree===6)&&chord.notes.some(n=>n.degree===3)&&music.omitted.every(pc=>chord.notes.some(n=>n.pc===pc&&n.degree===5&&T.mod(n.semitones)===7));
    if(shell)tags.push("shell");if(!tags.length)tags.push("compact");
    const family=shape.family&&tags.includes(shape.family)?shape.family:shell?"shell":openStrings?"open":tags.includes("drop2")?"drop2":tags.includes("drop3")?"drop3":tags.includes("barre")?"barre":tags[0];
    const effort=hand.effort+internalMutes*3,fullBarre=barres.some(b=>b.toString-b.fromString>=4);
    const difficulty=position>15&&played.length>=4?"advanced":!fullBarre&&hand.span<=2&&effort<=14.5?"easy":hand.span<=3&&effort<=20?"medium":"advanced";
    const bassTone=chord.notes.find(n=>n.pc===music.bassPc),bassName=bassTone?.name||T.noteName(music.bassPc);
    const omittedLabels=music.omitted.map(pc=>chord.notes.find(n=>n.pc===pc)?.label||T.noteName(pc));
    let sourceBonus=shape.provenance==="open-template"||shape.provenance==="barre-template"?-40:shape.known?-18:0;
    let score=effort*1.1+internalMutes*12+position*.65+Math.max(0,position-12)*1.5+music.omitted.length*4+sourceBonus;
    if(music.bassPc!==chord.rootPc)score+=14;
    if(played.length<4&&!shell&&chord.pitchClasses.length>=3)score+=9;
    if(openStrings&&position>capo+5)score+=18+(position-capo-5)*2;
    if(played.length>=4&&!internalMutes)score-=3;
    const sorted=[...music.midis].sort((a,b)=>a-b);
    if(sorted[0]<52&&sorted[1]-sorted[0]<=2)score+=12;
    return {...shape,id:shape.id||"voicing-"+frets.join("_"),symbol:chord.symbol,frets:[...frets],fingers:shape.fingers||null,barres,
      ...music,omittedLabels,position,openStrings,internalMutes,tags,family,familyLabel:FAMILY_NAMES[family],bassName,
      bassLabel:music.bassPc===chord.rootPc?"Kök bas":bassName+" bas",picking:internalMutes?"Parmakla":"Ritim / parmakla",
      ergonomics:hand,difficulty,difficultyLabel:DIFFICULTIES[difficulty],score,complete:music.omitted.length===0};
  }
  function standardOffset(tuning){
    if(tuning.notes.length!==6)return null;const midis=tuning.notes.map(G.midiFromNote),offset=midis[0]-40;
    return midis.every((m,i)=>m!==null&&m-[40,45,50,55,59,64][i]===offset)?offset:null;
  }
  function catalogueShapes(chord,tuning,capo,maxFret){
    const offset=standardOffset(tuning);if(offset===null||!Catalog)return [];
    const shapes=[],shifts=[...new Set([0,12,-12,capo,capo+12,capo-12])];
    for(const shift of shifts)for(let i=0;i<Catalog.records.length;i++){
      const [rootPc,sourceFrets,barres,sourceChord]=Catalog.records[i];if(T.mod(rootPc+offset+shift)!==chord.rootPc)continue;
      const frets=sourceFrets.map(f=>f<0?-1:f+shift);if(frets.some(f=>f>=0&&(f<capo||f>maxFret)))continue;
      // A negative shift must not turn a played position into a muted string.
      if(sourceFrets.some((f,s)=>f>=0&&frets[s]<capo))continue;
      shapes.push({frets,barres:barres.map(([f,fromString,toString])=>({fret:f+shift,fromString,toString})),known:true,provenance:"chords-db",sourceChord});
    }
    return shapes;
  }
  function movableShapes(chord,tuning,capo,maxFret){
    const offset=standardOffset(tuning);if(offset===null)return [];
    const shapes=[];
    for(const template of G.STANDARD_SHAPES){
      const templateRoot=T.parseNote(template.symbol.match(/^[A-G](?:♯|♭)?/)[0]);
      for(let shift=T.mod(chord.rootPc-templateRoot-offset);shift<=24;shift+=12){
        const frets=template.frets.map(f=>f<0?-1:f+shift);if(frets.some(f=>f>=0&&(f<capo||f>maxFret)))continue;
        shapes.push({frets,known:true,provenance:"movable-template",sourceChord:template.symbol,barres:template.barres.map(b=>({...b,fret:b.fret+shift}))});
      }
    }
    return shapes;
  }
  function dropShapes(chord,tuning,capo,maxFret){
    if(chord.pitchClasses.length!==4)return [];
    const pcs=[...chord.pitchClasses].sort((a,b)=>a-b),shapes=[],count=tuning.notes.length;
    for(let inversion=0;inversion<4;inversion++)for(let octave=2;octave<=6;octave++){
      const start=pcs[inversion]+12*octave,closed=pcs.map(pc=>start+T.mod(pc-pcs[inversion])).sort((a,b)=>a-b);
      for(const [family,index] of [["drop2",2],["drop3",1]]){
        const pitches=closed.map((n,i)=>n-(i===index?12:0)).sort((a,b)=>a-b);
        for(let base=0;base<(family==="drop2"?count-3:count-4);base++){
          const strings=family==="drop2"?[base,base+1,base+2,base+3]:[base,base+2,base+3,base+4];
          const frets=Array(count).fill(-1);let valid=true;
          strings.forEach((s,i)=>{const f=pitches[i]-G.midiFromNote(tuning.notes[s]);if(!Number.isInteger(f)||f<capo||f>maxFret)valid=false;frets[s]=f;});
          if(valid)shapes.push({frets,family,known:false,provenance:"drop-construction"});
        }
      }
    }
    return shapes;
  }
  function selectDiverse(pool,limit){
    const sorted=pool.sort((a,b)=>a.score-b.score||a.frets.join(",").localeCompare(b.frets.join(","))),chosen=[],seen=new Set(),buckets=new Map();
    // Keep the best recommendation, then represent different positions/string sets.
    for(const shape of sorted){const bucket=Math.floor(shape.position/4)+":"+shape.family+":"+shape.frets.findIndex(f=>f>=0);if((buckets.get(bucket)||0)>=2)continue;chosen.push(shape);seen.add(shape.id);buckets.set(bucket,(buckets.get(bucket)||0)+1);if(chosen.length>=limit)return chosen;}
    for(const shape of sorted){if(seen.has(shape.id))continue;chosen.push(shape);if(chosen.length>=limit)break;}return chosen;
  }
  function generate(chord,tuning=G.TUNINGS[0],capo=0,options={}){
    const maxFret=Math.max(capo,Math.min(24,options.maxFret??24)),maxResults=Math.max(1,Math.min(240,options.maxResults??96));
    if(!chord?.pitchClasses?.length||tuning.notes.some(n=>G.midiFromNote(n)===null))return [];
    const policy=policyFor(chord,options),pool=new Map(),checked=new Set(),count=tuning.notes.length;
    function add(shape){
      const key=shape.frets.join(",");if(checked.has(key)){
        const previous=pool.get(key);if(shape.family&&previous&&!previous.tags.includes(shape.family))previous.tags.push(shape.family);return;
      }
      checked.add(key);const candidate=inspectShape(shape,chord,tuning,capo,{...options,maxFret,policy});if(candidate)pool.set(key,candidate);
    }
    // Familiar grips such as C7 omit the fifth; the query policy decides whether to accept them.
    if(standardOffset(tuning)===0&&capo===0)G.STANDARD_SHAPES.filter(shape=>shape.symbol===chord.symbol).forEach(shape=>add({...shape,known:true}));
    catalogueShapes(chord,tuning,capo,maxFret).forEach(add);movableShapes(chord,tuning,capo,maxFret).forEach(add);dropShapes(chord,tuning,capo,maxFret).forEach(add);
    if(policy.required.length<=count&&policy.required.length<=6){
      const minimum=Math.max(2,Math.min(3,policy.required.length)),maximum=Math.min(count,6);
      for(let start=Math.max(1,capo+1);start<=maxFret;start++)for(let length=minimum;length<=maximum;length++)for(let first=0;first+length<=count;first++){
        const strings=Array.from({length},(_,i)=>first+i),choices=strings.map(s=>{
          const out=[];if(start<=capo+4&&policy.allowed.includes(T.mod(G.positionMidi(tuning,s,capo,capo))))out.push(capo);
          for(let f=start;f<=Math.min(start+4,maxFret);f++)if(policy.allowed.includes(T.mod(G.positionMidi(tuning,s,f,capo))))out.push(f);return out;
        });
        if(choices.some(list=>!list.length))continue;
        const suffix=Array.from({length:length+1},()=>new Set());
        for(let i=length-1;i>=0;i--){suffix[i]=new Set(suffix[i+1]);choices[i].forEach(f=>suffix[i].add(T.mod(G.positionMidi(tuning,strings[i],f,capo))));}
        if(policy.required.some(pc=>!suffix[0].has(pc)))continue;
        const frets=Array(count).fill(-1);let nodes=0;
        function walk(index,pcs,min,max){
          if(++nodes>6000||max-min>4)return;
          if(policy.required.some(pc=>!pcs.has(pc)&&!suffix[index].has(pc)))return;
          if(index===length){add({frets:[...frets],known:false,provenance:"constrained-search"});return;}
          const s=strings[index];for(const f of choices[index]){frets[s]=f;const next=new Set(pcs);next.add(T.mod(G.positionMidi(tuning,s,f,capo)));walk(index+1,next,f>capo?Math.min(min,f):min,f>capo?Math.max(max,f):max);}frets[s]=-1;
        }
        walk(0,new Set(),Infinity,-Infinity);
      }
    }
    // Shell grips: root under guide tones, with at most one skipped string.
    if(chord.notes.some(n=>n.degree===7||n.degree===6)&&chord.pitchClasses.length===4&&options.completeness!=="full"){
      for(let bass=0;bass<count-2;bass++)for(let top=bass+2;top<count-1;top++){
        if(top-bass>3)continue;const strings=[bass,top,top+1];
        for(let base=capo;base<=maxFret;base++){
          const lists=strings.map(s=>Array.from({length:Math.min(5,maxFret-base+1)},(_,i)=>base+i).filter(f=>policy.allowed.includes(T.mod(G.positionMidi(tuning,s,f,capo)))));
          for(const a of lists[0])for(const b of lists[1])for(const c of lists[2]){const frets=Array(count).fill(-1);[a,b,c].forEach((f,i)=>frets[strings[i]]=f);add({frets,family:"shell",known:false,provenance:"guide-tone-shell"});}
        }
      }
    }
    let candidates=[...pool.values()];
    if(options.family&&options.family!=="all")candidates=candidates.filter(s=>s.tags.includes(options.family));
    if(options.bass==="root")candidates=candidates.filter(s=>s.bassPc===chord.rootPc);else if(options.bass==="inversion")candidates=candidates.filter(s=>s.bassPc!==chord.rootPc);
    if(options.difficulty&&options.difficulty!=="all")candidates=candidates.filter(s=>s.difficulty===options.difficulty);
    if(options.minFret!=null)candidates=candidates.filter(s=>s.frets.every(f=>f<0||f>=options.minFret));
    if(options.returnPool)return candidates.map((shape,index)=>Object.freeze({...shape,rank:index+1}));
    return selectDiverse(candidates,maxResults).map((shape,index)=>Object.freeze({...shape,rank:index+1}));
  }
  const API=Object.freeze({generate,fingering,policyFor,inspectShape,dropFamily,FAMILY_NAMES,DIFFICULTIES});root.MBS2Voicings=API;
  if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
