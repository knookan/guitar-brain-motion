/* Guitar-specific tuning, position and fingering helpers. */
(function(root){
  "use strict";
  const T=root.MBS2Theory||(typeof require!=="undefined"?require("./theory.js"):null);
  const TUNINGS=Object.freeze([
    {id:"standard",name:"Standart · E A D G B E",notes:["E2","A2","D3","G3","B3","E4"]},
    {id:"dropD",name:"Drop D · D A D G B E",notes:["D2","A2","D3","G3","B3","E4"]},
    {id:"dadgad",name:"DADGAD",notes:["D2","A2","D3","G3","A3","D4"]},
    {id:"openG",name:"Open G · D G D G B D",notes:["D2","G2","D3","G3","B3","D4"]},
    {id:"openD",name:"Open D · D A D F♯ A D",notes:["D2","A2","D3","F♯3","A3","D4"]},
    {id:"ukuleleHighG",name:"Ukulele · High G · G4 C4 E4 A4",notes:["G4","C4","E4","A4"]},
    {id:"ukuleleLowG",name:"Ukulele · Low G · G3 C4 E4 A4",notes:["G3","C4","E4","A4"]},
    {id:"ukuleleBaritone",name:"Baritone ukulele · D3 G3 B3 E4",notes:["D3","G3","B3","E4"]},
    {id:"ukuleleD",name:"Ukulele · D tuning · A4 D4 F♯4 B4",notes:["A4","D4","F♯4","B4"]},
    {id:"bass4",name:"Bass · E1 A1 D2 G2",notes:["E1","A1","D2","G2"]},
    {id:"bass5",name:"5-string bass · B0 E1 A1 D2 G2",notes:["B0","E1","A1","D2","G2"]},
    {id:"mandolin",name:"Mandolin · G3 D4 A4 E5",notes:["G3","D4","A4","E5"]},
    {id:"guitar7",name:"7-string guitar · B1 E2 A2 D3 G3 B3 E4",notes:["B1","E2","A2","D3","G3","B3","E4"]}
  ]);
  function midiFromNote(text){
    const m=String(text).trim().replace(/♯/g,"#").replace(/♭/g,"b").match(/^([A-Ga-g](?:#{1,2}|b{1,2})?)(-?\d+)$/);
    if(!m) return null; const pc=T.parseNote(m[1]); if(pc===null)return null;const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1][0].toUpperCase()],accidental=[...m[1].slice(1)].reduce((n,c)=>n+(c==='#'?1:c==='b'?-1:0),0);return (Number(m[2])+1)*12+natural+accidental;
  }
  const STANDARD_SHAPES=Object.freeze([
    {id:"C-open",symbol:"C",frets:[-1,3,2,0,1,0],fingers:[0,3,2,0,1,0],provenance:"open-template"},
    {id:"D-open",symbol:"D",frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2],provenance:"open-template"},
    {id:"E-open",symbol:"E",frets:[0,2,2,1,0,0],fingers:[0,2,3,1,0,0],provenance:"open-template"},
    {id:"G-open",symbol:"G",frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3],provenance:"open-template"},
    {id:"A-open",symbol:"A",frets:[-1,0,2,2,2,0],fingers:[0,0,1,2,3,0],provenance:"open-template"},
    {id:"Am-open",symbol:"Am",frets:[-1,0,2,2,1,0],fingers:[0,0,2,3,1,0],provenance:"open-template"},
    {id:"Em-open",symbol:"Em",frets:[0,2,2,0,0,0],fingers:[0,2,3,0,0,0],provenance:"open-template"},
    {id:"Dm-open",symbol:"Dm",frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1],provenance:"open-template"},
    {id:"F-barre",symbol:"F",frets:[1,3,3,2,1,1],fingers:[1,3,4,2,1,1],barres:[{finger:1,fret:1,fromString:0,toString:5}],provenance:"barre-template"},
    {id:"Bm-barre",symbol:"Bm",frets:[-1,2,4,4,3,2],fingers:[0,1,3,4,2,1],barres:[{finger:1,fret:2,fromString:1,toString:5}],provenance:"barre-template"},
    {id:"A7-open",symbol:"A7",frets:[-1,0,2,0,2,0],fingers:[0,0,2,0,3,0],provenance:"open-template"},
    {id:"E7-open",symbol:"E7",frets:[0,2,0,1,0,0],fingers:[0,2,0,1,0,0],provenance:"open-template"},
    {id:"Am7-open",symbol:"Am7",frets:[-1,0,2,0,1,0],fingers:[0,0,2,0,1,0],provenance:"open-template"},
    {id:"D7-open",symbol:"D7",frets:[-1,-1,0,2,1,2],fingers:[0,0,0,2,1,3],provenance:"open-template"},
    {id:"Cmaj7-open",symbol:"Cmaj7",frets:[-1,3,2,0,0,0],fingers:[0,3,2,0,0,0],provenance:"open-template"},
    {id:"C7-open",symbol:"C7",frets:[-1,3,2,3,1,0],fingers:[0,3,2,4,1,0],provenance:"open-template"},
    {id:"G7-open",symbol:"G7",frets:[3,2,0,0,0,1],fingers:[3,2,0,0,0,1],provenance:"open-template"},
    {id:"B7-open",symbol:"B7",frets:[-1,2,1,2,0,2],fingers:[0,2,1,3,0,4],provenance:"open-template"},
    {id:"Dm7-open",symbol:"Dm7",frets:[-1,-1,0,2,1,1],fingers:[0,0,0,2,1,1],barres:[{finger:1,fret:1,fromString:4,toString:5}],provenance:"open-template"},
    {id:"Em7-open",symbol:"Em7",frets:[0,2,0,0,0,0],fingers:[0,2,0,0,0,0],provenance:"open-template"},
    {id:"Gmaj7-open",symbol:"Gmaj7",frets:[3,2,0,0,0,2],fingers:[2,1,0,0,0,3],provenance:"open-template"},
    {id:"Dmaj7-open",symbol:"Dmaj7",frets:[-1,-1,0,2,2,2],fingers:[0,0,0,1,1,1],barres:[{finger:1,fret:2,fromString:3,toString:5}],provenance:"open-template"},
    {id:"Amaj7-open",symbol:"Amaj7",frets:[-1,0,2,1,2,0],fingers:[0,0,2,1,3,0],provenance:"open-template"},
    {id:"Emaj7-open",symbol:"Emaj7",frets:[0,2,1,1,0,0],fingers:[0,3,1,2,0,0],provenance:"open-template"},
    {id:"Fmaj7-open",symbol:"Fmaj7",frets:[-1,-1,3,2,1,0],fingers:[0,0,3,2,1,0],provenance:"open-template"},
    {id:"C6-open",symbol:"C6",frets:[-1,3,2,2,1,3],fingers:[0,3,2,2,1,4],barres:[{finger:2,fret:2,fromString:2,toString:3}],provenance:"open-template"},
    {id:"Asus2-open",symbol:"Asus2",frets:[-1,0,2,2,0,0],fingers:[0,0,1,2,0,0],provenance:"open-template"},
    {id:"Dsus2-open",symbol:"Dsus2",frets:[-1,-1,0,2,3,0],fingers:[0,0,0,1,3,0],provenance:"open-template"},
    {id:"Esus4-open",symbol:"Esus4",frets:[0,2,2,2,0,0],fingers:[0,1,2,3,0,0],provenance:"open-template"},
    {id:"Asus4-open",symbol:"Asus4",frets:[-1,0,2,2,3,0],fingers:[0,0,1,2,3,0],provenance:"open-template"},
    {id:"Dsus4-open",symbol:"Dsus4",frets:[-1,-1,0,2,3,3],fingers:[0,0,0,1,3,4],provenance:"open-template"},
    {id:"E5-open",symbol:"E5",frets:[0,2,2,-1,-1,-1],fingers:[0,1,2,0,0,0],provenance:"open-template"},
    {id:"A5-open",symbol:"A5",frets:[-1,0,2,2,-1,-1],fingers:[0,0,1,2,0,0],provenance:"open-template"}
  ].map(s=>Object.freeze({...s,frets:Object.freeze([...s.frets]),fingers:Object.freeze([...s.fingers]),barres:Object.freeze([...(s.barres||[])])})));
  function shapePitchClasses(shape,tuning=TUNINGS[0],capo=0){
    if(shape.frets.length!==tuning.notes.length||shape.frets.some(f=>f>=0&&f<capo))return null;
    const pitches=shape.frets.map((f,i)=>f<0?null:positionMidi(tuning,i,f,capo));
    if(pitches.some((p,i)=>shape.frets[i]>=0&&!Number.isFinite(p)))return null;
    return pitches.filter(Number.isFinite).map(n=>T.mod(n));
  }
  function shapeIsChord(shape,chord,tuning=TUNINGS[0],capo=0){
    const pcs=shapePitchClasses(shape,tuning,capo); if(!pcs)return false;
    const actual=[...new Set(pcs)].sort((a,b)=>a-b),expected=[...chord.pitchClasses].sort((a,b)=>a-b);
    return expected.every(pc=>actual.includes(pc))&&actual.every(pc=>expected.includes(pc));
  }
  function getKnownShapes(chord,tuning=TUNINGS[0],capo=0){
    if(tuning.id!=="standard"||capo!==0)return [];
    return STANDARD_SHAPES.filter(shape=>shape.symbol===chord.symbol&&!shape.frets.some(f=>f>24)&&shapeIsChord(shape,chord,tuning,capo));
  }
  function generateVoicings(chord,tuning=TUNINGS[0],capo=0,options={}){
    const engine=root.MBS2Voicings||(typeof require!=="undefined"?require("./voicing-engine.js"):null);
    if(!engine)throw new Error("Gitar tutuş motoru yüklenemedi.");
    return engine.generate(chord,tuning,capo,options);
  }
  function positionMidi(tuning,stringIndex,physicalFret,capo=0){
    const open=midiFromNote(tuning.notes[stringIndex]); if(open===null||physicalFret<capo)return null;
    return open+Math.max(physicalFret,capo);
  }
  function noteOnPosition(tuning,stringIndex,physicalFret,capo=0){const midi=positionMidi(tuning,stringIndex,physicalFret,capo);return midi===null?null:{midi,pitchClass:T.mod(midi),name:T.noteName(midi),stringIndex,fret:physicalFret};}
  const API={TUNINGS,STANDARD_SHAPES,midiFromNote,shapePitchClasses,shapeIsChord,getKnownShapes,generateVoicings,positionMidi,noteOnPosition};
  root.MBS2Guitar=Object.freeze(API); if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
