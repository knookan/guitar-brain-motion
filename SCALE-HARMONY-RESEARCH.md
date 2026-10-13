# Gam sistemleri ve armoni araştırması

**Müzik Beyni Studio · 10 Ekim 2026**

**Makam ve dil güncellemesi:** Aşağıdaki araştırma 117 temel katalog kaydını anlatır. Buna 27 makam/çeşni/varyant referansı eklenerek uygulama 144 kayda çıkarıldı. Makamların göreli 53 birimli teorik koordinatları ve standart gitar projeksiyonu ayrı tutulur; bu genişleme tam mikrotonal icra motoru değildir. Türkçe/İngilizce adlar ve seyir bilgisi [Makam referansı](MAKAM-REFERENCE.md) içinde açıklanmıştır. Atlas ve dışa aktarma dosyaları yeni toplamı içerir.

Bu çalışma, gamın seslerini ve o seslerle kurulabilecek armoniyi ayrı hesaplayan yeni sistemi açıklar. Uygulama için 117 adlandırılmış gam/armonik yaklaşım, 116 farklı ses koleksiyonu hazırlandı. Aynı koleksiyon farklı armonik dilde kullanılabildiğinden ad sayısı ile ses kümesi sayısı eşit değildir.

## 1. Kapsam ve “bütün gamlar” sorusu

Standart perdeli gitarın bu sürümü **12 eşit aralıklı, oktavda tekrarlanan sesleri** kullanır. Tonik sıfırın bulunduğu bütün matematiksel alt kümelerin sayısı 2¹¹ = 2.048'dir. Bunları ayrıca [12TET-COLLECTIONS.json](12TET-COLLECTIONS.json) içinde ürettim. Bu dosya 2.048 kültürel veya repertuvarla doğrulanmış gam olduğu anlamına gelmez; tek/iki sesli kümeler de içerir.

Adlandırılmış katalog için Tonal'ın MIT lisanslı formülleri alındı; ek modlar ana gamın ses aralıklarını döndürerek hesaplandı. Kaynak 92 kayıt içeriyor. Sekiz heptatonik ana ailenin yedişer modu tamamlandı, tekrar eden koleksiyonlar birleştirildi. Majör bebop ve majör altılı–eksik ise aynı sesleri farklı armonik kurallarla kullandıkları için ayrı tutuldu. [Tonal kaynak verisi](https://github.com/tonaljs/tonal/blob/783f1ba2286d56cd9c478d104204b9ecbb1ca095/packages/scale-type/data.ts), [sözlük belgesi](https://tonaljs.github.io/tonal/docs/dictionaries/scale-types).

Bu katalog dünya müziğindeki bütün gam ve akort sistemlerinin tamamlandığı iddiasını taşımaz. Scala arşivi 5.350'den fazla akort/gam dosyasını; tarihsel temperamanları, oran tabanlı sistemleri ve başka gelenekleri kapsıyor. Bunları standart gitarın yarım ses perdelerine yuvarlayarak eklemek bilgi kaybettirir. Bu nedenle mikrotonal sistemleri araştırma kapsamında ayırdım; mevcut gitar haritasında gerçekmiş gibi göstermedim. [Huygens–Fokker ölçek arşivi](https://www.huygens-fokker.org/microtonality/scales.html).

### Dosyalar

| Dosya | İçerik |
|---|---|
| [Gam atlası](SCALE-HARMONY-ATLAS.md) | 117 yaklaşımın formülü, C kökündeki notaları, temel/geniş akorları ve karakter sesleri |
| [CSV atlası](SCALE-HARMONY-ATLAS.csv) | Filtrelenebilir/tabloya aktarılabilir araştırma verisi |
| [JSON atlası](SCALE-HARMONY-ATLAS.json) | Nota üyeliği, gerilimler, mod ilişkileri ve kaynak metadata'sı |
| [Katalog JSON](SCALE-CATALOG.json) | Uygulamanın salt gam verisi |
| [Matematiksel koleksiyonlar](12TET-COLLECTIONS.json) | Tonik içeren bütün 12-TET alt kümeleri |

## 2. Kaynakları nasıl değerlendirdim?

