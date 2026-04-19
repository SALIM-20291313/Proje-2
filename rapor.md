# Bulut Bilişim Dersi Proje 2 - Raporu

## 1. Google Cloud Projesinin Oluşturulması ve Hazırlık Aşamaları

Proje kapsamında, canlı veri akışını yönetmek üzere bir bulut altyapısı tercih edilmiştir. Bu bağlamda, Google Cloud Platform (GCP) üzerinde proje kimliği (Project ID) `project-6160b355-f911-4b6a-95c` olan bir proje ayağa kaldırılmıştır. Projenin oluşturulmasının ardından, mesajlaşma altyapısını sağlamak amacıyla Cloud Pub/Sub API etkinleştirilmiştir.

## 2. Topic (Konu) ve Abonelik (Subscription) Kurulumu

Veri yayını ve iletimi sağlamak için Pub/Sub sistemi üzerinde `binance-veri-akisi` ismiyle bir Topic (Konu) tanımlanmıştır. Tasarımsal olarak bir topic üzerinden yayınlanan mesajların tüketilebilmesi ve dinlenebilmesi için aynı topic'e ait varsayılan bir abonelik (subscription) oluşturulmuştur. Bu sayede verilerin asenkron ve güvenilir biçimde uçtan uca aktarım temeli atılmıştır.

## 3. IAM Üzerinden Güvenli Erişim ve Hizmet Hesabı (Service Account)

Sistemin, dışarıdan veya yerel bir ortamdan Google Cloud kaynaklarına güvenli bir biçimde erişim sağlayıp veri gönderebilmesi için Identity and Access Management (IAM) ekranı kullanılarak yeni bir Service Account (Hizmet Hesabı) oluşturulmuştur. Bu hizmet hesabına yalnızca ihtiyaç duyulan yetkiyi atfetmek bağlamında (Least Privilege Prensibi) **'Pub/Sub Admin'** rolü verilmiştir. Hesabın kimlik doğrulamasında kullanılmak üzere de JSON formatında bir anahtar oluşturularak indirilmiş ve proje ana dizinine `key.json` adıyla yerleştirilmiştir.

---

## Bölüm 3: Bulut Üzerinden Veri Tüketimi (Subscription)

Sistemin mimarisinde verilerin doğrudan WebSocket'ten tek bir istemciye okunması yerine, aracı bir mesaj dağıtım servisi (Pub/Sub) kullanılmıştır. Bunun temel nedenleri şunlardır:
- **Ölçeklenebilirlik (Scalability):** WebSocket genelde tek bir noktadan veri alırken, Pub/Sub üzerinden bu veriyi aynı anda yüzlerce farklı makine veya mikroservis (örn: veritabanı yazıcıları, sinyal analizcileri, mobil anlık bildirim servisleri) birbirinden bağımsız şekilde ölçeklenerek tüketebilir.
- **Güvenilirlik ve Hata Toleransı (Reliability):** Doğrudan WebSocket bağlantısı koptuğunda veri kaybı yaşanır. Ancak veriyi buluta (Pub/Sub) aktardıktan sonra aboneniz (subscriber) kısa süreli olarak çökse veya kapansa bile, mesajlar kuyrukta bekletilir. Sistem tekrar ayağa kalktığında okunmamış mesajlar kayıpsız bir şekilde teslim edilir.

### Subscriber Kodunun Mantığı (`subscriber.js`)
`subscriber.js`, Pub/Sub üzerindeki `binance-veri-akisi-sub` isimli aboneliği dinleyen asenkron bir Node.js betiğidir. `publisher.js`'den farklı olarak dış kaynaktan veri üretmez, yalnızca kuyruğa düşen mesajları olay (event) tabanlı olarak yakalar. Gelen mesaj bir `Buffer` (bayt dizisi) formatında olduğu için kod, bu mesajı string'e çevirip JSON olarak çözümler. Her iterasyonda "Buluttan Gelen Veri:" başlığı ile terminale log düşer. Son olarak verinin başarıyla alındığını ve sıradan çıkarılabileceğini Google Cloud'a bildirmek için `message.ack()` (acknowledge) metodunu çağırır.

## 4. Uygulama ve Kod Mimarisinin Çalışma Mantığı (`publisher.js`)

Node.js tabanlı olarak geliştirilen projede `ws` (WebSocket istemcisi) ve `@google-cloud/pubsub` kütüphaneleri kullanılmıştır. `publisher.js` dosyasının çalışma akışı aşağıdaki gibidir:

1. **GCP Yetkilendirme:** 
   Uygulama başlatıldığında Node.js, ilgili proje kimliği ve yerel dizinde yer alan `key.json` belgesini kullanarak Google Cloud sunucularında kimlik doğrulaması gerçekleştirir. Bu işlem, kod içerisinde tanımlanan `PubSub` nesnesi başlatılarak otomatik olarak tamamlanır.
2. **WebSocket Bağlantısı (Binance API):**
   `ws` kütüphanesi yardımıyla doğrudan Binance'ın canlı ticaret ("trade") verilerini yayınladığı `wss://stream.binance.com:9443/ws/btcusdt@trade` endpointine bir bağlantı açılır. Bu sayede BTC/USDT paritesine ait gerçek zamanlı tüm işlemler sunucudan alınır.
3. **Gerçek Zamanlı İletim:**
   WebSocket referansı tarafında `message` (mesaj gelme) eventi tetiklendiği zaman sistem, sunucudan gelen string ifadeleri bir JSON nesnesine çevirir ve doğru parse işleminden hemen sonra bir log kaydı basar. Ardından, `@google-cloud/pubsub` kütüphanesi yardımıyla bu veri bytelara (Buffer) dönüştürülüp bulut tarafındaki `binance-veri-akisi` topic'ine anlık yayınlanır (Publish message).  
4. **Hata Yakalama (Error Handling) ve Olay Dinleyicileri:**
   Bağlantı koptuğunda (`close`) veya bir hata meydana geldiğinde (`error`) sistem, durumu terminale basarak hata takibine imkân tanır. Asekron Pub/Sub isteği de `try-catch` bloklarına sarılarak, uygulamanın olası yayın hatalarında çökmesi engellenmiştir.

## 5. Projenin Ayağa Kaldırılması

Sistemi ortamınızda çalıştırmak için adımları terminal ekranında uygulamalısınız.  

Bağımlılıkları kurmak için ilk komut:
```bash
npm install
```

Sistemi başlatmak için komut:
```bash
node publisher.js
```
*(Not: Sistemi çalıştırmadan önce `key.json` yetkilendirme dosyanızın `publisher.js` ile aynı dizin olan proje klasörü içinde bulunduğundan emin olunuz).*
