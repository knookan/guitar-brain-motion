/* Installation and offline lifecycle are independent of musical state. */
(function(root){
  'use strict';
  let prompt=null,registration=null,offline=false,failure=false,reloading=false;
  const supported=()=>root.location?.protocol==='https:'||root.location?.hostname==='localhost';
  const installed=()=>!!root.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches||root.navigator?.standalone===true;
  const notify=()=>root.dispatchEvent?.(new Event('mbs-pwa-change'));
  root.addEventListener?.('beforeinstallprompt',event=>{event.preventDefault();prompt=event;notify();});
  root.addEventListener?.('appinstalled',()=>{prompt=null;notify();});
  async function install(){if(!prompt||!offline)return false;const pending=prompt;prompt=null;await pending.prompt();const choice=await pending.userChoice;notify();return choice.outcome==='accepted';}
  async function fullscreen(){if(root.document.fullscreenElement){await root.document.exitFullscreen();return;}if(!root.document.documentElement.requestFullscreen)throw new Error('Fullscreen unavailable');await root.document.documentElement.requestFullscreen();}
  function update(){if(registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});}
  root.MBS2PWA=Object.freeze({installed,install,fullscreen,update,status:()=>({installed:installed(),canInstall:!!prompt&&offline,offline,failed:failure,update:!!registration?.waiting,web:supported()})});
  if(supported()&&'serviceWorker' in root.navigator){
    root.navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading){root.location.reload();return;}offline=true;notify();});
    root.navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(async reg=>{
      registration=reg;notify();
      reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){notify();}});});
      await root.navigator.serviceWorker.ready;offline=true;notify();
    }).catch(error=>{failure=true;notify();console.warn('Offline setup:',error.message);});
    const originalUpdate=root.MBS2PWA.update;
    root.MBS2PWA=Object.freeze({...root.MBS2PWA,update(){reloading=true;originalUpdate();}});
  }
})(typeof window!=='undefined'?window:globalThis);
