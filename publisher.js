const WebSocket = require('ws');
const { PubSub } = require('@google-cloud/pubsub');

// Google Cloud proje ID ve yetkilendirme dosyası (key.json ana dizinde bulunmalı)
const projectId = 'project-6160b355-f911-4b6a-95c';
const keyFilename = './key.json';

// Pub/Sub istemcisi oluştur
const pubSubClient = new PubSub({ projectId, keyFilename });
const topicName = 'binance-veri-akisi';

// Binance WebSocket adresi (saniyede bir güncellenen Trade stream)
const binanceWsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@trade';

console.log('Binance WebSocket bağlantısı başlatılıyor...');
const ws = new WebSocket(binanceWsUrl);

ws.on('open', () => {
    console.log('Binance WebSocket sunucusuna bağlantı sağlandı. Veri dinleniyor (btcusdt@trade)...');
});

ws.on('message', async (data) => {
    try {
        // Gelen String veriyi JSON formatına çevir (Hata denetimi maksadıyla faydalı)
        const tradeData = JSON.parse(data);
        const dataBuffer = Buffer.from(JSON.stringify(tradeData));

        // Mesajı Pub/Sub topic'ine ilet
        const messageId = await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
        console.log(`[Yeni Veri] Pub/Sub tarafına mesaj gönderildi. Mesaj ID: ${messageId} | Fiyat: ${tradeData.p}`);
    } catch (error) {
        console.error('Veri işlenirken veya yayınlanırken bir hata oluştu:', error);
    }
});

ws.on('close', () => {
    console.log('Binance WebSocket bağlantısı koparıldı.');
});

ws.on('error', (error) => {
    console.error('WebSocket bağlantı hatası:', error);
});
