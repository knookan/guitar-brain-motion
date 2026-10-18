const fs=require("node:fs");
const path=require("node:path");
const base=__dirname;
const files=["scale-catalog.js","makam-catalog.js","makam-tuning.js","i18n.js","theory.js","chord-pool.js","voicing-catalog.js","guitar.js","voicing-engine.js","chord-diagram.js","guitar-samples.js","audio.js","harmony-engine.js","harmony-atlas.js","orbit-engine.js","orbit-view.js","harmony-map.js","export.js","scene.js","pwa.js","motion-engine.js","motion-workspace.js","app.js"];
let html=fs.readFileSync(path.join(base,"index.html"),"utf8");
const css=fs.readFileSync(path.join(base,"styles.css"),"utf8").replace(/url\(["']?(assets\/fonts\/[^"')]+)["']?\)/g,(_,asset)=>{
  const bytes=fs.readFileSync(path.join(base,asset));
  return 'url("data:font/ttf;base64,'+bytes.toString("base64")+'")';
});
if(!html.includes('<link rel="stylesheet" href="styles.css">'))throw new Error("Stylesheet link not found in index.html");
html=html.replace('<link rel="stylesheet" href="styles.css">',()=>`<style>\n${css}\n</style>`);
html=html.replace('<link rel="stylesheet" href="motion.css">',()=>`<style>\n${fs.readFileSync(path.join(base,"motion.css"),"utf8")}\n</style>`);
html=html.replace('<link rel="stylesheet" href="atlas.css">',()=>`<style>\n${fs.readFileSync(path.join(base,"atlas.css"),"utf8")}\n</style>`);
html=html.replace(/^\s*<script defer src="(?:scale-catalog|makam-catalog|makam-tuning|i18n|theory|chord-pool|voicing-catalog|guitar|voicing-engine|chord-diagram|guitar-samples|audio|harmony-engine|harmony-atlas|orbit-engine|orbit-view|harmony-map|export|scene|pwa|motion-engine|motion-workspace|app)\.js"><\/script>\s*$/gm,"");
html=html.replace('<link rel="stylesheet" href="orbit.css">',()=>`<style>\n${fs.readFileSync(path.join(base,"orbit.css"),"utf8")}\n</style>`);
const scripts=files.map(name=>{const code=fs.readFileSync(path.join(base,name),"utf8");if(code.includes("</script>"))throw new Error(`${name} contains an unescaped script terminator`);return `<script>\n${code}\n</script>`;}).join("\n");
html=html.replace('<link rel="stylesheet" href="workspace-layout.css">',()=>`<style>\n${fs.readFileSync(path.join(base,"workspace-layout.css"),"utf8")}\n</style>`);
html=html.replace('<script defer src="workspace-layout.js"></script>',"");
const layoutScript=fs.readFileSync(path.join(base,"workspace-layout.js"),"utf8");
if(!html.includes("</body>"))throw new Error("Body closing tag not found");
// A local single-file copy cannot install an offline worker or resolve app icons.
html=html.replace(/^\s*<link rel="(?:manifest|icon|apple-touch-icon)"[^>]*>\s*$/gm,"");
html=html.replace("</body>",()=>`${scripts}\n<script>\n${layoutScript}\n</script>\n</body>`);
const output=path.join(base,"Guitar_Brain_Motion.html");
fs.writeFileSync(output,html,"utf8");
console.log(`Standalone app written: ${output}`);
