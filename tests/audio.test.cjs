/* Web Audio API fixture: routing, real PCM, tuning and cancellation; no speakers. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),bank=require('../guitar-samples.js');
function fixture({suspended=false,deferred=false}={}){
  const sources=[],buffers=[],nodes=[];let ctx=null;
  const param=()=>({value:0,events:[],setValueAtTime(v,t){this.events.push(['set',v,t]);},linearRampToValueAtTime(v,t){this.events.push(['linear',v,t]);},cancelScheduledValues(t){this.events.push(['cancel',t]);}});
  const node=()=>{const n={connections:[],connect(x){this.connections.push(x);},disconnect(){this.disconnected=true;}};nodes.push(n);return n;};
  class Context{constructor(){ctx=this;this.currentTime=0;this.sampleRate=48000;this.state=suspended?'suspended':'running';this.destination={};}
    resume(){this.resumed=true;return deferred?new Promise(resolve=>{this.finishResume=()=>{this.state='running';resolve();};}):Promise.resolve(this.state='running');}
    createGain(){return Object.assign(node(),{gain:param()});}
    createBiquadFilter(){return Object.assign(node(),{frequency:param(),Q:param()});}
    createDynamicsCompressor(){return Object.assign(node(),Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k=>[k,param()])));}
    createConvolver(){return node();}createStereoPanner(){return Object.assign(node(),{pan:param()});}
    createBuffer(channels,length,rate){const data=Array.from({length:channels},()=>new Float32Array(length));const b={length,sampleRate:rate,duration:length/rate,getChannelData:i=>data[i]};buffers.push(b);return b;}
    createBufferSource(){const s=Object.assign(node(),{playbackRate:param(),starts:[],stops:[],start(t){this.starts.push(t);},stop(t){this.stops.push(t);}});sources.push(s);return s;}
  }
  const context={MBS2GuitarSamples:bank,AudioContext:Context,atob:s=>Buffer.from(s,'base64').toString('binary'),console};vm.createContext(context);vm.runInContext(fs.readFileSync('audio.js','utf8'),context);
  return {audio:context.MBS2Audio,sources,buffers,nodes,get ctx(){return ctx;}};
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
  return checks;
};
