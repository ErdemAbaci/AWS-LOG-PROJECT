require('dotenv').config();
const express = require('express');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

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
// 📗 2. LOG LİSTELEME ENDPOINTİ
//
app.get("/logs", async (req, res) => {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: "logs/"
    });
    const data = await s3.send(listCommand);

    if (!data.Contents) return res.json([]);

    const logs = await Promise.all(data.Contents.map(async (obj) => {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: obj.Key
      });
      const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 dakika geçerli

      return {
        key: obj.Key,
        size: obj.Size,
        url
      };
    }));

    res.json(logs);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching logs");
  }
});

//
// 🚀 SUNUCU BAŞLAT
//
app.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Server running on port ${process.env.PORT || 3000}`);
});
