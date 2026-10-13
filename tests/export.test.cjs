const assert=require("node:assert/strict");
const Export=require("../export.js");
const checks=[];function check(name,fn){fn();checks.push(name);}
check("MIDI dışa aktarımı geçerli başlık, tempo, nota açma ve kapama olayları üretir",()=>{const data=Buffer.from(Export.midiFile([{midi:60,startBeat:0,durationBeats:1}],{bpm:120}));assert.equal(data.toString("ascii",0,4),"MThd");assert.equal(data.toString("ascii",14,18),"MTrk");assert(data.includes(Buffer.from([0xff,0x51,0x03,0x07,0xa1,0x20])));assert(data.includes(Buffer.from([0x90,60,92])));assert(data.includes(Buffer.from([0x80,60,0])));});
module.exports=checks;
