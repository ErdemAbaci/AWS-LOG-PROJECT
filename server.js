require('dotenv').config();
const express = require('express');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// AWS S3 bağlantısı
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// DynamoDB bağlantısı
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

//
// 📘 1. LOG EKLEME ENDPOINTİ
//
app.post("/log", async (req, res) => {
  const { message, level } = req.body;

  if (!message) return res.status(400).send('Message is missing');

  // Otomatik meta veriler
  const logData = {
    id: uuidv4(),
    message,
    level: level || "info", // varsayılan: info
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    location: "Unknown" // ileride GeoIP servisi ekleyeceğiz
  };

  // S3’e kayıt
  const key = `logs/${logData.id}.txt`;
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(logData, null, 2)
  };

  // DynamoDB’ye kayıt
  const ddbParams = {
    TableName: "Logs",
    Item: {
      ...logData,
      s3Key: key
    }
  };

  try {
    await s3.send(new PutObjectCommand(s3Params));
    await ddbDocClient.send(new PutCommand(ddbParams));
    res.send('✅ Log uploaded to S3 and saved in DynamoDB');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error uploading log');
  }
});

//
// 📘 3. GELİŞMİŞ LOG LİSTELEME (FİLTRELİ)
//
app.get("/logs", async (req, res) => {
  const { level, ip, search } = req.query;

  try {
    // 1️⃣ DynamoDB'den tüm logları çek
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const command = new ScanCommand({ TableName: "Logs" });
    const data = await ddbDocClient.send(command);

    let logs = data.Items || [];

    // 2️⃣ Filtreleme işlemleri (GÜVENLİ HALE GETİRİLDİ)
    // Bu kontroller, loglarda 'level' veya 'message' alanı olmadığında kodun çökmesini engeller.
    if (level) {
      logs = logs.filter(log => log.level && log.level.toLowerCase() === level.toLowerCase());
    }

    if (ip) {
      logs = logs.filter(log => log.ip === ip);
    }

    if (search) {
      logs = logs.filter(log => log.message && log.message.toLowerCase().includes(search.toLowerCase()));
    }

    // 3️⃣ Tarihe göre sıralama (GÜVENLİ HALE GETİRİLDİ)
    // Bu kontrol, 'timestamp' alanı olmayan loglarda sıralamanın hata vermesini engeller.
    logs.sort((a, b) => (new Date(b.timestamp) || 0) - (new Date(a.timestamp) || 0));

    // 4️⃣ Her kayıt için S3 URL’si oluştur (GÜVENLİ HALE GETİRİLDİ)
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    const logsWithUrl = await Promise.all(
      logs.map(async (log) => {
        // Eğer logda 's3Key' yoksa, URL oluşturmaya çalışmadan devam et.
        if (!log.s3Key) {
          return { ...log, s3Url: null };
        }

        try {
          const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: log.s3Key
          });
          const url = await getSignedUrl(s3, command, { expiresIn: 300 });
          return { ...log, s3Url: url };
        } catch (s3Error) {
          // Bir S3 anahtarı hatalı olsa bile tüm isteğin çökmesini engelle.
          // Hatalı anahtarı konsola yazdırarak sorunu tespit etmeyi kolaylaştır.
          console.error(`S3 URL oluşturulurken hata (Key: ${log.s3Key}):`, s3Error);
          return { ...log, s3Url: null };
        }
      })
    );

    // 5️⃣ Sonuç döndür
    res.json(logsWithUrl);

  } catch (err) {
    // Hata durumunda konsola daha açıklayıcı bir mesaj yazdır.
    console.error("'/logs' endpointinde bir hata oluştu:", err);
    res.status(500).send("Error fetching filtered logs");
  }
});


//
// 🚀 SUNUCU BAŞLAT
//
app.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Server running on port ${process.env.PORT || 3000}`);
});