| Kaynak | Kullanıldığı alan | Sınırı |
|---|---|---|
| Tonal · açık kaynak | Sayısal formüller, alternatif adlar | Ad/formül sözlüğü kültürel icra veya armonik işlev kanıtı değildir |
| Open Music Theory · açık ders kitabı | Tonikleştirme, modal armoni, jazz chord–scale ilişkisi | Bölümler belirli üslupları anlatır; her gama aynı kurallar uygulanmaz |
| Fundamentals, Function, and Form · açık ders kitabı | Napoliten ve artmış altılı sonoriteler | Ses yürüyüşü ve çevrim bağlamı önemlidir |
| Music21 · akademik yazılım belgesi | Yönlü, oktav dışı ve mikrotonal gam modelleri | Bazı sınıflar özellikle “pseudo-raga” olarak adlandırılır |
| MaqamWorld · uygulayıcıların kaynağı | Cins, makam, melodik seyir ve modülasyon | Arap makamını Türk makamıyla veya bir batı gamıyla özdeşleştirmez |
| UPF CompMusic | Türkiye makam müziğinin kültüre özgü hesaplamalı incelenmesi | Yalnız perde sınıfı, melodik gelişimi açıklamak için yeterli değildir |
| Open Studio ve Barry Harris yöntem notları | Altılı–eksik yaklaşımının temeli | İki akorlu veri modeli bütün reharmonizasyon pedagojisi değildir |

