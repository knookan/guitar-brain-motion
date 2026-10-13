# Akor tutuş sistemi: araştırma ve uygulama

10 Ekim 2026. Amaç: yalnız doğru notaları içeren şekiller değil, gitar üzerinde anlamlı alternatifler sunmak. Aşağıdaki sonuçlar kaynak okuması, yerel veri denetimi ve uygulanan model kararlarını ayrı belirtir.

## Eski motorun sorunu

Eski arama tel başına bütün uygun perdeleri ve susturma seçeneğini birleştiriyordu. En fazla dört perde farkı dışında el kısıtı yoktu. Puanlama çalınan tel sayısını artırınca ceza veriyor; bu nedenle bölünmüş, iki tarafında susturulan telleri olan küçük şekiller öne çıkıyordu. Sonuç sayısı sekizle sınırlandırılmıştı. İlk 50.000 kombinasyonda durması da farklı klavye konumlarını eşit değerlendirmiyordu.

Yerel tekrar üretiminde C için 0,x,x,0,x,8; F♯7 için x,x,23,23,23,0 çıktıları görüldü. Bunlar akor seslerini içerse de normal eşlik tutuşları arasında ilk sıraya konmamalıydı. Ayrıca C13 yedi ayrı sesi zorunlu saydığı için altı telli gitarda hiç sonuç vermiyordu.

## İncelenen kaynaklar

