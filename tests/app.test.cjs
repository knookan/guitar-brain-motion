const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"..");
const index=fs.readFileSync(path.join(base,"index.html"),"utf8"),app=fs.readFileSync(path.join(base,"app.js"),"utf8"),css=fs.readFileSync(path.join(base,"styles.css"),"utf8"),standalone=fs.readFileSync(path.join(base,"Muzik_Beyni_Studio_V2.html"),"utf8");
const T=require("../theory.js"),G=require("../guitar.js");
const checks=[];function check(name,fn){fn();checks.push(name);}
function stateFor(saved,storageBlocked=false){
  const context={MBS2Theory:T,MBS2Guitar:G,localStorage:{getItem(){if(storageBlocked)throw new Error("SecurityError");return saved;}}};
  vm.createContext(context);vm.runInContext(app,context);return JSON.parse(JSON.stringify(context.MBS2App.getState()));
}
check("Uygulama ilk açılışta klonlama sırası hatası olmadan durumunu kurar",()=>{const state=stateFor(null);assert.equal(state.mode,"explore");assert.deepEqual(state.selectedPositions,[]);});
check("Yerel depolama engellense veya JSON bozulsa da varsayılan durum yüklenir",()=>{assert.equal(stateFor(null,true).mode,"explore");assert.equal(stateFor("{broken").mode,"explore");});
check("Eski Yürüyüş kaydı, geçerli bölüme taşınır ve kaldırılan veriyi UI durumuna katmaz",()=>{const state=stateFor(JSON.stringify({version:1,mode:"progression",progression:[{}]}));assert.equal(state.mode,"explore");assert.equal(state.progression,undefined);});
check("Kayıtlı akor ve özel akort yeni sürümde korunur",()=>{const state=stateFor(JSON.stringify({version:1,mode:"chord",chordRoot:"F♯",chordType:"minor7",tuningId:"custom",customTuning:["D2","A2","D3","G3","A3","D4"]}));assert.equal(state.chordRoot,"F♯");assert.equal(state.chordType,"minor7");assert.equal(state.customTuning.length,6);});
check("Nota çalışmasından kalan seçimler akor/gam görüntüsünü örtmez",()=>{
  const context={MBS2Theory:T,MBS2Guitar:G,localStorage:{getItem:()=>JSON.stringify({version:1,mode:"chord",selectedPositions:[{stringIndex:0,fret:1}]})}};
  vm.createContext(context);vm.runInContext(app,context);assert.equal(context.MBS2App.getState().selectedPositions.length,1);assert.equal(context.MBS2App.sceneState().selectedPositions.length,0);
});
check("Kalıcı gitar canvas ve SVG aynı sahnede birer kez bulunur",()=>{assert.equal((index.match(/id="guitarScene"/g)||[]).length,1);assert.equal((index.match(/id="guitarCanvas"/g)||[]).length,1);});
check("Arayüzde beş bölüm bulunur, Yürüyüş ve parmak önerisi kaldırılmıştır",()=>{for(const mode of ["explore","chord","scale","harmony","project"])assert(index.includes('data-mode="'+mode+'"'));assert.doesNotMatch(index+app,/data-mode="progression"|Parmak önerisi|fingerStatus|addDegree|addChord|Piyano/);});
check("Menü ve tutuş seçimi belgeyi otomatik kaydırmaz",()=>{assert.doesNotMatch(app,/scrollIntoView|window\.scrollTo/);assert.match(css,/html,body\{width:100%;height:100%;margin:0;overflow:hidden/);});
check("Panel kendi içinde kayar, bölüm değişince panel başı açılır",()=>{assert.match(css,/\.panel-content\{[^}]*overflow:auto/);assert.match(app,/renderPanel\(\{keepScroll:false\}\)/);});
check("Manrope ve Space Grotesk gerçekten tek HTML içine gömülür",()=>{assert.equal((standalone.match(/data:font\/ttf;base64,/g)||[]).length,2);assert.doesNotMatch(standalone,/url\("assets\/fonts\//);});
check("Tek dosya sürümü gerçek gitar kayıtlarıyla birlikte on yedi modülü içerir",()=>{assert.equal((standalone.match(/<script>/g)||[]).length,18);assert.doesNotMatch(standalone,/<script[^>]+src=|<link rel="stylesheet"/);});
module.exports=checks;
