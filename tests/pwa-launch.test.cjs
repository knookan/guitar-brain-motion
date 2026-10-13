const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ORIGIN='https://guitar.thespacebug.chatgpt.site/';
const HTML='<!doctype html><title>Guitar Brain</title><main id="appShell">Guitar</main>';
function redirectResponse(){const res=new Response(HTML,{headers:{'Content-Type':'text/html','Content-Encoding':'gzip','Content-Length':'42'}});Object.defineProperty(res,'redirected',{value:true});return res;}
function fixture({failAsset=null,storageFail=false,networkFail=false}={}){
  const listeners={},stores=new Map(),requests=[],life={skipped:false,claimed:false};
  const key=request=>typeof request==='string'?new URL(request,ORIGIN).href:request.url;
  const caches={async open(name){if(storageFail)throw new Error('Storage blocked');if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {put:async(r,res)=>store.set(key(r),res),match:async(r,options)=>{const requestKey=key(r);let res=store.get(requestKey);if(!res&&options?.ignoreSearch)res=store.get(requestKey.split('?')[0]);return res?.clone();}};},keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)};
  const self={location:{origin:new URL(ORIGIN).origin},registration:{scope:ORIGIN},addEventListener:(type,fn)=>listeners[type]=fn,skipWaiting:async()=>{life.skipped=true;},clients:{claim:async()=>{life.claimed=true;}}};
  const fetch=async request=>{const url=key(request);requests.push(url);if(networkFail)throw new Error('Offline');if(url.endsWith(failAsset||'__never__'))return new Response('missing',{status:404});if(url===ORIGIN)return new Response(HTML,{headers:{'Content-Type':'text/html'}});if(url.includes('index.html'))return redirectResponse();return new Response('asset');};
  const context={self,caches,fetch,URL,Request,Response,Headers};vm.createContext(context);vm.runInContext(fs.readFileSync('sw.js','utf8'),context);
  const lifecycle=async type=>{let promise;listeners[type]({waitUntil:p=>promise=p});await promise;};
  const navigate=async(path='')=>{const request=new Request(new URL(path,ORIGIN),{redirect:'manual'});Object.defineProperty(request,'mode',{value:'navigate'});let response;listeners.fetch({request,respondWith:p=>response=p});return await response;};
  return {context,listeners,stores,caches,life,requests,lifecycle,navigate};
}
module.exports=async()=>{
  const checks=[];const check=async(name,fn)=>{await fn();checks.push(name);};
  await check('PWA ikinci açılışında manual navigation için yönlendirmesiz root HTML döner',async()=>{
    const f=fixture();await f.lifecycle('install');assert(f.life.skipped);assert(!f.requests.some(url=>url.endsWith('/index.html')));await f.lifecycle('activate');assert(f.life.claimed);
    for(const path of ['', '?source=app','index.html']){const res=await f.navigate(path);assert.equal(res.redirected,false);assert.equal(res.status,200);assert.equal(await res.text(),HTML);}
  });
  await check('307 sonrası önbelleğe giren HTML yeni Response olur; decoded body encoding/length başlıkları taşınmaz',async()=>{
    const f=fixture();const res=vm.runInContext('navigationResponse',f.context)(redirectResponse());assert.equal(res.redirected,false);assert.equal(res.headers.get('content-encoding'),null);assert.equal(res.headers.get('content-length'),null);assert.equal(res.headers.get('content-type'),'text/html');assert.equal(await res.text(),HTML);
  });
  await check('Ağ olmadan mevcut önbellek açılış yapar; bozuk cache çevrimiçi açılışı engellemez',async()=>{
    const f=fixture();await f.lifecycle('install');f.context.fetch=async()=>{throw new Error('Offline');};assert.equal(await (await f.navigate()).text(),HTML);
    const blocked=fixture({storageFail:true});const response=await blocked.navigate('index.html');assert.equal(response.redirected,false);assert.equal(await response.text(),HTML);
  });
  await check('Cache ve ağ yoksa Chrome ERR_FAILED yerine Retry içeren anlaşılır fallback sayfası gelir',async()=>{
    const f=fixture({storageFail:true,networkFail:true});const response=await f.navigate();assert.equal(response.status,503);assert((await response.text()).includes('Retry'));
  });
  await check('Eksik bir offline dosyası yeni workerı aktive etmez; onarım müzik projesi depolamasına dokunmaz',async()=>{
    const f=fixture({failAsset:'guitar-samples.js'});await assert.rejects(f.lifecycle('install'),/Offline asset unavailable/);assert.equal(f.life.skipped,false);
    const source=fs.readFileSync('sw.js','utf8');assert(!/localStorage|indexedDB|unregister/.test(source));
  });
  await check('PWA yükleme düğmesi offline hazır olmadan açılmaz',async()=>{
    const events={},listeners={};let resolveReady;const ready=new Promise(resolve=>resolveReady=resolve),reg={active:{},addEventListener(){}};
    const root={location:{protocol:'https:',hostname:'guitar.thespacebug.chatgpt.site'},matchMedia:()=>({matches:false}),addEventListener:(type,fn)=>events[type]=fn,dispatchEvent(){},navigator:{serviceWorker:{addEventListener:(type,fn)=>listeners[type]=fn,register:async()=>reg,ready}},document:{}};
    const context={window:root,Event,console};vm.createContext(context);vm.runInContext(fs.readFileSync('pwa.js','utf8'),context);
    events.beforeinstallprompt({preventDefault(){}});assert.equal(root.MBS2PWA.status().canInstall,false);await Promise.resolve();assert.equal(root.MBS2PWA.status().offline,false);resolveReady(reg);await new Promise(resolve=>setImmediate(resolve));assert.equal(root.MBS2PWA.status().canInstall,true);
  });
  return checks;
};
