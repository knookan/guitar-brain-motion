const assert=require("node:assert/strict"),T=require("../theory.js"),G=require("../guitar.js"),D=require("../chord-diagram.js"),S=require("../scene.js");
const checks=[];function check(name,fn){fn();checks.push(name);}
const tuning=G.TUNINGS[0];
check("C diyagramı x32010 tutuşunun MIDI seslerini, açık ve susturulmuş tellerini doğru gösterir",()=>{
  const chord=T.buildChord("C","major"),shape=G.getKnownShapes(chord)[0],m=D.model(shape,chord,tuning);
  assert.deepEqual(m.strings.map(s=>s.midi),[null,48,52,55,60,64]);assert.deepEqual(m.strings.filter(s=>s.open).map(s=>s.index),[3,5]);assert.deepEqual(m.strings.filter(s=>s.muted).map(s=>s.index),[0]);
  const rendered=D.render(shape,chord,tuning);assert.equal((rendered.match(/class="diagram-dot/g)||[]).length,3);assert.equal((rendered.match(/class="diagram-open/g)||[]).length,2);
});
check("F diyagramı tanımlı bareyi korur, parmak numarası basmaz",()=>{
  const chord=T.buildChord("F","major"),shape=G.getKnownShapes(chord)[0],m=D.model(shape,chord,tuning);
  assert.equal(m.barres.length,1);assert.equal(m.barres[0].x1,m.strings[0].x);assert.equal(m.barres[0].x2,m.strings[5].x);
  assert.deepEqual([...new Set(m.strings.map(s=>s.pc))].sort((a,b)=>a-b),[0,5,9]);assert.doesNotMatch(D.render(shape,chord,tuning),/finger|parmak/i);
});
check("Yüksek pozisyon numarası ayrı sütundadır, açık/susturulmuş tel işaretleriyle çakışmaz",()=>{
  const chord=T.buildChord("C","major"),m=D.model({frets:[8,10,10,9,8,8]},chord,tuning);
  assert.equal(m.start,8);assert(m.strings.every(s=>s.y>m.top&&s.y<m.bottom));assert(m.strings.every(s=>s.x>=50));assert.equal(m.rows,4);
});
check("Capo perdesi açık tel olarak işaretlenir, perde etiketleri fiziksel sayıyı korur",()=>{
  const chord=T.buildChord("F♯","major"),m=D.model({frets:[2,4,4,3,2,2]},chord,tuning,2);
  assert.equal(m.start,3);assert.equal(m.showNut,false);assert.deepEqual(m.strings.filter(s=>s.open).map(s=>s.index),[0,4,5]);
  assert.deepEqual(m.strings.map(s=>s.midi),[42,49,54,58,61,66]);
});
check("Diyagram 4–8 telli akortlarda bütün sesleri kendi telinde tutar",()=>{
  for(const count of [4,5,6,7,8]){const t={notes:Array(count).fill("E2")},m=D.model({frets:Array(count).fill(0)},T.buildChord("E","major"),t);assert.equal(m.strings.length,count);assert(m.strings.every(s=>s.midi===40));assert.equal(new Set(m.strings.map(s=>s.x)).size,count);}
});
check("1, 12 ve 24. perde merkezleri gerçek komşu fret sınırlarının içinde kalır",()=>{
  for(const [range,frets] of [[0,[1,6,12]],[12,[12,18,24]]])for(const f of frets){assert(S.fretCenter(f,range)>S.fretX(f-1,range));assert(S.fretCenter(f,range)<S.fretX(f,range));}
  assert.equal(S.bounds(12).start,11);
});
check("3D kamerada kalın tel altta, ince tel üstte kalır; projeksiyon farklı boyutlarda görünürdür",()=>{
  for(const [w,h] of [[1200,650],[720,260],[360,150]])for(const camera of [{},{yaw:0,elevation:88,zoom:1.02},{yaw:-6,elevation:62,zoom:1.2}]){
    const view=S.cameraMatrix(w,h,camera),low=S.project([0,S.stringY(0,6),.24],view.matrix,w,h),high=S.project([0,S.stringY(5,6),.24],view.matrix,w,h);
    assert(low.y>high.y);
    for(const range of [0,12])for(let f=range===0?0:12;f<=range+12;f++)for(let s=0;s<6;s++){const p=S.project([S.fretCenter(f,range),S.stringY(s,6),.24],view.matrix,w,h);assert(p&&Number.isFinite(p.x)&&p.x>0&&p.x<w&&p.y>0&&p.y<h);}
  }
});
check("3D mesh 4–8 telli, capo ve iki perde aralığında geçerli üçgen/normal üretir",()=>{
  for(const count of [4,6,8])for(const range of [0,12]){const mesh=S.geometry(count,range,range?12:3);assert.equal(mesh.length%30,0);assert(mesh.length>5000);assert(mesh.every(Number.isFinite));}
});
module.exports=checks;
