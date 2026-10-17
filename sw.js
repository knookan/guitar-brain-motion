/* Each worker retains one complete offline build, including guitar samples. */
const CACHE='gb-motion-1.3.0-layout-r6';
// The host redirects /index.html to /. Caching that redirected Response breaks
// Chrome navigation requests, whose redirect mode is manual (ERR_FAILED).
const ASSETS=['./','./motion.css','./motion-engine.js','./motion-workspace.js','./styles.css','./scale-catalog.js','./makam-catalog.js','./makam-tuning.js','./i18n.js','./theory.js','./chord-pool.js','./voicing-catalog.js','./guitar.js','./voicing-engine.js','./chord-diagram.js','./guitar-samples.js','./audio.js','./harmony-engine.js','./harmony-atlas.js','./harmony-map.js','./export.js','./scene.js','./pwa.js','./app.js','./manifest.webmanifest','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/maskable-512.png','./assets/icons/apple-touch-icon.png','./assets/fonts/Manrope.ttf','./assets/fonts/SpaceGrotesk.ttf','./Makam_Arastirmasi.html'];
ASSETS.push('./atlas.css','./orbit.css','./orbit-engine.js','./orbit-view.js');
ASSETS.push('./workspace-layout.css','./workspace-layout.js');
const HOME=new URL('./',self.registration.scope).href;
function navigationResponse(response){
  if(!response.redirected)return response;
  const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.all(ASSETS.map(async path=>{
    const request=new Request(new URL(path,HOME).href,{cache:'reload'}),response=await fetch(request);
    if(!response.ok)throw new Error('Offline asset unavailable: '+path);
    await cache.put(request,path==='./'?navigationResponse(response):response);
  }));
  // Repair v3 without requiring a settings page that can no longer open.
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('gb-motion-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    // Navigation stays on the same version as its scripts until the user applies an update.
    if(event.request.mode==='navigate'){
      try{const cached=await (await caches.open(CACHE)).match(HOME);if(cached)return navigationResponse(cached);}catch(_){/* Storage failure must not prevent online launch. */}
      try{return navigationResponse(await fetch(new Request(event.request,{redirect:'follow'})));}
      catch(_){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Guitar Brain</title><body style="background:#101923;color:#eef4ff;font:18px system-ui;padding:32px"><h1>Guitar Brain</h1><p>Bağlantı yok / No connection</p><p>İlk açılış için internete bağlan. Connect to the internet for the first launch.</p><button onclick="location.reload()">Tekrar dene / Retry</button>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});}
    }
    try{const cached=await (await caches.open(CACHE)).match(event.request,{ignoreSearch:true});if(cached)return cached;}catch(_){/* Network fallback when storage is blocked. */}
    return fetch(event.request);
  })());
});
