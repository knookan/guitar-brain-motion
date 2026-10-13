/* Deterministic, UI-independent pitch and harmony model. */
(function (root) {
  "use strict";
  const NATURAL = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 });
  const LETTERS = Object.freeze(["C", "D", "E", "F", "G", "A", "B"]);
  const SHARP_NAMES = Object.freeze(["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]);
  const FLAT_NAMES = Object.freeze(["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"]);
  const DEGREE_LABELS = Object.freeze({1:"1",2:"2",3:"3",4:"4",5:"5",6:"6",7:"7",9:"9",11:"11",13:"13"});
  function mod(n, m = 12) { return ((Number(n) % m) + m) % m; }
  function parseNote(value) {
    if (typeof value === "number" && Number.isFinite(value)) return mod(Math.round(value));
    if (typeof value !== "string") return null;
    const match = value.trim().replace(/♯/g,"#").replace(/♭/g,"b").replace(/𝄪/g,"##").replace(/𝄫/g,"bb").match(/^([A-Ga-g])((?:#{1,2}|b{1,2})*)(?:-?\d+)?$/);
    if (!match) return null;
    let acc = 0;
    for (const char of match[2]) acc += char === "#" ? 1 : char === "b" ? -1 : 0;
    return mod(NATURAL[match[1].toUpperCase()] + acc);
  }
  function parseSpelling(value) {
    if (typeof value !== "string") return null;
    const match = value.trim().replace(/♯/g,"#").replace(/♭/g,"b").replace(/𝄪/g,"##").replace(/𝄫/g,"bb").match(/^([A-Ga-g])((?:#{1,2}|b{1,2})*)(?:-?\d+)?$/);
    if (!match) return null;
    const letter = match[1].toUpperCase();
    const accidental = [...match[2]].reduce((sum,ch)=>sum+(ch==="#"?1:ch==="b"?-1:0),0);
    return { letter, accidental, pitchClass: mod(NATURAL[letter]+accidental) };
  }
  function noteName(pc, preference = "sharp") { const n = parseNote(pc); return n === null ? "?" : (preference === "flat" ? FLAT_NAMES : SHARP_NAMES)[n]; }
  function spelling(rootText, degree, targetPc) {
    const root = parseSpelling(rootText) || parseSpelling(noteName(targetPc));
    const step = (Number(degree)-1)%7;
    const rootIndex = LETTERS.indexOf(root.letter);
    const letter = LETTERS[(rootIndex+step)%7];
    const naturalTarget = NATURAL[letter];
    let alteration = mod(targetPc-naturalTarget+6,12)-6;
    if (alteration === -6) alteration = 6;
    if (alteration > 2) alteration -= 12;
    if (alteration < -2) alteration += 12;
    return letter + (alteration > 0 ? "♯".repeat(alteration) : "♭".repeat(-alteration));
  }
  function interval(label, degree, semitones) { return Object.freeze({ label, degree, semitones }); }
  const I = {
    R: interval("1",1,0), M2: interval("2",2,2), b2: interval("♭2",2,1), m3: interval("♭3",3,3), M3: interval("3",3,4), P4: interval("4",4,5), sharp4: interval("♯4",4,6), b5: interval("♭5",5,6), P5: interval("5",5,7), sharp5: interval("♯5",5,8), m6: interval("♭6",6,8), M6: interval("6",6,9), b7: interval("♭7",7,10), M7: interval("7",7,11), b9: interval("♭9",9,1), N9: interval("9",9,2), sharp9: interval("♯9",9,3), sharp11: interval("♯11",11,6), P11: interval("11",11,5), b13: interval("♭13",13,8), M13: interval("13",13,9), bb7: interval("♭♭7",7,9)
  };
  const CHORD_TYPES = Object.freeze([
    {id:"major",name:"Majör",symbol:"",family:"Üçlü",intervals:[I.R,I.M3,I.P5]},
    {id:"minor",name:"Minör",symbol:"m",family:"Üçlü",intervals:[I.R,I.m3,I.P5]},
    {id:"diminished",name:"Eksik",symbol:"dim",family:"Üçlü",intervals:[I.R,I.m3,I.b5]},
    {id:"augmented",name:"Artmış",symbol:"aug",family:"Üçlü",intervals:[I.R,I.M3,I.sharp5]},
    {id:"sus2",name:"Sus2",symbol:"sus2",family:"Üçlü",intervals:[I.R,I.M2,I.P5]},
    {id:"sus4",name:"Sus4",symbol:"sus4",family:"Üçlü",intervals:[I.R,I.P4,I.P5]},
    {id:"power",name:"Beşli",symbol:"5",family:"Üçlü",intervals:[I.R,I.P5]},
    {id:"major6",name:"Majör 6",symbol:"6",family:"Altılı",intervals:[I.R,I.M3,I.P5,I.M6]},
    {id:"minor6",name:"Minör 6",symbol:"m6",family:"Altılı",intervals:[I.R,I.m3,I.P5,I.M6]},
    {id:"dominant7",name:"Dominant 7",symbol:"7",family:"Yedili",intervals:[I.R,I.M3,I.P5,I.b7]},
    {id:"major7",name:"Majör 7",symbol:"maj7",family:"Yedili",intervals:[I.R,I.M3,I.P5,I.M7]},
    {id:"minor7",name:"Minör 7",symbol:"m7",family:"Yedili",intervals:[I.R,I.m3,I.P5,I.b7]},
    {id:"minorMajor7",name:"Minör maj7",symbol:"m(maj7)",family:"Yedili",intervals:[I.R,I.m3,I.P5,I.M7]},
    {id:"halfDim7",name:"Yarı eksik 7",symbol:"m7♭5",family:"Yedili",intervals:[I.R,I.m3,I.b5,I.b7]},
    {id:"dim7",name:"Eksik 7",symbol:"dim7",family:"Yedili",intervals:[I.R,I.m3,I.b5,I.bb7]},
    {id:"major9",name:"Majör 9",symbol:"maj9",family:"9 / 11 / 13",intervals:[I.R,I.M3,I.P5,I.M7,I.N9]},
    {id:"dominant9",name:"Dominant 9",symbol:"9",family:"9 / 11 / 13",intervals:[I.R,I.M3,I.P5,I.b7,I.N9]},
    {id:"minor9",name:"Minör 9",symbol:"m9",family:"9 / 11 / 13",intervals:[I.R,I.m3,I.P5,I.b7,I.N9]},
    {id:"dominant11",name:"Dominant 11",symbol:"11",family:"9 / 11 / 13",intervals:[I.R,I.M3,I.P5,I.b7,I.N9,I.P11]},
    {id:"minor11",name:"Minör 11",symbol:"m11",family:"9 / 11 / 13",intervals:[I.R,I.m3,I.P5,I.b7,I.N9,I.P11]},
    {id:"dominant13",name:"Dominant 13",symbol:"13",family:"9 / 11 / 13",intervals:[I.R,I.M3,I.P5,I.b7,I.N9,I.P11,I.M13]},
    {id:"major13",name:"Majör 13",symbol:"maj13",family:"9 / 11 / 13",intervals:[I.R,I.M3,I.P5,I.M7,I.N9,I.P11,I.M13]},
    {id:"dominantB9",name:"7♭9",symbol:"7♭9",family:"Altered",intervals:[I.R,I.M3,I.P5,I.b7,I.b9]},
    {id:"dominantSharp9",name:"7♯9",symbol:"7♯9",family:"Altered",intervals:[I.R,I.M3,I.P5,I.b7,I.sharp9]},
    {id:"dominantSharp11",name:"7♯11",symbol:"7♯11",family:"Altered",intervals:[I.R,I.M3,I.P5,I.b7,I.sharp11]},
    {id:"dominantB13",name:"7♭13",symbol:"7♭13",family:"Altered",intervals:[I.R,I.M3,I.P5,I.b7,I.b13]},
    {id:"altered",name:"Altered",symbol:"7alt",family:"Altered",intervals:[I.R,I.M3,I.b7,I.b9,I.sharp9,I.b5,I.sharp5]}
  ].map(c=>Object.freeze({...c,intervals:Object.freeze([...c.intervals])})));
  const MODIFIERS = Object.freeze([
    {id:"add9",label:"add9",interval:I.N9,kind:"add"},{id:"6",label:"6",interval:I.M6,kind:"add"},
    {id:"addb9",label:"add♭9",interval:I.b9,kind:"add"},{id:"addsharp9",label:"add♯9",interval:I.sharp9,kind:"add"},
    {id:"add11",label:"add11",interval:I.P11,kind:"add"},{id:"addsharp11",label:"add♯11",interval:I.sharp11,kind:"add"},
    {id:"addb13",label:"add♭13",interval:I.b13,kind:"add"},{id:"add13",label:"add13",interval:I.M13,kind:"add"},
    {id:"b5",label:"♭5",interval:I.b5,kind:"alter",degree:5},{id:"sharp5",label:"♯5",interval:I.sharp5,kind:"alter",degree:5},
    {id:"b9",label:"♭9",interval:I.b9,kind:"alter",degree:9},{id:"sharp9",label:"♯9",interval:I.sharp9,kind:"alter",degree:9},
    {id:"sharp11",label:"♯11",interval:I.sharp11,kind:"alter",degree:11},{id:"b13",label:"♭13",interval:I.b13,kind:"alter",degree:13}
  ]);
  const CORE_SCALES = Object.freeze([
    {id:"major",name:"Majör / İyonya",family:"Majör modlar",intervals:[0,2,4,5,7,9,11],steps:[0,1,2,3,4,5,6]},
    {id:"dorian",name:"Doryen",family:"Majör modlar",intervals:[0,2,3,5,7,9,10],steps:[0,1,2,3,4,5,6]},
    {id:"phrygian",name:"Frigyen",family:"Majör modlar",intervals:[0,1,3,5,7,8,10],steps:[0,1,2,3,4,5,6]},
    {id:"lydian",name:"Lidyen",family:"Majör modlar",intervals:[0,2,4,6,7,9,11],steps:[0,1,2,3,4,5,6]},
    {id:"mixolydian",name:"Miksolidyen",family:"Majör modlar",intervals:[0,2,4,5,7,9,10],steps:[0,1,2,3,4,5,6]},
    {id:"naturalMinor",name:"Doğal minör / Eolya",family:"Minör modlar",intervals:[0,2,3,5,7,8,10],steps:[0,1,2,3,4,5,6]},
    {id:"locrian",name:"Lokriyen",family:"Majör modlar",intervals:[0,1,3,5,6,8,10],steps:[0,1,2,3,4,5,6]},
    {id:"harmonicMinor",name:"Harmonik minör",family:"Minör gamlar",intervals:[0,2,3,5,7,8,11],steps:[0,1,2,3,4,5,6]},
    {id:"melodicMinor",name:"Melodik minör",family:"Minör gamlar",intervals:[0,2,3,5,7,9,11],steps:[0,1,2,3,4,5,6]},
    {id:"majorPentatonic",name:"Majör pentatonik",family:"Pentatonik",intervals:[0,2,4,7,9],steps:[0,1,2,4,5]},
    {id:"minorPentatonic",name:"Minör pentatonik",family:"Pentatonik",intervals:[0,3,5,7,10],steps:[0,2,3,4,6]},
    {id:"blues",name:"Blues",family:"Blues / Bebop",intervals:[0,3,5,6,7,10],steps:[0,2,3,3,4,6]},
    {id:"majorBebop",name:"Majör bebop",family:"Blues / Bebop",intervals:[0,2,4,5,7,8,9,11],steps:[0,1,2,3,4,4,5,6]},
    {id:"dominantBebop",name:"Dominant bebop",family:"Blues / Bebop",intervals:[0,2,4,5,7,9,10,11],steps:[0,1,2,3,4,5,6,6]},
    {id:"wholeTone",name:"Tam ton",family:"Simetrik",intervals:[0,2,4,6,8,10],steps:[0,1,2,3,4,5]},
    {id:"diminishedWH",name:"Eksik (tam-yarım)",family:"Simetrik",intervals:[0,2,3,5,6,8,9,11],steps:[0,1,2,3,3,4,5,6]},
    {id:"diminishedHW",name:"Eksik (yarım-tam)",family:"Simetrik",intervals:[0,1,3,4,6,7,9,10],steps:[0,0,2,2,3,4,5,6]}
  ].map(s=>Object.freeze({...s,intervals:Object.freeze([...s.intervals]),steps:Object.freeze([...s.steps])})));
  const scaleCatalog=root.MBS2Scales||(typeof require!=="undefined"?require("./scale-catalog.js"):null);
  const makams=root.MBS2Makams||(typeof require!=="undefined"?require("./makam-catalog.js"):null);
  const SCALES=Object.freeze([...(scaleCatalog?.records||CORE_SCALES),...(makams?.records||[])]);
  function scaleNotes(rootText, scaleId, preference = "sharp") {
    const scale=SCALES.find(s=>s.id===scaleId), rootPc=parseNote(rootText);
    if(!scale||rootPc===null) return null;
    const pcs=scale.intervals.map(x=>mod(rootPc+x));
    const spellings=pcs.map((pc,i)=>spelling(rootText,scale.steps[i]+1,pc));
    return {root:rootText,rootPc,scale,pcs,spellings,notes:pcs.map((pc,i)=>({pc,name:spellings[i]||noteName(pc,preference),degree:i+1,label:scale.formula?.[i]||String(i+1),interval:scale.intervals[i]}))};
  }
  function buildChord(rootText, typeId = "major", modifiers = {}) {
    const root = parseSpelling(rootText), type = CHORD_TYPES.find(c=>c.id===typeId);
    if (!root || !type) throw new Error("Kök nota veya akor tipi geçersiz.");
    const omitted = new Set((modifiers.omit || []).map(Number));
    const intervals = type.intervals.map(x=>({...x}));
    for (const raw of modifiers.alter || []) {
      const modDef=MODIFIERS.find(m=>m.id===raw||m.label===raw);
      if(!modDef||modDef.kind!=="alter") continue;
      for(let i=intervals.length-1;i>=0;i--) if(intervals[i].degree===modDef.degree) intervals.splice(i,1);
      intervals.push({...modDef.interval});
    }
    for (const raw of modifiers.add || []) {
      const modDef=MODIFIERS.find(m=>m.id===raw||m.label===raw);
      if(!modDef||modDef.kind!=="add") continue;
      if(!intervals.some(x=>x.degree===modDef.interval.degree&&mod(x.semitones)===mod(modDef.interval.semitones))) intervals.push({...modDef.interval});
    }
    const kept=intervals.filter(x=>!omitted.has(x.degree)).sort((a,b)=>a.degree-b.degree||a.semitones-b.semitones);
    const notes=kept.map(item=>({degree:item.degree,label:item.label,semitones:item.semitones,pc:mod(root.pitchClass+item.semitones),name:spelling(rootText,item.degree,root.pitchClass+item.semitones)}));
    const pitchClasses=[...new Set(notes.map(n=>n.pc))];
    const addLabels=(modifiers.add||[]).map(id=>MODIFIERS.find(m=>m.id===id)?.label).filter(Boolean);
    const alterLabels=(modifiers.alter||[]).map(id=>MODIFIERS.find(m=>m.id===id)?.label).filter(Boolean);
    const omitLabels=[...omitted].sort((a,b)=>a-b).map(n=>`omit${n}`);
    const suffix=[...addLabels,...alterLabels,...omitLabels];
    const symbol=`${rootText}${type.symbol}${suffix.length?`(${suffix.join(",")})`:""}`;
    return Object.freeze({root:rootText,rootPc:root.pitchClass,typeId:type.id,typeName:type.name,symbol,intervals:Object.freeze(kept),notes:Object.freeze(notes),pitchClasses:Object.freeze(pitchClasses),modifiers:Object.freeze({add:Object.freeze([...(modifiers.add||[])]),alter:Object.freeze([...(modifiers.alter||[])]),omit:Object.freeze([...omitted])})});
  }
  function exactChordMatch(pcs, rootHint=null) {
    const unique=[...new Set(pcs.map(parseNote).filter(n=>n!==null))];
    if(unique.length<2) return [];
    const roots=rootHint===null?Array.from({length:12},(_,i)=>i):[parseNote(rootHint)];
    const matches=[];
    for(const rootPc of roots){
      if(rootPc===null) continue;
      for(const type of CHORD_TYPES){
        const chord=buildChord(noteName(rootPc),type.id);
        const a=[...unique].sort((x,y)=>x-y).join(","),b=[...chord.pitchClasses].sort((x,y)=>x-y).join(",");
        if(a===b) matches.push({...chord,score:0,match:"tam"});
      }
    }
    return matches.sort((a,b)=>a.typeId.localeCompare(b.typeId)||a.rootPc-b.rootPc);
  }
  function spellScale(rootText, scale) { return scale.intervals.map((pc,i)=>spelling(rootText,scale.steps[i]+1,parseNote(rootText)+pc)); }
  // Completion candidates cover EVERY selected pitch. Scores order hypotheses;
  // they are not probabilities. Missing notes never become an exact match.
  function findChordMatches(pcs,{bassPc=null,rootHint=null,preference='sharp',limit=96,maxMissing=3}={}) {
    const selected=[...new Set(pcs.map(parseNote).filter(n=>n!==null))].sort((a,b)=>a-b);
    if(selected.length<2)return [];
    bassPc=parseNote(bassPc);const hint=rootHint===null?null:parseNote(rootHint);
    const roots=hint===null?Array.from({length:12},(_,i)=>i):[hint],found=new Map();
    const extensions={1:'addb9',2:'add9',3:'addsharp9',5:'add11',6:'addsharp11',8:'addb13',9:'add13'};
    function consider(chord){
      if(!selected.every(pc=>chord.pitchClasses.includes(pc)))return;
      const missingNotes=chord.notes.filter(n=>!selected.includes(n.pc)),rootPresent=selected.includes(chord.rootPc);
      if(missingNotes.length>maxMissing||(!rootPresent&&selected.length<3&&hint===null))return;
      const matchKind=!missingNotes.length?'exact':selected.length>=3&&missingNotes.length===1&&missingNotes[0].degree===5&&mod(missingNotes[0].semitones)===7&&chord.notes.some(n=>n.degree===3)&&chord.notes.some(n=>n.degree===6||n.degree===7)?'omitted':'partial';
      let score=missingNotes.reduce((sum,n)=>sum+(n.degree===1?9:n.degree===3?7:n.degree===7?4:n.degree===5&&mod(n.semitones)===7?1.4:2),0)+chord.notes.length*.35;
      score+=(chord.modifiers.add.length+chord.modifiers.alter.length)*.4;
      if(bassPc!==null&&bassPc!==chord.rootPc)score+=2;
      const slashBassPc=bassPc!==null&&bassPc!==chord.rootPc&&chord.pitchClasses.includes(bassPc)?bassPc:undefined;
      const symbol=chord.symbol+(slashBassPc!==undefined?'/'+noteName(slashBassPc,preference):'');
      const candidate={...chord,symbol,slashBassPc,matchKind,score,inputPitchClasses:selected,matchedNotes:chord.notes.filter(n=>selected.includes(n.pc)),missingNotes,rootPresent,bassPc,requiredPitchClasses:selected};
      const identity=chord.rootPc+'|'+[...chord.pitchClasses].sort((a,b)=>a-b).join(',')+'|'+slashBassPc;
      if(!found.has(identity)||score<found.get(identity).score)found.set(identity,candidate);
    }
    for(const rootPc of roots)for(const type of CHORD_TYPES){
      const base=buildChord(noteName(rootPc,preference),type.id);consider(base);
      if(type.id==='power'||type.id==='sus2'&&!selected.includes(mod(rootPc+2))||type.id==='sus4'&&!selected.includes(mod(rootPc+5)))continue;
      const extra=selected.filter(pc=>!base.pitchClasses.includes(pc)),relative=extra.map(pc=>mod(pc-rootPc));
      if(!extra.length||extra.length>3||relative.some(n=>extensions[n]===undefined))continue;
      // A simultaneous minor/major third is named #9 only over a major-third chord.
      if(relative.includes(3)&&!base.notes.some(n=>n.degree===3&&n.semitones===4))continue;
      const add=relative.map(n=>n===9&&!base.notes.some(t=>t.degree===7)?'6':extensions[n]);
      consider(buildChord(base.root,type.id,{add}));
      if(base.notes.some(n=>n.degree===5&&n.semitones===7)&&!selected.includes(mod(rootPc+7)))for(const [pitch,id] of [[6,'b5'],[8,'sharp5']]){
        if(!relative.includes(pitch))continue;
        const other=relative.filter(n=>n!==pitch).map(n=>extensions[n]);
        consider(buildChord(base.root,type.id,{alter:[id],add:other}));
      }
    }
    const rank={exact:0,omitted:1,partial:2};
    const result=[...found.values()].sort((a,b)=>rank[a.matchKind]-rank[b.matchKind]||a.score-b.score||a.rootPc-b.rootPc||a.symbol.localeCompare(b.symbol));
    if(result.length)return result.slice(0,Math.max(1,limit));
    // A chromatic cluster is retained explicitly, rather than silently dropping
    // pitches or pretending it has a conventional jazz chord symbol.
    const rootPc=hint??bassPc??selected[0],rootText=noteName(rootPc,preference);
    const names={0:I.R,1:I.b9,2:I.N9,3:selected.includes(mod(rootPc+4))?I.sharp9:I.m3,4:I.M3,5:I.P11,6:I.sharp11,7:I.P5,8:I.b13,9:I.M13,10:I.b7,11:I.M7};
    const notes=selected.map(pc=>{const n=names[mod(pc-rootPc)];return {...n,pc,name:spelling(rootText,n.degree,pc)};}).sort((a,b)=>a.semitones-b.semitones);
    return [{root:rootText,rootPc,typeId:null,typeName:'Ses kümesi',symbol:rootText+'['+notes.map(n=>n.label).join(',')+']',notes,intervals:notes,pitchClasses:selected,modifiers:{add:[],alter:[],omit:[]},matchKind:'collection',score:0,inputPitchClasses:selected,matchedNotes:notes,missingNotes:[],rootPresent:selected.includes(rootPc),bassPc,requiredPitchClasses:selected}];
  }
  function chordQualityForIntervals(intervals) {
    const target=[...new Set(intervals)].sort((a,b)=>a-b).join(",");
    for(const type of CHORD_TYPES){
      const test=[...new Set(type.intervals.map(x=>mod(x.semitones)))].sort((a,b)=>a-b).join(",");
      if(test===target) return type;
    }
    return null;
  }
  function romanNumeral(degree, qualityId) {
    const base=["I","II","III","IV","V","VI","VII"][((degree-1)%7+7)%7];
    const minorLike=["minor","minor7","minor6","minor9","minor11","minorMajor7","halfDim7"].includes(qualityId);
    const diminished=["diminished","halfDim7","dim7"].includes(qualityId);
    let roman=minorLike||diminished?base.toLowerCase():base;
    if(diminished) roman += qualityId==="halfDim7"?"ø":"°";
    if(qualityId==="augmented") roman += "+";
    return roman;
  }
  function harmonizeScale(rootText, scaleId, chordSize=3, options={}) {
    const model=scaleNotes(rootText,scaleId); if(!model) throw new Error("Gam veya ton geçersiz.");
    const scale=model.scale, result=[];
    // Collections without seven distinct letter degrees have no automatic diatonic stack.
    if(options.contained||!(scale.tertian??(scale.intervals.length===7&&new Set(scale.steps).size===7))){
      const types=CHORD_TYPES.filter(t=>t.intervals.length===Math.min(4,chordSize)&&!t.id.startsWith("dominantB"));
      for(let degree=0;degree<model.pcs.length;degree++)for(const type of types){
        const chord=buildChord(model.spellings[degree],type.id);if(!chord.pitchClasses.every(pc=>model.pcs.includes(pc)))continue;
        result.push(Object.freeze({degree:degree+1,root:chord.root,rootPc:chord.rootPc,notes:chord.pitchClasses,noteNames:chord.notes.map(n=>n.name),pitchClasses:chord.pitchClasses,chordId:type.id,chordName:type.name,symbol:chord.symbol,roman:scale.formula?.[degree]||String(degree+1),intervals:chord.intervals,quality:type.id,construction:"contained"}));
      }
      return result;
    }
    for(let degree=0;degree<model.pcs.length;degree++){
      const indices=Array.from({length:Math.min(chordSize,model.pcs.length)},(_,i)=>(degree+i*2)%model.pcs.length);
      const pcs=indices.map(i=>model.pcs[i]);
      const noteNames=indices.map(i=>model.spellings[i]);
      const semitones=pcs.map(pc=>mod(pc-model.pcs[degree]));
      const quality=chordQualityForIntervals(semitones);
      const type=quality||null;
      const triadQuality=chordQualityForIntervals(semitones.slice(0,3));
      const intervals=indices.map((idx,j)=>({degree:2*j+1,label:j===0?"1":noteNames[j],semitones:semitones[j]}));
      const formula=semitones.map((n,j)=>{const expected=[0,4,7,11,2,5,9][j],labels=["1","3","5","7","9","11","13"],delta=mod(n-expected+6)-6;return (delta<0?"♭".repeat(-delta):"♯".repeat(delta))+labels[j];});
      const prefix=(scale.formula?.[degree]||String(degree+1)).replace(/\d+/g,"");
      result.push(Object.freeze({degree:degree+1,root:model.spellings[degree],rootPc:model.pcs[degree],notes:Object.freeze(pcs),noteNames:Object.freeze(noteNames),pitchClasses:Object.freeze([...new Set(pcs)]),chordId:type?.id||null,chordName:type?.name||"Gam içi ses yapısı",symbol:`${model.spellings[degree]}${type?.symbol??"["+formula.join(",")+"]"}`,roman:prefix+romanNumeral(degree+1,type?.id||triadQuality?.id)+(chordSize===4?"7":""),intervals:Object.freeze(intervals.map((n,j)=>({...n,label:formula[j]}))),quality:type?.id||"custom",construction:"tertian"}));
    }
    return result;
  }
  function findScales(pcs, preference="sharp") {
    const selected=[...new Set(pcs.map(parseNote).filter(n=>n!==null))];
    if(!selected.length) return [];
    const hits=[];
    for(let root=0;root<12;root++) for(const scale of SCALES){
      const notes=scale.intervals.map(i=>mod(root+i)), missing=selected.filter(pc=>!notes.includes(pc));
      if(!missing.length) hits.push({root:noteName(root,preference),rootPc:root,scaleId:scale.id,scaleName:scale.name,family:scale.family,matched:selected.length,total:notes.length,extra:notes.length-selected.length,pcs:notes});
    }
    return hits.sort((a,b)=>a.extra-b.extra||a.total-b.total||a.rootPc-b.rootPc||a.scaleName.localeCompare(b.scaleName));
  }
  function chordToMidi(chord, baseMidi=48) {
    const tones=chord.notes.map(n=>({midi:baseMidi+n.semitones,note:n.name,degree:n.label}));
    return tones.sort((a,b)=>a.midi-b.midi);
  }
  const API={mod,parseNote,parseSpelling,noteName,spelling,CHORD_TYPES,MODIFIERS,SCALES,buildChord,exactChordMatch,findChordMatches,scaleNotes,spellScale,harmonizeScale,findScales,chordToMidi,romanNumeral};
  root.MBS2Theory=Object.freeze(API);
  if(typeof module!=="undefined"&&module.exports) module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
