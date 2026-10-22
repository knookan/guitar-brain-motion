/* Suggested fingers, finger numbers on diagrams and the left-handed mirror. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const T=require('../theory.js'),G=require('../guitar.js'),V=require('../voicing-engine.js'),D=require('../chord-diagram.js'),E=require('../export.js');
const {fixture}=require('./harmony-ui.test.cjs');
const checks=[];function check(name,fn){fn();checks.push(name);}
const json=value=>JSON.stringify(value);

check('Klasik açık akorlar ve barre şekilleri alışılmış parmaklarla önerilir',()=>{
  const classic={'C':[[-1,3,2,0,1,0],[0,3,2,0,1,0]],'Am':[[-1,0,2,2,1,0],[0,0,2,3,1,0]],'E':[[0,2,2,1,0,0],[0,2,3,1,0,0]],'Em':[[0,2,2,0,0,0],[0,2,3,0,0,0]],'G':[[3,2,0,0,0,3],[3,2,0,0,0,4]],
    'F barre':[[1,3,3,2,1,1],[1,3,4,2,1,1]],'Am barre':[[5,7,7,5,5,5],[1,3,4,1,1,1]],'Bm barre':[[-1,2,4,4,3,2],[0,1,3,4,2,1]],'B7':[[-1,2,1,2,0,2],[0,2,1,3,0,4]]};
  for(const [name,[frets,expected]] of Object.entries(classic)){const hand=V.fingering(frets);assert(hand.playable,name);assert.equal(json(Array.from(hand.fingers)),json(expected),name);}
  assert.equal(json(Array.from(V.fingering([0,0,0,0,0,0]).fingers)),json([0,0,0,0,0,0]));
  assert.equal(V.fingering([7,8,9,10,11,7]).fingers,undefined);
});

check('Önerilen parmaklar 1890 üretilmiş tutuşta tutarlıdır: basılan tel 1–4, diğerleri 0, perde yükseldikçe parmak düşmez',()=>{
  let count=0;
  for(const root of ['C','D','E','F','G','A','B','F♯','B♭'])for(const type of ['major','minor','dominant7','major7','minor7','sus4','halfDim7'])
    for(const shape of G.generateVoicings(T.buildChord(root,type),G.TUNINGS[0],0,{maxResults:30})){
      const hand=V.fingering(shape.frets);if(!hand.playable)continue;count++;
      shape.frets.forEach((fret,s)=>{
        if(fret>0)assert(hand.fingers[s]>=1&&hand.fingers[s]<=4,root+type+' '+shape.frets+' string '+s);else assert.equal(hand.fingers[s],0);
        shape.frets.forEach((other,t)=>{if(other>fret&&fret>0)assert(hand.fingers[t]>=hand.fingers[s],root+type+' '+shape.frets);});
      });
      assert(new Set(hand.fingers.filter(Boolean)).size<=4);
    }
  assert(count>1500,String(count));
});

check('Diyagram parmak numaralarını yalnızca istenince ve basılan tellerin altında gösterir',()=>{
  const shape={frets:[-1,3,2,0,1,0]},chord=T.buildChord('C','major');
  const off=D.render(shape,chord,G.TUNINGS[0],0),on=D.render(shape,chord,G.TUNINGS[0],0,{fingers:true});
  assert(!/diagram-finger/.test(off));assert.equal((on.match(/class="diagram-finger"/g)||[]).length,3);
  assert.equal(json([...on.matchAll(/<text class="diagram-finger" data-string="(\d)"[^>]*>(\d)</g)].map(m=>[Number(m[1]),Number(m[2])])),json([[1,3],[2,2],[4,1]]));
  assert(D.model(shape,chord,G.TUNINGS[0],0,{fingers:true}).height>D.model(shape,chord,G.TUNINGS[0],0).height);
  assert(!/diagram-finger/.test(D.render({frets:[0,0,0,0,0,0]},chord,G.TUNINGS[0],0,{fingers:true})),'open strings carry no numbers');
  assert(!/diagram-finger/.test(D.render({frets:[7,8,9,10,11,7]},chord,G.TUNINGS[0],0,{fingers:true})),'unplayable shapes carry no numbers');
  for(const tuning of G.TUNINGS.filter(t=>t.notes.length!==6))assert.doesNotThrow(()=>D.render({frets:tuning.notes.map((_,i)=>i%3===0?-1:i%3)},chord,tuning,0,{fingers:true,mirror:true}),tuning.id);
});

check('Solak diyagramda teller ve perde etiketi yansıtılır; barre ve noktalar tellerle birlikte kayar',()=>{
  const shape={frets:[1,3,3,2,1,1],barres:[{fret:1,fromString:0,toString:5}]},chord=T.buildChord('F','major');
  const right=D.model(shape,chord,G.TUNINGS[0],0),left=D.model(shape,chord,G.TUNINGS[0],0,{mirror:true});
  right.strings.forEach((s,i)=>assert(Math.abs(left.strings[i].x-(left.left+left.right-s.x))<1e-9,'string '+i));
  assert(left.strings[0].x>left.strings[5].x);assert.equal(left.strings[0].tuning,'E');assert.equal(left.strings[1].tuning,'A');
  const svg=D.render(shape,chord,G.TUNINGS[0],0,{mirror:true}),position=svg.match(/class="diagram-position" x="(\d+)"/);assert.equal(Number(position[1]),left.width-22);
  assert.equal(Math.min(left.barres[0].x1,left.barres[0].x2),Math.min(right.barres[0].x1,right.barres[0].x2));
  assert.notEqual(D.render(shape,chord,G.TUNINGS[0],0),svg);
});

check('Solak dışa aktarımda perde 0 sağa gelir; etiketler, teller ve nut yansıtılır, boyut aynı kalır',()=>{
  const model={tuning:G.TUNINGS[0],capo:0,sceneRange:0,selectedPositions:[{stringIndex:0,fret:1}],color:'#7ee5e0'};
  const right=E.fretboardSvg(model,'visible'),left=E.fretboardSvg({...model,leftHanded:true},'visible');
  assert.equal(left.width,right.width);assert.equal(left.height,right.height);
  const label=(svg,f)=>Number(svg.source.match(new RegExp('data-fret-label="'+f+'" x="([0-9.]+)"'))[1]);
  assert(label(right,1)<label(right,9));assert(label(left,1)>label(left,9));
  assert(Math.abs(label(left,5)-(right.width-label(right,5)))<1e-6);
  const dot=svg=>Number(svg.source.match(/data-string="0" data-fret="1"[^>]*><circle cx="([0-9.]+)"/)[1]);assert(Math.abs(dot(left)-(right.width-dot(right)))<1e-6);
  const names=svg=>[...svg.source.matchAll(/<text x="([0-9.]+)" y="[0-9.]+" fill="#c0cddd"/g)].map(m=>Number(m[1]));
  assert(names(right).every(x=>x<right.width/2)&&names(left).every(x=>x>left.width/2));
  assert.equal(E.fretboardSvg({...model,leftHanded:false},'visible').source,right.source);
});

check('Tercihler kaydedilir ve temizlenir: parmak numaraları varsayılan açık, solak varsayılan kapalı',()=>{
  const read=saved=>fixture(false,saved).preferences.attributes['data-hand'];
  assert.equal(read(null),'right');assert.equal(read('{"leftHanded":true}'),'left');
  assert.equal(read('{"leftHanded":"yes"}'),'right');assert.equal(read('{"leftHanded":1}'),'right');
  const f=fixture(false,'{"showFingers":false}');assert.equal(f.app.getState().showFingers,false);
  assert.equal(fixture(false,'{"showFingers":"maybe"}').app.getState().showFingers,true);assert.equal(fixture(false,null).app.getState().showFingers,true);
});

check('Aynalama bağımsız dönüşüm özellikleriyle yapılır ve metin geri çevrilir',()=>{
  const css=fs.readFileSync('styles.css','utf8');
  assert(css.includes("html[data-hand='left'] :is(.guitar-canvas,.guitar-scene){scale:-1 1}"));
  assert(css.includes("html[data-hand='left'] .guitar-scene text{scale:-1 1;transform-box:fill-box;transform-origin:center}"));
  assert(!/data-hand='left'[^{]*\{[^}]*transform:\s*scaleX/.test(css),'transform would be overridden by the arrival animation');
  const scene=fs.readFileSync('scene.js','utf8');assert(scene.includes("dataset?.hand==='left'?-.22:.22"));
  const app=fs.readFileSync('app.js','utf8');assert(app.includes("element?.setAttribute?.('data-hand',state.leftHanded?'left':'right')"));
  assert(app.includes('toggleHand')&&app.includes('toggleFingers'));
});

module.exports=checks;
