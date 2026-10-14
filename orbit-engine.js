/* Connection priority is an explicit heuristic, never a probability of progression. */
(function(root){
  'use strict';
  const T=root.MBS2Theory||(typeof require!=='undefined'?require('./theory.js'):null),Atlas=root.MBS2HarmonyAtlas||(typeof require!=='undefined'?require('./harmony-atlas.js'):null);
  const key=chord=>chord?.pitchClasses?chord.rootPc+':'+[...new Set(chord.pitchClasses)].sort((a,b)=>a-b).join(','):'';
  const distance=(a,b)=>Math.min(T.mod(a-b),T.mod(b-a));
  function proximity(a,b){
    let small=[...new Set(a.pitchClasses)],large=[...new Set(b.pitchClasses)];if(small.length>large.length)[small,large]=[large,small];
    const memo=new Map();function visit(i,mask){if(i===small.length)return 0;const k=i+':'+mask;if(memo.has(k))return memo.get(k);let cost=Infinity;for(let j=0;j<large.length;j++)if(!(mask&(1<<j)))cost=Math.min(cost,distance(small[i],large[j])+visit(i+1,mask|(1<<j)));memo.set(k,cost);return cost;}
    const cost=visit(0,0)+(large.length-small.length)*3,average=cost/Math.max(1,large.length);return {cost,average,closeness:1/(1+average)};
  }
  function recommendations(anchor,graph,{scope='context',limit=24,preference='sharp'}={}){
    if(!anchor?.pitchClasses?.length)return [];
    const nodes=new Map(),put=node=>{const record=node.record;if(record?.pitchClasses?.length&&!nodes.has(key(record)))nodes.set(key(record),{...node,key:key(record)});};
    graph.nodes.forEach(put);const relation=Atlas.plr(anchor);
    relation?.neighbors.forEach(n=>put({id:'orbit-plr-'+n.operation,record:n.record,symbol:n.record.symbol,degree:n.operation,kind:'plr',role:'color',plr:n.operation,projected:relation.projected}));
    if(scope==='all')for(let pc=0;pc<12;pc++)for(const type of T.CHORD_TYPES){const record=T.buildChord(T.noteName(pc,preference),type.id);put({id:'orbit-'+pc+'-'+type.id,record,symbol:record.symbol,degree:'◇',kind:'catalogue',role:'color'});}
    const contextualNode=record=>{const exact=graph.nodes.find(n=>n.kind==='diatonic'&&key(n.record)===key(record));if(exact)return exact;if(record.pitchClasses.some(pc=>!graph.analysis.scale.pcs.includes(pc)))return null;const core=Atlas.triadCore(record);return core?graph.nodes.find(n=>n.kind==='diatonic'&&key(Atlas.triadCore(n.record))===key(core)):null;};
    const sourceIds=new Set(graph.nodes.filter(n=>key(n.record)===key(anchor)).map(n=>n.id)),sourceNode=contextualNode(anchor),sourceDegree=sourceNode?.degreeNumber,centre=graph.analysis.scale.rootPc;
    return Array.from(nodes.values()).filter(n=>n.key!==key(anchor)).map(node=>{
      const target=node.record,common=anchor.pitchClasses.filter(pc=>target.pitchClasses.includes(pc)),p=proximity(anchor,target),evidence=[];
      let directed=0;
      for(const edge of graph.edges)if(sourceIds.has(edge.from)&&graph.nodes.some(n=>n.id===edge.to&&key(n.record)===node.key)){
        const value=edge.kind==='dom-tonic'||edge.kind==='primary-edge'||edge.kind==='secondary-edge'?1:edge.kind==='prep-dom'?.9:edge.kind==='deceptive'?.8:edge.kind==='borrowed-edge'?.45:.6;if(value>directed){directed=value;evidence.unshift({kind:'directed',label:edge.label});}
      }
      if(graph.functional){
        const targetNode=contextualNode(target),degree=targetNode?.degreeNumber;
        const dominant=anchor.rootPc===T.mod(centre+7)&&anchor.pitchClasses.includes(T.mod(centre+11))&&(anchor.pitchClasses.length===3&&anchor.pitchClasses.includes(T.mod(centre+2))||anchor.pitchClasses.includes(T.mod(centre+5)));
        if(dominant&&degree===1){directed=Math.max(directed,1);evidence.unshift({kind:'resolution',label:'V → '+targetNode.degree});}
        else if(sourceDegree===1&&degree&&[2,4,5].includes(degree)){directed=Math.max(directed,.64);evidence.push({kind:'context',label:sourceNode.degree+' → '+targetNode.degree});}
        else if(sourceDegree===4&&degree===1){directed=Math.max(directed,.72);evidence.push({kind:'context',label:sourceNode.degree+' → '+targetNode.degree});}
        else if(sourceDegree===7&&anchor.pitchClasses.includes(T.mod(centre+11))&&degree===1){directed=Math.max(directed,.94);evidence.push({kind:'context',label:sourceNode.degree+' → '+targetNode.degree});}
      }
      const incoming=graph.edges.some(e=>sourceIds.has(e.to)&&graph.nodes.some(n=>n.id===e.from&&key(n.record)===node.key));if(incoming)evidence.push({kind:'incoming',label:anchor.symbol});
      if(node.plr)evidence.push({kind:'plr',label:node.plr,projected:node.projected});
      if(common.length)evidence.push({kind:'common',count:common.length});
      const ratio=2*common.length/(anchor.pitchClasses.length+target.pitchClasses.length),score=(graph.functional ? .5*directed+.3*p.closeness+.2*ratio : .6*p.closeness+.4*ratio)*100;
      if(!evidence.length)evidence.push({kind:'colour',label:'12-TET'});
      return {...node,score:Number(score.toFixed(2)),directed,common,proximity:p,evidence,outside:target.pitchClasses.filter(pc=>!graph.analysis.scale.pcs.includes(pc))};
    }).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key)).slice(0,limit);
  }
  function spatialLayout(recommendations,width=900,{initial=false}={}){
    width=Math.max(240,width);const mobile=width<650,height=mobile?350:520,cardWidth=mobile?76:112,cardHeight=mobile?58:74,centre={x:width/2,y:height/2,width:mobile?90:122,height:mobile?82:110};
    const maxR=height/2-cardHeight/2-14,minR=Math.min(maxR,mobile?102:145),n=Math.min(recommendations.length,mobile?(width<330?4:6):8),positions=[],rects=[{x:centre.x,y:centre.y,w:centre.width,h:centre.height}];
    for(let i=0;i<n;i++){
      const r0=Math.max(minR+(maxR-minR)*i/Math.max(1,n-1),positions.length?positions.at(-1).radius+1:minR);let found=null;
      for(let r=r0;r<=maxR+.1&&!found;r+=3)for(let k=0;k<72;k++){
        const angle=(-90+i*137.508+k*5)*Math.PI/180,x=centre.x+Math.cos(angle)*r,y=centre.y+Math.sin(angle)*r;
        if(x-cardWidth/2<10||x+cardWidth/2>width-10||y-cardHeight/2<10||y+cardHeight/2>height-10)continue;
        if(rects.some(a=>Math.abs(x-a.x)<(a.w+cardWidth)/2+6&&Math.abs(y-a.y)<(a.h+cardHeight)/2+6))continue;
        found={key:recommendations[i].key,x,y,radius:r,z:24-i*6,rank:i,score:recommendations[i].score};break;
      }
      if(found){positions.push(found);rects.push({x:found.x,y:found.y,w:cardWidth,h:cardHeight});}
    }
    return {width,height,cardWidth,cardHeight,centre,positions};
  }
  const API=Object.freeze({key,proximity,recommendations,spatialLayout});root.GBOrbitEngine=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
