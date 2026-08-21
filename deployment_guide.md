# Hood2 - Deployment Guide

Bu oyun, Vercel veya Netlify gibi "Serverless" platformlar yerine, kendi VPS sunucunuzda (Ubuntu/Debian) veya Render/Railway gibi Web Service platformlarında çalışacak şekilde tasarlanmıştır.

## Gereksinimler
- Node.js (v18 veya üzeri)
- NPM

## Adım 1: Projeyi Sunucuya Çekme ve Kurulum
Sunucunuzun terminalinde projenin olduğu dizine gidin ve bağımlılıkları yükleyin:
```bash
npm install
```

## Adım 2: Production Build Alma
Next.js uygulamanızı canlı (production) ortam için derleyin:
```bash
npm run build
```

## Adım 3: Çalıştırma (PM2 ile)
Sunucu kapandığında veya yeniden başlatıldığında oyunun otomatik çalışması için **PM2** kullanmanız önerilir.

PM2'yi global olarak kurun:
```bash
npm install -g pm2
```

Projeyi başlatın:
```bash
pm2 start npm --name "hood2-game" -- run start
```
*Not: Bu komut `package.json` içindeki `"start": "NODE_ENV=production node server.js"` scriptini çalıştıracaktır.*

PM2'yi başlangıçta otomatik çalışacak şekilde ayarlayın:
```bash
pm2 startup
pm2 save
```

## Adım 4: Veritabanı (MongoDB) Ayarları
Projede, ortamda bir MongoDB bulunamazsa otomatik olarak **In-Memory MongoDB** (bellek içi geçici veritabanı) başlatılır. Ancak in-memory veritabanı, sunucu yeniden başladığında tüm verileri sıfırlar. 

Gerçek bir veritabanı kullanmak için sunucunuzda MongoDB kurun veya MongoDB Atlas'tan bir bağlantı dizesi alın.
Bunu yapılandırmak için projeye `.env` dosyası oluşturun ve şunu ekleyin:
```env
MONGO_URL=mongodb://localhost:27017
PORT=80
```
*(Eğer güvenlik gereği `.env` kullanmak istemiyorsanız, doğrudan `server.js` içindeki `mongoUrl` değişkenini değiştirebilirsiniz).*

## Adım 5: Port ve Domain Yönlendirmesi (Nginx / Apache)
Uygulama varsayılan olarak `80` portunda veya `.env` içindeki `PORT` değişkeninde çalışır. Eğer sunucunuzda başka siteler de varsa (örneğin port 3000'de çalıştırıp), Nginx üzerinden kendi domaininize reverse proxy yapmanız gerekir.

**Örnek Nginx Ayarı:**
```nginx
server {
    listen 80;
    server_name senin-domainin.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*Not: WebSocket'in (`/api/ws`) çalışabilmesi için `proxy_set_header Upgrade $http_upgrade;` satırları kesinlikle gereklidir.*
