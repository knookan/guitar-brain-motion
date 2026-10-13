/* Compact chord diagrams use physical fret positions and actual tuning pitches. */
(function(root){
  "use strict";
  const T=root.MBS2Theory||(typeof require!=="undefined"?require("./theory.js"):null);
  const G=root.MBS2Guitar||(typeof require!=="undefined"?require("./guitar.js"):null);
  const escape=text=>String(text??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function model(shape,chord,tuning=G.TUNINGS[0],capo=0){
    if(!shape||!Array.isArray(shape.frets)||shape.frets.length!==tuning.notes.length)return null;
    capo=Math.max(0,Number(capo)||0);
    const pressed=shape.frets.filter(f=>f>capo),minimum=pressed.length?Math.min(...pressed):capo+1;
    const start=minimum<=capo+4?capo+1:minimum;
    const rows=Math.max(4,(pressed.length?Math.max(...pressed):start+3)-start+1);
    const left=50,right=204,top=52,bottom=top+rows*30;
    const strings=shape.frets.map((fret,index)=>{
      const muted=fret<0||fret<capo;
      const midi=muted?null:G.positionMidi(tuning,index,fret,capo);
      const pc=midi===null?null:T.mod(midi);
      const tone=chord?.notes?.find(n=>n.pc===pc);
      return {index,fret,muted,open:!muted&&fret===capo,midi,pc,
        root:pc!==null&&pc===chord?.rootPc,
        note:tone?.name||(midi===null?"":T.noteName(midi)),
        degree:tone?.label||"",tuning:tuning.notes[index].replace(/-?\d+$/,""),
        x:left+index*(right-left)/(shape.frets.length-1),
        y:muted||fret===capo?29:top+(fret-start+.5)*30};
    });
    const barres=(shape.barres||[]).filter(b=>b.fret>=start&&b.fret<start+rows&&
      strings[b.fromString]&&!strings[b.fromString].muted&&strings[b.toString]&&!strings[b.toString].muted)
      .map(b=>({fret:b.fret,x1:strings[b.fromString].x,x2:strings[b.toString].x,y:top+(b.fret-start+.5)*30}));
    return {width:248,height:bottom+35,left,right,top,bottom,start,rows,capo,strings,barres,
      radius:Math.min(11,(right-left)/(shape.frets.length-1)*.4),showNut:start===1&&capo===0};
  }
  function render(shape,chord,tuning,capo=0,{labels="notes",compact=false}={}){
    const m=model(shape,chord,tuning,capo);if(!m)return '<div class="diagram-unavailable">Tutuş bulunamadı</div>';
    let svg='<svg class="chord-diagram'+(compact?' compact':'')+'" viewBox="0 0 '+m.width+' '+m.height+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+escape((chord?.symbol||"Akor")+" · "+shape.frets.map(f=>f<0?"susturulmuş":f).join(", "))+'">';
    svg+='<title>'+escape((chord?.symbol||"Akor")+" gitar tutuşu")+'</title>';
    svg+='<rect class="diagram-board" x="'+(m.left-1)+'" y="'+m.top+'" width="'+(m.right-m.left+2)+'" height="'+(m.bottom-m.top)+'" rx="1"/>';
    for(let row=0;row<=m.rows;row++){
      const y=m.top+row*30;
      svg+='<line class="diagram-fret'+(row===0&&m.showNut?' diagram-nut':'')+'" x1="'+m.left+'" x2="'+m.right+'" y1="'+y+'" y2="'+y+'"/>';
    }
    svg+='<text class="diagram-position" x="22" y="'+(m.top+19)+'">'+m.start+'<tspan x="22" dy="13">fr</tspan></text>';
    m.strings.forEach(s=>{svg+='<line class="diagram-string" x1="'+s.x+'" x2="'+s.x+'" y1="'+m.top+'" y2="'+m.bottom+'"/>';});
    m.barres.forEach(b=>{svg+='<line class="diagram-barre" x1="'+b.x1+'" x2="'+b.x2+'" y1="'+b.y+'" y2="'+b.y+'"/>';});
    m.strings.forEach(s=>{
      if(s.muted){
        svg+='<path class="diagram-mute" data-string="'+s.index+'" d="M '+(s.x-4)+' 25 l 8 8 m 0 -8 l -8 8"/>';
      }else if(s.open){
        svg+='<circle class="diagram-open'+(s.root?' is-root':'')+'" data-string="'+s.index+'" cx="'+s.x+'" cy="29" r="5"/>';
      }else{
        svg+='<circle class="diagram-dot'+(s.root?' is-root':'')+'" data-string="'+s.index+'" data-fret="'+s.fret+'" cx="'+s.x+'" cy="'+s.y+'" r="'+m.radius+'"/>';
        const label=labels==="degrees"?s.degree:s.note;
        svg+='<text class="diagram-note" x="'+s.x+'" y="'+s.y+'" style="font-size:'+(m.strings.length>6?9:11)+'px">'+escape(label)+'</text>';
      }
      svg+='<text class="diagram-tuning" x="'+s.x+'" y="'+(m.bottom+23)+'">'+escape(s.tuning)+'</text>';
    });
    return svg+'</svg>';
  }
  const API=Object.freeze({model,render});root.MBS2Diagram=API;
  if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