Gam ile tonalite aynı şey değildir. Bir akor için uygun bulunan koleksiyon, her akor değişiminde yeni bir tonaliteye geçildiğini göstermez. Tonik, bas, melodi ve çözülme bağlamı birlikte değerlendirilmelidir. Programın etiketleri bu nedenle “gam içi”, “tonal yaklaşım”, “modal renk” ve “gam dışı bağlantı” şeklinde ayrılır. [Open Music Theory: chord–scale teorisi](https://viva.pressbooks.pub/openmusictheorycopy/chapter/chord-scale-theory/).

## 3. Ana gam aileleri ve armonik yaklaşım

Aşağıdaki formüller tonik göreli aralıklardır. Mod listeleri ve C kökündeki akorlar ayrıca atlasın içinde hesaplanmış olarak bulunur.

| Aile / sistem | Ana formül | Armoni ekranındaki yaklaşım |
|---|---|---|
| Majör ve yedi modu | 1 2 3 4 5 6 7 | İyonya için tonal; diğer modlarda karakter sesleri ve modal merkez |
| Doğal minör / Eolya | 1 2 ♭3 4 5 ♭6 ♭7 | Gam içi v ile yükseltilmiş öncü sesli V7 ayrı |
| Harmonik minör ve yedi modu | 1 2 ♭3 4 5 ♭6 7 | Ana minörde dominant ilişkisi; diğer modlarda modal/renk hesabı |
| Jazz melodik minör ve yedi modu | 1 2 ♭3 4 5 6 7 | Minör maj7, Lidyen dominant, altered ve diğer modal renkler |
| Harmonik majör ve yedi modu | 1 2 3 4 5 ♭6 7 | Majör merkez ile minör iv rengi; üçüncü dizilimleri gerçek seslerden |
| Çift harmonik ve yedi modu | 1 ♭2 3 4 5 ♭6 7 | Artmış ikili aralıkları; klasik T–S–D etiketleri otomatik dayatılmaz |
| Napoliten majör ve yedi modu | 1 ♭2 ♭3 4 5 6 7 | Geniş minör/modal aile; isimdeki “majör” tonik üçlünün majör olduğu anlamına gelmez |
| Napoliten minör ve yedi modu | 1 ♭2 ♭3 4 5 ♭6 7 | ♭2, ♭6 ve öncü ses birlikte; akor kalitesi hesapla belirlenir |
| Macar majör ve yedi modu | 1 ♯2 3 ♯4 5 6 ♭7 | Farklı dereceler ve renk ilişkileri |
| Pentatonik / beş sesli | Koleksiyona göre | Gamın içinde gerçekten bulunan majör/minör/sus akorları |
| Blues | Küçük/büyük/birleşik biçimler | Melodik koleksiyon ile I7–IV7–V7 eşliği ayrı |
| Bebop | Yedi sesli iskelet + geçiş sesi | Geçiş sesi sekizinci tonal derece yapılmaz |
| Altılı–eksik | Altılı akor + eksik7 sesleri | Altılı/eksik çiftinin ilişkisi |
| Tam ton, eksik, artmış simetrik | Koleksiyona göre | Simetri, eşdeğer merkezler ve gam içi akorlar |
| Messiaen'in yedi koleksiyonu | Koleksiyona göre | Sınırlı transpozisyon ve ses üyeliği |
| Enigmatik, Prometheus ve diğerleri | Kaynak formülü | Ses üyeliği; bilinmeyen yapıya majör etiketi takılmaz |
| Kültürel adla kayıtlı koleksiyonlar | 12-TET katalog biçimi | Batı ses üyeliği incelemesi; özgün geleneksel armoni/seyir iddiası yok |

### Majör modların farklı davranması

| Mod | Öne çıkan renk | İncelenebilecek ilişki |
|---|---|---|
| Doryen | Minör üçlü + doğal 6 | i–IV veya IV–i merkez ilişkisi |
| Frigyen | ♭2 | ♭II–i yaklaşımı |
| Lidyen | ♯4 | II–I rengi |
| Miksolidyen | ♭7 | ♭VII–I ve ♭VII–IV–I |
| Eolya | ♭6 ve ♭7 | ♭VI/♭VII/i renkleri |
| Lokriyen | ♭2 ve ♭5 | Eksik tonik yapısı; güçlü otantik kadans varsayılmaz |

Bunlar bütün eserlerin zorunlu şemaları değildir. Modal malzeme ve tonal çözülme arasındaki fark özellikle vurgulanır. [Open Music Theory: modal şemalar](https://viva.pressbooks.pub/openmusictheory/chapter/modal-schemas/).

### Melodik ve harmonik minörde önemli ayrımlar

Jazz melodik minör bu uygulamada iki yönde aynı yedi sesi kullanır. Klasik melodik minörün inişte doğal minöre dönüşü ayrı yönlü model gerektirir; kullanıcı bunu gam açıklamasında görür. Music21 yönlü ve ağ tabanlı gamları modelleyebiliyor; gelecekteki yönlü sisteme uygun bir referans. [Music21 gam belgesi](https://music21.org/music21docs/moduleReference/moduleScale.html).

C harmonik minörün yedili akorları hesaplanırken üçüncü derece E♭–G–B–D içerir. Bu artmış maj7 yapıyı yalnızca “E♭ majör” diye göstermek yanlıştır. Katalogda özel bir akor adı bulunmadığında program **E♭[1,3,♯5,7]** gibi gerçek formülü gösterir. Bu örnek, yerel motorun doğrudan nota hesabıdır.

C altered, melodik minörün yedinci modudur: C–D♭–E♭–F♭–G♭–A♭–B♭. F♭ ile E aynı sesi verir; modal harf sırasını korumak için F♭ yazılır. Jazz akor rengi yorumunda bu sesin majör üçlü olarak duyulması ayrı bir bağlamdır. Program yalnız ses eşitliğinden tonal merkez sonucu çıkarmaz.

### Pentatonik neden yedi dereceli gam gibi armonize edilmez?

Beş sesli bir listede “her ikinci elemanı al” işlemi, diatonik üçüncü dizilimiyle aynı şey değildir. Yeni sistem tanınmış akor türlerini gerçek nota üyeliğiyle arar. C majör pentatonikte C, Am ve bazı sus yapıları bulunur; F majör ve G majörün bütün sesleri bu beşli koleksiyonda bulunmaz.

Buna rağmen pentatonikle F/G eşliği yapılabilir: melodik koleksiyon ile daha geniş armonik bağlam farklıdır. Program aynı tonikten başlayan olası üst gamları ve **eklenen sesleri** gösterir. C minör pentatonik için Doryen, Eolya ve Frigyen gibi seçenekler karşılaştırılabilir. Bu matematiksel kapsama ilişkisidir; tek bir tonaliteyi kanıtlamaz. Koleksiyon ve mod ayrımı için [Open Music Theory: koleksiyon analizi](https://viva.pressbooks.pub/openmusictheory/chapter/analyzing-with-collections-scales-and-modes/).

### Blues, bebop ve altılı–eksik

Blues melodisindeki ♭3 ile eşlikteki majör üçlü aynı anda bulunabilir. Bu yüzden minör blues seçildiğinde C7/F7/G7 eşlik katmanı, gam dışı sesleriyle birlikte ayrı gösterilir; bu akorlar sanki blues gamının bütün seslerinden kurulmuş gibi etiketlenmez. [Open Music Theory: blues armonisi](https://viva.pressbooks.pub/openmusictheory/chapter/blues-harmony/).

Majör bebop koleksiyonunda ek ses ritmik/geçiş rolü taşıyabilir; program armonizasyon için majör iskeleti kullanır. Doryen/dominant/minör/Lokriyen bebop kayıtları kendi iskeletleriyle ilişkilendirilir. “Ses üyeliği” modunda ise aynı koleksiyonun içindeki diğer akorlar ayrıca incelenebilir.

Majör altılı–eksik yaklaşımında C6'nin C–E–G–A sesleri ile Ddim7'nin D–F–A♭–B sesleri sekizli koleksiyonu tamamlar. Minör biçimde Cm6 kullanılır. Uygulama bu iki tamamlayıcı grubu gösterir; bütün Barry Harris yönteminin, borrowed notes ve hareketli çevrim pedagojisinin tamamlandığını iddia etmez. [Open Studio'nun yöntem anlatımı](https://www.youtube.com/watch?v=_n0vuuKdUyM), [Barry Harris yöntemi üzerine çalışma notları](https://irfu.cea.fr/Pisp/frederic.galliano/Zique/barry_harris.pdf).

### Simetriyi armonik işlevle karıştırmamak

Yerel transpozisyon hesabında tam ton iki, octatonic/eksik üç farklı ses kümesi üretir. Messiaen Mod 3 dört; Mod 4–7 altışar farklı transpozisyon üretir. Mod 1 tam ton, Mod 2 octatonic koleksiyonuyla ilişkilidir. Bunlar bütün 12 transpozisyonu deneyerek hesaplanmış sonuçlardır. Aynı ses kümesinin birden çok kökten adlandırılabilmesi, kendi başına güçlü bir tonik ya da V–I çözülmesi yaratmaz.

## 4. Yeniden yapılan armoni katmanları

### Tonik dominantı ve ikincil dominantlar

Bir majör/minör hedefin beşli üstünden kurulan V7, hedefe yönelmeyi sağlayan bir öneridir. Program C majörde A7→Dm, B7→Em, C7→F, D7→G ve E7→Am bağlantılarını üretir. Eksik/artmış üçlüler burada kararlı geçici tonik gibi kabul edilmez. C doğal minörde gam içi Gm ile tona yönelen G7 ayrı kayıtlardır; G7'nin B sesi gam dışı gösterilir.

İkincil öncü ses eksik7, hedefin yarım ses altında kurulur. Örneğin C♯dim7→Dm. Eksik7 simetrisi nedeniyle aynı sesler başka hedeflerle başka yazımlara sahip olabilir; hedef etiketi bu belirsizliği azaltır. [Open Music Theory: tonikleştirme](https://viva.pressbooks.pub/openmusictheory/chapter/tonicization/).

### Paralel gamdan ödünç alma

Majör için varsayılan kaynak aynı tonikten doğal minör, minör için paralel majördür. Kullanıcı Doryen, Frigyen, Lidyen, Miksolidyen, harmonik/melodik minör veya harmonik majör kaynaklarını da seçebilir. C majörden C doğal minöre geçilen örnekte Cm, Ddim, E♭, Fm, Gm, A♭ ve B♭ farklı üçlülerdir; yedili görünümde türler yeniden hesaplanır.

Kaynak gam, değişen sesler ve olası merkez ilişkisi açık gösterilir. Her ödünç akorun doğrudan toniğe çözülmesi gerektiği söylenmez. [Open Music Theory: modal mixture](https://viva.pressbooks.pub/openmusictheory/chapter/modal-mixture/).

### İlgili ii–V ve triton vekili

Majör hedef öncesinde ii7–V7; minör hedef öncesinde iiø7–V7 bulunur. Örneğin C için Dm7–G7, Am için Bm7♭5–E7. Bu çiftler üçüncü akorun içine dahil edilmez; ayrı düğüm/bağlantılardır. Ortak ses eksik7 ise hedefin kök sesini tutan komşu renk olarak gösterilir. [Open Music Theory: süsleyici akorlar](https://viva.pressbooks.pub/openmusictheory/chapter/jazz-embellishing-chords/).

Triton vekili hedefin yarım ses üstünde dominant7'dir: C'ye D♭7 yaklaşımı gibi. G7'nin B–F tritonu, D♭7'nin enharmonik C♭–F sesleriyle paylaşılır. Program bu aralık eşitliğini de test eder. Bu ilişki her bağlamda bütün üst renklerin eşdeğer olduğu anlamına gelmez. [Open Music Theory: substitüsyonlar](https://viva.pressbooks.pub/openmusictheory/chapter/substitutions/).

### Napoliten ve artmış altılı

Napoliten ♭II majör üçlüsünün ilk çevrimidir. C bağlamında **D♭/F** basıyla gösterilir; F bası gitar tutuşunda korunur. [Fundamentals, Function, and Form: Napoliten](https://milnepublishing.geneseo.edu/fundamentals-function-form/chapter/31-the-neapolitan-chord/).

C bağlamında It+6 = A♭–C–F♯, Fr+6 buna D ekler, Ger+6 buna E♭ ekler. A♭ ile F♯ dominant kökü G'ye açılır. Ger+6 sesleri enharmonik olarak A♭7 ile örtüşebilse de yazım ve hazırlık işlevi korunur; basitçe “A♭7” diye değiştirilmez. Alman biçimi için klasik çözülmede kadans 6/4 bağlamı ve paralel beşli konusu açıklanır. Program kontrpuan realizasyonu yapmaz. [Artmış altılı sonoriteler](https://milnepublishing.geneseo.edu/fundamentals-function-form/chapter/32-augmented-sixth-sonorities/).

### Kromatik medyan ve dörtlü kurulum

Medyan katmanı aynı kaliteli üçlülerden, minör/majör üçlü uzaklıkta ve tek ortak ses taşıyan dar bir alt grubu gösterir: C majör için E♭, E, A♭, A. Bu katman renk ilişkisidir; dominant çözülmesi etiketi almaz. Daha geniş medyan sınıflandırmasının tamamı bu seçime indirgenmez. [Open Music Theory: medyanlar](https://viva.pressbooks.pub/openmusictheory/chapter/mediants/).

“Tam dörtlüler” kurulumu üst üste 5 yarım ses aralıkları kullanır. C Doryende C–F–B♭ veya C–F–B♭–E♭ gibi yapılar bulunur. Q3/Q4 programın açıklayıcı etiketidir; evrensel bir akor simgesi iddiası taşımaz. Artmış dörtlülerin karıştığı bütün quartal türler veya üsluba göre bassız realizasyonlar henüz modellenmez. [William Flynn'in gitar odaklı dörtlü voicing çalışması](https://williamflynnguitar.github.io/music-tools/quartal-voicings/index.html).

## 5. Makam, raga ve başka akort sistemleri

Makam bir nota kümesinden daha fazlasıdır: cinsler, merkez/vurgu noktaları, melodik seyir ve modülasyon yolları önemlidir. Rast/Bayati/Hicaz vb. geleneksel icraları bir batı eşit aralıklı gam adıyla özdeşleştirmek doğru değildir. [MaqamWorld: makam](https://www.maqamworld.com/en/maqam.php), [cins](https://maqamworld.com/en/jins.php).

Türkiye makam müziği için kültüre özgü temsil ve seyir bilgisi gerekir. Araştırmada UPF CompMusic çalışmasını bu gereksinim için değerlendirdim. Bu sürümde Arel–Ezgi–Uzdilek/başka koma sistemleri ve makam seyir kuralları uygulanmış değildir. [CompMusic Türkiye makam müziği çalışması](https://mtg.upf.edu/system/files/publications/20-Sertan-Senturk-2nd-CompMusic-Workshop-2012.pdf).

Raga kayıtlarında da çıkış/iniş, karakteristik melodik hareket ve icra kuralları ayrı veri ister. Katalogdaki Todi/Malkos/Kafi gibi adlar yalnız Tonal'ın 12-TET kayıtları olarak işaretlenir. Music21'in bazı raga sınıflarını “pseudo-raga” diye tanımlaması bu ayrımın teknik olarak da gerekli olduğunu gösteriyor; gerçek raga motoru tamamlanmış sayılmaz.

Gelecek mikrotonal katman için gereken veri modeli: cents veya oran tabanlı perde, oktav dışı dönem, yönlü/asimetrik yürüyüş, melodik kalıp, gelenek/üslup etiketi ve kaynağın gözden geçirilme durumu. Scala içe aktarma, standart gitar perdelerinde tam karşılığı olmayan sesleri ayrıca belirtmelidir.

## 6. Uygulamada somut olarak değişenler

- Gam sayısı 17'den 117 adlandırılmış yaklaşıma çıktı; Türkçe aile ve alternatif ad araması var.
- Gam ve Armoni seçimleri aynı ton/gamı kullanıyor.
- Her gamın kendi profil, karakteristik ses, formül, mod ailesi ve simetri bilgisi gösteriliyor.
- “Gama göre / Ses üyeliği / Tam dörtlüler” ayrı kurulumlar.
- İkincil dominant, paralel ödünç ve diğer etkin katmanlar **doğrudan görünüm düğmeleriyle** açılıyor. Uzun haritanın altında aranması gerekmiyor.
- Bağlantı kartlarında hedef, gam dışı sesler, Çal ve Arpej bulunuyor.
- Üçlü/yedili seçimi hem haritaya hem seçili akora uygulanıyor.
- Akor dışındaki gam sesleri 9/11/13 ve alterasyon renkleri olarak hesaplanıyor. Üçlü/beşlinin yarım ses üstündeki sesler “bağlama bağlı” işaretleniyor; evrensel yasak olarak sunulmuyor.
- Harita panel genişliğine göre iki/üç sütun kullanıyor; yeniden boyutlandırıldığında yerleşim güncelleniyor. Belgeyi otomatik kaydıran bir işlem eklenmedi.

## 7. Doğrulama ve sınırlar

Otomatik kontroller nota yazımı, mod rotasyonları, akor üyeliği, işlev ayrımı, bas/çevrim, layer hedefleri ve arayüz olaylarını kapsıyor. Geniş taramada **8.424 senaryo, 106.152 akor kaydı, 46.260 bağlantı** incelendi; bu ölçütlerde hata bulunmadı. Sayılar farklı bağlamlarda dönen toplam kayıtlardır; benzersiz gam veya müzik eseri sayısı değildir.

Node arayüz fixture'ları gerçek render fonksiyonlarını ve Seç/Çal/Arpej olaylarını çalıştırır. Bu, gerçek tarayıcı/WebGL/ses çıkışı veya insan müzikal değerlendirmesi değildir. Statik şemalar da tarayıcı ekran görüntüsü olarak sunulmaz.

Sonraki geliştirmeler için açık alanlar: gerçek kontrpuan/ses yürüyüşü, çok tonlu pivot akor ve modülasyon değerlendirmesi, melodik zaman/ritim bağlamı, yönlü klasik minör, mikrotonal/makam/raga motoru ve kaynak/üslup bazında daha kapsamlı insan değerlendirmesi. Bu sürüm akor ve bağlantı araştırma motorudur; bütün eserlerin armonik analizini otomatik çözmüş değildir.

### Teknik yeniden üretim

Kaynak commit: `783f1ba2286d56cd9c478d104204b9ecbb1ca095`.

Kaynak SHA-256: `171f51fc8ae55263b7b2a0b982c471d678f63a1fb063b216ee6b0a9eb8a08f1a`.

Lisans: [Tonal MIT metni](SCALE-CATALOG-LICENSE.txt), katalog modülünde ve tek HTML içinde de korunur. Çalışırken uzak katalog indirilmez.

Yeniden üretim dosyaları `work/import-scales.cjs`, `work/export-scale-reference.cjs`, `work/harmony-audit.cjs`; doğrulama `tests/run.cjs`. Ayrıntılı denetim [work/harmony-audit.json](work/harmony-audit.json) içindedir.
