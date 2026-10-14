/* Abstract harmonic relationships. Physical guitar voice routes belong to Motion. */
(function(root){
  'use strict';
  const T=root.MBS2Theory||(typeof require!=='undefined'?require('./theory.js'):null);
  const SOURCES={functions:'https://musictheory.pugetsound.edu/mt21c/HarmonicFunctionInClassicalMusic.html',plr:'https://mtosmt.org/issues/mto.19.25.2/mto.19.25.2.plotkin.php',fifths:'https://musictheory.pugetsound.edu/mt21c/CircleOfFifths.html'};
  function triadCore(chord){
    if(!chord||!Number.isFinite(chord.rootPc))return null;
    const intervals=chord.pitchClasses.map(pc=>T.mod(pc-chord.rootPc));
    const type=intervals.includes(7)?intervals.includes(4)&&!intervals.includes(3)?'major':intervals.includes(3)&&!intervals.includes(4)?'minor':null:null;
    return type?T.buildChord(chord.root,type):null;
  }
  function plr(chord){
    const core=triadCore(chord);if(!core)return null;
    const major=core.typeId==='major',typeId=major?'minor':'major';
    const changes=[['P',0,1],['L',major?4:8,major?3:6],['R',major?9:3,major?6:3]];
    return {core,projected:chord.pitchClasses.length!==3,source:SOURCES.plr,neighbors:changes.map(([operation,offset,degree])=>{
      const record=T.buildChord(T.spelling(core.root,degree,core.rootPc+offset),typeId);
      const common=core.pitchClasses.filter(pc=>record.pitchClasses.includes(pc)),from=core.notes.find(n=>!common.includes(n.pc)),to=record.notes.find(n=>!common.includes(n.pc));
      return {operation,record,common,from:from.name,to:to.name,semitones:Math.min(T.mod(to.pc-from.pc),T.mod(from.pc-to.pc))};
    })};
  }
  function fifthIndex(pc,center=0){return T.mod((pc-center)*7);}
  function visibleNodes(graph,focus='diatonic',limit=12){
    const primaries=graph.nodes.filter(n=>n.kind==='diatonic');
    if(focus==='all')return [...primaries,...graph.nodes.filter(n=>n.kind!=='diatonic')].slice(0,Math.max(limit,primaries.length));
    if(focus==='diatonic')return primaries.slice(0,limit);
    const related=graph.nodes.filter(n=>n.kind===focus).slice(0,limit),targets=new Set(related.map(n=>n.targetId).filter(Boolean));
    for(const edge of graph.edges)if(related.some(n=>n.id===edge.from))targets.add(edge.to);
    return [...related,...primaries.filter(n=>targets.has(n.id))];
  }
  function layout(nodes,width=700,{lens='functions',functional=true,center=0}={}){
    width=Math.max(240,width);const positions=[],groups=[];
    if(lens==='fifths'){
      const buckets=new Map();nodes.forEach(n=>{const i=fifthIndex(n.rootPc,center);if(!buckets.has(i))buckets.set(i,[]);buckets.get(i).push(n);});
      const max=Math.max(1,...Array.from(buckets.values(),b=>b.length)),radius=Math.min(240,Math.max(110,width*.34)),height=radius*2+120+(max-1)*70,cy=height/2;
      for(const [i,bucket] of buckets){const angle=i*Math.PI/6-Math.PI/2;bucket.forEach((n,j)=>positions.push({id:n.id,x:width/2+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius+(j-(bucket.length-1)/2)*70}));}
      // Very small panels use a pitch-root list: ring cards would overlap there.
      if(width<650||nodes.length>12||max>1){positions.length=0;const sorted=[...nodes].sort((a,b)=>fifthIndex(a.rootPc,center)-fifthIndex(b.rootPc,center));const cols=width<380?2:3;sorted.forEach((n,i)=>positions.push({id:n.id,x:(i%cols+.5)*width/cols,y:52+Math.floor(i/cols)*94}));return {width,height:Math.ceil(nodes.length/cols)*94+28,cardWidth:Math.min(112,width/cols-16),positions,groups,ring:false};}
      return {width,height,cardWidth:96,positions,groups,ring:true,radius,center:{x:width/2,y:cy}};
    }
    const bucket=n=>n.role==='tonic'?0:n.role==='prep'?1:n.role==='dominant'||['primary','secondary','leading','tritone','relatedII'].includes(n.kind)?2:3;
    const approaches=nodes.filter(n=>n.kind!=='diatonic'&&n.targetId),targets=new Set(approaches.map(n=>n.targetId));
    if(approaches.length&&approaches.length===targets.size&&nodes.length===approaches.length*2){
      approaches.forEach((n,i)=>{positions.push({id:n.id,x:width*.27,y:52+i*88},{id:n.targetId,x:width*.73,y:52+i*88});});
      return {width,height:approaches.length*88+20,cardWidth:Math.min(132,width*.4-16),positions,groups,ring:false};
    }
    const allCategories=[['tonic','T'],['prep','PD'],['dominant','D'],['color','◇']],used=allCategories.map((_,i)=>i).filter(i=>nodes.some(n=>bucket(n)===i)),categories=functional?used.map(i=>allCategories[i]):[];
    const columns=width<440?2:width<650?3:functional?Math.max(1,categories.length):4,rowCounts=Array(columns).fill(0),cardWidth=Math.min(132,width/columns-16);
    if(functional&&width>=650){categories.forEach(([role,label],i)=>groups.push({role,label,x:(i+.5)*width/columns}));nodes.forEach(n=>{const col=used.indexOf(bucket(n)),row=rowCounts[col]++;positions.push({id:n.id,x:(col+.5)*width/columns,y:72+row*98});});}
    else nodes.forEach((n,i)=>positions.push({id:n.id,x:(i%columns+.5)*width/columns,y:52+Math.floor(i/columns)*98}));
    return {width,height:Math.max(240,(groups.length?Math.max(...rowCounts):Math.ceil(nodes.length/columns))*98+48),cardWidth,positions,groups,ring:false};
  }
  const API=Object.freeze({SOURCES,triadCore,plr,fifthIndex,visibleNodes,layout});root.MBS2HarmonyAtlas=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
