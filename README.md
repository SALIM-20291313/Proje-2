# Binance Data Streaming to GCP Pub/Sub

Bu proje, Binance WebSocket API üzerinden canlı kripto para (BTC/USDT) işlem (trade) verilerini anlık ve asenkron bir şekilde Google Cloud Pub/Sub sistemine aktarmak (publisher) ve bu bulut kuyruğundan verileri okumak (subscriber) üzere geliştirilmiştir. (Bulut Bilişim Dersi Proje-2)

## 🏗️ Mimari ve Çalışma Mantığı

Sistem temel olarak iki parçadan ve bir bulut altyapısından oluşur:

1. **Publisher (`publisher.js`)**: `ws` kütüphanesi ile Binance WebSocket (`wss://stream.binance.com:9443/ws/btcusdt@trade`) sunucusuna bağlanır. Gelen anlık piyasa verilerini alır ve Google Cloud Pub/Sub üzerindeki `binance-veri-akisi` topic'ine (konu) gönderir.
2. **Subscriber (`subscriber.js`)**: Pub/Sub üzerindeki `binance-veri-akisi-sub` aboneliğini (subscription) asenkron olarak dinler. Gelen verileri yakalar, terminale yazdırır ve başarıyla işlendiğini buluta bildirir (message.ack).
3. **Mimarinin Avantajları**: WebSocket verisi doğrudan istemci yerine Google Cloud Pub/Sub'a gönderilir. Bu sayede **ölçeklenebilirlik** (aynı veriyi onlarca farklı servisin aynı anda tüketebilmesi) ve **hata toleransı** (istemci çökse bile verilerin kuyrukta saklanabilmesi) sağlanır.

## 🚀 Projenin Kurulumu ve Çalıştırılması

### 1. Gereksinimler
- Node.js yüklü bir sistem.
- Google Cloud Platform (GCP) üzerinde aktif bir proje.
- Pub/Sub üzerinde oluşturulmuş `binance-veri-akisi` isimli bir Topic ve `binance-veri-akisi-sub` isimli bir Subscription.
- IAM üzerinden `Pub/Sub Admin` rolüne sahip yetkilendirilmiş bir hizmet hesabına (Service Account) ait JSON anahtarı.

### 2. Bağımlılıkların Yüklenmesi
Projeyi klonladıktan veya indirdikten sonra proje dizininde terminali açıp aşağıdaki komutu çalıştırın:
```bash
npm install
```

### 3. Kimlik Doğrulama
Bulut erişimi için GCP üzerinden aldığınız anahtar dosyasını projenin ana dizinine `key.json` adıyla kopyalayın.

### 4. Sistemi Çalıştırma

**Veri Yayıncıyı (Publisher) Başlatmak:**
Binance üzerinden verileri alıp Pub/Sub'a göndermek için terminalde şu komutu çalıştırın:
```bash
node publisher.js
```

**Veri Tüketiciyi (Subscriber) Başlatmak:**
Kuyruktaki mesajları dinlemek için yeni ve ayrı bir terminal penceresinde şu komutu çalıştırın:
```bash
node subscriber.js
```

## 🔐 Güvenlik Notu
`key.json` dosyası hassas bulut kimlik bilgileri içerdiği için `.gitignore` kullanılarak repo dışı bırakılmıştır. Bu dosyayı asla public platformlarda paylaşmayın!
