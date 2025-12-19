# ☁️ AWS Log Tracker (CloudLog)

Modern, gerçek zamanlı ve bulut tabanlı bir log takip sistemi. AWS servisleri (S3, DynamoDB, CloudWatch) ile entegre çalışır ve logları estetik bir dashboard üzerinden sunar.

![Project Preview](https://via.placeholder.com/1200x600/0f172a/06b6d4?text=AWS+Log+Tracker+Dashboard)

## 🌟 Özellikler

- **Modern UI:** React, Vite ve TailwindCSS ile geliştirilmiş "Glassmorphism" tasarımlı arayüz.
- **Gerçek Zamanlı Takip:** Loglar anlık olarak sisteme düşer.
- **AWS Entegrasyonu:**
  - **S3:** Log dosyalarının ham hallerini JSON olarak saklar.
  - **DynamoDB:** Hızlı sorgulama ve filtreleme için metadata tutar.
  - **CloudWatch:** Lambda fonksiyonlarından gelen sistem loglarını izler.
- **Coğrafi Konum (GeoIP):** Logu gönderen cihazın IP adresinden ülke/şehir bilgisi çıkarır.
- **Filtreleme:** Log seviyesine (Info, Warn, Error) veya içeriğe göre arama yapma imkanı.

## 🛠️ Teknolojiler

### Backend
- **Node.js & Express:** API sunucusu.
- **TypeScript:** Tip güvenliği için.
- **AWS SDK v3:** S3, DynamoDB ve CloudWatch iletişimi.
- **GeoIP-lite:** IP analizi.

### Frontend
- **React 18:** Kullanıcı arayüzü.
- **Vite:** Hızlı geliştirme ve build aracı.
- **TailwindCSS:** Modern stil işlemleri.
- **Framer Motion:** Akıcı animasyonlar.

## 🚀 Kurulum (Lokal)

Bu projeyi kendi bilgisayarında çalıştırmak için:

1.  **Projeyi Klonla:**
    ```bash
    git clone https://github.com/ErdemAbaci/AWS-LOG-PROJECT.git
    cd AWS-LOG-PROJECT
    ```

2.  **Bağımlılıkları Yükle:**
    ```bash
    # Backend için
    npm install

    # Frontend için
    cd log-tracker-frontend
    npm install
    ```

3.  **Çevresel Değişkenleri (.env) Ayarla:**
    Ana dizinde `.env` dosyası oluştur ve AWS bilgilerini gir:
    ```env
    AWS_ACCESS_KEY_ID=senin_access_key
    AWS_SECRET_ACCESS_KEY=senin_secret_key
    AWS_REGION=eu-central-1
    S3_BUCKET_NAME=senin-bucket-ismin
    PORT=3000
    ```

4.  **Backend'i Başlat:**
    ```bash
    # Ana dizinde
    npm run dev
    ```

5.  **Frontend'i Başlat:**
    ```bash
    # log-tracker-frontend klasöründe
    npm run dev
    ```

## 🌍 Canlıya Alma (Deployment)

Proje **AWS EC2 (Ubuntu)** üzerinde çalışacak şekilde yapılandırılmıştır.

### Özet Deployment Adımları
1.  Sunucuya SSH ile bağlanın.
2.  `git clone` ile projeyi çekin.
3.  `npm install` ile paketleri yükleyin.
4.  Frontend'i `npm run build` ile derleyin ve Nginx klasörüne taşıyın.
5.  Backend'i `npx tsc` ile derleyin ve `pm2 start dist/server.js` ile başlatın.
6.  Nginx Reverse Proxy ayarlarını yaparak 80 portunu 3000 portuna yönlendirin.


## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir. MIT Lisansı ile kullanabilirsiniz.
