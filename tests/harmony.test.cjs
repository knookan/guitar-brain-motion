const assert=require("node:assert/strict");
require("../theory.js");
const H=require("../harmony-map.js");
const checks=[];function check(name,fn){fn();checks.push(name);}
check("C majör haritası beş majör/minör hedefe ikincil dominantları bağlar",()=>{const graph=H.buildGraph("C","major");const links=graph.nodes.filter(n=>n.kind==="secondary").map(n=>[n.symbol,n.targetLabel]);assert.deepEqual(links,[ ["A7","Dm"],["B7","Em"],["C7","F"],["D7","G"],["E7","Am"] ]);});
check("Paralel minörün bütün farklı üçlüleri kaynaklarıyla eklenir",()=>{const graph=H.buildGraph("C","major");assert.deepEqual(graph.nodes.filter(n=>n.kind==="borrowed").map(n=>n.symbol),["Cm","Ddim","E♭","Fm","Gm","A♭","B♭"]);});
check("Mod gamına klasik işlev etiketi uydurulmaz",()=>assert.equal(H.buildGraph("C","mixolydian").functional,false));
check("Armoni haritası 280 ve 370 px panelde kartları kenara taşırmaz veya üst üste bindirmez",()=>{
  const nodes=H.buildGraph("C","major").nodes.filter(n=>n.kind==="diatonic");
  for(const [width,cardWidth] of [[280,86],[370,98]]){
    const positions=H.layout(nodes,width).positions;
    for(const a of positions)assert(a.x-cardWidth/2>=0&&a.x+cardWidth/2<=width);
    for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){const a=positions[i],b=positions[j];assert(Math.abs(a.x-b.x)>=cardWidth||Math.abs(a.y-b.y)>=104);}
  }
});
module.exports=checks;
