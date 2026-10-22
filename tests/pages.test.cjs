/* The Pages artifact is staged from the service worker's offline list, so it ships what the app needs and nothing else. */
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const checks=[];function check(name,fn){fn();checks.push(name);}
const out=fs.mkdtempSync(path.join(os.tmpdir(),'gb-pages-'));
cp.execFileSync(process.execPath,['stage-pages.js',out],{stdio:'pipe'});
const staged=[];(function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else staged.push(path.relative(out,full).split(path.sep).join('/'));}})(out);

check('Hazırlanan klasör sayfayı, işçiyi, bütün modülleri ve 48 gitar örneğini taşır',()=>{
  for(const file of ['index.html','sw.js','manifest.webmanifest','.nojekyll','guitar-samples.js','harmony-diagram.js','harmony-diagram.css'])assert(staged.includes(file),file);
  assert.equal(staged.filter(f=>/^assets\/audio\/guitar\/\d+\.pcm$/.test(f)).length,48);
  for(const f of staged)assert.equal(fs.statSync(path.join(out,f)).size,fs.statSync(f).size,f);
});

check('Sayfanın başvurduğu her yerel dosya hazırlanan klasörde bulunur',()=>{
  const html=fs.readFileSync('index.html','utf8');
  for(const [,url] of [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)]){if(/^(https?:|data:|mailto:)/.test(url))continue;assert(staged.includes(url.replace(/^\.\//,'')),url);}
});

check('Araştırma belgeleri, veri dökümleri, testler ve derleme betikleri yayına girmez',()=>{
  for(const f of staged)assert(!/\.(md|csv|json|cjs|txt)$/.test(f)||/^assets\//.test(f),f);
  for(const unwanted of ['SCALE-HARMONY-ATLAS.json','MAKAM-CATALOG.json','12TET-COLLECTIONS.json','build-standalone.js','stage-pages.js','README.md','tests/run.cjs'])assert(!staged.includes(unwanted),unwanted);
  const bytes=staged.reduce((n,f)=>n+fs.statSync(path.join(out,f)).size,0);assert(bytes<12e6,'staged '+bytes);
});

check('Yayın iş akışı hazırlama adımını çalıştırır ve yalnızca o klasörü yükler',()=>{
  const yml=fs.readFileSync('.github/workflows/pages.yml','utf8');
  assert(yml.includes('node stage-pages.js site'));assert(/path:\s*site\s*$/m.test(yml));assert(!/path:\s*\.\s*$/m.test(yml));
  assert(fs.readFileSync('.gitignore','utf8').split('\n').includes('site/'));
});

fs.rmSync(out,{recursive:true,force:true});
module.exports=checks;
