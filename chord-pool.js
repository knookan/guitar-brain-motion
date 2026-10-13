/* Pitch membership analysis; a matching collection is not a proven key. */
(function(root){
  'use strict';
  const T=root.MBS2Theory||(typeof require!=='undefined'?require('./theory.js'):null);
  function normalize(items){
    return (Array.isArray(items)?items:[]).slice(0,24).map(item=>({symbol:String(item.symbol||'').slice(0,120),pitchClasses:[...new Set((item.pitchClasses||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<12))].sort((a,b)=>a-b)})).filter(item=>item.pitchClasses.length);
  }
  function analyze(items,{tonic=null,preference='sharp',includeChromatic=false}={}){
    const chords=normalize(items),union=[...new Set(chords.flatMap(c=>c.pitchClasses))].sort((a,b)=>a-b);
    const hint=tonic===null?null:T.parseNote(tonic);
    const matches=pcs=>T.findScales(pcs,preference).filter(s=>(includeChromatic||s.total<12)&&(hint===null||s.rootPc===hint)).sort((a,b)=>a.extra-b.extra||Number(!!T.SCALES.find(s=>s.id===a.scaleId)?.makam)-Number(!!T.SCALES.find(s=>s.id===b.scaleId)?.makam)||a.rootPc-b.rootPc||a.scaleName.localeCompare(b.scaleName));
    const results=matches(union),shared=union.filter(pc=>chords.every(c=>c.pitchClasses.includes(pc)));
    return {chords,union,shared,results,perChord:chords.map(chord=>({chord,results:matches(chord.pitchClasses)})),hasCommon:results.length>0};
  }
  const API=Object.freeze({normalize,analyze});root.MBS2ChordPool=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
