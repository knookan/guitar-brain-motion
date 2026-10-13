# Guitar Brain · Koma 1.0 — araştırma ve uygulama

11 Ekim 2026. Bu belge, kullanılan kaynakları, hesap modelini ve uygulamanın sınırlarını açıklar. Önceki çalışan v4 sürümü kaynakları ve yayın dosyalarıyla `outputs/releases/guitar-brain-v4/` altında korunmuştur; ZIP kopyası `Guitar_Brain_v4.zip` dosyasıdır. Yeni çalışma ayrı `outputs/guitar-brain-koma/` klasöründedir.

## 1. Makamı yalnız gam olarak düşünmemek

Makamda ses koleksiyonu kadar **durak, güçlü, seyir, başlangıç bölgesi, asma karar ve çeşniler** de önemlidir. Aynı sesleri kullanan kayıtları birleştirmedik: Uşşak/Bayati ve Hüseyni/Nevâ ayrı kalır. Uygulamadaki arpej, ses aralıklarını karşılaştırma egzersizidir; seyri gerçekleştiren bir taksim değildir. Durak için tek evrensel konser frekansı bulunmadığından kullanıcı tarafından seçilen kök ve A4 referansı ayrıca tanımlanır. [Şentürk, Atlı, Bozkurt — tonic frequency identification](https://www.mtg.upf.edu/system/files/publications/FMA2015_HSercanATLI_full-paper.pdf), [TDV — Uşşak](https://islamansiklopedisi.org.tr/ussak), [TDV — Nevâ](https://islamansiklopedisi.org.tr/neva).

Uygulamanın armoni kısmı standart gitarın yaklaşık 12-TET sesleri üzerinde akorları bulabilir. Bu, koma seslerinin geleneksel makam armonisi veya Batı işlevsel armonisiyle otomatik olarak uyumlu olduğu anlamına gelmez. Makamda ikincil dominant/ödünç akor kuralları otomatik açılmaz. Koma sesi, fiziksel eşit aralıklı gitar perdesine yerleştirilmez; elektronik dinlemede ayrıca üretilir.

## 2. Üç ayrı anlamı birbirine karıştırmamak

**AEU kuramı:** Arel–Ezgi–Uzdilek sistemi, gayri müsavi 24 perdeli Pisagor düzeni olarak araştırmalarda ele alınır. **53-EDO**, bu aralıklar için kullanışlı bir yaklaşık ızgaradır; AEU’nun tam frekans oranlarıyla özdeş değildir. Burada kullanılan eşit birim `1200/53 = 22,641509… cent` değeridir. Pisagor koması `1200 × log₂(531441/524288) ≈ 23,460010 cent` olur. İkisini aynı büyüklük gibi adlandırmak hatalıdır. [Yarman — A Comparative Evaluation of Pitch Notations, §5–6](https://www.ozanyarman.com/files/Abjad-JIMS-071119.pdf).

**İcra:** Kayıtlardan ölçülen entonasyonun bir kuramsal ızgaraya her zaman uymadığı, özellikle değişken perdelerde farklar bulunduğu araştırmalarda gösterilir. İcracı, melodik yön ve bağlam bir tek sabit dizi dosyasına indirgenemez. Alternatif 24/31, 41, 48, 53, 79 gibi öneriler aynı varsayımlara dayanmaz; bu sürümde bunları tam uygulanmış modeller olarak sunmuyoruz. [Bozkurt, Yarman, Karaosmanoğlu, Akkoç — Weighing Diverse Theoretical Models, 2009](https://www.tandfonline.com/doi/abs/10.1080/09298210903147673), [Yarman — İTÜ makalesi, s.2 ve sonrası](https://www.ozanyarman.com/files/itudergisi_makale_tam.pdf).

**12-TET gitar:** Bir oktav 12 eşit yarım sestir. Makamın en yakın perdelerinin boyanması, mikrotonal aralığın gitarda tam basılabildiğini göstermez. Bend, perdesiz gitar veya ek perde gibi teknikler bu sürümün fiziksel modelinde uygulanmaz. Perde sistemi karşılaştırmasının çalgıya göre ayrıca incelenmesi gerekir. [Aydın — AEU ve bağlama perde sisteminin karşılaştırılması](https://dergipark.org.tr/tr/pub/ijca/article/836102).

## 3. Aralık sözlüğü

Bu tabloda centler uygulamanın 53-EDO **hesap sonuçlarıdır**. Aralık adları ve eğitimde kullanılan koma sayıları MEB kaynağıyla karşılaştırılmıştır. `Tanini = 9 koma ≈ 203,774 cent`; bunu 12-TET’in 200 centlik tam sesiyle özdeş kullanmıyoruz. [MEB Dini Musiki, ünite 3, s.8](https://dogm.eba.gov.tr/panel/upload/etkilesimli/kitap/DiniMusiki/unite3/files/basic-html/page8.html).

| Aralık | Koma | 53-EDO cent |
|---|---:|---:|
| Koma | 1 | 22,6415 |
| Eksik bakiye | 3 | 67,9245 |
| Bakiye | 4 | 90,5660 |
| Küçük mücennep | 5 | 113,2075 |
| Büyük mücennep | 8 | 181,1321 |
| Tanini | 9 | 203,7736 |
| Artık ikili | 12 / 13 | 271,6981 / 294,3396 |

Dörtlü/beşli yapıları motorun kontrolünde temel bileşenlerdir: Rast dörtlüsü `9–8–5`, Uşşak dörtlüsü `8–5–9`, Kürdi dörtlüsü `4–9–9`, Buselik dörtlüsü `9–4–9`, Hicaz dörtlüsü `5–12–5`. Bunların oktav içindeki yerleri ve seyirleri ayrıca değerlendirilir. Aşağıdaki katalog, önceki sürümün 27 kaydını korur; yeni sayı tabloları bu kayıtların kümülatif koordinatlarından hesaplanır.

## 4. Katalog ve kapsam denetimi

Her kaydın kendi aktif kaynak bağlantısı uygulamada vardır. Tablodaki **0 duraktır**; son 53, üst duraktır. Saba için böyle bir oktav kapanışı eklenmez. Aynı koordinatlara sahip varyantlar tek makam kabul edilmez. Sayıların matematiksel tutarlılığı test edilir; bu, her eser ve icranın uzman tarafından onaylandığı anlamına gelmez.

| Kayıt | Durak / güçlü | Kümülatif koma | Kaynak / kapsam |
|---|---|---|---|
| Rast / Rast | Rast / 5 | 0 · 9 · 17 · 22 · 31 · 40 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/rast) · temel/varyant koleksiyon |
| Acemli Rast / Rast · Acem variant | Rast / 5 | 0 · 9 · 17 · 22 · 31 · 40 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/rast) · temel/varyant koleksiyon |
| Uşşak / Ussak | Dügâh / 4 | 0 · 8 · 13 · 22 · 31 · 35 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/ussak) · temel/varyant koleksiyon |
| Bayati / Bayati | Dügâh / 4 | 0 · 8 · 13 · 22 · 31 · 35 · 44 · 53 | [TDV](https://cdn2.islamansiklopedisi.org.tr/dosya/5/C05001903.pdf) · temel/varyant koleksiyon |
| Hüseyni / Huseyni | Dügâh / 5 | 0 · 8 · 13 · 22 · 31 · 39 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/huseyni) · temel/varyant koleksiyon |
| Acemli Hüseyni / Huseyni · Acem variant | Dügâh / 5 | 0 · 8 · 13 · 22 · 31 · 35 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/huseyni) · temel/varyant koleksiyon |
| Neva / Neva | Dügâh / 4 | 0 · 8 · 13 · 22 · 31 · 39 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/neva) · temel/varyant koleksiyon |
| Kürdi / Kurdi | Dügâh / 4 | 0 · 4 · 13 · 22 · 31 · 35 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/kurdi) · temel/varyant koleksiyon |
| Kürdili Hicazkâr / Kurdili Hicazkar | Rast / 8 | 0 · 4 · 13 · 22 · 31 · 35 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/kurdili-hicazkar) · temel/varyant koleksiyon |
| Buselik / Buselik | Dügâh / 5 | 0 · 9 · 13 · 22 · 31 · 35 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/buselik) · temel/varyant koleksiyon |
| Buselik · Hicaz üst bölge / Buselik · Hicaz upper region | Dügâh / 5 | 0 · 9 · 13 · 22 · 31 · 36 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/buselik) · temel/varyant koleksiyon |
| Nihavend / Nihavend | Rast / 5 | 0 · 9 · 13 · 22 · 31 · 35 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/nihavend--musiki) · temel/varyant koleksiyon |
| Nihavend · Hicaz üst bölge / Nihavend · Hicaz upper region | Rast / 5 | 0 · 9 · 13 · 22 · 31 · 36 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/nihavend--musiki) · temel/varyant koleksiyon |
| Çargâh / Cargah | Çargâh / 5 | 0 · 9 · 18 · 22 · 31 · 40 · 49 · 53 | [TDV](https://islamansiklopedisi.org.tr/cargah) · temel/varyant koleksiyon |
| Mahur / Mahur | Rast / 8 | 0 · 9 · 18 · 22 · 31 · 40 · 49 · 53 | [TDV](https://islamansiklopedisi.org.tr/mahur) · temel/varyant koleksiyon |
| Hicaz / Hicaz | Dügâh / 4 | 0 · 5 · 17 · 22 · 31 · 39 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/hicaz--musiki) · temel/varyant koleksiyon |
| Hümayun / Humayun | Dügâh / 4 | 0 · 5 · 17 · 22 · 31 · 35 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/humayun--musiki) · temel/varyant koleksiyon |
| Uzzal / Uzzal | Dügâh / 5 | 0 · 5 · 17 · 22 · 31 · 39 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/uzzal) · temel/varyant koleksiyon |
| Zirgüleli Hicaz / Zirguleli Hicaz | Dügâh / 5 | 0 · 5 · 17 · 22 · 31 · 36 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/zirguleli-hicaz) · temel/varyant koleksiyon |
| Hicazkâr / Hicazkar | Rast / 8 | 0 · 5 · 17 · 22 · 31 · 36 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/hicazkar) · temel/varyant koleksiyon |
| Nikriz / Nikriz | Rast / 5 | 0 · 9 · 14 · 26 · 31 · 40 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/nikriz) · temel/varyant koleksiyon |
| Nikriz · Buselik üst bölge / Nikriz · Buselik upper region | Rast / 5 | 0 · 9 · 14 · 26 · 31 · 40 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/nikriz) · temel/varyant koleksiyon |
| Karcığar / Karcigar | Dügâh / 4 | 0 · 8 · 13 · 22 · 27 · 39 · 44 · 53 | [TDV](https://islamansiklopedisi.org.tr/karcigar) · temel/varyant koleksiyon |
| Suzinak / Suzinak | Rast / 5 | 0 · 9 · 17 · 22 · 31 · 36 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/suzinak) · temel/varyant koleksiyon |
| Segâh / Segah | Segâh / 3 | 0 · 5 · 14 · 22 · 31 · 36 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/segah) · temel/varyant koleksiyon |
| Hüzzam / Huzzam | Segâh / 3 | 0 · 5 · 14 · 19 · 31 · 36 · 48 · 53 | [TDV](https://islamansiklopedisi.org.tr/huzzam) · temel/varyant koleksiyon |
| Saba / Saba | Dügâh / 3 | 0 · 8 · 13 · 18 | [TDV](https://cdn2.islamansiklopedisi.org.tr/dosya/35/C35011565.pdf) · alt dörtlü |

Başlıca yapısal karşılaştırmalar:

- **Rast:** Rast beşlisi ve Nevâda Rast dörtlüsü; inişte Acemli Rast üst bölgesi ayrı tutulur. [TDV Rast](https://islamansiklopedisi.org.tr/rast).
- **Hüseyni:** Hüseyni beşlisi + Hüseynide Uşşak dörtlüsü; inişte Acem varyantı ayrı seçilir. [TDV Hüseyni](https://islamansiklopedisi.org.tr/huseyni).
- **Hicaz ailesi:** Hicaz, Hümayun, Uzzal ve Zirgüleli Hicazı güçlü ve üst bölge farklılıklarıyla koruduk. [TDV Hicaz](https://islamansiklopedisi.org.tr/hicaz--musiki), [Hümayun](https://islamansiklopedisi.org.tr/humayun--musiki), [Uzzal](https://islamansiklopedisi.org.tr/uzzal), [Zirgüleli Hicaz](https://islamansiklopedisi.org.tr/zirguleli-hicaz).
- **Buselik/Nihavend:** Kürdi ve Hicaz üst bölgeleri ayrı varyantlar halinde tutulur. [TDV Buselik](https://islamansiklopedisi.org.tr/buselik), [Nihavend](https://islamansiklopedisi.org.tr/nihavend--musiki).
- **Nikriz:** Nikriz beşlisine Rast/Buselik üst bölgeleri; [TDV Nikriz](https://islamansiklopedisi.org.tr/nikriz).
- **Karcığar:** Uşşak alt bölgesi + Nevâda Hicaz beşlisi; [TDV Karcığar](https://islamansiklopedisi.org.tr/karcigar).
- **Basit Suzinak:** Rast alt bölgesi + Nevâda Hicaz dörtlüsü. Bu kaydı bütün Suzinak türlerinin ortak ve tek dizisi gibi kullanmıyoruz. [TDV Suzinak](https://islamansiklopedisi.org.tr/suzinak).
- **Segâh:** Yazılı durak Buselikten bir koma pesttir. Kökü standart B seçmek ile bu yazılı kaymayı etkinleştirmek ayrı işlemlerdir. [TDV Segâh](https://islamansiklopedisi.org.tr/segah).

## 5. İcra bilgisi nasıl kullanılıyor?

### Uşşak — ikinci derece

TDV kaynağı, inişte Segâhın notasyondan 1–2 koma daha pes basılmasını açıklar; Dügâh–Segâh aralığı 6–7 komaya iner. Teorik kayıttaki `8` korunur. Seçilebilir örnekler ikinci dereceyi `7` veya `6` yapar. Bunlar bir eser analizi veya kendiliğinden seyir üreten kurallar değildir. Kullanıcı isterse bu sabit farkı tek ses ya da dizi arpejiyle duyar. [TDV Uşşak](https://islamansiklopedisi.org.tr/ussak).

### Hüzzam — dördüncü derece / Hisar

Kaynak, Hisarın yazımdan 1 veya 1,5 koma daha dik olabileceğini ve bağlamla değiştiğini anlatır. Örneklerde koordinat `19` yerine `20` veya `20,5` olur; komşu iki aralık da bundan etkilenir. Bu değerler tüm Hüzzam icralarının sabit akordu olarak sunulmaz. [TDV Hüzzam](https://islamansiklopedisi.org.tr/huzzam).

### Saba — kapsamı sınırlamak

Kaynak, 18 komalık eksik alt dörtlünün üzerine Çargâh merkezli üst yapı ve değişken perdeler anlatır. Tek oktavlık 7 sesli bir listeyle bunu tamamlanmış gibi göstermek doğru olmaz. Mevcut kaydın dört derecesi korunur, eksik üst bölge görünür şekilde belirtilir; kaynakta tartışılan icra dikleşmesi için bu sürümde otomatik seslendirme kuralı yoktur. [TDV Saba, s.335–337](https://cdn2.islamansiklopedisi.org.tr/dosya/35/C35011565.pdf).

## 6. Uygulamadaki sayıların anlamı

1. **Derece:** kayıt içindeki sıra; bir makamın bütün seyir olasılıklarının özeti değildir.
2. **Önceki sesten:** `qᵢ − qᵢ₋₁` komadır. İlk satır için aralık yoktur.
3. **Duraktan:** kümülatif `qᵢ` ve `qᵢ × 1200/53` cent. Bu sütun, 12-TET seçiliyken de karşılaştırma için teorik koordinatı gösterir.
4. **12-TET farkı:** sesin seçili A4 referansındaki en yakın 12-TET notasından cent farkı. Yanında farkın Holder koma cinsinden hesabı bulunur. Bu **notasyondaki koma bemolü sayısı değildir**. Örneğin G üzerinde teorik Rast III yaklaşık B −15,094 centtir; bunu “Bden −1 Holder koma” diye yazmıyoruz.
5. **Hz:** seçilen model, kök kayması ve A4 frekansıyla çalınacak hedef frekans. 12-TET seçilince Hz buna göre değişir.
6. **Perde adı:** kaynağı desteklenen geleneksel yazılı derece adı. Transpoze edilince otomatik olarak geleneksel ahenk/perde adlandırması icat edilmez. Doğrulanmamış ad yerine derece numarası kullanılır. Kaynakla desteklenen yazılı arızalar ayrıca `B ↓1` veya `F ↑4` gibi gösterilir: bunlar geleneksel yazımda koma bemolü/diyezi sayısıdır; 12-TET farkıyla aynı sayı değildir. Eksik arıza bilgisi tahmin edilmez.

Segâh ve Hüzzamda **“geleneksel durakla aç”**, B kökünü ve −1 koma yazılı durak kaymasını etkinleştirir. Bu elektronik kök, B’nin seçili 12-TET frekansından `1200/53` cent pest kurulmuştur; tam Pisagor koordinatı iddiası değildir. Kök veya makam değiştirmek bu kaymayı ve eski icra örneğini sıfırlar. Diğer tercihler projede saklanır.

## 7. Ses motorunun hesabı

Kullanıcı kökü, varsayılan dinleme oktavında kesirli MIDI ile gösterilir:

```text
K = 1200 / 53
mᵢ = m_durak + qᵢ × K / 100
fᵢ = A4_Hz × 2^((mᵢ − 69) / 12)
```

Yazılı durak kayması varsa önce durak değerine eklenir; icra örneği ilgili `qᵢ` değerini değiştirir. A4=432 gibi farklı referanslar ses örneğine yalnız bir kez uygulanır. Oktav kapanışı mevcut tam kayıtlarda 53 koma = 1200 cent olarak eklenir; Saba hariçtir.

Gitar kayıtlarının kendi ölçülmüş detune değerleri hesaba katılarak `playbackRate` ayarlanır. Kesirli MIDI tamsayıya yuvarlanmaz. Bu yöntem kayıtların tınısını da bir miktar değiştirir; ney/tanbur icrası ya da dinamik süsleme sentezi değildir. Arpej Web Audio saatinde zamanlanır; A/B sıralaması tekrarları koruyarak **12-TET → koma** şeklinde çalınır. [W3C Web Audio — AudioBufferSourceNode](https://www.w3.org/TR/webaudio-1.0/#AudioBufferSourceNode).

Kayıttan alınan akordu referans yapan uyarlanabilir sentez çalışmaları, ileride kullanıcı icrasından perde profili çıkarmak için daha uygun bir yön gösterir. Bu sürümde kayıt analizi uygulanmamıştır. [Atlı, Şentürk, Bozkurt, Serra — Adaptive Tuning Approach, 2017](https://www.upf.edu/web/xavier-serra/publications?_ppc_WAR_ppcportlet_INSTANCE_G7Gce2cjUn9h_mvcRenderCommandName=%2Fppc%2Fdetail&_ppc_WAR_ppcportlet_INSTANCE_G7Gce2cjUn9h_ppcId=CAP22438&_ppc_WAR_ppcportlet_INSTANCE_G7Gce2cjUn9h_ppcLanguage=ANG&_ppc_WAR_ppcportlet_INSTANCE_G7Gce2cjUn9h_ppcType=ACT&p_p_id=ppc_WAR_ppcportlet_INSTANCE_G7Gce2cjUn9h&p_p_lifecycle=0&p_p_state=normal).

## 8. Gösterim, çıktı ve doğrulama sınırı

- Koma modeli makamın Gam ve Armoni panellerinde görünür. Varsayılan makam dinlemesi koma arpejidir; normal gam ve akor sesleri değişmez.
- Tek derece dinleme ve A/B vardır. Çalınan derece tabloda vurgulanır. 3D gitar üzerindeki turuncu işaret **en yakın fiziksel perdeyi** gösterir; hedef mikrotonal frekansın tam basma noktası değildir.
- İngilizce ve Türkçe görünüm, A4 referansı, 12-TET/koma tercihi ve örnek projede saklanır. Mobilde tabla kart satırlarına döner; belge kaymaz.
- Standart MIDI dışa aktarımı koma seslerini korumaz. Mikrotonal MIDI/MPE, ahenk sistemi, tam Pisagor AEU oran modu, dinamik seyir, genişletilmiş Saba ve kayıt tabanlı kişisel entonasyon henüz uygulanmamıştır.
- Otomatik testler bütün 27 kaydı 12 farklı kökte; frekans/oktav hesabını; seçilebilir örnekleri; gerçek UI handlerlarını; örnek çalma hızını; önceki akor/armoni ve PWA açılış kontrollerini kapsar. Matematiksel ve yazılım testleri bir makam uzmanının icra onayı değildir. Fiziksel Android cihaz ve gerçek hoparlör dinlemesi ayrıca belirtilmelidir.

Araştırma kaynaklarının metin ve görselleri topluca kopyalanmamıştır; yapısal veriler ve uygulamanın kendi hesapları kullanılmış, ilgili kaynaklara doğrudan bağlantı verilmiştir.
