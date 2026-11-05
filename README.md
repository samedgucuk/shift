# LAST SHIFT
## Mesai bitti. Şehir yeni başlıyor.

V1.0 - Oynanabilir, stilize 3D sonsuz koşu prototipi.

## Oyunu aç
`index.html` veya `dist/index.html` dosyasını Chrome / Edge gibi WebGL 2 destekleyen bir tarayıcıda aç. Kurulum, hesap, internet veya geliştirme sunucusu gerekmez. Ses, ilk kullanıcı etkileşiminden sonra etkinleşir. Donanım hızlandırması kapalıysa etkinleştirmek gerekebilir.

Dağıtım HTML'i tüm kodu içerir. Kaynak kodlar tek bir dosyaya sıkıştırılmamıştır: motor, modeller, oynanış, ses ve arayüz ayrı dosyalardır. Build aşaması bunları kolay açılan tek bir dağıtım dosyasında birleştirir.

## Kontroller
- Sol / sağ ok veya A / D: şerit değiştir.
- Space / yukarı ok / W: zıpla.
- Aşağı ok / S: kay. Havadayken basarsan hızlı iniş yap.
- P / Esc: duraklat ve devam et.
- M: sesi aç / kapat. F: tam ekran.
- R: yeni koşu. Sonuç ekranında Enter veya Space de kullanılabilir.
- Telefon: sağa / sola / yukarı / aşağı kaydır. Kısa dokunuş zıplatır. Ekran düğmeleri de aynı kontrolleri sağlar.

## Oynanış
Takım elbiseli ve çantalı karakter, arkadan takip edilen üç şeritli bir şehir parkurunda koşar. Alçak bariyerler ve kasalar zıplanır; yüksek geçitlerin altından kayılır. Araçların yanından geçilir. Robotlar oyuncuya doğru yürür, dronelar uyarı verdikleri şeritte yaklaşır.

Coin'ler 10 puandan başlar. Kesintisiz toplama serisi, her 10 coin'de puan çarpanını artırır; üst sınır x5'tir. Mesafe ve mini görevler de skora katkı sağlar. Hız ve engel çeşitliliği ilerledikçe artar; görsel atmosfer yavaşça geceye döner.

### Bonuslar
| Bonus | Etki |
| --- | --- |
| Mıknatıs | 9 saniye boyunca yakındaki şeritlerden coin çeker. |
| Kalkan | 14 saniyelik pencere içinde tek bir darbeyi karşılar. |
| Hız patlaması | 6 saniye hızlanır; çarpılan engeller kırılır. |
| Jetpack | 9 saniye yükselir, yüksek coin rotaları açılır. İnişte yakın engeller temizlenir ve kısa koruma sağlanır. |

Engel dalgalarında en az bir açık şerit korunur. Oyuncunun zıplama veya kayma zamanlaması yine önemlidir; açık şerit bulunması oyunun otomatik oynanması anlamına gelmez.

## Teknoloji
- Dil: JavaScript; arayüz: HTML + CSS; shader'lar: GLSL ES 3.0.
- 3D: bu proje için yazılan ShiftGL WebGL 2 motoru. Three.js veya başka bir dış kütüphane kullanılmaz.
- Görseller: kodla oluşturulan gerçek 3D geometriler, eklemli karakter, hareketli şehir segmentleri, GPU instancing, gölge haritası, atmosferik sis ve ton eşleme.
- Ses: Web Audio API ile sentezlenen efektler ve düşük seviyeli ritim. Harici ses kaydı yoktur.
- Simülasyon: sabit 90 Hz adımlar; görüntüleme tarayıcının animasyon döngüsüyle yapılır.
- Kayıt: tarayıcının localStorage alanında rekor, toplam coin ve ses tercihi. Depolama engelliyse oyun kayıtsız devam eder.
- Ağ: sıfır harici istek. CDN, uzak model, font veya reklam kullanılmaz.

## Dosyalar
```
index.html                  Oynanabilir tek dosya
brand-guide.html            Marka ve oyun kimliği rehberi
build.py                    Standart Python ile birleştirme
src/engine.js               ShiftGL, geometriler ve shader'lar
src/world.js                Şehir, karakter ve nesne modelleri
src/game.js                 Kontroller, fizik, zorluk ve bonuslar
src/audio.js                Sentezlenmiş sesler
src/style.css               Responsive arayüz
src/index.template.html     Oyun arayüzü şablonu
assets/mark.svg             Bağımsız simge
assets/wordmark-dark.svg    Koyu zeminli logo
assets/wordmark-light.svg   Açık zeminli logo
assets/preview.png          Gerçek oyun ekran görüntüsü
dist/index.html             Yayına hazır, bağımsız dağıtım
tests/regression.py         Oynanış regresyon testleri
tests/test-results.json     30 kontrolün sonucu
```

## Kaynak koddan tekrar oluştur
Proje klasöründe `python3 build.py` çalıştır. NPM / bundler / paket kurulumu gerekmez. Düzenlemeler `src` klasöründe yapılır; script hem `index.html` hem `dist/index.html` dosyasını yeniler.

## Web'e yayınlama
`dist/index.html` herhangi bir statik web sunucusuna konabilir. Bu teslimde dış bir sunucuya yükleme veya alan adı bağlantısı yapılmamıştır. Dağıtım dosyasında kök dizine veya belirli bir alan adına bağlı yol yoktur. HTTPS statik yayın, mobil cihazlarda dosya aktarımına göre daha rahat açılır.

## Test kapsamı ve sınırlar
Chromium/WebGL 2 ortamında 30 regresyon kontrolü yapıldı: hareket, zıplama, kayma, çarpışma, coin toplama, dört bonus, güvenli iniş, duraklatma, 1.000 engel dalgasında açık şerit ve 150 saniyelik simülasyonda nesne sayısı sınırı. Sonuçlar `tests/test-results.json` içindedir. 1440x900 masaüstü ve 390x844 mobil görünümler tarayıcıda kontrol edildi. Bu, tüm fiziksel telefonlarda performans sertifikası anlamına gelmez.

Bu sürüm stilize bir oynanabilir prototiptir; fotoğraf gerçekçiliği, online liderlik tablosu, hesap sistemi veya çok oyunculu sunucu içermez. Ad ve kimlik yaratıcı bir çalışmadır; marka tescil taraması yapılmamıştır.

Test arayüzü yalnızca `?debug=1` parametresiyle açılır. Normal oyunda test koruması veya otomatik oynayan bir sistem etkin değildir.
