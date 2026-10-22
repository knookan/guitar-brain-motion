/* Browser smoke test: real Chromium against a served copy of the app.
   Usage: node tests/browser/smoke.cjs [baseUrl]   (needs playwright and axe-core; see .github/workflows/browser.yml)
   Environment: CHROMIUM_PATH selects a browser binary instead of Playwright's own. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const axeSource=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const base=process.argv[2]||'http://localhost:8764/';
const KEY='guitar-brain-motion-v1-project';
const results=[];
async function step(name,fn){const started=Date.now();try{await fn();results.push(['ok',name,Date.now()-started]);console.log('✓ '+name);}catch(error){results.push(['fail',name,error]);console.log('✗ '+name+'\n  '+String(error.message||error).split('\n').slice(0,6).join('\n  '));}}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const open=async({width=1440,height=900,state=null,permissions=[]}={})=>{
    const context=await browser.newContext({viewport:{width,height},permissions,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
    await page.goto(base,{waitUntil:'load'});
    if(state){await page.evaluate(([key,value])=>{localStorage.clear();localStorage.setItem(key,JSON.stringify({version:1,orbitVersion:1,mapVersion:1,...value}));},[KEY,state]);await page.reload({waitUntil:'load'});}
    await page.waitForTimeout(700);return {context,page,errors};
  };
  const tab=async(page,mode)=>{await page.locator(`[data-mode="${mode}"]`).first().click();await page.waitForTimeout(600);};
  const clean=async s=>{assert.deepEqual(s.errors,[],'no page errors');await s.context.close();};

  await step('First visit downloads about a megabyte, not eleven, and starts without errors',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];let bytes=0,pcm=0;
    page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{try{bytes+=(await r.body()).length;if(r.url().endsWith('.pcm'))pcm++;}catch(_){}});
    await page.goto(base,{waitUntil:'load'});await page.waitForTimeout(800);
    assert.equal(await page.title(),'Guitar Brain · Motion');assert.equal(pcm,0,'samples load on demand');assert(bytes<2.2e6,'first load '+(bytes/1e6).toFixed(2)+' MB');
    assert((await page.locator('.empty-state').textContent()).length>0);assert.deepEqual(errors,[]);await context.close();
  });

  await step('Notes: choosing notes on the fretboard lists them and finds chords',async()=>{
    const s=await open();
    for(const [string,fret] of [[1,3],[2,2],[4,1]])await s.page.locator(`.guitar-scene [data-string="${string}"][data-fret="${fret}"]`).first().click({force:true});
    await s.page.waitForTimeout(500);assert((await s.page.locator('.note-chip, .selected-notes span, .match-card').count())>0,'selected notes or matches shown');
    assert((await s.page.locator('#selectedCount').textContent()).trim().length>0);await clean(s);
  });

  await step('Chord: diagram with suggested fingers; Scale: scale list',async()=>{
    const s=await open();await tab(s.page,'chord');
    assert.deepEqual(await s.page.locator('.chord-focus .diagram-finger').allTextContents(),['3','2','1']);
    await tab(s.page,'scale');assert((await s.page.locator('select[data-change="scaleId"] option').count())>100);await clean(s);
  });

  await step('Harmony map: three regions, secondary groups, selecting a chord updates the inspector',async()=>{
    const s=await open();await tab(s.page,'harmony');
    assert((await s.page.locator('.hm-node').count())>=40);assert.equal(await s.page.locator('.hm-pair').count(),8);assert.equal(await s.page.locator('.hm-regions line').count(),3);
    await s.page.locator('[data-node-id="diatonic-5"] .hm-label').click();await s.page.waitForTimeout(400);
    assert.equal((await s.page.locator('.atlas-selected strong').textContent()).trim(),'G7');
    await s.page.locator('[data-action="mapLabels"]').click();await s.page.waitForTimeout(300);
    assert.equal((await s.page.locator('[data-node-id="diatonic-5"] .hm-label').textContent()).trim(),'G7');
    for(const lens of ['Orbit','Functions','Fifths','PLR']){await s.page.locator(`.atlas-lenses button:has-text("${lens}")`).click();await s.page.waitForTimeout(400);assert.equal((await s.page.locator('.atlas-lenses .active').textContent()).trim(),lens);}
    await clean(s);
  });

  await step('Motion: Space plays with count-in and loop, arrows step, library and share link round trip',async()=>{
    const s=await open({permissions:['clipboard-read','clipboard-write']});await tab(s.page,'motion');
    await s.page.locator('[data-motion="lib-preset"]').first().waitFor({state:'attached'}).catch(()=>{});
    await s.page.locator('.motion-library summary').click();await s.page.locator('[data-motion="lib-preset"][data-value="jazz-251"]').click();await s.page.waitForTimeout(400);
    assert.deepEqual(await s.page.locator('.sequence-pick strong').allTextContents(),['Dm7','G7','Cmaj7']);
    await s.page.locator('[data-value="loop"]').click();await s.page.locator('[data-value="countIn"]').click();
    await s.page.mouse.click(720,60);await s.page.keyboard.press('Space');await s.page.waitForTimeout(1200);
    assert((await s.page.evaluate(()=>MBS2Audio.getPlayback().events.length))>0,'count-in and loop scheduled notes');
    await s.page.keyboard.press('Space');await s.page.waitForTimeout(400);
    assert.equal(await s.page.evaluate(()=>MBS2Audio.getPlayback().events.length),0,'Space stops playback');
    await s.page.keyboard.press('ArrowRight');await s.page.waitForTimeout(300);
    assert.equal(await s.page.evaluate(()=>[...document.querySelectorAll('.sequence-item')].findIndex(e=>e.classList.contains('active'))),1);
    await s.page.locator('[data-lib-name]').fill('Smoke');await s.page.locator('[data-motion="lib-save"]').click();await s.page.waitForTimeout(300);
    assert.deepEqual(await s.page.locator('.lib-item strong').allTextContents(),['Smoke']);
    await s.page.locator('[data-motion="share"]').click();await s.page.waitForTimeout(400);
    const link=await s.page.evaluate(()=>navigator.clipboard.readText());assert(link.includes('#m='));
    // A link opened in a new tab loads the app with the hash...
    const fresh={context:await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'})};fresh.page=await fresh.context.newPage();
    await fresh.page.goto(link,{waitUntil:'load'});await fresh.page.waitForTimeout(900);
    assert.match(await fresh.page.locator('.share-banner').textContent(),/Dm7 → G7 → Cmaj7/);
    await fresh.page.locator('[data-motion="share-open"]').click();await fresh.page.waitForTimeout(400);
    assert.deepEqual(await fresh.page.locator('.sequence-pick strong').allTextContents(),['Dm7','G7','Cmaj7']);assert.equal(await fresh.page.evaluate(()=>location.hash),'');
    // ...and pasted into an open tab it only changes the hash, which must be noticed too.
    const open2=await open();await open2.page.evaluate(l=>{location.hash=new URL(l).hash;},link);await open2.page.waitForTimeout(900);
    assert.match(await open2.page.locator('.share-banner').textContent(),/Dm7 → G7 → Cmaj7/);assert.equal(await open2.page.locator('#appShell').getAttribute('data-workspace-mode'),'motion');
    await open2.page.locator('[data-motion="share-dismiss"]').click();await open2.page.waitForTimeout(300);assert.equal(await open2.page.locator('.share-banner').count(),0);
    await open2.context.close();await fresh.context.close();await clean(s);
  });

  await step('Left-handed mode mirrors the fretboard and is remembered',async()=>{
    const s=await open({state:{leftHanded:true}});
    assert.equal(await s.page.evaluate(()=>document.documentElement.dataset.hand),'left');
    const x=await s.page.evaluate(()=>{const c=(f)=>document.querySelector(`.guitar-scene [data-string="0"][data-fret="${f}"]`)?.getBoundingClientRect().x;return [c(1),c(9)];});
    assert(x[0]>x[1],'fret 1 is right of fret 9');await clean(s);
  });

  await step('Phone: no horizontal page scroll in any workspace and the controls stay reachable',async()=>{
    const s=await open({width:390,height:844});
    for(const mode of ['explore','chord','scale','harmony','motion']){await tab(s.page,mode);
      const overflow=await s.page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert(overflow<=1,mode+' overflows by '+overflow);
      assert(await s.page.locator('#playbackDock').isVisible(),mode+' dock');}
    await clean(s);
  });

  for(const theme of ['graphite','midnight','cyberpunk','light'])await step(`Accessibility: axe finds no violations in ${theme} (all workspaces)`,async()=>{
    const problems=[];
    for(const [name,extra] of [['explore',{}],['chord',{}],['scale',{}],['harmony',{harmonyLens:'map'}],['harmony',{harmonyLens:'orbit'}],['motion',{}],['project',{}]]){
      const s=await open({state:{theme,mode:name,lastMusicMode:name==='project'?'explore':name,...extra}});await tab(s.page,name);
      await s.page.addScriptTag({content:axeSource});
      const found=await s.page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','best-practice']},resultTypes:['violations']})).violations.map(v=>v.id+' ×'+v.nodes.length+' '+v.nodes[0].target.join(' ').slice(0,70)));
      for(const f of found)problems.push(name+(extra.harmonyLens?'/'+extra.harmonyLens:'')+': '+f);await s.context.close();
    }
    assert.deepEqual(problems,[]);
  });

  await browser.close();
  const failed=results.filter(r=>r[0]==='fail');
  console.log(`\n${results.length-failed.length}/${results.length} browser checks passed`);
  process.exit(failed.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
