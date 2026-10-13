/* Turkish makam reference records. 53-unit diagrams are theoretical coordinates,
   not measured performance intonation. Guitar/chord membership uses a separately
   labelled nearest-12-TET projection. Makams with the same pitches stay distinct. */
(function(root){
  'use strict';
  const base='https://islamansiklopedisi.org.tr/';
  const rows=[
    ['rast','Rast','Rast',[0,9,17,22,31,40,48],'G','Rast',5,'ascending','Rast pentachord + Rast tetrachord','Rast beşlisi + Rast dörtlüsü','rast'],
    ['acemli-rast','Acemli Rast','Rast · Acem variant',[0,9,17,22,31,40,44],'G','Rast',5,'descending','Rast pentachord + Buselik tetrachord','Rast beşlisi + Buselik dörtlüsü','rast'],
    ['ussak','Uşşak','Ussak',[0,8,13,22,31,35,44],'A','Dügâh',4,'ascending','Ussak tetrachord + Buselik pentachord','Uşşak dörtlüsü + Buselik beşlisi','ussak'],
    ['bayati','Bayati','Bayati',[0,8,13,22,31,35,44],'A','Dügâh',4,'mixed','Ussak tetrachord + Buselik pentachord; starts near the middle register','Uşşak dörtlüsü + Buselik beşlisi; orta bölge odaklı başlangıç','https://cdn2.islamansiklopedisi.org.tr/dosya/5/C05001903.pdf'],
    ['huseyni','Hüseyni','Huseyni',[0,8,13,22,31,39,44],'A','Dügâh',5,'mixed','Huseyni pentachord + Ussak tetrachord','Hüseyni beşlisi + Uşşak dörtlüsü','huseyni'],
    ['acemli-huseyni','Acemli Hüseyni','Huseyni · Acem variant',[0,8,13,22,31,35,44],'A','Dügâh',5,'descending','Huseyni pentachord + Kurdi tetrachord; descending Acem colour','Hüseyni beşlisi + Kürdi dörtlüsü; inişte Acem rengi','huseyni'],
    ['neva','Neva','Neva',[0,8,13,22,31,39,44],'A','Dügâh',4,'mixed','Ussak tetrachord + Rast pentachord','Uşşak dörtlüsü + Rast beşlisi','neva'],
    ['kurdi','Kürdi','Kurdi',[0,4,13,22,31,35,44],'A','Dügâh',4,'ascending','Kurdi tetrachord + Buselik pentachord','Kürdi dörtlüsü + Buselik beşlisi','kurdi'],
    ['kurdili-hicazkar','Kürdili Hicazkâr','Kurdili Hicazkar',[0,4,13,22,31,35,44],'G','Rast',8,'descending','Kurdi collection on Rast; descending form, with multiple seyir variants','Rast üzerinde Kürdi; inici biçim, farklı seyir türleri vardır','kurdili-hicazkar'],
    ['buselik','Buselik','Buselik',[0,9,13,22,31,35,44],'A','Dügâh',5,'ascending','Buselik pentachord + Kurdi tetrachord','Buselik beşlisi + Kürdi dörtlüsü','buselik'],
    ['buselik-hicaz','Buselik · Hicaz üst bölge','Buselik · Hicaz upper region',[0,9,13,22,31,36,48],'A','Dügâh',5,'ascending','Buselik pentachord + Hicaz tetrachord','Buselik beşlisi + Hicaz dörtlüsü','buselik'],
    ['nihavend','Nihavend','Nihavend',[0,9,13,22,31,35,44],'G','Rast',5,'mixed','Buselik structure on Rast; Kurdi upper region','Rast üzerinde Buselik; üst bölgede Kürdi','nihavend--musiki'],
    ['nihavend-hicaz','Nihavend · Hicaz üst bölge','Nihavend · Hicaz upper region',[0,9,13,22,31,36,48],'G','Rast',5,'mixed','Buselik structure on Rast; Hicaz upper region','Rast üzerinde Buselik; üst bölgede Hicaz','nihavend--musiki'],
    ['cargah','Çargâh','Cargah',[0,9,18,22,31,40,49],'C','Çargâh',5,'ascending','Cargah pentachord + Cargah tetrachord','Çargâh beşlisi + Çargâh dörtlüsü','cargah'],
    ['mahur','Mahur','Mahur',[0,9,18,22,31,40,49],'G','Rast',8,'descending','Cargah collection on Rast; upper tonic is prominent','Rast üzerinde Çargâh koleksiyonu; tiz durak vurgusu','mahur'],
    ['hicaz','Hicaz','Hicaz',[0,5,17,22,31,39,44],'A','Dügâh',4,'mixed','Hicaz tetrachord + Rast pentachord','Hicaz dörtlüsü + Rast beşlisi','hicaz--musiki'],
    ['humayun','Hümayun','Humayun',[0,5,17,22,31,35,44],'A','Dügâh',4,'mixed','Hicaz tetrachord + Buselik pentachord','Hicaz dörtlüsü + Buselik beşlisi','humayun--musiki'],
    ['uzzal','Uzzal','Uzzal',[0,5,17,22,31,39,44],'A','Dügâh',5,'mixed','Hicaz pentachord + Ussak tetrachord; fifth-degree focus','Hicaz beşlisi + Uşşak dörtlüsü; beşinci derece vurgusu','uzzal'],
    ['zirguleli-hicaz','Zirgüleli Hicaz','Zirguleli Hicaz',[0,5,17,22,31,36,48],'A','Dügâh',5,'mixed','Hicaz pentachord + Hicaz tetrachord','Hicaz beşlisi + Hicaz dörtlüsü','zirguleli-hicaz'],
    ['hicazkar','Hicazkâr','Hicazkar',[0,5,17,22,31,36,48],'G','Rast',8,'descending','Zirguleli Hicaz collection on Rast; descending entry','Rast üzerinde Zirgüleli Hicaz; inici giriş','hicazkar'],
    ['nikriz','Nikriz','Nikriz',[0,9,14,26,31,40,48],'G','Rast',5,'mixed','Nikriz pentachord + Rast tetrachord','Nikriz beşlisi + Rast dörtlüsü','nikriz'],
    ['nikriz-buselik','Nikriz · Buselik üst bölge','Nikriz · Buselik upper region',[0,9,14,26,31,40,44],'G','Rast',5,'descending','Nikriz pentachord + Buselik tetrachord','Nikriz beşlisi + Buselik dörtlüsü','nikriz'],
    ['karcigar','Karcığar','Karcigar',[0,8,13,22,27,39,44],'A','Dügâh',4,'mixed','Ussak tetrachord + Hicaz pentachord','Uşşak dörtlüsü + Hicaz beşlisi','karcigar'],
    ['suzinak','Suzinak','Suzinak',[0,9,17,22,31,36,48],'G','Rast',5,'mixed','Basic Suzinak: Rast pentachord + Hicaz tetrachord','Basit Suzinak: Rast beşlisi + Hicaz dörtlüsü','suzinak'],
    ['segah','Segâh','Segah',[0,5,14,22,31,36,48],'B','Segâh',3,'ascending','Full Segah pentachord + Hicaz tetrachord; Acem/Neva alternatives occur','Tam Segâh beşlisi + Hicaz dörtlüsü; Acem/Neva alternatifleri vardır','segah'],
    ['huzzam','Hüzzam','Huzzam',[0,5,14,19,31,36,48],'B','Segâh',3,'mixed','Huzzam pentachord + Hicaz tetrachord; Neva-Humayun region is also important','Hüzzam beşlisi + Hicaz dörtlüsü; Neva-Hümayun bölgesi de önemlidir','huzzam'],
    ['saba','Saba','Saba',[0,8,13,18],'A','Dügâh',3,'mixed','Lower Saba tetrachord only. The overlapping upper network is not an octave scale.','Yalnız alt Saba dörtlüsü. Örtüşen üst bölge tek oktavlık gam değildir.','https://cdn2.islamansiklopedisi.org.tr/dosya/35/C35011565.pdf']
  ];
  const major=[0,2,4,5,7,9,11];
  const performanceNotes={
    rast:{tr:'İnişte Eviç yerine Acem kullanılabilir; Acemli Rast kaydı bu üst bölgeyi ayrı gösterir. Makamın bütünü bu diziye indirgenmez.',en:'Descending phrases may replace Evic with Acem; the Acemli Rast entry shows that upper region separately. A makam is more than its pitch collection.'},
    ussak:{tr:'Kaynak, inişte Segâhın yazımdan 1–2 koma daha pes basılmasını anlatır. Buradaki iki örnek sabit dinleme karşılaştırmasıdır; otomatik seyir uygulanmaz.',en:'The source describes Segah 1–2 commas below its notation in descending phrases. The two presets are fixed listening examples; seyir is not automated.'},
    bayati:{tr:'Uşşak ile ses koleksiyonunu paylaşır; başlangıç bölgesi ve seyir farklıdır. Uşşak için verilen sabit icra örneği bu kayda otomatik kopyalanmaz.',en:'Shares a pitch collection with Ussak but differs in entry region and seyir. Fixed performance examples for Ussak are not automatically copied to this entry.'},
    huseyni:{tr:'İnişte Eviç yerine Acem kullanılabilir. Acemli Hüseyni ayrı bir dizi varyantıdır; her inişte zorunlu uygulanacak bir kural değildir.',en:'Descending phrases may use Acem instead of Evic. Acemli Huseyni is a separate collection variant, not a mandatory rule for every descent.'},
    neva:{tr:'Eviç yerine Acem ile iniş, Nevâda Bûselik kalışına imkân verir. Burada temel koleksiyon gösterilir; bu seyir değişimi otomatik seslendirilmez.',en:'Descending with Acem instead of Evic permits a Buselik resting point on Neva. This entry shows the main collection; the melodic change is not automatic.'},
    huzzam:{tr:'Hisar, kaynağa göre yazımdan 1 veya 1,5 koma daha dik basılabilir; seyir ve çeşniyle değişir. Seçilebilir örnekler yalnız bu farkı gösterir.',en:'According to the source, Hisar may be raised 1 or 1.5 commas from its notation and varies with melodic context. Presets demonstrate only that difference.'},
    saba:{tr:'Alt dörtlü 18 komadır. Kaynak dördüncü sesin icrada değişken dikleşmesini anlatır; tam üst ağ ve bu icra davranışı bu sürümde seslendirilmez.',en:'The lower tetrachord spans 18 commas. The source describes a variable raising of its fourth pitch; the full upper network and that performance behavior are not synthesized here.'}
  };
  const records=rows.map(([id,nameTr,nameEn,commas,traditionalRoot,tonicName,focusDegree,seyir,structureEn,structureTr,source])=>{
    const intervals=commas.map(c=>Math.round(c*12/53)),steps=commas.map((_,i)=>i);
    const formula=intervals.map((pc,i)=>{const d=pc-major[i];return(d<0?'♭'.repeat(-d):'♯'.repeat(d))+(i+1);});
    const makam={nameTr,nameEn,commas:Object.freeze(commas),cents:Object.freeze(commas.map(c=>c*1200/53)),traditionalRoot,tonicName,focusDegree,seyir,structureEn,structureTr,partial:id==='saba',source:source.startsWith('https:')?source:base+source,tuningModel:'53-EDO reference · approximation of AEU intervals, not exact AEU ratios',projection:'nearest-12-TET',tonicOffsetCommas:['segah','huzzam'].includes(id)?-1:0,performanceNote:performanceNotes[id]?Object.freeze(performanceNotes[id]):null};
    return Object.freeze({id:'makam-'+id,name:nameTr,nameTr,nameEn,aliases:[nameTr,nameEn,'Makam '+nameEn,'Turkish '+nameEn],family:'Türk makamları',intervals:Object.freeze(intervals),steps:Object.freeze(steps),formula:Object.freeze(formula),parents:[],tertian:false,culturalApproximation:true,harmony:'makam',source:makam.source,mask:intervals.reduce((m,p)=>m|(1<<p),0),transpositionCount:12,makam:Object.freeze(makam)});
  });
  const API=Object.freeze({records:Object.freeze(records),metadata:Object.freeze({count:records.length,scope:'Reference variants, not all historical makams. Standard guitar is a labelled approximation; no automatic authentic makam harmonization.'})});root.MBS2Makams=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
