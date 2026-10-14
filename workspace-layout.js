/* One layout owner. Resizing never rebuilds musical state or panel content. */
(function(root){
  'use strict';
  const KEY='guitar-brain-motion-layout-v1',clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let shell,bench,divider,controls,prefs,drag=null,frame=0,observer;
  function load(){
    let data;try{data=JSON.parse(root.localStorage.getItem(KEY)||'null');}catch(_){}
    return {arrangement:['stack','side'].includes(data?.arrangement)?data.arrangement:'auto',
      stack:clamp(Number(data?.stack)||.44,.15,.85),phone:clamp(Number(data?.phone)||.34,.15,.85),side:clamp(Number(data?.side)||.55,.2,.8),
      focus:['balanced','guitar','workspace','custom'].includes(data?.focus)?data.focus:'balanced'};
  }
  function save(){try{root.localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){} }
  function language(){return document.documentElement.lang==='tr'?'tr':'en';}
  function words(){return language()==='tr'?{balanced:'Dengeli',guitar:'Gitar',workspace:'Araçlar',focus:'Alan odağı',layout:'Yerleşim',switchStack:'Üst alta yerleştir',switchSide:'Yan yana yerleştir',unavailable:'Yan yana görünüm için ekranı genişlet',reset:'Yerleşimi sıfırla',resize:'Gitar ve araç alanlarını boyutlandır',share:'Gitar alanı',hint:'Sürükle veya ok tuşlarıyla boyutlandır',restore:'Klavyeyi göster'}:{balanced:'Balanced',guitar:'Guitar',workspace:'Tools',focus:'Area focus',layout:'Layout',switchStack:'Stack guitar above tools',switchSide:'Place guitar beside tools',unavailable:'Widen the window for side-by-side view',reset:'Reset layout',resize:'Resize guitar and tools',share:'Guitar area',hint:'Drag or use arrow keys to resize',restore:'Show fretboard'};}
  function dimensions(){
    const rect=bench.getBoundingClientRect(),style=root.getComputedStyle(bench);
    const width=rect.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=rect.height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
    const shortLandscape=width>=720&&height<=460,sideAvailable=width>=1050||shortLandscape;
    const arrangement=prefs.arrangement==='side'&&sideAvailable?'side':prefs.arrangement==='stack'?'stack':shortLandscape?'side':'stack';
    const extent=(arrangement==='side'?width:height)-12;
    let firstMin,secondMin;
    if(arrangement==='side'){firstMin=shortLandscape?Math.min(390,width*.46):460;secondMin=shortLandscape?280:420;}
    else{firstMin=width<600?174:200;secondMin=width<600?190:210;}
    // Keep both sections available even in a unusually short viewport.
    const factor=Math.min(1,Math.max(0,extent)/(firstMin+secondMin));
    firstMin*=factor;secondMin*=factor;
    return {arrangement,slot:arrangement==='stack'&&width<650?'phone':arrangement,extent:Math.max(1,extent),min:firstMin,max:Math.max(firstMin,extent-secondMin),sideAvailable};
  }
  function sync(){
    if(!bench)return;
    const w=words(),d=dimensions(),collapsed=shell.classList.contains('fretboard-collapsed');
    shell.dataset.layout=d.arrangement;shell.dataset.layoutFocus=prefs.focus;
    const size=clamp(prefs[d.slot]*d.extent,d.min,d.max),percent=Math.round(size/d.extent*100);
    bench.style.setProperty('--guitar-size',size.toFixed(1)+'px');
    divider.hidden=collapsed;divider.setAttribute('aria-orientation',d.arrangement==='side'?'vertical':'horizontal');
    divider.setAttribute('aria-label',w.resize);divider.title=w.hint;
    divider.setAttribute('aria-valuemin',String(Math.ceil(d.min/d.extent*100)));divider.setAttribute('aria-valuemax',String(Math.floor(d.max/d.extent*100)));
    divider.setAttribute('aria-valuenow',String(percent));divider.setAttribute('aria-valuetext',w.share+' '+percent+'%');
    controls.setAttribute('aria-label',w.layout);controls.querySelector('.layout-focus').setAttribute('aria-label',w.focus);
    for(const button of controls.querySelectorAll('[data-layout-focus]')){
      button.textContent=w[button.dataset.layoutFocus];button.setAttribute('aria-pressed',String(button.dataset.layoutFocus===prefs.focus&&!collapsed));
    }
    const switcher=document.getElementById('layoutArrangement'),target=d.arrangement==='side'?'stack':'side';
    switcher.disabled=target==='side'&&!d.sideAvailable;
    switcher.title=switcher.disabled?w.unavailable:target==='side'?w.switchSide:w.switchStack;
    switcher.setAttribute('aria-label',switcher.title);switcher.dataset.arrangement=d.arrangement;
    switcher.querySelector('path').setAttribute('d',d.arrangement==='side'?'M12 3v18':'M3 12h18');
    const reset=document.getElementById('layoutReset');reset.title=w.reset;reset.setAttribute('aria-label',w.reset);
  }
  function schedule(){if(!frame)frame=root.requestAnimationFrame(()=>{frame=0;sync();});}
  function reveal(){if(shell.classList.contains('fretboard-collapsed'))document.getElementById('toggleFretboard').click();}
  function setFocus(focus){
    reveal();prefs.focus=focus;
    // Layout does not change when the musical workspace changes.
    const ratios={balanced:{stack:.44,phone:.34,side:.55},guitar:{stack:.66,phone:.6,side:.68},workspace:{stack:.25,phone:.24,side:.4}};
    Object.assign(prefs,ratios[focus]);sync();save();
  }
  function stopDrag(event){
    if(!drag||event.pointerId!==drag.id)return;
    try{divider.releasePointerCapture(drag.id);}catch(_){}
    drag=null;shell.classList.remove('layout-resizing');sync();save();
  }
  function init(){
    shell=document.getElementById('appShell');bench=shell?.querySelector('.workbench');divider=document.getElementById('workspaceDivider');controls=document.getElementById('layoutControls');
    if(!bench||!divider||!controls)return;
    prefs=load();document.getElementById('studioNavigation').append(document.getElementById('modeNav'));
    const camera=document.querySelector('.scene-camera');if(camera)document.getElementById('studioToolbar').insertBefore(camera,controls);
    for(const button of controls.querySelectorAll('[data-layout-focus]'))button.addEventListener('click',()=>setFocus(button.dataset.layoutFocus));
    document.getElementById('layoutArrangement').addEventListener('click',()=>{reveal();prefs.arrangement=dimensions().arrangement==='side'?'stack':'side';sync();save();});
    document.getElementById('layoutReset').addEventListener('click',()=>{prefs={arrangement:'auto',stack:.44,phone:.34,side:.55,focus:'balanced'};reveal();sync();save();});
    divider.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0)return;
      event.preventDefault();const d=dimensions(),rect=bench.getBoundingClientRect(),style=root.getComputedStyle(bench);
      drag={id:event.pointerId,arrangement:d.arrangement,slot:d.slot,origin:d.arrangement==='side'?rect.left+parseFloat(style.paddingLeft):rect.top+parseFloat(style.paddingTop)};
      divider.setPointerCapture(event.pointerId);divider.focus({preventScroll:true});shell.classList.add('layout-resizing');
    });
    divider.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const d=dimensions();if(d.arrangement!==drag.arrangement||d.slot!==drag.slot){stopDrag(event);return;}
      const value=(d.arrangement==='side'?event.clientX:event.clientY)-drag.origin-6;
      prefs[d.slot]=clamp(value,d.min,d.max)/d.extent;prefs.focus='custom';schedule();
    });
    divider.addEventListener('pointerup',stopDrag);divider.addEventListener('pointercancel',stopDrag);
    divider.addEventListener('lostpointercapture',()=>{if(drag){drag=null;shell.classList.remove('layout-resizing');sync();save();}});
    divider.addEventListener('dblclick',()=>setFocus('balanced'));
    divider.addEventListener('keydown',event=>{
      const d=dimensions(),minus=d.arrangement==='side'?'ArrowLeft':'ArrowUp',plus=d.arrangement==='side'?'ArrowRight':'ArrowDown';
      if(![minus,plus,'Home','End','Enter'].includes(event.key))return;
      event.preventDefault();if(event.key==='Enter'){setFocus('balanced');return;}
      const current=clamp(prefs[d.slot]*d.extent,d.min,d.max),step=(event.shiftKey ? 0.1 : 0.025)*d.extent;
      const next=event.key==='Home'?d.min:event.key==='End'?d.max:current+(event.key===minus?-step:step);
      prefs[d.slot]=clamp(next,d.min,d.max)/d.extent;prefs.focus='custom';sync();save();
    });
    root.addEventListener('resize',schedule);root.addEventListener('gb-layout-sync',schedule);
    if(root.ResizeObserver){observer=new root.ResizeObserver(schedule);observer.observe(bench);}
    sync();
  }
  root.GBWorkspaceLayout=Object.freeze({sync:schedule});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window!=='undefined'?window:globalThis);
