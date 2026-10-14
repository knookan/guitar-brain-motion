/* Adaptive harmony map: every enabled relationship has a visible group and target. */
(function(root){
  'use strict';
  const H=root.MBS2Harmony||(typeof require!=='undefined'?require('./harmony-engine.js'):null);
  let resizeObserver=null;
  const tr=text=>root.MBS2I18n?.t(text)||text,html=text=>root.MBS2I18n?.html(text)||text;
  function dispose(){resizeObserver?.disconnect();resizeObserver=null;}
  const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function layout(nodes,width=370){
    const columns=width<340?2:3,cardWidth=width<340?86:98,rowHeight=122,padding=58,rows=Math.ceil(nodes.length/columns),height=Math.max(160,rows*rowHeight);
    return {height,cardWidth,positions:nodes.map((n,i)=>({id:n.id,x:(i%columns+.5)*width/columns,y:padding+Math.floor(i/columns)*rowHeight}))};
  }
  function render(container,graph,activeId,{onSelect=()=>{},onAction=()=>{},limit=12,onMore=()=>{},focusKind='all'}={}){
    const options=arguments[3]||{};if(options.lens)return renderAtlas(container,graph,activeId,options);
    dispose();
    container.replaceChildren();if(!graph.analysis){container.textContent=tr('Armoni hesaplanamadı.');return;}
    const view=document.createElement('div');view.className='map-view';view.setAttribute('aria-label',graph.root+' '+(root.MBS2I18n?.scaleName(graph.scale)||graph.scale.name)+' '+tr('Armoni haritası'));
    const primary=graph.nodes.filter(n=>n.kind==='diatonic').slice(0,limit),width=Math.max(240,container.clientWidth||370),grid=layout(primary,width);
    const canvas=document.createElement('div');canvas.className='map-canvas';canvas.style.height=grid.height+'px';canvas.style.minHeight='160px';
    const dots=document.createElement('div');dots.className='map-grid';canvas.append(dots);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','map-lines');svg.setAttribute('viewBox','0 0 '+width+' '+grid.height);svg.setAttribute('preserveAspectRatio','none');
    const defs=document.createElementNS('http://www.w3.org/2000/svg','defs'),marker=document.createElementNS('http://www.w3.org/2000/svg','marker');
    marker.setAttribute('id','harmonyArrow');marker.setAttribute('viewBox','0 0 10 10');marker.setAttribute('refX','9');marker.setAttribute('refY','5');marker.setAttribute('markerWidth','5');marker.setAttribute('markerHeight','5');marker.setAttribute('orient','auto-start-reverse');
    const arrow=document.createElementNS('http://www.w3.org/2000/svg','path');arrow.setAttribute('d','M 0 0 L 10 5 L 0 10 z');arrow.setAttribute('fill','#8397b9');marker.append(arrow);defs.append(marker);svg.append(defs);
    const coordinates=new Map(grid.positions.map(p=>[p.id,p]));
    for(const edge of graph.edges){const a=coordinates.get(edge.from),b=coordinates.get(edge.to);if(!a||!b)continue;
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),shorten=48/length;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M '+(a.x+dx*shorten)+' '+(a.y+dy*shorten)+' L '+(b.x-dx*shorten)+' '+(b.y-dy*shorten));path.setAttribute('class',edge.kind);path.setAttribute('marker-end','url(#harmonyArrow)');path.setAttribute('aria-label',tr(edge.label));svg.append(path);
    }
    canvas.append(svg);
    function card(node,related){
      const article=document.createElement('article');article.className=(related?'map-related-card ':'map-node ')+node.role+(node.id===activeId?' active':'');article.dataset.nodeId=node.id;
      if(!related){const p=coordinates.get(node.id);article.style.left=p.x/width*100+'%';article.style.top=p.y+'px';article.style.width=grid.cardWidth+'px';}
      const select=document.createElement('button');select.type='button';select.className=related?'map-related-select':'map-node-select';select.setAttribute('aria-pressed',String(node.id===activeId));select.setAttribute('aria-label',node.symbol+' '+tr(node.functionLabel));
      select.innerHTML=html('<strong>'+escape(node.symbol)+'</strong><small>'+escape(node.degree)+(related&&node.targetLabel?' → '+escape(node.targetLabel):' · '+escape(node.functionLabel))+'</small>'+(related?'<span class="map-outside">'+(node.outside?.length?'Gam dışı: '+node.outside.map(escape).join(' · '):'Gam içinde')+'</span>':''));
      select.addEventListener('click',()=>onSelect(node));article.append(select);
      const actions=document.createElement('div');actions.className='map-node-actions';
      for(const [label,action] of [['Çal','play'],['Arpej','arpeggio']]){const button=document.createElement('button');button.type='button';button.textContent=tr(label);button.setAttribute('aria-label',node.symbol+' '+tr(label));button.addEventListener('click',()=>onAction(node,action));actions.append(button);}article.append(actions);return article;
    }
    const showPrimary=['all','diatonic'].includes(focusKind);
    primary.forEach(n=>canvas.append(card(n,false)));if(showPrimary){view.append(canvas);container.append(view);}
    if(showPrimary&&!primary.length){const empty=document.createElement('p');empty.className='harmony-notice';empty.textContent=tr('Bu koleksiyonda seçilen türden tanınmış akor bulunamadı.');container.append(empty);}
    let hidden=showPrimary?graph.nodes.filter(n=>n.kind==='diatonic').length-primary.length:0;
    for(const layer of graph.layers){
      const all=graph.nodes.filter(n=>n.kind===layer.id);if(!layer.enabled||!all.length)continue;
      if(focusKind!=='all'&&focusKind!==layer.id)continue;
      const section=document.createElement('section');section.className='map-related';section.dataset.layer=layer.id;
      const heading=document.createElement('div');heading.className='section-label';heading.innerHTML=html('<span>'+escape(layer.name)+'</span><span>'+all.length+'</span>');section.append(heading);
      const description=document.createElement('p');description.className='harmony-notice';description.textContent=tr(layer.explanation+(layer.id==='borrowed'?' Kaynak: '+graph.root+' '+all[0].sourceScaleName:''));section.append(description);
      const list=document.createElement('div');list.className='map-related-list';all.slice(0,limit).forEach(n=>list.append(card(n,true)));section.append(list);container.append(section);hidden+=Math.max(0,all.length-limit);
    }
    if(hidden){const button=document.createElement('button');button.type='button';button.className='more-voicings';button.textContent=tr('Daha fazla bağlantı · '+hidden);button.addEventListener('click',onMore);container.append(button);}
    if(root.ResizeObserver&&showPrimary){resizeObserver=new root.ResizeObserver(()=>{if(Math.abs((container.clientWidth||370)-width)>1)render(container,graph,activeId,{onSelect,onAction,limit,onMore,focusKind});});resizeObserver.observe(container);}
  }
  function renderAtlas(container,graph,activeId,{onSelect=()=>{},onAction=()=>{},limit=12,onMore=()=>{},focusKind='diatonic',lens='functions',anchor=null}={}){
    dispose();container.replaceChildren();
    const Atlas=root.MBS2HarmonyAtlas||(typeof require!=='undefined'?require('./harmony-atlas.js'):null),en=root.MBS2I18n?.getLocale()==='en',L=(a,b)=>en?b:a;
    const width=Math.max(240,container.clientWidth||700),all=Atlas.visibleNodes(graph,focusKind,limit),relationship=lens==='plr'?Atlas.plr(anchor||graph.nodes[0]?.record):null;
    if(lens==='plr'&&!relationship){const p=document.createElement('p');p.className='atlas-empty';p.textContent=L('PLR için majör veya minör üçlü içeren bir akor seç.','Choose a chord containing a major or minor triad for PLR.');container.append(p);return;}
    let nodes=all,edges=graph.edges,grid;
    if(relationship){
      activeId='plr-center';
      const make=(record,id,degree,extra={})=>({id,record,symbol:record.symbol,degree,rootPc:record.rootPc,kind:'plr',role:'color',functionLabel:'PLR',...extra});
      nodes=[make(relationship.core,'plr-center','●'),...relationship.neighbors.map(n=>make(n.record,'plr-'+n.operation,n.operation,{relationship:n}))];
      const columns=width<420?1:3;grid={width,height:columns===1?520:315,cardWidth:Math.min(160,width/columns-24),positions:[{id:'plr-center',x:width/2,y:60},...nodes.slice(1).map((n,i)=>({id:n.id,x:columns===1?width/2:(i+.5)*width/3,y:columns===1?178+i*112:228}))],groups:[]};
      edges=nodes.slice(1).map(n=>({from:'plr-center',to:n.id,kind:'plr',label:n.degree}));
    }else grid=Atlas.layout(nodes,width,{lens,functional:graph.functional,center:graph.analysis.scale.rootPc});
    const canvas=document.createElement('div');canvas.className='atlas-canvas '+lens;canvas.style.height=grid.height+'px';canvas.dataset.lens=lens;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','atlas-lines');svg.setAttribute('viewBox','0 0 '+width+' '+grid.height);svg.setAttribute('aria-hidden','true');
    const coords=new Map(grid.positions.map(p=>[p.id,p]));
    for(const group of grid.groups||[]){const label=document.createElement('div');label.className='atlas-function '+group.role;label.style.left=group.x/width*100+'%';label.textContent=group.label;canvas.append(label);}
    if(grid.ring){const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx',grid.center.x);circle.setAttribute('cy',grid.center.y);circle.setAttribute('r',grid.radius);circle.setAttribute('class','atlas-ring');svg.append(circle);const label=document.createElement('div');label.className='atlas-ring-center';label.style.top=grid.center.y+'px';label.innerHTML='<strong>'+escape(graph.root)+'</strong><small>'+L('Beşli kök sırası','Root order by fifths')+'</small>';canvas.append(label);}
    for(const edge of edges){const a=coords.get(edge.from),b=coords.get(edge.to);if(!a||!b)continue;
      const selected=edge.from===activeId||edge.to===activeId||lens==='plr',dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1)continue;
      const shorten=Math.min(.36,46/len),sx=a.x+dx*shorten,sy=a.y+dy*shorten,ex=b.x-dx*shorten,ey=b.y-dy*shorten;
      const arcY=Math.abs(dx)>grid.cardWidth*2&&Math.abs(dy)<82?Math.max(-30,Math.min(sy,ey)-120):(sy+ey)/2-18;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M '+sx+' '+sy+' Q '+((sx+ex)/2+Math.min(45,Math.abs(dy)*.12))+' '+arcY+' '+ex+' '+ey);path.setAttribute('class','atlas-edge '+edge.kind+(selected?' selected':''));svg.append(path);
      if(selected){const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',ex);dot.setAttribute('cy',ey);dot.setAttribute('r','3');dot.setAttribute('class','atlas-arrival');svg.append(dot);}
    }
    canvas.append(svg);
    for(const node of nodes){const p=coords.get(node.id),article=document.createElement('article');article.className='atlas-node '+node.role+(node.id===activeId?' active':'');article.dataset.nodeId=node.id;article.style.left=p.x/width*100+'%';article.style.top=p.y+'px';article.style.width=grid.cardWidth+'px';
      const button=document.createElement('button');button.className='atlas-select';button.setAttribute('aria-pressed',String(node.id===activeId));button.setAttribute('aria-label',node.symbol+' · '+node.degree);button.innerHTML='<small>'+escape(node.degree)+'</small><strong>'+escape(node.symbol)+'</strong>'+(node.relationship?'<span>'+escape(node.relationship.from+' → '+node.relationship.to)+' · '+node.relationship.semitones+L(' yarım ses',' semitones')+'</span>':node.targetLabel?'<span>→ '+escape(node.targetLabel)+'</span>':'');button.addEventListener('click',()=>onSelect(node));article.append(button);
      const actions=document.createElement('div');actions.className='atlas-node-actions';for(const [label,action] of [[L('Çal','Play'),'play'],[L('Arpej','Arpeggio'),'arpeggio']]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label',node.symbol+' '+label);b.addEventListener('click',()=>onAction(node,action));actions.append(b);}article.append(actions);canvas.append(article);
    }
    container.append(canvas);
    if(!nodes.length){const p=document.createElement('p');p.className='atlas-empty';p.textContent=L('Bu yapıda akor bulunamadı.','No chords found for this construction.');container.append(p);}
    const caption=document.createElement('div');caption.className='atlas-caption';caption.textContent=relationship?L('İki ortak ses korunur · hareket ses sınıfı düzeyindedir.','Two common tones retained · movement is at pitch-class level.')+(relationship.projected?' '+L('Yedili/uzantılar gösterilmez; üçlü çekirdeği kullanılır.','Sevenths/extensions are omitted here; the triad core is used.'):''):lens==='fifths'?L('Kökler beşlilerle sıralanır; çember mesafesi tutuş hareketi değildir.','Roots are ordered by fifths; circle distance is not fingering movement.'):graph.functional?L('T: merkez / renk · PD: hazırlık · D: dominant · ◇: diğer bağlantılar','T: centre / colour · PD: preparation · D: dominant · ◇: other relationships'):L('Modal/koleksiyon üyeliği · klasik işlev atanmaz.','Modal/collection membership · no classical function assigned.');container.append(caption);
    const hidden=focusKind==='all'?Math.max(0,graph.nodes.length-nodes.length):Math.max(0,graph.nodes.filter(n=>n.kind===focusKind).length-limit);if(hidden&&!relationship){const more=document.createElement('button');more.className='atlas-more';more.textContent=L('Daha fazla bağlantı','More relationships')+' · '+hidden;more.addEventListener('click',onMore);container.append(more);}
    if(root.ResizeObserver){resizeObserver=new root.ResizeObserver(()=>{if(Math.abs((container.clientWidth||700)-width)>1)renderAtlas(container,graph,activeId,{onSelect,onAction,limit,onMore,focusKind,lens,anchor});});resizeObserver.observe(container);}
  }
  const API=Object.freeze({buildGraph:H.buildGraph,render,layout,dispose});root.MBS2HarmonyMap=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
