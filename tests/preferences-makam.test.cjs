const assert=require('node:assert/strict'),fs=require('node:fs'),T=require('../theory.js'),H=require('../harmony-engine.js'),I=require('../i18n.js'),K=require('../makam-catalog.js'),{fixture}=require('./harmony-ui.test.cjs');
const checks=[];function check(name,fn){fn();checks.push(name);}
check('27 makam/çeşni kaydı iki dilde ad, kaynak, koma ve ayrı gitar projeksiyonu taşır',()=>{
  assert.equal(K.records.length,27);assert.equal(new Set(K.records.map(s=>s.id)).size,27);
  for(const s of K.records){assert(s.nameEn&&s.nameTr&&s.makam.source.startsWith('https:'));assert.equal(s.intervals[0],0);assert.deepEqual(s.intervals,s.makam.commas.map(c=>Math.round(c*12/53)));assert.equal(s.intervals.length,new Set(s.intervals).size);assert(s.makam.commas.every((c,i)=>i===0||c>s.makam.commas[i-1]));}
});
check('Aynı sesleri taşıyan Uşşak/Bayati ve Hüseyni/Neva farklı seyir/güçlüyle korunur',()=>{
  const get=id=>K.records.find(s=>s.id==='makam-'+id).makam;assert.deepEqual(get('ussak').commas,get('bayati').commas);assert.notEqual(get('ussak').seyir,get('bayati').seyir);assert.deepEqual(get('huseyni').commas,get('neva').commas);assert.notEqual(get('huseyni').focusDegree,get('neva').focusDegree);
});
check('Makam seçimi otomatik klasik dominant üretmez; Saba eksik kapsamını açıkça belirtir',()=>{
  for(const s of K.records){const g=H.buildGraph('C',s.id,{primary:true,secondary:true,borrowed:true});assert.equal(g.analysis.profile.context,'makam');assert.equal(g.functional,false);assert(g.nodes.every(n=>n.kind==='diatonic'));assert(g.analysis.notices[0].includes('12-TET'));}
  const s=H.analyze('A','makam-saba');assert.equal(s.makam.partial,true);assert.equal(s.scale.pcs.length,4);assert(s.notices.some(n=>n.includes('yalnız alt dörtlü')));
});
check('Varsayılan dil İngilizcedir; gerçek Ayarlar olayı Türkçeye geçer ve seçimi saklar',()=>{
  const f=fixture(true);assert.equal(f.app.getState().language,'en');assert.equal(f.preferences.attributes.lang,'en');assert(f.host.innerHTML.includes('Scale'));assert(f.host.innerHTML.includes('Dorian'));f.app.setMode('project');assert(f.host.innerHTML.includes('Settings'));f.change('language','tr');assert(f.host.innerHTML.includes('Ayarlar'));assert.equal(f.preferences.attributes.lang,'tr');assert.equal(JSON.parse(f.preferences.saved).language,'tr');
  const restored=fixture(true,f.preferences.saved);assert.equal(restored.app.getState().language,'tr');assert(restored.host.innerHTML.includes('Gam'));
});
check('Tema ve font olayları tüm uygulamanın görsel tercihlerini değiştirir ve kayıttan yüklenir',()=>{
  const f=fixture(true);f.app.setMode('project');for(const theme of ['midnight','cyberpunk','light','graphite']){f.change('theme',theme);assert.equal(f.preferences.attributes['data-theme'],theme);}for(const font of ['space','system','serif','mono','manrope']){f.change('font',font);assert.equal(f.preferences.attributes['data-font'],font);assert(f.preferences.styles['--font-ui']);assert(f.preferences.styles['--font-display']);}assert.equal(fixture(true,f.preferences.saved).app.getState().font,'manrope');
});
check('Dil değiştirmek seçili gamı, gitar notalarını ve panel konumunu bozmaz',()=>{
  const f=fixture(true);f.change('scaleId','dorian');f.change('scaleRoot','F♯');const before=Array.from(f.app.sceneState().activeScale.pcs);f.app.setMode('project');f.host.scrollTop=80;f.change('language','tr');assert.equal(f.host.scrollTop,80);assert.deepEqual(Array.from(f.app.sceneState().activeScale.pcs),before);f.app.setMode('scale');assert(f.host.innerHTML.includes('Doryen'));
});
check('Koma modelini dinle eylemi gerçek kesirli MIDI sesleri gönderir; gitar haritası tam perdede kalır',()=>{
  const f=fixture(true);f.change('scaleId','makam-rast');f.action('playMakamTuning');const e=f.audio[0];assert(e.arp);assert(e.notes.some(n=>!Number.isInteger(n)));assert.equal(e.notes.length,8);[0,9,17,22,31,40,48,53].forEach((c,i)=>assert(Math.abs(e.notes[i]-(60+c*12/53))<1e-9));assert(f.app.sceneState().activeScale.pcs.every(Number.isInteger));
});
check('Makam araması iki dilde çalışır ve geleneksel durak işlemi Gam/Armoniyi eşitler',()=>{
  const f=fixture(true);f.change('scaleQuery','Ussak');assert(f.host.innerHTML.includes('makam-ussak'));f.change('scaleQuery','Uşşak');assert(f.host.innerHTML.includes('makam-ussak'));f.change('scaleQuery','');f.change('scaleId','makam-hicaz');f.action('makamRoot');assert.equal(f.app.getState().scaleRoot,'A');assert.equal(f.app.getState().harmonyRoot,'A');f.action('scaleHarmony');assert(f.host.innerHTML.includes('guitar approximation'));assert(f.host.innerHTML.includes('Hicaz'));
});
check('HTML çevirisi ID/değerleri ve nota simgelerini korur; kaynak linki değişmez',()=>{
  const html='<button data-action="playDegree" data-value="Türk makamları" title="Çal">Çal</button><a href="https://example.test/Çal">C♯</a>';const en=I.html(html,'en');assert(en.includes('data-value="Türk makamları"'));assert(en.includes('title="Play"'));assert(en.includes('>Play<'));assert(en.includes('>C♯<'));assert(en.includes('https://example.test/Çal'));assert.equal(I.html(html,'tr'),html);
});
check('Geçersiz görünüm tercihleri güvenle varsayılana döner, zoom sınırı korunur',()=>{
  const saved=JSON.stringify({version:1,language:'de',theme:'broken',font:'constructor',cameraView:'broken',cameraZoom:99});
  const f=fixture(true,saved),s=f.app.getState();assert.equal(s.language,'en');assert.equal(s.theme,'graphite');assert.equal(s.font,'manrope');assert.equal(s.cameraView,'top');assert.equal(s.cameraZoom,2.5);
});
check('Büyük harf ve aksansız arama iki dilde çalışır; tel/perde yardım metni İngilizcedir',()=>{
  const f=fixture(true);f.change('scaleQuery','DORIAN');assert(f.host.innerHTML.includes('value="dorian"'));f.change('scaleQuery','KURDILI HICAZKAR');assert(f.host.innerHTML.includes('value="makam-kurdili-hicazkar"'));assert.equal(I.t('E2 · 1. tel · 3. perde','en'),'E2 · string 1 · fret 3');
});
module.exports=checks;
