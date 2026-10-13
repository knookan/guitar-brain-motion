# Notes akor bulucu ve gitar sesi

11 Ekim 2026 güncellemesi.

## Akor bulma

Önceki Notes ekranı yalnız hazır akorların **tam** ses kümelerini karşılaştırıyordu. İki ses veya eksik tutuş, daha büyük bir akora ait olsa bile sonuç gelmeyebiliyordu. Tam eşleme başka teori hesaplarında aynı anlamla korunur; Notes şimdi ayrı bir tamamlama araması kullanır.

- **Tam eşleşme:** Önerilen akorun bütün sesleri seçilmiştir.
- **Beşlisi eksik:** Üçlü ve altılı/yedili kimliği olan bir akorda yalnız doğal beşli eksiktir.
- **Olası akor:** Seçilen bütün sesler öneride bulunur; eklenmesi gereken en fazla üç ses açıkça yazılır. Kök/üçlü/yedili eksikliği sıralamayı etkiler. Bu sıralama olasılık yüzdesi veya bağlamdan bağımsız kesin tanı değildir.
- **Ses kümesi:** Katalog ve gerilim kurallarıyla uygun adlandırma bulunamazsa sesler kaybedilmeden kök ve aralık listesiyle gösterilir; geleneksel akor adı uydurulmaz.

Do–Do♯ / C–C♯ seçimi örneğin C(add♭9) ve C♯maj7/C olasılıkları taşıyabilir; iki ses tek bir akoru belirlemez. C–D♭–E–G–B♭ ise C7♭9 ile tam eşleşir. Bas, seçili fiziksel notaların en düşük MIDI değerinden bulunur; arayüzde alternatif çevrimler slash adlarıyla gösterilir. Enharmonik nota yazımı akor derecesine göre yapılır: C♯ girdisi C kökünde D♭ / ♭9 olarak görünebilir.

Tanımlı gerilimler add9, add♭9, add♯9, add11, add♯11, add♭13, add13/6 ve beşli alterasyonlarını içerir. Aynı dereceye ait farklı renkler birlikte tutulabilir. Bir öneri hiçbir seçili sesi görmezden gelemez. Öneriyi Seç/Çal/Arpej ile kullanırken pratik gitar tutuşunun isteğe bağlı ses çıkarması da bu seçili sesleri çıkaramaz. Daha fazla öneri altışar açılır.

Yöntem uygulamanın kural tabanlı yorumudur. Genişletilmiş/altered akorların kuramsal bağlamı: [Open Music Theory: Altered and Extended Chords](https://viva.pressbooks.pub/openmusictheory/chapter/altered-and-extended-dominant-chords/). Eksik akor ile tam akor tanımlamasının ayrımı için: [music21 chord belgesi](https://music21.org/music21docs/moduleReference/moduleChord.html).

## Gitar sesi

Üç osilatörlü eski tını yerine 48 CC0 gitar ses örneği kullanılır. Kaynak ve hazırlama ayrıntıları [ses kaydı belgesinde](assets/audio/README.md) bulunur. Kayıtlar bağımsız HTML'e gömülür; çalarken indirme yapılmaz.

Ses motoru en yakın kayıt üzerinden perdeyi ayarlar, notaları doğal sönümleriyle çalar, akorda kısa tel taraması ve hafif stereo dağılım uygular. Arpej Web Audio zaman çizelgesine yazılır. Hafif oda yansıması, seviye dengeleme ve kompresör kullanılır. Durdur bekleyen arpej seslerini de iptal eder; ikinci Çal eski bekleyen isteği geçersiz kılar. Makam koma playback değerleri tam MIDI notasına yuvarlanmaz.

Kayıtların yaklaşık durağan akort sapması ölçülerek oynatma hızında telafi edilir. Bu, kaydedilmiş tınının zaman içindeki bütün değişimini veya gerçek hoparlör çıktısını doğrulamaz.

Bu banka tek dinamik katmanlıdır; farklı pena/vuruş kayıtları veya tel başına ayrılmış örnekler taşımaz. Uç seslerde kaynak kaydın daha büyük transpozisyonu tınıyı etkiler. Otomatik doğrulama örneklerin PCM verisini, MIDI hız oranını, çizelgeyi ve iptali kontrol eder; hoparlörden dinleme veya gerçek tarayıcı davranışı onayı değildir.
