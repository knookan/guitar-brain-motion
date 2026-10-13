const assert=require("node:assert/strict");
const T=require("../theory.js"),G=require("../guitar.js");
const checks=[];function check(name,fn){fn();checks.push(name);}
const shapes=[
  ["C-open","C","major"],["D-open","D","major"],["E-open","E","major"],["G-open","G","major"],["A-open","A","major"],
  ["Am-open","A","minor"],["Em-open","E","minor"],["Dm-open","D","minor"],["F-barre","F","major"],["Bm-barre","B","minor"],
  ["A7-open","A","dominant7"],["E7-open","E","dominant7"],["Am7-open","A","minor7"],["D7-open","D","dominant7"],["Cmaj7-open","C","major7"]
];
check("Temel açık/barre tutuşlarının sesleri tanımlı akorla eşleşir",()=>{for(const [id,root,type] of shapes){const shape=G.STANDARD_SHAPES.find(s=>s.id===id);assert(shape);assert(G.shapeIsChord(shape,T.buildChord(root,type)),`${id} yanlış pitch set`);}});
check("C majör için ilk katalog tutuşu x32010 olur",()=>{const shape=G.getKnownShapes(T.buildChord("C","major"))[0];assert.deepEqual(shape.frets,[-1,3,2,0,1,0]);});
check("Standart kalın E 0/1/12/24 perdelerde doğru MIDI üretir",()=>{const t=G.TUNINGS[0];assert.equal(G.positionMidi(t,0,0),40);assert.equal(G.positionMidi(t,0,1),41);assert.equal(G.positionMidi(t,0,12),52);assert.equal(G.positionMidi(t,0,24),64);});
check("Capo altındaki fiziksel perde susturulur, capo perdesi doğru duyulur",()=>{const t=G.TUNINGS[0];assert.equal(G.positionMidi(t,0,2,3),null);assert.equal(G.positionMidi(t,0,3,3),43);assert.equal(G.positionMidi(t,0,5,3),45);});
check("Drop D ve DADGAD kalın tel notalarını korur",()=>{assert.equal(G.midiFromNote(G.TUNINGS.find(t=>t.id==="dropD").notes[0]),38);assert.equal(G.midiFromNote(G.TUNINGS.find(t=>t.id==="dadgad").notes[0]),38);});
check("Tutuş araması, bilinmeyen şekle parmak uydurmaz",()=>{const shapes=G.generateVoicings(T.buildChord("F♯","dominant7"),G.TUNINGS[0],0,{maxFret:12,maxResults:8});for(const s of shapes)assert.equal(s.fingers,null);});
check("Capo açık notalarıyla üretilen tutuşlar fiziksel 24. perdeyi aşmaz",()=>{const shapes=G.generateVoicings(T.buildChord("D","major"),G.TUNINGS[0],5,{maxFret:24,maxResults:10});assert(shapes.every(s=>s.frets.every(f=>f<0||f<=24)));});
check("Slash baslı akor voicing'i en düşük çalınan telde bas notasını taşır",()=>{const chord={...T.buildChord("C","major"),symbol:"C/E",slashBassPc:T.parseNote("E")};const shapes=G.generateVoicings(chord,G.TUNINGS[0],0,{maxFret:12,maxResults:8});assert(shapes.length>0);for(const shape of shapes){const bass=shape.frets.findIndex(f=>f>=0);assert.notEqual(bass,-1);assert.equal(T.mod(G.midiFromNote(G.TUNINGS[0].notes[bass])+shape.frets[bass]),T.parseNote("E"));}});
module.exports=checks;
