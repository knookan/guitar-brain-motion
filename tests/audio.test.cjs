/* Web Audio API fixture: routing, real PCM, tuning and cancellation; no speakers. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),bank=require('../guitar-samples.js');
function fixture({suspended=false,deferred=false,lazy=false,fetchImpl=null}={}){
  const sources=[],buffers=[],nodes=[],oscillators=[],timers=[];let ctx=null;
  const param=()=>({value:0,events:[],setValueAtTime(v,t){this.events.push(['set',v,t]);},linearRampToValueAtTime(v,t){this.events.push(['linear',v,t]);},exponentialRampToValueAtTime(v,t){this.events.push(['exp',v,t]);},cancelScheduledValues(t){this.events.push(['cancel',t]);}});
  const node=()=>{const n={connections:[],connect(x){this.connections.push(x);},disconnect(){this.disconnected=true;}};nodes.push(n);return n;};
  class Context{constructor(){ctx=this;this.currentTime=0;this.sampleRate=48000;this.state=suspended?'suspended':'running';this.destination={};}
    resume(){this.resumed=true;return deferred?new Promise(resolve=>{this.finishResume=()=>{this.state='running';resolve();};}):Promise.resolve(this.state='running');}
    createGain(){return Object.assign(node(),{gain:param()});}
    createBiquadFilter(){return Object.assign(node(),{frequency:param(),Q:param()});}
    createDynamicsCompressor(){return Object.assign(node(),Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k=>[k,param()])));}
    createConvolver(){return node();}createStereoPanner(){return Object.assign(node(),{pan:param()});}
    createBuffer(channels,length,rate){const data=Array.from({length:channels},()=>new Float32Array(length));const b={length,sampleRate:rate,duration:length/rate,getChannelData:i=>data[i]};buffers.push(b);return b;}
    createOscillator(){const o=Object.assign(node(),{type:'sine',frequency:{value:0},starts:[],stops:[],start(t){this.starts.push(t);},stop(t){this.stops.push(t);}});oscillators.push(o);return o;}
    createBufferSource(){const s=Object.assign(node(),{playbackRate:param(),starts:[],stops:[],start(t){this.starts.push(t);},stop(t){this.stops.push(t);}});sources.push(s);return s;}
  }
  const lazyBank={metadata:bank.metadata,records:bank.records.map(r=>({midi:r.midi,name:r.name,sampleRate:r.sampleRate,frames:r.frames,detuneCents:r.detuneCents,url:r.url}))};
  const context={MBS2GuitarSamples:lazy?lazyBank:bank,fetch:fetchImpl||undefined,AudioContext:Context,atob:s=>Buffer.from(s,'base64').toString('binary'),console,setInterval:fn=>{timers.push(fn);return timers.length;},clearInterval:id=>{timers[id-1]=null;}};vm.createContext(context);vm.runInContext(fs.readFileSync('audio.js','utf8'),context);
  return {audio:context.MBS2Audio,sources,buffers,nodes,oscillators,timers,tick(){timers.forEach(fn=>fn&&fn());},get ctx(){return ctx;}};
}
module.exports=async()=>{const checks=[];const check=async(name,fn)=>{await fn();checks.push(name);};
  await check('48 gerçek CC0 gitar örneği geçerli uzunlukta PCM ve kaynak metadata taşır',()=>{
    assert.equal(bank.metadata.license,'CC0-1.0');assert.equal(bank.records.length,48);for(const r of bank.records){const pcm=Buffer.from(r.pcm,'base64');assert.equal(pcm.length,r.frames*2);assert(r.frames>r.sampleRate*.3);assert(r.frames<=r.sampleRate*6);let peak=0;for(let i=0;i<pcm.length;i+=2)peak=Math.max(peak,Math.abs(pcm.readInt16LE(i)));assert(peak>100&&peak<=24001);assert(r.sourceSha256.length===64);}
  });
  await check('Örnek seçimi doğru MIDI ve kesirli makam sesi hızını korur',()=>{
    const f=fixture();for(let midi=31;midi<=84;midi++){const p=f.audio.samplePlan(midi);assert(Math.abs(p.sampleMidi-midi)<=1);assert(Math.abs(p.playbackRate-Math.pow(2,(midi-p.sampleMidi)/12-p.sourceDetuneCents/1200))<1e-12);}const p=f.audio.samplePlan(60+9*12/53);assert.equal(p.playbackRate,Math.pow(2,(60+9*12/53-p.sampleMidi)/12-p.sourceDetuneCents/1200));
  });
  await check('Blok playback gerçek sample buffer kullanır, doğal tarama ve seviye sınırı vardır',async()=>{
    const f=fixture();await f.audio.playNotes([48,52,55,60,64]);assert.equal(f.sources.length,5);assert(f.sources.every(s=>s.buffer&&s.starts.length===1));assert(f.sources[1].starts[0]>f.sources[0].starts[0]);assert(f.sources[0].buffer.getChannelData(0).some(n=>n!==0));assert(!f.nodes.some(n=>n.type==='triangle'));const count=f.buffers.length;await f.audio.playNotes([48,52,55,60,64]);assert.equal(f.buffers.length,count);
  });
  await check('Arpej Web Audio zaman çizelgesinde doğru tempo/yön kullanır, sesler doğal sönmeye bırakılır',async()=>{
    const f=fixture();const duration=await f.audio.playArpeggio([60,64,67],{bpm:120,direction:'down'});assert.equal(duration,.75);assert(Math.abs(f.sources[1].starts[0]-f.sources[0].starts[0]-.25)<1e-12);assert.equal(f.sources[0].buffer,f.buffers.find(b=>b.length===bank.records.find(r=>r.midi===67).frames));assert(f.sources[0].stops[0]-f.sources[0].starts[0]>1);
  });
  await check('Durdur bekleyen arpej seslerini de iptal eder; kaynaklar bitince bağlantılar temizlenir',async()=>{
    const f=fixture();await f.audio.playArpeggio([60,64,67]);f.audio.stop();assert(f.sources.every(s=>s.stops.at(-1)<.1));for(const s of f.sources)s.onended();assert(f.sources.every(s=>s.disconnected));
  });
  await check('AudioContext açılması beklenirken veya aynı anda ikinci Çal gelince eski çalma başlamaz',async()=>{
    const f=fixture({suspended:true,deferred:true}),first=f.audio.playNotes([60]);f.audio.stop();f.ctx.finishResume();await first;assert.equal(f.sources.length,0);
    const g=fixture(),a=g.audio.playNotes([60]),b=g.audio.playNotes([64]);await Promise.all([a,b]);assert.equal(g.sources.length,1);assert.equal(g.audio.samplePlan(64).sampleMidi,64);
  });
  await check('Geçersiz MIDI sesleri elenir, up-down yönü ve tekrar çalma korunur',async()=>{
    const f=fixture();await f.audio.playNotes([0,NaN,109,60,60]);assert.equal(f.sources.length,1);const g=fixture();await g.audio.playArpeggio([60,64,67],{bpm:120,direction:'up-down'});assert.equal(g.sources.length,4);
  });
  await check('Görsel playback saati gerçek AudioContext ve kaynak başlangıç/bitişlerini takip eder',async()=>{
    const f=fixture();await f.audio.playArpeggio([60,64,67],{bpm:120});const p=f.audio.getPlayback();assert.equal(p.events.length,3);assert.equal(p.events[0].start,f.sources[0].starts[0]);assert.equal(p.events[1].start-f.sources[1].starts[0],0);assert(p.events[0].end>p.events[0].start);
    f.ctx.currentTime=.3;assert.equal(f.audio.getPlayback().time,.3);f.audio.stop();assert.equal(f.audio.getPlayback().events.length,0);assert(f.audio.getPlayback().token>p.token);
  });
  await check('Makam A/B aynı sesleri de iki kez çalar, sıralamayı korur ve kesirli MIDIyi yuvarlamaz',async()=>{
    const f=fixture();await f.audio.playSequence([64,60+17*12/53,60,60]);assert.equal(f.sources.length,4);const notes=Array.from(f.audio.getPlayback().events,e=>e.midi);assert.deepEqual(notes,[64,60+17*12/53,60,60]);assert(Math.abs(f.sources[1].starts[0]-f.sources[0].starts[0]-.7)<1e-9);assert(f.sources[1].playbackRate.value!==1);
  });
  await check('Makam örnek kayıt hızından üretilen temel frekans hedef Hz ile eşleşir',async()=>{
    const K=require('../makam-catalog.js'),MT=require('../makam-tuning.js'),s=K.records.find(s=>s.id==='makam-huzzam'),a=MT.analyze(s,71,{notationAnchor:true,example:'huzzam-1.5',referenceA:432}),midis=MT.midis(s,71,{notationAnchor:true,example:'huzzam-1.5',referenceA:432}),f=fixture();await f.audio.playArpeggio(midis,{bpm:120,noteDuration:.5});for(const [i,m] of midis.entries()){const p=f.audio.samplePlan(m),sampleHz=440*2**((p.sampleMidi-69)/12)*2**(p.sourceDetuneCents/1200),actualHz=sampleHz*f.sources[i].playbackRate.events[0][1];assert(Math.abs(actualHz-a.rows[i].frequency)<1e-7);}f.audio.stop();assert.equal(f.audio.getPlayback().events.length,0);
  });
  await check('Rota sesi aynı MIDI değerindeki iki teli ayrı olaylar olarak korur ve ölçü sınırını aşmaz',async()=>{const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:60,stringIndex:0,fret:3},{midi:60,stringIndex:1,fret:8}],beats:4},{events:[{midi:59,stringIndex:0,fret:2}],beats:4}],{bpm:120,arpeggio:true});const events=f.audio.getPlayback().events;assert.equal(events.length,3);assert.equal(events[0].midi,events[1].midi);assert.notEqual(events[0].position.stringIndex,events[1].position.stringIndex);assert.equal(events[0].stepEnd-events[0].stepStart,2);assert.equal(events[2].stepIndex,1);assert(events.every(e=>e.end<=e.stepEnd));f.audio.stop();assert.equal(f.audio.getPlayback().events.length,0);});
  await check('Bekleyen rota playback durdurulduğunda geç ses başlatmaz',async()=>{const f=fixture({suspended:true,deferred:true}),pending=f.audio.playVoicingRoute([{events:[{midi:60,stringIndex:1,fret:3}],beats:4}]);f.audio.stop();f.ctx.finishResume();await pending;assert.equal(f.sources.length,0);});
  await check('Sayım dört tık çalar ve rota ancak sayımdan sonra başlar',async()=>{
    const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:60,stringIndex:1,fret:3}],beats:4}],{bpm:120,countIn:true});
    assert.equal(f.oscillators.length,4);assert.deepEqual(f.oscillators.map(o=>o.frequency.value),[1560,1040,1040,1040]);
    assert(Math.abs(f.oscillators[1].starts[0]-f.oscillators[0].starts[0]-.5)<1e-12);
    assert(Math.abs(f.sources[0].starts[0]-(f.oscillators[0].starts[0]+2))<1e-12);
  });
  await check('Metronom her vuruşa tık koyar, vurgu yalnızca dörtlük grup başındadır',async()=>{
    const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:60,stringIndex:1,fret:3}],beats:4},{events:[{midi:62,stringIndex:1,fret:5}],beats:2}],{bpm:120,metronome:true});
    assert.deepEqual(f.oscillators.map(o=>o.frequency.value),[1560,1040,1040,1040,1560,1040]);
    assert(Math.abs(f.oscillators[5].starts[0]-f.oscillators[0].starts[0]-2.5)<1e-12);
    const quiet=fixture();await quiet.audio.playVoicingRoute([{events:[{midi:60,stringIndex:1,fret:3}],beats:4}],{bpm:120});assert.equal(quiet.oscillators.length,0);
  });
  await check('Döngü bir sonraki geçişi yaklaşırken planlar, bitişte boşluk bırakmaz; Durdur zamanlayıcıyı da iptal eder',async()=>{
    const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:60,stringIndex:1,fret:3}],beats:4}],{bpm:120,loop:true});
    assert.equal(f.sources.length,1);f.ctx.currentTime=.5;f.tick();assert.equal(f.sources.length,1);
    f.ctx.currentTime=1.5;f.tick();assert.equal(f.sources.length,2);assert(Math.abs(f.sources[1].starts[0]-(f.sources[0].starts[0]+2))<1e-12);
    f.tick();assert.equal(f.sources.length,2);
    f.ctx.currentTime=3.5;f.tick();assert.equal(f.sources.length,3);
    f.audio.stop();f.ctx.currentTime=5.5;f.tick();assert.equal(f.sources.length,3);
  });
  await check('Döngüde uzun kesinti sonrası geçmiş geçişler toplu çalınmaz',async()=>{
    const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:60,stringIndex:1,fret:3}],beats:4}],{bpm:120,loop:true});
    f.ctx.currentTime=30.2;f.tick();assert.equal(f.sources.length,1);f.ctx.currentTime=31.6;f.tick();assert.equal(f.sources.length,2);assert(f.sources[1].starts[0]>=31.6);
  });
  await check('Durdur bekleyen sayım ve metronom tıklarını da iptal eder',async()=>{
    const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:60,stringIndex:1,fret:3}],beats:4}],{bpm:120,countIn:true,metronome:true});
    assert(f.oscillators.length>=8);f.audio.stop();assert(f.oscillators.every(o=>o.stops.at(-1)===0));
  });
  await check('Strum kalıbı her vuruşta aşağı vuruş yapar; her vuruş kendi akorunun içinde kalır',async()=>{
    const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:48,stringIndex:5,fret:3},{midi:55,stringIndex:4,fret:5}],beats:4}],{bpm:120,pattern:'strum'});
    const events=f.audio.getPlayback().events;assert.equal(events.length,8);
    assert(Math.abs(events[2].start-events[0].start-.5)<1e-9);assert(events[1].start>events[0].start);assert.equal(events[1].midi,55);
    assert(events.every(e=>e.end<=e.stepEnd+1e-9&&e.start>=e.stepStart));
  });
  await check('Aşağı-yukarı kalıbı sekizlik vuruşlarla çalar; yukarı vuruş telleri ters sırayla ve daha yumuşak çalar',async()=>{
    const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:48,stringIndex:5,fret:3},{midi:55,stringIndex:4,fret:5}],beats:2}],{bpm:120,pattern:'downup'});
    const events=f.audio.getPlayback().events;assert.equal(events.length,8);
    assert(Math.abs(events[2].start-events[0].start-.25)<1e-9);
    assert.deepEqual(Array.from(events.slice(0,4).map(e=>e.midi)),[48,55,55,48]);
    assert(events.every(e=>e.end<=e.stepEnd+1e-9));
  });
  await check('Arpej, strum kalıbından önceliklidir ve bilinmeyen kalıp blok çalar',async()=>{
    const f=fixture();await f.audio.playVoicingRoute([{events:[{midi:48,stringIndex:5,fret:3},{midi:55,stringIndex:4,fret:5}],beats:4}],{bpm:120,pattern:'strum',arpeggio:true});
    assert.equal(f.audio.getPlayback().events.length,2);
    const g=fixture();await g.audio.playVoicingRoute([{events:[{midi:48,stringIndex:5,fret:3},{midi:55,stringIndex:4,fret:5}],beats:4}],{bpm:120,pattern:'nonsense'});
    assert.equal(g.audio.getPlayback().events.length,2);
  });
  await check('Yüzlerce planlı nota, henüz çalmayan seslerin erken kesilmesine yol açmaz',async()=>{
    const f=fixture(),chord=()=>({events:[40,47,52,56,59,64].map((midi,i)=>({midi,stringIndex:5-i,fret:i})),beats:8});
    await f.audio.playVoicingRoute(Array.from({length:8},chord),{bpm:100,pattern:'downup'});
    assert(f.sources.length>600);assert(f.sources.every(s=>s.stops.length===1));
  });
  const pcmFetch=(log,{status=200,shortBy=0,gate=null}={})=>async url=>{
    log.push(url);if(gate)await gate;if(status!==200)return {ok:false,status};
    const raw=fs.readFileSync(url),bytes=raw.subarray(0,raw.length-shortBy);return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  };
  await check('Ses dizini 48 örneğin gerçek dosyalarını gösterir, küçük kalır ve çevrimdışı önbellekte hepsi vardır',()=>{
    const index=fs.readFileSync('guitar-samples.js','utf8');assert(index.length<60000);assert(!/[A-Za-z0-9+\/]{400}/.test(index),'index carries no embedded audio');
    const sw=fs.readFileSync('sw.js','utf8'),assets=vm.runInNewContext('['+sw.match(/ASSETS\.push\(\.\.\.(\[[0-9,]+\])\.map/)[1]+']')[0].map(m=>'./assets/audio/guitar/'+m+'.pcm');
    assert.equal(bank.records.length,48);
    for(const r of bank.records){assert.equal(r.url,'assets/audio/guitar/'+r.midi+'.pcm');assert.equal(fs.statSync(r.url).size,r.frames*2);assert(assets.includes('./'+r.url),r.url);}
    assert.equal(assets.length,48);
  });
  await check('Dizindeki örnekler ilk çalmada getirilir, aynı örnek bir kez indirilir ve ses diskteki PCM ile aynıdır',async()=>{
    const log=[],f=fixture({lazy:true,fetchImpl:pcmFetch(log)});
    assert(f.audio.metadata.license==='CC0-1.0');await f.audio.playNotes([60,64,67]);
    assert.equal(log.length,3);assert(log.every(u=>u.startsWith('assets/audio/guitar/')));assert.equal(f.sources.length,3);
    const sample=bank.records.find(r=>r.midi===60),raw=fs.readFileSync(sample.url),data=f.buffers.find(b=>b.length===sample.frames).getChannelData(0);
    for(const i of [0,1000,50000,sample.frames-1])assert.equal(data[i],raw.readInt16LE(i*2)/32768);
    await f.audio.playNotes([60,64,67]);assert.equal(log.length,3);
  });
  await check('Aynı örneği isteyen eşzamanlı çalmalar tek indirmeyi paylaşır; Durdur bekleyen çalmayı iptal eder',async()=>{
    let release;const gate=new Promise(resolve=>{release=resolve;}),log=[],f=fixture({lazy:true,fetchImpl:pcmFetch(log,{gate})});
    const first=f.audio.playNotes([60]),second=f.audio.playArpeggio([60,60]);
    await new Promise(resolve=>setImmediate(resolve));assert.equal(log.length,1);
    f.audio.stop();release();await first;await second;assert.equal(f.sources.length,0);
    await f.audio.playNotes([60]);assert.equal(f.sources.length,1);assert.equal(log.length,1);
  });
  await check('Eksik, kısa ya da ağdan gelmeyen örnek anlaşılır hatayla reddedilir ve sonra yeniden denenebilir',async()=>{
    for(const [options,pattern] of [[{status:404},/yüklenemedi/],[{shortBy:2},/eksik/]]){
      const log=[],f=fixture({lazy:true,fetchImpl:pcmFetch(log,options)});
      await assert.rejects(f.audio.playNotes([60]),pattern);assert.equal(f.sources.length,0);
      await assert.rejects(f.audio.playNotes([60]),pattern);assert.equal(log.length,2);
    }
    const down=fixture({lazy:true,fetchImpl:async()=>{throw new Error('Offline');}});await assert.rejects(down.audio.playNotes([60]),/Offline/);
  });
  await check('Rota, ilerleme ve dizi çalmaları ihtiyaç duydukları örnekleri çalmadan önce yükler',async()=>{
    const log=[],f=fixture({lazy:true,fetchImpl:pcmFetch(log)});
    await f.audio.playVoicingRoute([{events:[{midi:48,stringIndex:5,fret:3}],beats:2},{events:[{midi:67,stringIndex:1,fret:0}],beats:2}],{bpm:120});
    assert.equal(log.length,2);await f.audio.playProgression([{midis:[50,54],beats:2}],{bpm:100});assert.equal(log.length,4);
    await f.audio.playSequence([72,74],{});assert.equal(log.length,6);
  });
  await check('Önyükleme ortak gitar aralığını getirir ve başarısız olursa sessizce hata verir',async()=>{
    const log=[],f=fixture({lazy:true,fetchImpl:pcmFetch(log)});await f.audio.preload([40,76]);
    const wanted=new Set(Array.from({length:37},(_,i)=>f.audio.samplePlan(40+i).sampleMidi));assert.equal(log.length,wanted.size);
    const g=fixture({lazy:true,fetchImpl:pcmFetch([],{status:500})});await assert.rejects(g.audio.preload([60,62]),/yüklenemedi/);
  });
  return checks;
};
