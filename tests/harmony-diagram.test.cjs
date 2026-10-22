/* Tonal harmony diagram: pure layout, labels, regions, pairs, arrows and rendering contract. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const T=require('../theory.js'),H=require('../harmony-engine.js'),D=require('../harmony-diagram.js');
const checks=[];function check(name,fn){fn();checks.push(name);}
const LAYERS={primary:true,borrowed:true,chromatic:true,leading:true,tritone:true,commonTone:true,sevenths:true};
const build=(root,scale)=>D.augment(H.buildGraph(root,scale,LAYERS));
const major=build('C','major'),minor=build('A','naturalMinor');
const byId=(model,id)=>model.items.find(i=>i.id===id);
const finite=model=>model.items.every(i=>Number.isFinite(i.x)&&Number.isFinite(i.y))&&model.arrows.every(a=>[a.x1,a.y1,a.x2,a.y2,a.bend].every(Number.isFinite));

check('Roma rakamları yedili akorlar için △, ø, ° ve ♭ ile yazılır',()=>{
  const m=D.model(major),label=id=>byId(m,id).label;
  assert.equal(label('diatonic-1'),'I△');assert.equal(label('diatonic-2'),'ii7');assert.equal(label('diatonic-5'),'V7');assert.equal(label('diatonic-7'),'vii7♭5');
  assert.equal(label('borrowed-2'),'ii7♭5');assert.equal(label('borrowed-4'),'iv7');assert.equal(label('borrowed-6'),'♭VI△');assert.equal(label('borrowed-7'),'♭VII7');
  assert.equal(label('neapolitan'),'N⁶');assert.equal(label('leading-1'),'VII°7');assert.equal(label('tritone-1'),'subV7');assert.equal(label('common-tone'),'I°7');
});

check('Akor adı kipi gerçek akor sembollerini gösterir',()=>{
  const m=D.model(major,{labels:'names'});
  assert.equal(byId(m,'diatonic-5').label,'G7');assert.equal(byId(m,'diatonic-1').label,'Cmaj7');assert.equal(byId(m,'pair-V-v').label,'D7');
});

check('Ödünç, kromatik ve öncü ses akorları işlev dairelerine yerleşir; diyatonikler serbest etiket olur',()=>{
  const m=D.model(major);
  for(const id of ['borrowed-2','borrowed-4','borrowed-6'])assert.equal(byId(m,id).cluster,'S',id);
  for(const id of ['borrowed-7','neapolitan','leading-1'])assert.equal(byId(m,id).cluster,'D',id);
  for(const id of ['borrowed-1','borrowed-3'])assert.equal(byId(m,id).cluster,'T',id);
  for(const id of ['diatonic-2','diatonic-4','diatonic-5','diatonic-6'])assert.equal(byId(m,id).cluster,undefined,id);
  assert.deepEqual(['diatonic-2','diatonic-4'].map(id=>byId(m,id).region),['S','S']);assert.equal(byId(m,'diatonic-5').region,'D');assert.equal(byId(m,'diatonic-6').region,'T');
});

check('Üç bölge çizgisi merkez noktada birleşir ve küme merkezleri doğru bölgededir',()=>{
  assert.equal(D.regionOf({x:D.CLUSTERS.S.x,y:D.CLUSTERS.S.y}),'S');assert.equal(D.regionOf({x:D.CLUSTERS.D.x,y:D.CLUSTERS.D.y}),'D');assert.equal(D.regionOf({x:D.CLUSTERS.T.x,y:D.CLUSTERS.T.y}),'T');
  assert.equal(D.regionOf({x:D.CENTRE.x,y:D.CENTRE.y}),'T');assert.equal(D.regionOf({x:200,y:20}),'S');assert.equal(D.regionOf({x:900,y:20}),'D');
  const m=D.model(major);assert.equal(m.lines.length,3);assert(m.lines.every(l=>l[0]===m.lines[0][0]&&l[1]===m.lines[0][1]));
});

check('İkincil dominant grupları sekiz hedef için doğru yazımla kurulur',()=>{
  const m=D.model(major);assert.equal(m.pairs.length,8);
  assert.deepEqual(m.pairs.map(p=>p.key).sort(),['II','III','IV','V','VI','bIII','bVI','bVII']);
  const root=id=>major.nodes.find(n=>n.id===id).record.root;
  assert.equal(root('pair-V-v'),'D');assert.equal(root('pair-IV-v'),'C');assert.equal(root('pair-bVII-v'),'F');assert.equal(root('pair-bIII-v'),'B♭');
  assert.equal(root('pair-IV-vii'),'E');assert.equal(root('pair-II-ii'),'E');
  assert.equal(byId(m,'pair-V-ii').label,'ii7/V');assert.equal(byId(m,'pair-bVII-v').label,'V7/♭VII');assert.equal(byId(m,'pair-IV-vii').label,'VII°7/IV');assert.equal(byId(m,'pair-II-half').label,'ii7♭5/II');
  assert(!major.nodes.some(n=>n.id==='pair-bVI-half'),'only II, IV and V carry a half-diminished ii');
  assert.equal(major.nodes.find(n=>n.id==='pair-V-half').record.typeId,'halfDim7');assert.equal(major.nodes.find(n=>n.id==='pair-V-vii').record.typeId,'dim7');
});

check('Kadans 6/4 ve V7sus4 gerçek akor kayıtları taşır',()=>{
  const sixFour=major.nodes.find(n=>n.id==='cadential-64').record,sus=major.nodes.find(n=>n.id==='cadential-sus4').record;
  assert.equal(sixFour.symbol,'C/G');assert.equal(sixFour.slashBassPc,7);assert.deepEqual([...sixFour.pitchClasses].sort((a,b)=>a-b),[0,4,7]);
  assert.equal(sus.symbol,'G7sus4');assert.deepEqual([...sus.pitchClasses].sort((a,b)=>a-b),[0,2,5,7]);
});

check('Augment tekrar çağrılınca düğümleri çoğaltmaz',()=>{
  const g=H.buildGraph('G','major',LAYERS);D.augment(g);const count=g.nodes.length;D.augment(g);assert.equal(g.nodes.length,count);
  assert.equal(new Set(g.nodes.map(n=>n.id)).size,g.nodes.length);
});

check('Bütün etiketler çizim alanının içinde kalır ve birbirine yakın değildir',()=>{
  for(const [name,graph] of [['C major',major],['A minor',minor],['F♯ major',build('F♯','major')],['E♭ harmonicMinor',build('E♭','harmonicMinor')]]){
    const m=D.model(graph);assert(finite(m),name);
    for(const i of m.items){assert(i.x>0&&i.x<D.W&&i.y>0&&i.y<D.H,name+' '+i.id);}
    for(let a=0;a<m.items.length;a++)for(let b=a+1;b<m.items.length;b++){
      const A=m.items[a],B=m.items[b],d=Math.hypot(A.x-B.x,A.y-B.y);assert(d>=16,name+' '+A.id+' vs '+B.id+' '+d.toFixed(1));
    }
  }
});

check('İkincil dominant grupları birbirinin ve işlev dairelerinin üstüne binmez',()=>{
  const m=D.model(major),box=p=>({x1:p.x-82,x2:p.x+112,y1:p.y-48,y2:p.y+58});
  for(let a=0;a<m.pairs.length;a++){
    const A=box(m.pairs[a]);assert(A.x1>=0&&A.x2<=D.W&&A.y1>=0&&A.y2<=D.H,m.pairs[a].key);
    for(let b=a+1;b<m.pairs.length;b++){const B=box(m.pairs[b]);assert(A.x2<=B.x1||B.x2<=A.x1||A.y2<=B.y1||B.y2<=A.y1,m.pairs[a].key+' vs '+m.pairs[b].key);}
    for(const c of m.clusters){const nx=Math.max(A.x1,Math.min(c.x,A.x2)),ny=Math.max(A.y1,Math.min(c.y,A.y2));assert(Math.hypot(nx-c.x,ny-c.y)>=c.r-4,m.pairs[a].key+' vs cluster '+c.func);}
  }
});

check('Oklar gerçek düğümlere bağlanır; ikincil oklar hedef akora, subV7 tonik dairesine gider',()=>{
  const m=D.model(major),ids=new Set(m.items.map(i=>i.id)),arrow=id=>m.arrows.find(a=>a.id===id);
  for(const a of m.arrows){assert(ids.has(a.from),a.id);if(a.to)assert(ids.has(a.to),a.id);}
  assert.equal(m.arrows.filter(a=>a.kind==='secondary').length,8);
  assert.equal(arrow('arrow-V').to,'diatonic-5');assert.equal(arrow('arrow-II').to,'diatonic-2');assert.equal(arrow('arrow-IV').to,'diatonic-4');
  assert.equal(arrow('arrow-bVII').to,'borrowed-7');assert.equal(arrow('arrow-bVI').to,'borrowed-6');assert.equal(arrow('arrow-bIII').to,'borrowed-3');
  const sub=m.arrows.find(a=>a.kind==='sub');assert.equal(sub.from,'tritone-1');assert.equal(sub.to,'diatonic-1');
  assert(m.arrows.some(a=>a.kind==='tonic'&&a.from==='diatonic-5'&&a.to==='diatonic-1'));
});

check('Minör tonda da sekiz grup, işlev daireleri ve geçerli konumlar üretilir',()=>{
  const m=D.model(minor);assert.equal(m.pairs.length,8);
  assert.equal(byId(m,'diatonic-1').label,'i7');assert.equal(byId(m,'diatonic-3').cluster,'T');assert.equal(byId(m,'diatonic-6').cluster,'S');assert.equal(byId(m,'diatonic-7').cluster,'D');
  assert.equal(m.arrows.filter(a=>a.kind==='secondary').length,8);
});

check('Klasik işlevi olmayan gamlar için çizim yerine bildirim döner',()=>{
  const g=H.buildGraph('C','wholeTone',LAYERS);D.augment(g);assert.equal(g._diagram,undefined);
  const m=D.model(g);assert.equal(m.notice,'nonfunctional');assert.equal(m.items.length,0);
  const box={};D.render(box,g,null,{language:'en'});assert(box.innerHTML.includes('hm-notice'));assert(!box.innerHTML.includes('hm-node'));
});

check('Render her akor için düğme verir; tıklama seçer, çift tıklama çalar, seçili düğüm işaretlenir',()=>{
  const listeners={},box={addEventListener:(type,fn)=>{(listeners[type]||=[]).push(fn);}},selected=[],played=[];
  const m=D.render(box,major,'diatonic-5',{onSelect:n=>selected.push(n.id),onAction:(n,a)=>played.push(n.id+':'+a),language:'en'});
  assert.equal((box.innerHTML.match(/class="hm-node /g)||[]).length,m.items.length);
  assert(box.innerHTML.includes('data-node-id="pair-V-v"'));assert(/hm-node[^"]*active"[^>]*data-node-id="diatonic-5"/.test(box.innerHTML));
  assert(box.innerHTML.includes('aria-pressed="true"'));assert(box.innerHTML.includes('<svg class="hm-svg"'));
  const target=id=>({closest:()=>({dataset:{nodeId:id}})});
  listeners.click.forEach(fn=>fn({target:target('diatonic-2')}));listeners.dblclick.forEach(fn=>fn({target:target('pair-IV-v')}));
  listeners.click.forEach(fn=>fn({target:{closest:()=>null}}));
  assert.deepEqual(selected,['diatonic-2']);assert.deepEqual(played,['pair-IV-v:play']);
});

check('Bölge başlıkları iki dilde yazılır ve yakınlaştırma sınırlıdır',()=>{
  const tr={},en={};D.render(tr,major,null,{language:'tr',zoom:9});D.render(en,major,null,{language:'en',zoom:0});
  assert(tr.innerHTML.includes('Tonik')&&en.innerHTML.includes('Tonic'));
  assert(tr.innerHTML.includes('--hm-zoom:2')&&en.innerHTML.includes('--hm-zoom:1'));
});

check('Harita varlıkları sayfaya, çevrimdışı önbelleğe ve tek dosya sürümüne eklidir',()=>{
  for(const [file,needles] of [['index.html',['harmony-diagram.js','harmony-diagram.css']],['sw.js',['harmony-diagram.js','harmony-diagram.css']],['build-standalone.js',['harmony-diagram.js','harmony-diagram.css']]])
    for(const needle of needles)assert(fs.readFileSync(file,'utf8').includes(needle),file+' '+needle);
  const css=fs.readFileSync('harmony-diagram.css','utf8');assert(css.includes("data-theme='light'")&&css.includes('prefers-reduced-motion'));
  assert(!/font-size:\s*[0-9](\.[0-9]+)?px/.test(css),'no text below 10px');
});

module.exports=checks;
