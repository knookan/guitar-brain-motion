const assert=require("node:assert/strict");
const T=require("../theory.js");
const checks=[];
function check(name,fn){fn();checks.push(name);}
check("Enharmonik adlar aynı pitch class değerine gelir",()=>{assert.equal(T.parseNote("C♯"),T.parseNote("D♭"));assert.equal(T.parseNote("F𝄪"),T.parseNote("G"));assert.equal(T.parseNote("C𝄫"),T.parseNote("B♭"));});
const expected={major:[0,4,7],minor:[0,3,7],dominant7:[0,4,7,10],major7:[0,4,7,11],minor7:[0,3,7,10],diminished:[0,3,6],augmented:[0,4,8],sus2:[0,2,7],sus4:[0,5,7],halfDim7:[0,3,6,10],dim7:[0,3,6,9]};
for(const [type,intervals] of Object.entries(expected))check(`${type} formülü 12 kökte değişmeden korunur`,()=>{for(let root=0;root<12;root++){const chord=T.buildChord(T.noteName(root),type);assert.deepEqual(chord.notes.map(n=>T.mod(n.pc-root)).sort((a,b)=>a-b),intervals);}});
check("D♭ majör teorik harf yazımını korur",()=>assert.deepEqual(T.buildChord("D♭","major").notes.map(n=>n.name),["D♭","F","A♭"]));
check("F♯ maj7 teorik harf yazımını korur",()=>assert.deepEqual(T.buildChord("F♯","major7").notes.map(n=>n.name),["F♯","A♯","C♯","E♯"]));
check("C majör derece üçlüleri kalite ve notalarla doğru çıkar",()=>{const chords=T.harmonizeScale("C","major",3);assert.deepEqual(chords.map(c=>c.symbol),["C","Dm","Em","F","G","Am","Bdim"]);assert.deepEqual(chords.map(c=>c.noteNames.join("")),["CEG","DFA","EGB","FAC","GBD","ACE","BDF"]);});
check("C majör derece yedilileri doğru çıkar",()=>assert.deepEqual(T.harmonizeScale("C","major",4).map(c=>c.symbol),["Cmaj7","Dm7","Em7","Fmaj7","G7","Am7","Bm7♭5"]));
check("A doğal ve armonik minör dominantları birbirinden ayrılır",()=>{assert.equal(T.harmonizeScale("A","naturalMinor",3)[4].symbol,"Em");assert.equal(T.harmonizeScale("A","harmonicMinor",3)[4].symbol,"E");assert.equal(T.scaleNotes("A","harmonicMinor").spellings[6],"G♯");});
check("Alterasyon aynı dereceyi değiştirir, omit gerçekten çıkarır",()=>{const c=T.buildChord("C","dominant9",{alter:["b9"],omit:[7]});assert.deepEqual(c.notes.map(n=>n.label),["1","3","5","♭9"]);});
check("add9 dominant yediliyi gizlice eklemez",()=>{const c=T.buildChord("C","major",{add:["add9"]});assert.deepEqual(c.notes.map(n=>n.label),["1","3","5","9"]);assert(!c.pitchClasses.includes(10));});
check("Sus akorlarında üçlü bulunmaz",()=>{assert.deepEqual(T.buildChord("C","sus2").notes.map(n=>n.name),["C","D","G"]);assert.deepEqual(T.buildChord("C","sus4").notes.map(n=>n.name),["C","F","G"]);});
check("Tam akor eşlemesi C-E-G için C majörü bulur",()=>assert(T.exactChordMatch([0,4,7]).some(c=>c.root==="C"&&c.typeId==="major")));
check("Sekiz sesli koleksiyonda akor üyeliği doğrulanır, yalancı tonal Roma derecesi atanmaz",()=>{const scale=T.scaleNotes("C","majorBebop"),chords=T.harmonizeScale("C","majorBebop",3);assert(chords.length>0);for(const c of chords){assert(c.pitchClasses.every(pc=>scale.pcs.includes(pc)));assert.doesNotMatch(c.roman,/[IViv]/);}});
module.exports=checks;