| Kaynak | Sağladığı bilgi | Kullanım kararı |
| --- | --- | --- |
| [tombatossals/chords-db](https://github.com/tombatossals/chords-db) ve [MIT lisansı](https://github.com/tombatossals/chords-db/blob/master/LICENSE) | Akor başına birden fazla konum, baseFret, MIDI ve bare verisi. | Sabit sürümden çevrimdışı katalog oluşturuldu. İsimleri doğruluk garantisi sayılmadı; sesler ayrıca hesaplanıyor. |
| [Leeds Conservatoire gitar hazırlık paketi](https://www.leedsconservatoire.ac.uk/media/1bspf2g3/jazz-preparation-pack-guitar.pdf), s. 7–10 | Üçlü çevrimleri, Drop 2, Drop 3 ve shell tutuşları; kapalı dört sesli şekillerin gitardaki güçlüğü. | Bu aileler ayrı üretiliyor ve filtreleniyor. |
| [Milton Mermikides / University of Surrey: Drop II voicings](https://blogs.surrey.ac.uk/arts/wp-content/uploads/sites/17/2011/05/Drop2-voicings.pdf) | Drop 2'nin ikinci üst sesi bir oktav indirmesi, çevrimler ve farklı tel grupları. | Etiket yalnız gerçek MIDI dizilimi Drop 2/3 koşulunu sağladığında veriliyor. |
| [McVicar, Fukayama ve Goto: AutoGuitarTab](https://staff.aist.go.jp/m.goto/PAPER/IEEETASLP201507mcvicar.pdf), 2015 | Gitar klavyesinin fiziksel kısıtları, el açıklığı ve çalım bağlamıyla gerçekçi tablature üretimi. | Nota doğruluğuna ek olarak gitar üzerinde konum ve el kısıtları kullanılıyor. Makalenin yazılımı veya öğrenilmiş modeli kopyalanmadı. |
| [D'Hooge vd.: Guitar Chord Diagram Suggestion](https://arxiv.org/html/2407.14260v1), 2024 | Aynı akorun çok sayıda tutuşu; veri kümelerindeki yanlış etiketler; önceki tutuşun bağlamı ve anatomik ölçütlerin sınırları. | Kaynak etiketi yerine gerçek pitch seti doğrulanıyor. Çeşitlilik, yalnız tek tek susturulmuş tel varyantlarını sayarak artırılmıyor. |
| [Matthew Keating / Dartmouth: Jazz Guitar Voice-Leading Chord Fingerings](https://digitalcommons.dartmouth.edu/cs_senior_theses/9/), 2023 | Profesyonel jazz gitar tutuşlarından veri ve ardışık akorlar için ses yürütme. | Jazz ailelerinin ayrı sunulmasını destekleyen karşılaştırma kaynağı. Bu güncelleme bir yürüyüş ekranı veya öğrenilmiş geçiş modeli eklemiyor. |

Araştırmanın ortak sonucu: müzikal doğruluk, el kısıtları, tutuşun ailesi ve bağlam ayrı değerlendirilmelidir. Tek bir fret-span puanı bunların yerine geçmez. Kaynaklar insan icracı değerlendirmesini de kullanır; yerel otomatik kontrollerimiz böyle bir değerlendirme sayılmaz.

## Katalog nasıl alındı?

- Kaynak commit: df06fa7b425cf5fd29485ff6591236b3557e3fac.
- Kaynak JSON SHA-256: cfe439962b2f444d2c341b1f0261403b4c3a3416e321147286fc608922699974.
- 3.283 konumun relative fret sayısı baseFret ile fiziksel perdeye çevrildi; pozitif frete baseFret−1 eklenirken açık ve susturulmuş teller ayrı korundu.
- Her telin fiziksel perdesinden bağımsız MIDI hesabı yapıldı ve kaynaktaki MIDI dizisiyle karşılaştırıldı. Bu kontrolde uyuşmayan kayıt çıkmadı.
- Aynı kök ve fiziksel tel/perde konumuna sahip tekrarlar birleştirildi: 3.212 kayıt kaldı.
- Bu sayı bütün kayıtların insan eliyle onaylandığı anlamına gelmez. Akor sorgusunda ses kimliği ve ergonomi filtresi yeniden uygulanır.
- Lisans CATALOG-LICENSE.txt dosyasında ve gömülü katalog kodunda korunur. Uygulama çalışırken ağdan veri indirmez.

## Uygulanan motor

### 1. Adayların kaynakları

Önce alışılmış açık/bare tutuşları, sonra katalog şekilleri, taşınabilir şablonlar, matematiksel Drop 2/3 ve konum pencerelerinde üretilen tutuşlar değerlendirilir. Genel arama bitişik tel gruplarını kullanır. Tek bir arada susturulan tel içeren shell/Drop 3 şekilleri ayrıca üretilir ve “Parmakla çal” olarak belirtilir.

Standart akorttan aynı aralıklarla transpoze edilmiş akortlarda katalog taşınabilir. Drop D/DADGAD gibi farklı tel aralıklarında standart katalog zorlanmaz; gerçek akorttan arama yapılır. Capo, fiziksel perde ve ses yüksekliği ayrı tutulur.

### 2. Parmak ve bare kısıtları

Her basılan ses bir eylem sayılır; aynı fret üzerindeki uygun teller bare ile tek eylem olabilir. Bare, daha aşağıda basılan veya açık kalması gereken bir telin üzerinden geçemez. Örtme araması bütün basılan noktaları en fazla dört parmak ve en fazla iki bare eylemiyle karşılamalıdır. Parmak numaraları arayüzde gösterilmez.

Perde açıklığına ek olarak 648 mm ölçek üzerinden fiziksel fret merkezi uzaklığı hesaplanır. Dört fret farkı ve 112 mm ulaşım sınırı bu uygulamanın temkinli eşikleridir; akademik kaynakların evrensel anatomik sınırı olarak sunulmaz. Gerçek el büyüklüğü, sap genişliği, çalım tekniği ve gitar gövdesi sonucu değiştirebilir. Thumb-over, tapping ve çok büyük özel gerilmeler modellenmez.

### 3. Akorun kimliğini koruma

- Üçlüler, sus ve power akorları gerekli seslerinin tamamını korur.
- “Tüm akor sesleri” açıkken hiçbir ses otomatik çıkarılmaz.
- Varsayılan gitar voicing'inde dört ve daha fazla sesli akorun doğal beşlisi çıkarılabilir. Kök, akorun üçüncüsü/yedilisi ve en üst belirtilen renk korunur.
- Geniş 11/13 akorlarının aradaki doğal 9/11 sesleri isteğe bağlı olabilir. Elle add/alter ile istenen sesler korunur.
- 7alt, en az bir altered beşli ve bir altered dokuzlu taşır; çıkarılan diğer seçenekler görünürdür. Açıkça istenen alterasyon bunun yerine geçirilmez.
- Shell, kök ile üçüncü/yedili veya altılıyı korur; altered beşli gibi akor kimliğini belirleyen bir sesi gizlice silmez.
- Slash akorunda bas, ilk çalınan tel değil gerçek en düşük MIDI sesiyle doğrulanır. Bu reentrant/özel akortlarda önemlidir.
- Çıkarılan sesler her kartta “5 yok”, “9 yok” gibi belirtilir; ana akorun teorik nota kutularında soluk gösterilir. Playback ve MIDI seçili tutuşun gerçek sesleridir.

### 4. Sıralama ve seçenekler

Alışılmış tutuş, kök bas, düşük/orta konum, daha az gerilme ve az iç susturma tercih edilir. Seçimde farklı konumlar ve tel grupları temsil edilir. Aile, seviye, fiziksel perde bölgesi ve bas filtreleri bulunur. Ekran 12 tutuşla başlar, liste 12'şer genişletilir; mevcut sorgu için en fazla 144 aday sunulur. Her akorda bu sayıya ulaşılacağı vaat edilmez.

## Doğrulama sonucu

- 79 otomatik kontrol: teori, katalog, 33 temel şablon, tutuş sesi, capo, alternatif/4–8 telli akortlar, dört parmak/bare kuralları, Drop 2/3, shell, geniş akorlar, gerçek bas ve arayüz olay akışı. C7 x32310 gibi alışılmış beşlisiz tutuşlar pratik modda kabul edilir; tam ses modunda beşliyi içeren bir alternatif gerekir.
- Ek tarama: 594 akor/ton/akort/capo senaryosunda 56.599 dönen sonuç incelendi. Akor dışı ses, capo altı perde, 24 üstü perde ve modelde dört parmak sınırı ihlali bulunmadı. Bu sayı farklı senaryolardaki sonuçların toplamıdır; benzersiz katalog büyüklüğü değildir.
- Seç/Çal/Arpej, aile ve zorluk filtresi, daha fazla kart ve yüksek perde seçimi Node arayüz fixture'larında çalıştırıldı.
- Statik diyagram incelemesi ayrı yapıldı. Gerçek tarayıcı görünümü ve gitarist icrası doğrulanmış gibi raporlanmaz.

Tekrar üretim: node work/import-catalog.cjs, node tests/run.cjs ve node work/voicing-audit.cjs. Ayrıntılı kayıtlar work/catalog-audit.json ve work/voicing-audit.json dosyalarındadır.
