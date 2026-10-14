/* Register-aware guitar voice leading. Every sounding string keeps its identity. */
(function(root){
  'use strict';
  const T=root.MBS2Theory||(typeof require!=='undefined'?require('./theory.js'):null);
  const G=root.MBS2Guitar||(typeof require!=='undefined'?require('./guitar.js'):null);
  const V=root.MBS2Voicings||(typeof require!=='undefined'?require('./voicing-engine.js'):null);
  const COLORS={root:'#d9f87b',guide:'#d4bfff',foundation:'#8bbce3',extension:'#ffbf87',tension:'#ff9aab',outside:'#8a899e',common:'#7ce8c8'};
  const signature=shape=>shape.frets.join(',');
  const poolCache=new Map(),edgeCache=new Map();let nextNodeId=1;
  function roleFor(pc,chord,contextPcs=[]){
    const note=chord?.notes?.find(n=>n.pc===T.mod(pc));
    if(!note){const interval=T.mod(pc-(chord?.rootPc??0)),colors={1:'♭9',2:'9',3:'♯9',5:'11',6:'♯11',8:'♭13',9:'13'};if(contextPcs.includes(T.mod(pc))&&colors[interval])return {kind:'tension',label:colors[interval],degree:null,color:COLORS.tension,note:T.noteName(pc),contextual:true};return {kind:'outside',label:'—',degree:null,color:COLORS.outside,note:T.noteName(pc)};}
    const kind=note.degree===1?'root':note.degree===3||note.degree===7?'guide':note.degree===5&&T.mod(note.semitones)===7?'foundation':'extension';
    return {kind,label:note.label||String(note.degree),degree:note.degree,color:COLORS[kind],note:note.name,semitones:note.semitones};
  }
  function eventsFor(shape,chord,tuning,capo=0){
    return shape.frets.flatMap((fret,stringIndex)=>{
      if(fret<0)return [];const midi=G.positionMidi(tuning,stringIndex,fret,capo);
      return Number.isFinite(midi)?[{stringIndex,fret,midi,pc:T.mod(midi),role:roleFor(midi,chord)}]:[];
    }).sort((a,b)=>a.midi-b.midi||a.stringIndex-b.stringIndex);
  }
  function pairCost(a,b){return 100*Math.abs(b.midi-a.midi)+50*Math.max(0,Math.abs(b.midi-a.midi)-5)+15*Math.abs(b.stringIndex-a.stringIndex)+10*Math.abs(b.fret-a.fret);}
  function alignInner(a,b){
    const memo=new Map(),needed=Math.min(a.length,b.length);
    function visit(i,j,k){
      if(k===0)return {cost:0,matches:[],exits:a.slice(i),enters:b.slice(j)};
      if(a.length-i<k||b.length-j<k)return null;
      const key=[i,j,k].join(':');if(memo.has(key))return memo.get(key);
      const choices=[];
      if(i<a.length&&j<b.length){const tail=visit(i+1,j+1,k-1);if(tail)choices.push({...tail,cost:tail.cost+pairCost(a[i],b[j]),matches:[[a[i],b[j]],...tail.matches]});}
      if(a.length-i>k){const tail=visit(i+1,j,k);if(tail)choices.push({...tail,exits:[a[i],...tail.exits]});}
      if(b.length-j>k){const tail=visit(i,j+1,k);if(tail)choices.push({...tail,enters:[b[j],...tail.enters]});}
      choices.sort((x,y)=>x.cost-y.cost);const best=choices[0]||null;memo.set(key,best);return best;
    }
    return visit(0,0,needed);
  }
  function matchVoices(source,target){
    let result;
    if(source.length>=2&&target.length>=2){
      const inner=alignInner(source.slice(1,-1),target.slice(1,-1));
      const ends=[[source[0],target[0]],[source.at(-1),target.at(-1)]];
      result={...inner,cost:inner.cost+ends.reduce((n,[a,b])=>n+pairCost(a,b),0),matches:[ends[0],...inner.matches,ends[1]]};
    }else result=alignInner(source,target);
    const pairs=result.matches.map(([from,to])=>({from,to,delta:to.midi-from.midi,common:from.midi===to.midi,physicalHold:from.midi===to.midi&&from.stringIndex===to.stringIndex&&from.fret===to.fret}));
    return {...result,pairs,totalSemitones:pairs.reduce((n,p)=>n+Math.abs(p.delta),0),largestLeap:Math.max(0,...pairs.map(p=>Math.abs(p.delta))),commonCount:pairs.filter(p=>p.common).length,physicalHoldCount:pairs.filter(p=>p.physicalHold).length};
  }
  function transition(a,b,{profile='flow',melody='free'}={}){
    const cacheKey=a.cacheId&&b.cacheId?a.cacheId+':'+b.cacheId+':'+profile+':'+melody:null;if(cacheKey&&edgeCache.has(cacheKey))return edgeCache.get(cacheKey);
    const delta=b.events.at(-1).midi-a.events.at(-1).midi;
    if(melody==='hold'&&delta!==0||melody==='up'&&delta<=0||melody==='down'&&delta>=0)return null;
    const voices=matchVoices(a.events,b.events),shift=Math.abs(a.shape.position-b.shape.position);
    const changedStrings=a.shape.frets.reduce((n,f,s)=>n+(Boolean(f>=0)!==Boolean(b.shape.frets[s]>=0)?1:0),0);
    const handWeight=profile==='anchor'?180:45;
    const cost=voices.cost+600*(voices.enters.length+voices.exits.length)+handWeight*shift+25*changedStrings+10*(b.shape.ergonomics?.effort||0);
    const result={...voices,cost,positionShift:shift,topDelta:delta,from:a,to:b};if(cacheKey){if(edgeCache.size>24000)edgeCache.clear();edgeCache.set(cacheKey,result);}return result;
  }
  function validateGrip(shape,chord,tuning,capo=0,options={}){
    const frets=shape?.frets,min=options.minFret??capo,max=options.maxFret??24;
    if(!Array.isArray(frets)||frets.length!==tuning.notes.length||frets.some(f=>!Number.isInteger(f)||f< -1||f>24))return {valid:false,reason:'frets'};
    if(frets.some(f=>f>=0&&(f<Math.max(capo,min)||f>max)))return {valid:false,reason:'region'};
    const events=eventsFor(shape,chord,tuning,capo),pcs=[...new Set(events.map(e=>e.pc))],policy=V.policyFor(chord,{completeness:options.completeness||'full'});
    const outside=pcs.filter(pc=>!policy.allowed.includes(pc)),missing=policy.required.filter(pc=>!pcs.includes(pc));
    if(outside.length)return {valid:false,reason:'outside',outside,missing,events};
    if(missing.length||policy.groups.some(group=>!group.some(pc=>pcs.includes(pc))))return {valid:false,reason:'missing',missing,events};
    if(events.length<Math.min(3,policy.required.length))return {valid:false,reason:'voices',events};
    if(chord.slashBassPc!==undefined&&events[0]?.pc!==chord.slashBassPc)return {valid:false,reason:'bass',events};
    const hand=V.fingering(frets,capo,options);if(!hand.playable)return {valid:false,reason:hand.reason,events};
    const inspected=V.inspectShape({...shape,known:false,manual:true},chord,tuning,capo,{...options,manual:true});
    return inspected?{valid:true,shape:inspected,events,warnings:[...(inspected.internalMutes>1?['fingerpicking']:[]),...(inspected.openStrings&&inspected.position>capo+5?['open-high']:[])]}:{valid:false,reason:'ergonomics',events};
  }
  function candidates(chord,tuning,capo,options={}){
    const minFret=options.minFret??capo,maxFret=options.maxFret??12;
    const keyShape=options.startShape;
    if(keyShape){const inspected=keyShape.manual?validateGrip(keyShape,chord,tuning,capo,options).shape:V.inspectShape(keyShape,chord,tuning,capo,{maxFret,completeness:options.completeness||'full'});if(!inspected||inspected.frets.some(f=>f>=0&&(f<minFret||f>maxFret)))return [];const events=eventsFor(inspected,chord,tuning,capo);if(options.melodyMidi!=null&&events.at(-1).midi!==Number(options.melodyMidi))return [];return [{shape:inspected,chord,events,signature:signature(inspected)}];}
    const cacheKey=JSON.stringify([chord,tuning.notes,capo,minFret,maxFret,options.completeness,options.melodyMidi]);if(poolCache.has(cacheKey))return poolCache.get(cacheKey);
    const generated=V.generate(chord,tuning,capo,{returnPool:true,minFret,maxFret,completeness:options.completeness||'full',allowRootless:false});
    const seen=new Set();const list=[];
    for(const shape of generated){
      const id=signature(shape);if(seen.has(id))continue;seen.add(id);
      const played=shape.frets.filter(f=>f>=0);if(played.some(f=>f<minFret||f>maxFret))continue;
      const events=eventsFor(shape,chord,tuning,capo);if(!events.length||events.some(e=>e.midi<12||e.midi>108))continue;
      if(options.melodyMidi!=null&&events.at(-1).midi!==Number(options.melodyMidi))continue;
      list.push({shape,chord,events,signature:id,cacheId:nextNodeId++});
    }
    // Template priority is irrelevant to movement. Keep several registers/string sets.
    list.sort((a,b)=>(a.shape.ergonomics?.effort||0)-(b.shape.ergonomics?.effort||0)||a.shape.position-b.shape.position||a.signature.localeCompare(b.signature));
    const buckets=new Map();for(const c of list){const key=Math.floor(c.shape.position/3)+':'+c.events.length;const bucket=buckets.get(key)||[];bucket.push(c);buckets.set(key,bucket);}
    const diverse=[],keep=new Set();
    // Preserve every available top pitch before bounded ergonomic sampling.
    for(const c of list){const top=c.events.at(-1).midi,key=top+':'+c.events.length;if(!keep.has(key)){keep.add(key);diverse.push(c);}}
    for(let round=0;round<30&&diverse.length<120;round++)for(const bucket of buckets.values())if(bucket[round]&&!diverse.includes(bucket[round])&&diverse.length<120)diverse.push(bucket[round]);
    if(poolCache.size>24)poolCache.clear();poolCache.set(cacheKey,diverse);return diverse;
  }
  function routes(chords,tuning=G.TUNINGS[0],capo=0,options={}){
    if(!Array.isArray(chords)||chords.length<2||chords.length>8)return {routes:[],reason:'chord-count'};
    const pools=chords.map((chord,index)=>candidates(chord,tuning,capo,{...options,startShape:index===0?options.startShape:null,melodyMidi:options.melodyMidis?.[index]??null}));
    const missing=pools.findIndex(pool=>!pool.length);if(missing>=0)return {routes:[],reason:'no-voicing',chordIndex:missing,poolSizes:pools.map(p=>p.length)};
    const requested=Math.max(1,Math.min(24,Number(options.limit)||12)),width=Math.max(5,requested);
    let layer=pools[0].map(c=>[{nodes:[c],edges:[],cost:10*(c.shape.ergonomics?.effort||0),key:c.signature}]);
    for(let step=1;step<pools.length;step++){
      const next=pools[step].map(()=>[]);
      for(let j=0;j<pools[step].length;j++){
        for(let i=0;i<pools[step-1].length;i++){
          if(!layer[i]?.length)continue;
          const edge=transition(pools[step-1][i],pools[step][j],options);if(!edge)continue;
          for(const prefix of layer[i])next[j].push({prefix,edge,candidate:pools[step][j],cost:prefix.cost+edge.cost,key:prefix.key+'|'+pools[step][j].signature});
        }
        next[j].sort((a,b)=>a.cost-b.cost||a.key.localeCompare(b.key));next[j]=next[j].slice(0,width).map(p=>({nodes:[...p.prefix.nodes,p.candidate],edges:[...p.prefix.edges,p.edge],cost:p.cost,key:p.key}));
      }
      layer=next;
    }
    const ranked=layer.flat().sort((a,b)=>a.cost-b.cost||a.key.localeCompare(b.key));
    const chosen=[];for(const route of ranked){
      if(chosen.some(r=>r.key===route.key))continue;
      // Prefer alternatives that change more than one grip when possible.
      if(chosen.length&&chosen.length<2&&chosen.every(r=>route.nodes.filter((n,i)=>n.signature!==r.nodes[i].signature).length<Math.min(2,chords.length))&&ranked.length>20)continue;
      chosen.push(route);if(chosen.length===requested)break;
    }
    if(chosen.length<requested)for(const r of ranked)if(!chosen.some(c=>c.key===r.key)){chosen.push(r);if(chosen.length===requested)break;}
    return {routes:chosen.map((route,index)=>({...route,id:'route-'+index,totalSemitones:route.edges.reduce((n,e)=>n+e.totalSemitones,0),commonCount:route.edges.reduce((n,e)=>n+e.commonCount,0),physicalHoldCount:route.edges.reduce((n,e)=>n+e.physicalHoldCount,0),largestLeap:Math.max(...route.edges.map(e=>e.largestLeap)),positionSpan:[Math.min(...route.nodes.map(n=>n.shape.position)),Math.max(...route.nodes.map(n=>n.shape.position))],approximation:route.nodes.some(n=>n.shape.omittedLabels?.length)})),boundedSearch:true,reason:chosen.length?null:'melody-constraint',poolSizes:pools.map(p=>p.length)};
  }
  const API=Object.freeze({COLORS,roleFor,eventsFor,matchVoices,transition,validateGrip,candidates,routes});root.GBMotionEngine=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
