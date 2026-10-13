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
  const API=Object.freeze({buildGraph:H.buildGraph,render,layout,dispose});root.MBS2HarmonyMap=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
