/* Tonal harmony diagram: three function regions, cluster circles, secondary-dominant pairs and arrows.
   model() and regionOf() are pure; render() draws one inline SVG with an HTML button for every chord. */
(function(root){
  'use strict';
  const T=root.MBS2Theory||(typeof require!=='undefined'?require('./theory.js'):null);
  const W=1000,H=660,J={x:505,y:292},CENTRE={x:508,y:366,r:30};
  const CLUSTERS={S:{x:327,y:262,r:70},D:{x:812,y:258,r:70},T:{x:510,y:466,r:68}};
  // The three lines leave the junction upward, to the lower left and to the lower right.
  const LINES=[[J.x,J.y,J.x,0],[J.x,J.y,0,438],[J.x,J.y,W,422]];
  const lineLeft=x=>J.y+(J.x-x)*(438-J.y)/J.x,lineRight=x=>J.y+(x-J.x)*(422-J.y)/(W-J.x);
  function regionOf(p){return p.x<=J.x?(p.y<lineLeft(p.x)?'S':'T'):(p.y<lineRight(p.x)?'D':'T');}
  // Chords that sit as free labels in the reference layout, keyed by semitones above the tonic.
  const FREE={0:CENTRE,2:{x:395,y:178},4:{x:762,y:416},5:{x:262,y:190},7:{x:888,y:192},9:{x:636,y:466},11:{x:872,y:334}};
  const FUNCTION_AT={0:'T',1:'S',2:'S',3:'T',4:'T',5:'S',6:'D',7:'D',8:'S',9:'T',10:'D',11:'D'};
  const SLOTS=[[-.48,-.5],[.48,-.5],[-.55,0],[.55,0],[-.48,.5],[.48,.5]];
  const NUMERALS={0:'I',1:'♭II',2:'II',3:'♭III',4:'III',5:'IV',6:'♯IV',7:'V',8:'♭VI',9:'VI',10:'♭VII',11:'VII'};
  const SUFFIX={major:'',major7:'△',dominant7:'7',minor:'',minor7:'7',halfDim7:'7♭5',dim7:'°7',diminished:'°',major6:'6',minor6:'6',minorMajor7:'(△)',augmented:'+',sus4:'sus4'};
  // Secondary-dominant groups: target offset, letter distance, centre and whether a half-diminished ii variant is drawn.
  const PAIRS=[
    {key:'II',label:'II',offset:2,degree:2,x:360,y:100,half:true,viiDx:22},{key:'V',label:'V',offset:7,degree:5,x:828,y:105,half:true,viiDx:22},
    {key:'IV',label:'IV',offset:5,degree:4,x:118,y:205,half:true},{key:'bVII',label:'♭VII',offset:10,degree:7,x:612,y:205,half:false},
    {key:'bVI',label:'♭VI',offset:8,degree:6,x:158,y:395,half:false},{key:'bIII',label:'♭III',offset:3,degree:3,x:300,y:508,half:false},
    {key:'III',label:'III',offset:4,degree:3,x:842,y:492,half:false},{key:'VI',label:'VI',offset:9,degree:6,x:640,y:588,half:false}
  ];
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const round=n=>Math.round(n*10)/10;

  function romanLabel(record,tonicPc){
    const offset=T.mod(record.rootPc-tonicPc),type=record.typeId,base=NUMERALS[offset];
    const lower=['minor','minor7','minor6','minorMajor7','halfDim7','diminished'].includes(type);
    const numeral=lower?base.replace(/[IV]+/,m=>m.toLowerCase()):base;
    const suffix=type in SUFFIX?SUFFIX[type]:(T.CHORD_TYPES.find(t=>t.id===type)?.symbol||'');
    return numeral+suffix;
  }
  function makeNode(record,id,kind,degree,extra={}){
    return {id,kind,role:kind,root:record.root,rootPc:record.rootPc,symbol:record.symbol,chordId:record.typeId,pitchClasses:record.pitchClasses,notes:record.pitchClasses,noteNames:record.notes.map(n=>n.name),intervals:record.intervals||record.notes,functionLabel:extra.functionLabel||'',record,degree,...extra};
  }
  function pairChords(rootText,tonicPc,pair){
    const targetPc=T.mod(tonicPc+pair.offset),target=T.spelling(rootText,pair.degree,targetPc);
    const nameAt=(degree,semitones)=>T.spelling(target,degree,T.mod(targetPc+semitones));
    return {target,ii:T.buildChord(nameAt(2,2),'minor7'),half:T.buildChord(nameAt(2,2),'halfDim7'),v:T.buildChord(nameAt(5,7),'dominant7'),vii:T.buildChord(nameAt(7,-1),'dim7')};
  }
  // Adds the chords the diagram needs beyond the engine graph (secondary groups, cadential 6/4 and sus4).
  function augment(graph){
    if(!graph||graph._diagram||!graph.functional||!graph.nodes.length)return graph;
    const rootText=graph.root,tonicPc=T.parseNote(rootText);
    for(const pair of PAIRS){
      const c=pairChords(rootText,tonicPc,pair),target=pair.label;
      graph.nodes.push(
        makeNode(c.ii,'pair-'+pair.key+'-ii','mapPairII','ii7/'+target,{pairKey:pair.key,targetLabel:target,functionLabel:'İlgili ii–V'}),
        makeNode(c.v,'pair-'+pair.key+'-v','mapPairV','V7/'+target,{pairKey:pair.key,targetLabel:target,functionLabel:'İkincil dominant'}),
        makeNode(c.vii,'pair-'+pair.key+'-vii','mapPairVii','VII°7/'+target,{pairKey:pair.key,targetLabel:target,functionLabel:'Öncü ses eksik yedili'}));
      if(pair.half)graph.nodes.push(makeNode(c.half,'pair-'+pair.key+'-half','mapPairHalf','ii7♭5/'+target,{pairKey:pair.key,targetLabel:target,functionLabel:'İlgili ii–V (minör hedef)'}));
    }
    const fifthName=T.spelling(rootText,5,T.mod(tonicPc+7)),major=T.buildChord(rootText,'major');
    const sixFour=Object.freeze({...major,symbol:rootText+'/'+fifthName,slashBassPc:T.mod(tonicPc+7)});
    const sus=T.buildChord(fifthName,'dominant7',{add:['add11'],omit:[3]});
    graph.nodes.push(makeNode(sixFour,'cadential-64','cadential','I⁶₄',{functionLabel:'Kadans 6/4'}),makeNode(Object.freeze({...sus,symbol:fifthName+'7sus4'}),'cadential-sus4','cadential','V7sus4',{functionLabel:'Askıya alınmış dominant'}));
    graph._diagram=true;return graph;
  }
  function tone(node){
    if(node.kind==='tritone')return 'sub';
    if(['mapPairII','mapPairHalf','mapPairV'].includes(node.kind))return 'dom';
    if(node.kind==='mapPairVii'||node.kind==='commonTone'||node.kind==='cadential'||node.chordId==='dim7')return 'color';
    if(node.chordId==='dominant7'||node.role==='dominant'||node.chordId==='halfDim7')return 'dom';
    return 'main';
  }
  function borrowedOffset(node,tonicPc){return T.mod(node.rootPc-tonicPc);}
  // Pure layout: positions every chord of the graph inside the 1000×660 space.
  function model(graph,{labels='roman'}={}){
    if(!graph||!graph.functional||!graph.nodes.length)return {notice:'nonfunctional',items:[],clusters:[],pairs:[],arrows:[],lines:LINES,width:W,height:H};
    const tonicPc=T.parseNote(graph.root),items=[],byId=new Map(),alias=new Map(),claimed=new Set(),fill={S:0,D:0,T:0};
    const text=(node,roman)=>labels==='names'?node.symbol:roman;
    const place=(node,x,y,extra={})=>{
      const roman=extra.roman||(node.kind.startsWith('mapPair')?node.degree:romanLabel(node.record,tonicPc)),item={id:node.id,node,x:round(x),y:round(y),roman,label:text(node,roman),tone:tone(node),kind:node.kind,region:regionOf({x,y}),...extra};
      items.push(item);byId.set(node.id,item);return item;
    };
    const inCluster=(node,func,extra={})=>{
      const c=CLUSTERS[func],index=fill[func]++;
      if(index<SLOTS.length)return place(node,c.x+SLOTS[index][0]*c.r,c.y+SLOTS[index][1]*c.r,{cluster:func,...extra});
      // Overflow rings the circle on the side facing away from the junction.
      const angle=Math.atan2(c.y-J.y,c.x-J.x)+(index-SLOTS.length-1)*.5,distance=c.r+38;
      return place(node,c.x+Math.cos(angle)*distance,c.y+Math.sin(angle)*distance,{cluster:func,...extra});
    };
    const byKind=kind=>graph.nodes.filter(n=>n.kind===kind);
    for(const node of [...byKind('diatonic'),...byKind('borrowed')]){
      const offset=borrowedOffset(node,tonicPc),free=FREE[offset];
      if(free&&!claimed.has(offset)){claimed.add(offset);place(node,free.x,free.y,{circle:offset===0?CENTRE.r:offset===4?18:0});}
      else inCluster(node,FUNCTION_AT[offset]);
    }
    const dominantKey=items.find(i=>i.kind==='diatonic'&&borrowedOffset(i.node,tonicPc)===7);
    for(const node of byKind('primary')){
      const key=n=>[...n.pitchClasses].sort((a,b)=>a-b).join(),duplicate=items.find(i=>key(i.node)===key(node));
      if(duplicate)alias.set(node.id,duplicate.id);else place(node,dominantKey?.x+58||946,(dominantKey?.y||192)+48,{roman:'V7'});
    }
    for(const node of byKind('chromatic').filter(n=>n.id==='neapolitan'))inCluster(node,'D',{roman:'N⁶'});
    for(const node of byKind('leading').filter(n=>n.id==='leading-1'))inCluster(node,'D');
    for(const node of byKind('tritone').filter(n=>n.id==='tritone-1'))place(node,735,322,{roman:'subV7',circle:0});
    for(const node of byKind('commonTone'))place(node,524,552,{roman:'I°7'});
    // Cadential 6/4 and sus4 cluster beside the dominant.
    const dom=dominantKey||{x:888,y:192};
    for(const [id,x,y,roman] of [['cadential-64',dom.x+58,dom.y-30,'I⁶₄'],['cadential-sus4',dom.x+48,dom.y+22,'V7sus4']]){const node=graph.nodes.find(n=>n.id===id);if(node)place(node,x,y,{roman,satellite:true,circle:id==='cadential-64'?0:0});}
    // Secondary groups: left ring (ii), right ring (V7), diminished label, bracket, and an arrow to the target chord.
    const pairs=PAIRS.map(pair=>{
      const nodes={ii:graph.nodes.find(n=>n.id==='pair-'+pair.key+'-ii'),v:graph.nodes.find(n=>n.id==='pair-'+pair.key+'-v'),vii:graph.nodes.find(n=>n.id==='pair-'+pair.key+'-vii'),half:graph.nodes.find(n=>n.id==='pair-'+pair.key+'-half')};
      if(!nodes.ii)return null;
      const {x,y}=pair,left={x:x-44,y:y+8,r:36},right={x:x+42,y,r:36};
      const result={key:pair.key,label:pair.label,offset:pair.offset,x,y,left,right,half:nodes.half?{x:x-52,y:y+16,r:15}:null,
        bracket:{x1:x-80,x2:x+78,y:y+54},link:{x1:left.x+left.r,y1:left.y-3,x2:right.x-right.r,y2:right.y+2},ids:{ii:nodes.ii.id,v:nodes.v.id,vii:nodes.vii.id,half:nodes.half?.id||null}};
      place(nodes.ii,x-36,y-38,{pair:pair.key,slot:'ii'});place(nodes.v,x+86,y-38,{pair:pair.key,slot:'v'});place(nodes.vii,x+(pair.viiDx??76),y+44,{pair:pair.key,slot:'vii'});
      if(nodes.half)place(nodes.half,x-50,y+19,{pair:pair.key,slot:'half',small:true});
      return result;
    }).filter(Boolean);
    // Arrows between displayed chords. Direction is from → to; kind picks the stroke.
    const arrows=[],at=id=>byId.get(id)||byId.get(alias.get(id));
    const targetFor=offset=>items.find(i=>i.kind==='diatonic'&&borrowedOffset(i.node,tonicPc)===offset)||items.find(i=>i.kind==='borrowed'&&borrowedOffset(i.node,tonicPc)===offset)||null;
    for(const pair of pairs){
      const target=targetFor(pair.offset),from=at(pair.ids.v);
      const to=target?{x:target.x,y:target.y,id:target.id,margin:24}:{x:CLUSTERS[FUNCTION_AT[pair.offset]].x,y:CLUSTERS[FUNCTION_AT[pair.offset]].y,id:null,margin:CLUSTERS[FUNCTION_AT[pair.offset]].r};
      arrows.push({id:'arrow-'+pair.key,kind:'secondary',from:from.id,to:to.id,x1:pair.right.x+pair.right.r*.55,y1:pair.right.y-pair.right.r*.8,x2:to.x,y2:to.y,margin:to.margin,bend:.22});
    }
    const centre=items.find(i=>i.kind==='diatonic'&&borrowedOffset(i.node,tonicPc)===0);
    for(const edge of graph.edges){
      const a=at(edge.from),b=at(edge.to);if(!a||!b||a===b)continue;
      const style={'dom-tonic':['tonic',-.3],'prep-dom':['prep',.28],'deceptive':['return',.3],'chromatic-edge':a.kind==='chromatic'?['tonic',.3]:null,'tritone-edge':a.kind==='tritone'?['sub',.1]:null,'modal':['return',.3]}[edge.kind];
      if(!style)continue;
      arrows.push({id:'edge-'+edge.from+'-'+edge.to,kind:style[0],from:a.id,to:b.id,x1:a.x,y1:a.y,x2:b.x,y2:b.y,margin:b.circle?b.circle+6:22,bend:style[1],label:edge.label});
    }
    return {notice:null,items,clusters:Object.entries(CLUSTERS).map(([func,c])=>({func,...c})),centre:{...CENTRE,id:centre?.id||null},pairs,arrows,lines:LINES,width:W,height:H,tonicPc};
  }
  const icons={
    S:'<path d="M2 36 L24 6 L33 20 L41 12 L62 36 Z" fill="currentColor" opacity=".55"/><path d="M24 6 L19 14 L24 12 L28 15 Z" fill="currentColor"/>',
    D:'<path d="M4 38 Q32 48 60 36 L54 42 Q32 50 10 44 Z" fill="currentColor" opacity=".7"/><path d="M30 6 V36 H12 Z M34 14 V36 H54 Z" fill="currentColor" opacity=".55"/>',
    T:'<path d="M2 24 L22 4 L42 24 V40 H2 Z" fill="currentColor" opacity=".55"/><rect x="16" y="26" width="12" height="14" fill="#111" opacity=".6"/>'
  };
  function curve(a,b,bend){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,mx=(a.x+b.x)/2+nx*len*bend,my=(a.y+b.y)/2+ny*len*bend;
    return 'M'+round(a.x)+' '+round(a.y)+' Q'+round(mx)+' '+round(my)+' '+round(b.x)+' '+round(b.y);
  }
  // Shorten both ends of a curve so arrowheads stop at the label instead of covering it.
  function arrowPath(arrow){
    const a={x:arrow.x1,y:arrow.y1},b={x:arrow.x2,y:arrow.y2},len=Math.hypot(b.x-a.x,b.y-a.y)||1,ux=(b.x-a.x)/len,uy=(b.y-a.y)/len;
    const start={x:a.x+ux*(arrow.kind==='secondary'?0:24),y:a.y+uy*(arrow.kind==='secondary'?0:24)},end={x:b.x-ux*arrow.margin,y:b.y-uy*arrow.margin};
    return curve(start,end,arrow.bend);
  }
  function svgMarkup(m,words){
    let s='<svg class="hm-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>'+['tonic','sub','prep'].map(k=>'<marker id="hm-head-'+k+'" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" class="hm-head hm-head-'+k+'"/></marker>').join('')+'</defs>';
    s+='<g class="hm-regions">'+m.lines.map(l=>'<line x1="'+l[0]+'" y1="'+l[1]+'" x2="'+l[2]+'" y2="'+l[3]+'"/>').join('')+'</g>';
    s+='<g class="hm-icons">'+['S','D','T'].map(k=>{const p={S:[18,14],D:[928,368],T:[18,604]}[k];return '<g transform="translate('+p[0]+' '+p[1]+')" class="hm-icon"><title>'+escape(words[k])+'</title>'+icons[k]+'</g>';}).join('')+'</g>';
    s+='<g class="hm-clusters">'+m.clusters.map(c=>'<circle class="hm-cluster" data-func="'+c.func+'" cx="'+c.x+'" cy="'+c.y+'" r="'+c.r+'"/>').join('')+'<circle class="hm-centre" cx="'+m.centre.x+'" cy="'+m.centre.y+'" r="'+m.centre.r+'"/>';
    for(const i of m.items)if(i.circle&&i.id!==m.centre.id)s+='<circle class="hm-ring" cx="'+i.x+'" cy="'+i.y+'" r="'+i.circle+'"/>';
    s+='</g><g class="hm-pairs">';
    for(const p of m.pairs){
      s+='<g class="hm-pair" data-pair="'+p.key+'"><circle class="hm-ring" cx="'+p.left.x+'" cy="'+p.left.y+'" r="'+p.left.r+'"/><circle class="hm-ring" cx="'+p.right.x+'" cy="'+p.right.y+'" r="'+p.right.r+'"/>';
      if(p.half)s+='<circle class="hm-half" cx="'+p.half.x+'" cy="'+p.half.y+'" r="'+p.half.r+'"/>';
      s+='<line class="hm-link" x1="'+p.link.x1+'" y1="'+p.link.y1+'" x2="'+p.link.x2+'" y2="'+p.link.y2+'"/><path class="hm-bracket" d="M'+p.bracket.x1+' '+(p.bracket.y-7)+' V'+p.bracket.y+' H'+p.bracket.x2+' V'+(p.bracket.y-7)+'"/></g>';
    }
    s+='</g><g class="hm-arrows">'+m.arrows.map(a=>'<path class="hm-arrow hm-arrow-'+a.kind+(a.kind==='prep'||a.kind==='return'?' hm-soft':'')+'" data-from="'+escape(a.from||'')+'" data-to="'+escape(a.to||'')+'" d="'+arrowPath(a)+'" marker-end="url(#hm-head-'+(a.kind==='sub'?'sub':a.kind==='prep'||a.kind==='return'?'prep':'tonic')+')"/>').join('')+'</g></svg>';
    return s;
  }
  function render(container,graph,activeId,{onSelect=()=>{},onAction=()=>{},language='en',labels='roman',zoom=1}={}){
    const L=(tr,en)=>language==='tr'?tr:en,words={S:L('Subdominant','Subdominant'),D:L('Dominant','Dominant'),T:L('Tonik','Tonic')};
    if(!graph.functional||!graph.nodes.length){container.innerHTML='<p class="hm-notice">'+escape(L('Bu gam için klasik tonal işlev atanmaz; Keşif, Beşliler veya PLR görünümünü kullan.','Classical tonal function is not assigned to this scale; use the Orbit, Fifths or PLR view.'))+'</p>';return;}
    augment(graph);
    const m=model(graph,{labels}),clamp=Math.max(1,Math.min(2,Number(zoom)||1));
    let html='<div class="hmap-scroll"><div class="hmap" style="--hm-zoom:'+clamp+'" data-labels="'+labels+'" role="group" aria-label="'+escape(graph.root+' '+L('tonal armoni haritası','tonal harmony map'))+'"><div class="hm-stage">'+svgMarkup(m,words);
    for(const k of ['S','D','T']){const pos={S:[20,76],D:[982,350],T:[20,590]}[k];html+='<span class="hm-region hm-region-'+k+'" style="left:'+round(pos[0]/W*100)+'%;top:'+round(pos[1]/H*100)+'%">'+escape(words[k])+'</span>';}
    for(const i of m.items){
      const node=i.node,aria=node.symbol+' · '+i.roman+(node.functionLabel?' · '+node.functionLabel:'');
      html+='<article class="hm-node hm-'+i.tone+(i.small?' hm-small':'')+(i.satellite?' hm-satellite':'')+(i.id===activeId?' active':'')+'" data-node-id="'+escape(i.id)+'" style="left:'+round(i.x/W*100)+'%;top:'+round(i.y/H*100)+'%"><button class="hm-label" aria-label="'+escape(aria)+'" aria-pressed="'+(i.id===activeId)+'" title="'+escape(node.symbol+' · '+i.roman)+'">'+escape(i.label)+'</button></article>';
    }
    html+='</div></div></div>';
    container.innerHTML=html;
    if(typeof container.addEventListener!=='function')return m;
    const find=target=>{const el=target?.closest?.('[data-node-id]');return el?graph.nodes.find(n=>n.id===el.dataset.nodeId):null;};
    container.addEventListener('click',event=>{const node=find(event.target);if(node)onSelect(node);});
    container.addEventListener('dblclick',event=>{const node=find(event.target);if(node)onAction(node,'play');});
    const highlight=id=>{
      const map=container.querySelector?.('.hmap');if(!map)return;
      map.toggleAttribute?.('data-hl',!!id);
      for(const a of map.querySelectorAll('.hm-arrow'))a.classList.toggle('on',!!id&&(a.dataset.from===id||a.dataset.to===id));
    };
    container.addEventListener('pointerover',event=>highlight(find(event.target)?.id));container.addEventListener('pointerout',()=>highlight(null));
    container.addEventListener('focusin',event=>highlight(find(event.target)?.id));container.addEventListener('focusout',()=>highlight(null));
    return m;
  }
  const API=Object.freeze({W,H,CLUSTERS,CENTRE,PAIRS,regionOf,romanLabel,augment,model,render});
  root.MBS2HarmonyDiagram=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
