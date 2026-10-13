# Gitar kayıtları

Kaynak: [FreePats Spanish classical guitar](https://freepats.zenvoid.org/Guitar/acoustic-guitar.html), Roberto, 2019-06-18 dağıtımı. 2008 yılında kaydedilmiş naylon telli klasik gitar sesleri. Kaynak CC0 kamu malı adanmıştır; tam lisans ve özgün açıklama aynı klasördedir.

Uygulama 48 ayrı ses kaydını çevrimdışı taşır. Kayıtlar tek kanallı 24 kHz / 16 bit PCM biçimine yeniden örneklenir, en fazla altı saniye tutulur, tepe seviyesi sınırlı şekilde dengelenir ve son 50 ms yumuşatılır. En yakın kaydın oynatma hızı istenen perdeye ayarlanır; kaynak aralık dışında transpozisyon daha büyüktür. Tek velocity katmanıdır; çok katmanlı gitar icrası veya tel başına ayrı kayıt değildir.

Kaynak banka bağlantısı: https://freepats.zenvoid.org/Guitar/SpanishClassicalGuitar/SpanishClassicalGuitar-SFZ-20190618.7z

Özgün kayıtların 0,12–0,65 saniyelik bölgesinde sınırlı otokorelasyonla yaklaşık akort sapması ölçüldü. En büyük ölçüm 17,78 senttir; oynatma hızı bu statik sapmayı telafi eder. Ölçüm icra boyunca değişen akort veya üst harmoniklerin tamamı için kesinlik garantisi değildir. Makamın göreli koma oranı bu düzeltmeye ayrıca eklenir.

Hazırlama: `work/import-guitar-audio.py`. Her özgün WAV'ın SHA-256 değeri, kaynak MIDI sesi ve işlenmiş uzunluğu `sample-audit.json` içindedir. Sesler `guitar-samples.js` üzerinden hem modüler uygulamaya hem bağımsız HTML'e gömülür. Harici ses isteği yapılmaz.
