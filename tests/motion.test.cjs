const assert=require('node:assert/strict');
const T=require('../theory.js'),G=require('../guitar.js'),V=require('../voicing-engine.js'),E=require('../motion-engine.js');
const checks=[];function check(name,fn){fn();checks.push(name);console.log('✓ '+name);}
const standard=G.TUNINGS[0],g7=T.buildChord('G','dominant7'),cmaj=T.buildChord('C','major7');
function node(frets,chord,tuning=standard,capo=0){const shape=V.inspectShape({frets},chord,tuning,capo,{completeness:'practical'});assert(shape);return {shape,chord,events:E.eventsFor(shape,chord,tuning,capo)};}
function conserve(edge){const from=edge.pairs.map(p=>p.from).concat(edge.exits),to=edge.pairs.map(p=>p.to).concat(edge.enters);assert.equal(new Set(from).size,from.length);assert.equal(new Set(to).size,to.length);assert.equal(from.length,edge.from.events.length);assert.equal(to.length,edge.to.events.length);assert.equal(edge.pairs.length,Math.min(from.length,to.length));}
check('G7 → Cmaj7/G uses absolute pitches; B stays while its degree changes',()=>{
  const a=node([3,-1,3,4,3,-1],g7),slash={...cmaj,slashBassPc:7,symbol:'Cmaj7/G'},b=node([3,-1,2,4,1,-1],slash),edge=E.transition(a,b);
  assert.deepEqual(a.events.map(e=>e.midi),[43,53,59,62]);assert.deepEqual(b.events.map(e=>e.midi),[43,52,59,60]);assert.equal(edge.totalSemitones,3);assert.equal(edge.commonCount,2);assert.equal(edge.physicalHoldCount,2);assert(edge.pairs.some(p=>p.from.midi===59&&p.to.midi===59&&p.from.role.degree===3&&p.to.role.degree===7));conserve(edge);
});
check('Octave-displaced pitch classes are not reported as held notes',()=>{const edge=E.transition(node([3,-1,3,4,3,-1],g7),node([-1,3,5,4,5,-1],cmaj));assert.equal(edge.totalSemitones,9);assert.equal(edge.commonCount,1);conserve(edge);});
check('Voice entries/exits are explicit and never erase a leap',()=>{
  const a=node([3,2,3,0,0,-1],g7),b=node([-1,3,2,0,0,-1],cmaj),down=E.transition(a,b),up=E.transition(b,a);assert.equal(down.pairs.length,4);assert.equal(down.exits.length,1);assert.equal(down.enters.length,0);conserve(down);conserve(up);assert.equal(up.enters.length,1);
});
check('Top-note lock uses actual MIDI; strict ascent/descent do not accept holds',()=>{
  const a=node([3,2,3,0,0,-1],g7),b=node([-1,3,2,0,0,-1],cmaj),high=node([-1,-1,10,9,8,7],cmaj);assert(E.transition(a,b,{melody:'hold'}));assert.equal(E.transition(a,high,{melody:'hold'}),null);assert.equal(E.transition(a,b,{melody:'up'}),null);assert.equal(E.transition(a,b,{melody:'down'}),null);
});
check('Unison strings remain separate voices; reentrant tuning is sorted by pitch',()=>{const tuning={notes:['G4','C4','E4','A4']},events=E.eventsFor({frets:[0,0,0,0]},T.buildChord('C','major'),tuning);assert.deepEqual(events.map(e=>e.midi),[60,64,67,69]);assert.equal(events.at(-1).stringIndex,3);const a=[{midi:60,stringIndex:0,fret:0},{midi:60,stringIndex:1,fret:0}],b=[{midi:60,stringIndex:0,fret:0},{midi:60,stringIndex:1,fret:0}];const matched=E.matchVoices(a,b);assert.equal(matched.pairs.length,2);assert.equal(matched.commonCount,2);});
check('Capo and enharmonic octave boundaries preserve sounding pitches',()=>{assert.equal(G.midiFromNote('B#2'),48);assert.equal(G.midiFromNote('Cb3'),47);assert.equal(G.positionMidi(standard,0,2,2),42);assert.equal(G.positionMidi(standard,0,1,2),null);});
check('Context colours are explicit, and actual chord membership wins',()=>{assert.equal(E.roleFor(11,g7).label,'3');assert.equal(E.roleFor(11,cmaj).degree,7);assert.equal(E.roleFor(5,cmaj,[0,2,4,5,7,9,11]).kind,'tension');assert.equal(E.roleFor(5,cmaj,[]).kind,'outside');assert.equal(E.roleFor(0,cmaj).kind,'root');});
check('Complete generated routes are deterministic, playable and carry every chord tone',()=>{
  const records=[T.buildChord('D','minor7'),g7,cmaj],options={maxFret:12,completeness:'full',limit:3},a=E.routes(records,standard,0,options),b=E.routes(records,standard,0,options);assert.equal(a.routes.length,3);assert.deepEqual(a.routes.map(r=>r.key),b.routes.map(r=>r.key));assert.equal(new Set(a.routes.map(r=>r.key)).size,3);assert(a.routes[0].cost<=a.routes[1].cost);
  for(const route of a.routes){for(const n of route.nodes){assert(V.inspectShape(n.shape,n.chord,standard,0,{maxFret:12,completeness:'full'}));assert(n.chord.pitchClasses.every(pc=>n.events.some(e=>e.pc===pc)));assert(n.events.every(e=>e.midi===G.positionMidi(standard,e.stringIndex,e.fret,0)));}for(const edge of route.edges)conserve(edge);assert.equal(route.totalSemitones,route.edges.reduce((n,e)=>n+e.totalSemitones,0));}
});
check('Changed tuning regenerates routes using its actual open strings',()=>{const tuning=G.TUNINGS.find(t=>t.id==='ukuleleHighG'),result=E.routes([g7,cmaj],tuning,0,{maxFret:12});assert(result.routes.length);for(const r of result.routes)for(const n of r.nodes)for(const e of n.events)assert.equal(e.midi,G.positionMidi(tuning,e.stringIndex,e.fret,0));});
console.log(checks.length+' meaningful motion checks passed');
