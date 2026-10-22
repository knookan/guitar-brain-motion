/* Copies exactly the files the app serves into a folder for GitHub Pages: everything in the
   service worker's offline list plus the worker itself. Research documents and data stay out. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const out=path.resolve(process.argv[2]||'site'),base=__dirname;
const context={self:{registration:{scope:'http://localhost/'},addEventListener(){}},URL,Headers,Response,Request,caches:{}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(base,'sw.js'),'utf8'),context);
const assets=vm.runInContext('ASSETS',context).filter(asset=>asset!=='./').map(asset=>asset.replace(/^\.\//,''));
const files=[...new Set(['index.html','sw.js','.nojekyll',...assets])];
fs.rmSync(out,{recursive:true,force:true});
let bytes=0;
for(const file of files){
  const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(base,file),target);bytes+=fs.statSync(target).size;
}
console.log(`Staged ${files.length} files (${(bytes/1e6).toFixed(1)} MB) in ${out}`);
