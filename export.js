/* Data exports use the same chord/voicing records as the interactive view. */
(function(root){
  "use strict";
  const T=root.MBS2Theory||(typeof require!=="undefined"?require('./theory.js'):null),G=root.MBS2Guitar||(typeof require!=="undefined"?require('./guitar.js'):null);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function fretboardSvg(model,range='visible'){
    const start=range==='12-24'?12:range==='visible'?model.sceneRange||0:0,end=range==='0-24'?24:start+12;
    const width=end-start===24?2400:1600,height=560,count=model.tuning.notes.length,left=125,right=width-60,top=150,bottom=height-90,lane=(bottom-top)/(count-1),openWidth=64;
    const boundaryStart=Math.max(0,start-1),fraction=f=>1-Math.pow(2,-f/12),x=f=>left+openWidth+(fraction(f)-fraction(boundaryStart))/(fraction(end)-fraction(boundaryStart))*(right-left-openWidth);
    const center=f=>f===0?left+openWidth/2:(x(f-1)+x(f))/2;
    const selected=new Set((model.selectedPositions||[]).map(p=>p.stringIndex+':'+p.fret)),voice=new Set((model.activeVoicing?.frets||[]).map((f,s)=>s+':'+f)),scale=model.activeScale,chord=model.activeChord,accent=/^#[0-9a-f]{6}$/i.test(model.color||'')?model.color:'#7ee5e0';
    const title=chord?.symbol|| (scale?scale.root+' '+(model.language==='tr'?scale.scale.nameTr||scale.scale.name:scale.scale.nameEn||scale.scale.name):'Guitar Brain');
    const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-fret-start="${start}" data-fret-end="${end}"><rect width="100%" height="100%" rx="24" fill="#101923"/><style>text{font-family:Arial,sans-serif;text-anchor:middle;dominant-baseline:middle}.note{font-weight:700;font-size:16px}</style><text x="${left}" y="44" fill="#eef4ff" font-size="26" style="text-anchor:start">${escape(title)}</text><text x="${left}" y="84" fill="#9caec5" font-size="16" style="text-anchor:start">${escape(model.tuning.notes.join(' · '))} · ${start}–${end} · Capo ${model.capo||0}</text><rect x="${left+openWidth}" y="${top-18}" width="${right-left-openWidth}" height="${bottom-top+36}" fill="#1b2633" rx="6"/>`];
    for(let f=boundaryStart;f<=end;f++)parts.push(`<line x1="${x(f)}" x2="${x(f)}" y1="${top-18}" y2="${bottom+18}" stroke="${f===0?'#f3e5c9':'#8293a6'}" stroke-width="${f===0?6:2}"/>`);
    for(const f of [3,5,7,9,12,15,17,19,21,24])if(f>=Math.max(start,1)&&f<=end)for(const y of f%12===0?[top+lane*1.5,bottom-lane*1.5]:[(top+bottom)/2])parts.push(`<circle cx="${center(f)}" cy="${y}" r="6" fill="#546272"/>`);
    for(let f=start;f<=end;f++)parts.push(`<text data-fret-label="${f}" x="${center(f)}" y="${top-42}" fill="#aabbd0" font-size="17">${f}</text>`);
    for(let row=0;row<count;row++){
      const s=count-1-row,y=top+row*lane;parts.push(`<text x="${left-45}" y="${y}" fill="#c0cddd" font-size="18">${escape(model.tuning.notes[s])}</text><line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="#c4cccf" stroke-width="${1.2+(count-1-s)*.25}"/>`);
      if(model.activeVoicing?.frets[s]<0)parts.push(`<text x="${left-15}" y="${y}" fill="#9caec5" font-size="22">×</text>`);
      for(let f=start;f<=end;f++){
        if(f<(model.capo||0))continue;const n=G.noteOnPosition(model.tuning,s,f,model.capo||0);if(!n)continue;const pc=n.pitchClass,key=s+':'+f,tone=chord?.notes?.find(n=>n.pc===pc),index=scale?.pcs.indexOf(pc)??-1;
        let role='',label=n.name;
        if(selected.has(key))role='selected';else if(voice.has(key)||model.sceneToneView&&chord?.pitchClasses.includes(pc)){role=pc===chord.rootPc?'root':'chord';label=tone?.name||label;}else if(index>=0){role=pc===scale.rootPc?'root':'scale';label=model.diagramLabels==='degrees'?scale.degreeLabels?.[index]||label:scale.spellings?.[index]||label;}else if(model.comparisonPcs?.includes(pc))role='comparison';
        if(model.positionWindow&&(f<model.positionWindow[0]||f>model.positionWindow[1])&&!selected.has(key)&&!voice.has(key))role='';if(!role)continue;
        const fill=role==='root'?'#eccb8b':role==='selected'?accent:role==='scale'?'#12212a':'#ac9cf5',r=Math.max(10,Math.min(19,(f===0?openWidth:x(f)-x(f-1))*.35,lane*.35));
        parts.push(`<g data-string="${s}" data-fret="${f}" data-pc="${pc}" data-role="${role}"><circle cx="${center(f)}" cy="${y}" r="${r}" fill="${fill}" stroke="${role==='scale'?accent:'#e4e9f1'}" stroke-width="2"/><text class="note" x="${center(f)}" y="${y}" fill="${role==='scale'?'#e1f7f5':'#101923'}" font-size="${r<14?12:16}" style="font-size:${r<14?12:16}px">${escape(label)}</text></g>`);
      }
    }
    if(model.capo>0&&model.capo>=start&&model.capo<=end)parts.push(`<line x1="${x(model.capo)-5}" x2="${x(model.capo)-5}" y1="${top-22}" y2="${bottom+22}" stroke="#596676" stroke-width="8"/>`);
    parts.push('</svg>');return {source:parts.join(''),width,height};
  }
  function download(filename,mime,blob){const url=URL.createObjectURL(blob instanceof Blob?blob:new Blob([blob],{type:mime}));const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function saveJSON(data,filename="muzik-beyni-proje.json"){download(filename,"application/json;charset=utf-8",JSON.stringify(data,null,2));}
  function vlq(value){let buffer=Number(value)&0x7f;const bytes=[];while((value>>=7)){buffer<<=8;buffer|=((value&0x7f)|0x80);}for(;;){bytes.push(buffer&255);if(buffer&0x80)buffer>>=8;else break;}return bytes;}
  function midiFile(notes,{bpm=90,durationBeats=2}={}){
    const ppq=480,tempo=Math.round(60000000/Math.max(30,Math.min(240,bpm))),events=[];
    notes.forEach(note=>{const midi=Math.max(0,Math.min(127,Math.round(note.midi??note))),start=Math.max(0,Math.round((note.startBeat||0)*ppq)),end=Math.max(start+1,Math.round(((note.startBeat||0)+(note.durationBeats||durationBeats))*ppq));events.push({tick:start,bytes:[0x90, midi, 92]},{tick:end,bytes:[0x80,midi,0]});});
    events.sort((a,b)=>a.tick-b.tick||a.bytes[0]-b.bytes[0]);
    const track=[0x00,0xff,0x51,0x03,(tempo>>16)&255,(tempo>>8)&255,tempo&255];let previous=0;
    for(const event of events){track.push(...vlq(event.tick-previous),...event.bytes);previous=event.tick;}
    track.push(0,0xff,0x2f,0);const header=[0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,(ppq>>8)&255,ppq&255];const trackHeader=[0x4d,0x54,0x72,0x6b,(track.length>>>24)&255,(track.length>>>16)&255,(track.length>>>8)&255,track.length&255];return new Uint8Array([...header,...trackHeader,...track]);
  }
  function saveMidi(notes,options){download("muzik-beyni-notalar.mid","audio/midi",midiFile(notes,options));}
  function serializeSvg(svg,width,height){
    const clone=svg.cloneNode(true);
    clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("width",String(width));clone.setAttribute("height",String(height));
    clone.classList.remove("webgl-overlay");clone.style.transform="";
    clone.querySelectorAll(".hit-area,.playback-layer").forEach(node=>node.remove());
    const style=document.createElementNS("http://www.w3.org/2000/svg","style");
    const accent=root.getComputedStyle?.(document.documentElement).getPropertyValue("--cyan").trim()||"#7ee5e0";
    style.textContent=".fallback-layer{opacity:1}.board-face{fill:url(#boardGradient);stroke:#768597;stroke-width:1}.board-edge{fill:url(#edgeGradient);stroke:#465569;stroke-width:.7}.board-binding{fill:none;stroke:#aab9c1;stroke-opacity:.42;stroke-width:1.3}.fret-wire{stroke:#abb9c8;stroke-width:3;stroke-linecap:round}.fret-wire.nut{stroke:#cfccbd;stroke-width:7}.fret-highlight{stroke:#e5ecf3;stroke-width:.8;stroke-opacity:.72}.string-shadow{stroke:#0009;stroke-width:3}.string-wire{stroke:#d8dfdf;stroke-opacity:.8}.inlay{fill:#aaaeb8;fill-opacity:.45}.fret-number,.string-name{fill:#91a9c0;font:500 11px sans-serif;text-anchor:middle}.marker-halo{fill:"+accent+";opacity:.14}.marker{fill:#ac9cf5;stroke:#e5deff;stroke-width:1.2}.marker.selected{fill:"+accent+";stroke:#d4fffa}.marker.chord{fill:#ac9cf5;stroke:#ddd5ff}.marker.scale{fill:#12212a;stroke:"+accent+"}.marker.root{fill:#eccb8b;stroke:#fff0c9}.marker-ring{fill:none;stroke:#ffffff30;stroke-width:3}.marker-text{fill:#10151e;font:700 11px sans-serif;text-anchor:middle;dominant-baseline:central}.marker-text.light{fill:#c9f0f2}.mute-indicator{fill:#7c8ca3;font:500 16px sans-serif;text-anchor:middle}.capo-line{stroke:#434956;stroke-width:12;stroke-linecap:round}";
    clone.insertBefore(style,clone.firstChild);
    return new XMLSerializer().serializeToString(clone);
  }
  function saveSvg(svg,model,range){download("muzik-beyni-gitar.svg","image/svg+xml;charset=utf-8",model?fretboardSvg(model,range).source:serializeSvg(svg,1400,756));}
  function savePng(svg,model,range){const image=model?fretboardSvg(model,range):{source:serializeSvg(svg,1800,972),width:1800,height:972},url=URL.createObjectURL(new Blob([image.source],{type:"image/svg+xml;charset=utf-8"})),img=new Image();img.onload=()=>{const canvas=document.createElement("canvas");canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext("2d");ctx.fillStyle="#080b12";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{if(blob)download("muzik-beyni-gitar.png","image/png",blob);URL.revokeObjectURL(url);});};img.onerror=()=>URL.revokeObjectURL(url);img.src=url;}
  function print(model,range){if(!model){root.print();return;}document.querySelector('#printExport')?.remove();const host=document.createElement('div');host.id='printExport';host.innerHTML=fretboardSvg(model,range).source;document.body.append(host);document.documentElement.classList.add('printing-export');const cleanup=()=>{host.remove();document.documentElement.classList.remove('printing-export');};root.addEventListener('afterprint',cleanup,{once:true});try{root.print();}catch(error){cleanup();throw error;}}
  root.MBS2Export=Object.freeze({saveJSON,midiFile,saveMidi,saveSvg,savePng,print,fretboardSvg});
  if(typeof module!=="undefined"&&module.exports)module.exports=root.MBS2Export;
})(typeof window!=="undefined"?window:globalThis);
