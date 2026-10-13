const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../theory.js'),G=require('../guitar.js'),E=require('../export.js');
const checks=[];function check(name,fn){fn();checks.push(name);}
check('Gam Dinle ve ana çalma düğmesi arpejdir; derece ve gerçek akor blok çalmayı korur',()=>{
 const f=require('./harmony-ui.test.cjs').fixture();f.action('playScale');assert(f.audio.at(-1).arp);assert.deepEqual(Array.from(f.audio.at(-1).notes),[60,62,64,65,67,69,71]);f.app.playCurrent();assert(f.audio.at(-1).arp);
 f.host.controls.find(b=>b.dataset.cardAction==='showDegree').emit('click');f.app.playCurrent();assert.equal(f.audio.at(-1).arp,false);
 f.app.setMode('chord');f.app.playCurrent();assert.equal(f.audio.at(-1).arp,false);
});
check('Mobil kamera zoom/çevirme/tekerlek olaylarını kilitler; dokunma hedefi çalışır',()=>{
 const f=require('./scene.test.cjs').fixture(true);f.scene.update(f.state);f.flush();const cell=f.svg.querySelector('[data-string="1"][data-fret="3"]'),points=cell.children[0].attributes.points;
 f.scene.setCamera('perspective');f.scene.setZoom(2.4);f.stage.emit('wheel',{target:f.svg,deltaY:-100});f.stage.emit('pointerdown',{isPrimary:true,target:cell,pointerId:1,clientX:10,clientY:10});f.root.emit('pointermove',{pointerId:1,clientX:100,clientY:70});f.flush();
 assert.equal(f.scene.getCamera().preset,'top');assert.equal(f.scene.getCamera().zoom,1);assert.equal(cell.children[0].attributes.points,points);f.svg.emit('click',{target:cell.children[0]});assert.deepEqual(f.picked,[[1,3]]);
});
check('Sabit kamera hem 390×200 hem 844×280 yatay kadraja bütün klavyeyi sığdırır',()=>{
 const S=require('../scene.js');for(const [w,h] of [[390,200],[844,280],[510,220]]){const view=S.cameraMatrix(w,h,{mobile:true,yaw:0,elevation:88,zoom:1});for(const p of [[-7.7,-1.94,.24],[-7.7,1.85,.24],[7.2,-1.94,.24],[7.2,1.85,.24]]){const v=S.project(p,view.matrix,w,h);assert(v.x>=0&&v.x<=w&&v.y>=0&&v.y<=h,JSON.stringify(v));}}
});
check('24 perde çıktısı 0–24 etiketlerini ve son perdedeki seçili sesi taşır',()=>{
 const model={tuning:G.TUNINGS[0],capo:0,sceneRange:0,selectedPositions:[{stringIndex:0,fret:24}],color:'#7ee5e0'};const r=E.fretboardSvg(model,'0-24');assert.equal(r.width,2400);assert.equal((r.source.match(/data-fret-label=/g)||[]).length,25);assert(r.source.includes('data-string="0" data-fret="24" data-pc="4" data-role="selected"'));
 const visible=E.fretboardSvg(model,'visible');assert(visible.source.includes('data-fret-end="12"'));assert(!visible.source.includes('data-fret="24"'));model.sceneRange=12;assert(E.fretboardSvg(model,'visible').source.includes('data-fret-start="12"'));
});
check('Tam gam çıktısı doğru pitch class, capo ve ukulele tel sayısını korur',()=>{
 const scale=T.scaleNotes('C','major'),model={tuning:G.TUNINGS.find(t=>t.id==='ukuleleHighG'),capo:2,sceneRange:0,selectedPositions:[],activeScale:{...scale,degreeLabels:scale.notes.map(n=>n.label)},diagramLabels:'degrees'};const r=E.fretboardSvg(model,'0-24');const marks=[...r.source.matchAll(/data-string="(\d+)" data-fret="(\d+)" data-pc="(\d+)"/g)];assert(marks.length>20);for(const [,s,f,pc] of marks){assert(Number(s)<4);assert(Number(f)>=2);assert(scale.pcs.includes(Number(pc)));assert.equal(G.noteOnPosition(model.tuning,Number(s),Number(f),2).pitchClass,Number(pc));}
});
check('Ayarlar aralığı kayıt edilir; SVG, PNG ve PDF aynı 24 perde modelini alır',()=>{
 const F=require('./harmony-ui.test.cjs').fixture,f=F();f.app.setMode('project');f.change('exportRange','0-24');for(const action of ['exportSvg','exportPng','print'])f.action(action);assert.equal(f.exports.length,3);for(const e of f.exports)assert.equal(e.args.at(-1),'0-24');const loaded=F(false,f.preferences.saved);assert.equal(loaded.app.getState().exportRange,'0-24');
});
check('PWA manifesti tam ekran, serbest yön ve gerçek 192/512 maskable ikonları içerir',()=>{
 const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));assert.equal(manifest.display,'fullscreen');assert.equal(manifest.orientation,'any');assert.equal(manifest.start_url,'/');for(const icon of manifest.icons){const data=fs.readFileSync(icon.src);assert.equal(data.readUInt32BE(16),Number(icon.sizes.split('x')[0]));}assert(manifest.icons.some(i=>i.purpose==='maskable'));
});
check('Offline önbellek bütün modülleri, gitar örneklerini ve iki fontu gerçek dosyalardan alır',()=>{
 const source=fs.readFileSync('sw.js','utf8'),assets=vm.runInNewContext(source.match(/const ASSETS=(\[[^;]+\]);/)[1]);for(const file of assets)if(file!=='./')assert(fs.existsSync(file),file);assert(assets.includes('./guitar-samples.js'));assert(assets.includes('./pwa.js'));assert(assets.includes('./assets/fonts/Manrope.ttf'));
});
module.exports=checks;
