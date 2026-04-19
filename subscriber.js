const { PubSub } = require('@google-cloud/pubsub');

// Google Cloud proje ID'niz ve yetkilendirme dosyanızın yolu
const projectId = 'project-6160b355-f911-4b6a-95c';
const keyFilename = './key.json';

// Pub/Sub istemcisi oluşturulur
const pubSubClient = new PubSub({ projectId, keyFilename });

// Abonelik (Subscription) adı (Topic ile eşleşen varsayılan veya manuel oluşturulmuş abonelik)
const subscriptionName = 'binance-veri-akisi-sub';

// Abonelik referansı alınır
const subscription = pubSubClient.subscription(subscriptionName);

console.log(`[SUBSCRIBER] '${subscriptionName}' aboneliği dinleniyor...`);

// Mesaj geldiğinde tetiklenecek olay dinleyicisi
const messageHandler = message => {
  try {
    // Gelen buffer formundaki mesaj verisini string'e, ardından JSON nesnesine çeviriyoruz
    const dataString = message.data.toString();
    const tradeData = JSON.parse(dataString);
    
    // Konsola istenilen formatta yazdırma işlemi
    console.log(`\nBuluttan Gelen Veri:`);
    console.log(`- Mesaj ID: ${message.id}`);
    console.log(`- İşlem Gören Çift: ${tradeData.s}`);
    console.log(`- Fiyat: ${tradeData.p}`);
    console.log(`- Miktar: ${tradeData.q}`);
    
    // Mesajın başarıyla işlendiğini Google Cloud'a bildir ('acknowledge')
    // Bu işlem çağrılmazsa mesaj bir süre sonra tekrar teslim edilir.
    message.ack();
  } catch (error) {
    console.error('Mesaj parse/işleme sırasında hata oluştu:', error);
  }
};

// Abonelik üzerinde oluşabilecek diğer hataları dinle
const errorHandler = error => {
  console.error('Pub/Sub Abonelik Hatası:', error);
};

// Abonelik objesine dinleyicileri (listener) bağla
subscription.on('message', messageHandler);
subscription.on('error', errorHandler);
