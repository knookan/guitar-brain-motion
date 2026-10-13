# Makam referansı ve uygulama tercihleri

27 makam/çeşni/varyant kaydı eklendi; temel 117 kayıtla birlikte katalog 144 yaklaşımdan oluşuyor. Bu sayı 27 farklı tarihsel makamın tamamının modellendiği anlamına gelmez. Acemli Rast, Acemli Hüseyni ve üst bölge alternatifleri ayrı referanslardır.

## Adlandırma ve arama

Her gam Türkçe ve İngilizce ad taşır. Makamlarda İngilizce ad, özgün adın Latin harfli uluslararası yazımıdır: Uşşak / Ussak, Hüseyni / Huseyni, Çargâh / Cargah, Segâh / Segah, Hüzzam / Huzzam. Rast, Bayati ve Hicaz gibi ortak yazımlar korunur. Türk makamı, benzer adlı Arap maqamı veya Batı modu ile otomatik olarak özdeşleştirilmez.

İlk açılış dili İngilizcedir. Settings → Language bölümünden Türkçe seçilebilir. Ad/alternatif ad araması iki dilde çalışır; Türkçe işaretler olmadan yazılan adlar da bulunur. Makam seçildiğinde diğer dildeki adı, geleneksel durağı, güçlü derecesi, seyri ve alt/üst çeşni yapısı gösterilir. Aynı seslere sahip Uşşak ile Bayati veya Hüseyni ile Neva ayrı kalır.

## Teorik sesler ve gitar görünümü

Makam kartındaki koma değerleri, oktavı 53 eşit referans birimine bölen **göreli teorik koordinatlardır**. Sent değeri `koordinat × 1200 / 53` olarak hesaplanır. Bunlar icracıdan ölçülmüş frekanslar veya Arel–Ezgi–Uzdilek sistemindeki bütün oranların birebir frekansları değildir. Seyre ve icraya göre değişen perdeler tek sabit diziyle açıklanamaz; Uşşak ve Hüzzam kaynakları bunun örneklerini verir. [TDV: Uşşak](https://islamansiklopedisi.org.tr/ussak), [TDV: Hüzzam](https://islamansiklopedisi.org.tr/huzzam).

- **Gitar haritası ve akorlar:** Her teorik ses en yakın 12-TET perdeye ayrı olarak yansıtılır. Armoni bölümünde gösterilen akorlar bu standart gitar seslerinin üyelik analizidir; geleneksel makam armonisi değildir. İkincil dominant/ödünç kuralları otomatik atanmaz.
- **Koma modeli playback:** Seçilen kök eşit aralıklı bir başlangıç sesi kabul edilerek göreli koma aralıkları sentezlenir. Geleneksel Segâh durağının B'den bir koma aşağıda oluşu bilgi olarak gösterilir; bu mutlak durak düzeltmesi playback başlangıcına uygulanmaz.
- **MIDI:** Standart gitar/akor playback seslerini aktarır; koma dinletisi mikrotonal MIDI olarak dışa aktarılmaz.
- **Saba:** Yalnız alt dörtlüsü modellenmiştir. Örtüşen üst bölge ve oktav dışı seyir tek bir tamamlanmış oktav gamı olarak sunulmaz. [TDV: Saba](https://cdn2.islamansiklopedisi.org.tr/dosya/35/C35011565.pdf).

## Kaynaklı referanslar

Kayıtların tüm iki dilli adları, koordinatları ve doğrudan kaynak bağlantıları [gam atlasında](SCALE-HARMONY-ATLAS.md) ve [makam JSON verisinde](MAKAM-CATALOG.json) yer alır. Yapı ve seyir bilgisi TDV İslâm Ansiklopedisi makam maddeleri değerlendirilerek kısa özetlere dönüştürülmüştür. Kaynak nota/görselleri kopyalanmamıştır.

Başlıca aileler: [Rast](https://islamansiklopedisi.org.tr/rast), [Hicaz](https://islamansiklopedisi.org.tr/hicaz--musiki), [Hümayun](https://islamansiklopedisi.org.tr/humayun--musiki), [Hüseyni](https://islamansiklopedisi.org.tr/huseyni), [Nihavend](https://islamansiklopedisi.org.tr/nihavend--musiki), [Segâh](https://islamansiklopedisi.org.tr/segah), [Kürdili Hicazkâr](https://islamansiklopedisi.org.tr/kurdili-hicazkar).

## Görsel tercihler

Settings / Ayarlar bölümünde dört tema vardır: Graphite, Midnight, Cyberpunk ve Light. Beş font tercihi: Manrope, Space Grotesk, System, Georgia ve Consolas. İlk iki font çevrimdışı gömülüdür; diğerleri cihazın fontlarını kullanır. Tercihler tarayıcının yerel kaydında saklanır.

Gitar ilk açılışta üstten görünür; açılış animasyonu aynı açıdaki yaklaşmayı kullanır. + / −, kaydırıcı veya gitar sahnesinde fare tekerleğiyle %55–250 yakınlaştırma yapılır. Kamera konumu ve yakınlaştırma kaydedilir. Hareket azaltma ayarında animasyon kapatılır.
