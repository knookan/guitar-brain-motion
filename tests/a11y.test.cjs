/* Readability guards: text size floor, theme token contrast, the light theme layer and screen-reader hooks. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const checks=[];function check(name,fn){fn();checks.push(name);}
const read=file=>fs.readFileSync(file,'utf8'),styles=read('styles.css');
const cssFiles=fs.readdirSync('.').filter(f=>f.endsWith('.css'));
const blocks=sel=>[...styles.matchAll(/(?<=^|\})\s*([^{}]+)\{([^}]*)\}/g)].filter(m=>m[1].trim()===sel).map(m=>m[2]).join(';');
const tokens=body=>Object.fromEntries([...body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(x=>[x[1],x[2]]));
const lum=hex=>{const n=parseInt(hex.slice(1),16),f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(n>>16)+.7152*f((n>>8)&255)+.0722*f(n&255);};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const base=tokens(blocks(':root'));
const THEME_SELECTORS={graphite:null,midnight:':root[data-theme="midnight"]',cyberpunk:':root[data-theme="cyberpunk"]',light:':root[data-theme="light"]'};
const themeTokens=name=>name==='graphite'?base:{...base,...tokens(blocks(THEME_SELECTORS[name]))};

check('Hiçbir stil dosyasında 10 pikselin altında yazı boyutu yoktur; boyut tek bir değişkene bağlıdır',()=>{
  assert(/:root\{--fs-xs:10px;/.test(styles));
  for(const file of cssFiles){
    const css=read(file);
    for(const [,value] of css.matchAll(/font-size:\s*([0-9.]+)px/g))assert(Number(value)>=10,file+' font-size '+value+'px');
    for(const [,value] of css.matchAll(/font:[^;}]*?\b([0-9.]+)px/g))assert(Number(value)>=10,file+' font '+value+'px');
  }
  assert(/small\{font-size:max\(var\(--fs-xs\),/.test(styles));
});

check('Her temada ana ve ikincil metin yüzeylerine karşı 4,5:1, soluk metin 3:1 sınırının üstündedir',()=>{
  for(const name of Object.keys(THEME_SELECTORS)){
    const t=themeTokens(name);
    for(const surface of ['bg','surface','panel'])if(t[surface])for(const role of ['text','muted'])assert(ratio(t[role],t[surface])>=4.5,name+' '+role+' on '+surface+' '+ratio(t[role],t[surface]).toFixed(2));
    assert(ratio(t.dim,t.bg)>=3,name+' dim '+ratio(t.dim,t.bg).toFixed(2));
  }
});

check('Tarayıcı çubuğu rengi her temanın arka planıyla aynıdır ve Otomatik tema seçilebilir',()=>{
  const app=read('app.js'),colors=vm.runInNewContext('('+app.match(/THEME_COLORS=(\{[^}]*\})/)[1]+')');
  for(const name of Object.keys(THEME_SELECTORS))assert.equal(colors[name].toLowerCase(),themeTokens(name).bg.toLowerCase(),name);
  assert(/THEMES=\['graphite','midnight','cyberpunk','light','auto'\]/.test(app));assert(app.includes("['auto','Sistem']"));assert(app.includes('prefers-color-scheme: light'));
  assert(read('index.html').includes('<meta name="theme-color"'));
});

check('Açık tema katmanı sayfaya, çevrimdışı önbelleğe ve tek dosya sürümüne eklidir ve her rolü tanımlar',()=>{
  for(const file of ['index.html','sw.js','build-standalone.js'])assert(read(file).includes('theme-light.css'),file);
  const light=read('theme-light.css');for(const token of ['--lt-muted','--lt-strong','--lt-accent','--lt-caution'])assert(light.includes(token),token);
  assert(light.includes("html[data-theme='light'] #appShell{background:"));assert(light.includes('.guitar-scene :is(.fret-number,.string-name)'));
  assert(!/!important/.test(light.replace(/\/\*[\s\S]*?\*\//g,'')),'overrides win by order, not force');
  assert(read('index.html').indexOf('theme-light.css')>read('index.html').indexOf('workspace-layout.css'));
});

check('Ekran okuyucu bölgesi, gizli metin sınıfı ve kontrol adları yerindedir',()=>{
  const html=read('index.html');assert(/<div id="srStatus" class="sr-only" role="status" aria-live="polite">/.test(html));assert(styles.includes('.sr-only{position:absolute;'));
  const app=read('app.js');assert(app.includes('function announce('));assert(app.includes('announce(document.querySelector'));
  assert(/data-change="harmonySize" aria-label=/.test(app));assert(!app.includes('<aside class="atlas-inspector">'));
});

check('Düzen ayırıcısı azaltılmış hareket tercihine uyar',()=>{
  assert(/@media\(prefers-reduced-motion:reduce\)\{\.workspace-divider>span\{transition:none\}\}/.test(read('workspace-layout.css')));
});

module.exports=checks;
