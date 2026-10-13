/* Real, locally embedded nylon-guitar recordings; no oscillators or network.
   Fractional MIDI values retune samples without rounding makam coordinates. */
(function(root){
  'use strict';
  const bank=root.MBS2GuitarSamples||(typeof require!=='undefined'?require('./guitar-samples.js'):null);
  let context=null,master=null,room=null,wet=null,generation=0;
  let timeline=[];
  const buffers=new Map(),voices=new Set(),MAX_VOICES=48;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const clean=midis=>[...new Set(midis.map(Number).filter(n=>Number.isFinite(n)&&n>=12&&n<=108))].sort((a,b)=>a-b);
  function selectSample(midi){
    if(!bank?.records?.length)throw new Error('Gitar ses verileri yüklenemedi.');
    return bank.records.reduce((best,s)=>Math.abs(s.midi-midi)<Math.abs(best.midi-midi)?s:best);
  }
  function samplePlan(midi){const sample=selectSample(Number(midi)),sourceDetuneCents=Number(sample.detuneCents)||0;return {sampleMidi:sample.midi,sourceDetuneCents,playbackRate:Math.pow(2,(Number(midi)-sample.midi)/12-sourceDetuneCents/1200),duration:sample.frames/sample.sampleRate};}
  function roomImpulse(ctx){
    const length=Math.round(ctx.sampleRate*.32),impulse=ctx.createBuffer(2,length,ctx.sampleRate);
    let seed=971;for(let channel=0;channel<2;channel++){const data=impulse.getChannelData(channel);for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=((seed/4294967296)*2-1)*Math.pow(1-i/length,3)*.12;}}
    return impulse;
  }
  function ensure(){
    const Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx)throw new Error('Bu tarayıcıda Web Audio bulunamadı.');
    if(!context){
      context=new Ctx();master=context.createGain();master.gain.value=.78;
      const compressor=context.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=18;compressor.ratio.value=3;compressor.attack.value=.008;compressor.release.value=.18;
      master.connect(compressor);compressor.connect(context.destination);
      room=context.createConvolver();room.buffer=roomImpulse(context);wet=context.createGain();wet.gain.value=.085;room.connect(wet);wet.connect(master);
    }
    return context;
  }
  function getBuffer(sample){
    if(buffers.has(sample.midi))return buffers.get(sample.midi);
    const raw=root.atob(sample.pcm),buffer=context.createBuffer(1,sample.frames,sample.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<sample.frames;i++){let value=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);if(value>32767)value-=65536;data[i]=value/32768;}
    buffers.set(sample.midi,buffer);return buffer;
  }
  function releaseVoice(voice,at,fade=.04){
    try{voice.gain.gain.cancelScheduledValues(at);voice.gain.gain.setValueAtTime(voice.level,at);voice.gain.gain.linearRampToValueAtTime(0,at+fade);voice.source.stop(at+fade+.005);}catch(_){}
  }
  function stop(){
    generation++;timeline=[];const now=context?.currentTime||0;
    for(const voice of voices){
      if(voice.when>now){try{voice.source.stop(now);}catch(_){}}
      else releaseVoice(voice,now);
    }
    voices.clear();
  }
  function strike(midi,when,{duration=3.8,velocity=.75,pan=0,volume=1,metadata={}}={}){
    const ctx=context,sample=selectSample(midi),plan=samplePlan(midi),source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    source.buffer=getBuffer(sample);source.playbackRate.setValueAtTime(plan.playbackRate,when);
    filter.type='lowpass';filter.frequency.value=clamp(4800+velocity*5000,2500,10000);filter.Q.value=.3;
    const actualDuration=Math.min(Math.max(.1,duration),plan.duration/plan.playbackRate),level=clamp(velocity,.05,1)*.72*volume,end=when+actualDuration;
    gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(level,when+.004);gain.gain.setValueAtTime(level,Math.max(when+.005,end-.12));gain.gain.linearRampToValueAtTime(0,end);
    source.connect(filter);filter.connect(gain);
    let panner=null;if(ctx.createStereoPanner){panner=ctx.createStereoPanner();panner.pan.value=pan;gain.connect(panner);panner.connect(master);panner.connect(room);}else{gain.connect(master);gain.connect(room);}
    const voice={source,gain,when,level};
    if(voices.size>=MAX_VOICES){const oldest=voices.values().next().value;releaseVoice(oldest,ctx.currentTime);voices.delete(oldest);}
    voices.add(voice);source.onended=()=>{voices.delete(voice);for(const node of [source,filter,gain,panner])try{node?.disconnect();}catch(_){}};
    source.start(when);source.stop(end+.01);timeline.push({midi,start:when,end,...metadata});return voice;
  }
  function getPlayback(){
    if(!context)return {events:[],time:0,token:generation};
    // Output timestamp follows sound reaching the device, including output latency.
    const stamp=context.getOutputTimestamp?.();
    const time=stamp?.performanceTime>0&&root.performance?Math.min(context.currentTime,stamp.contextTime+(root.performance.now()-stamp.performanceTime)/1000):Math.max(0,context.currentTime-(context.outputLatency||0));
    return {events:timeline,time,token:generation};
  }
  async function begin(){
    stop();const token=generation,ctx=ensure();if(ctx.state==='suspended')await ctx.resume();
    return {ctx,token,valid:token===generation};
  }
  async function playNotes(midis,{duration=3.8,velocity=.78,strumMs=11}={}){
    const notes=clean(midis),{ctx,token,valid}=await begin();if(!valid||token!==generation||!notes.length)return token;
    const now=ctx.currentTime+.018,volume=1/Math.sqrt(Math.max(1,notes.length/2));
    notes.forEach((m,i)=>strike(m,now+i*clamp(strumMs,0,30)/1000,{duration,velocity:velocity*(1-i*.018),pan:notes.length===1?0:(i/(notes.length-1)-.5)*.28,volume}));return token;
  }
  async function playArpeggio(midis,{bpm=92,direction='up',step=.28,noteDuration=2.8}={}){
    let notes=clean(midis);if(direction==='down')notes.reverse();else if(direction==='up-down')notes=[...notes,...notes.slice(1,-1).reverse()];
    const spacing=Number.isFinite(bpm)?30/clamp(bpm,30,240):step;
    const {ctx,token,valid}=await begin();if(!valid||token!==generation||!notes.length)return 0;
    const now=ctx.currentTime+.018;notes.forEach((m,i)=>strike(m,now+i*spacing,{duration:noteDuration,velocity:.74+(i%3)*.025,pan:(i%2?1:-1)*.045,volume:.78}));
    return notes.length*spacing;
  }
  async function playProgression(chords,{arpeggio=false,bpm=88,repeat=false}={}){
    const {ctx,token,valid}=await begin();if(!valid||token!==generation)return 0;const beat=60/clamp(bpm,30,240),now=ctx.currentTime+.018;let offset=0;
    for(let pass=0;pass<(repeat?2:1);pass++)for(const item of chords){const notes=clean(item.midis||[]),seconds=clamp(Number(item.beats)||4,1,8)*beat;notes.forEach((m,i)=>strike(m,now+offset+i*(arpeggio?beat*.5:.011),{duration:Math.max(.3,seconds*.92),volume:1/Math.sqrt(Math.max(1,notes.length/2))}));offset+=seconds;}
    return offset;
  }
  async function playSequence(midis,{spacing=.7,noteDuration=.55}={}){
    const notes=midis.map(Number).filter(n=>Number.isFinite(n)&&n>=12&&n<=108),{ctx,token,valid}=await begin();if(!valid||token!==generation||!notes.length)return 0;
    const now=ctx.currentTime+.018;notes.forEach((m,i)=>strike(m,now+i*clamp(spacing,.1,2),{duration:noteDuration,velocity:.8,volume:.78}));return notes.length*spacing;
  }
  async function playVoicingRoute(nodes,{bpm=92,arpeggio=false}={}){
    const {ctx,token,valid}=await begin();if(!valid||token!==generation)return 0;
    const beat=60/clamp(bpm,30,240),start=ctx.currentTime+.025;let offset=0;
    nodes.forEach((node,stepIndex)=>{
      const notes=(node.events||[]).filter(n=>Number.isFinite(n.midi)&&n.midi>=12&&n.midi<=108),seconds=(node.beats||4)*beat;
      notes.forEach((note,i)=>{const delay=arpeggio?i*seconds/Math.max(notes.length,1)*.75:i*.012;strike(note.midi,start+offset+delay,{duration:Math.max(.1,seconds*.94-delay),velocity:.76,volume:1/Math.sqrt(Math.max(1,notes.length/2)),pan:(note.stringIndex/Math.max(1,notes.length-1)-.5)*.2,metadata:{stepIndex,position:{stringIndex:note.stringIndex,fret:note.fret,midi:note.midi},stepStart:start+offset,stepEnd:start+offset+seconds}});});offset+=seconds;
    });return offset;
  }
  const API=Object.freeze({playNotes,playArpeggio,playSequence,playProgression,playVoicingRoute,stop,getPlayback,samplePlan,metadata:bank?.metadata});root.MBS2Audio=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
