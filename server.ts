import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { CloudWatchLogsClient, GetLogEventsCommand, DescribeLogStreamsCommand, OutputLogEvent } from "@aws-sdk/client-cloudwatch-logs";
import geoip from 'geoip-lite';

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// Tip Tanımları
interface LocationData {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

interface LogData {
  id: string;
  message: string;
  level: string;
  ip: string;
  userAgent: string | undefined;
  timestamp: string;
  location: LocationData;
  s3Key?: string;
}

interface LogItem extends LogData {
  s3Url?: string | null;
}

// AWS Konfigürasyonu
const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
};

// AWS S3 bağlantısı
const s3 = new S3Client(awsConfig);

// DynamoDB bağlantısı
const ddbClient = new DynamoDBClient(awsConfig);
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// CloudWatch client oluştur
const cloudWatchClient = new CloudWatchLogsClient(awsConfig);

//
// 📘 1. LOG EKLEME ENDPOINTİ
//
app.post("/log", async (req: Request, res: Response) => {
  const { message, level } = req.body;

  if (!message) {
    return res.status(400).send('Message is missing');
  }

  // --- GEOIP Entegrasyonu ---
  // Express request.ip string olarak gelebilir, undefined olabilir. Güvenli hale getirelim.
  const ip = req.ip || '127.0.0.1';
  const geo = geoip.lookup(ip); // IP adresinden konum bilgisi al

  // Konum bilgisini daha yapısal hale getirelim
  const locationData: LocationData = geo ? {
    country: geo.country,
    region: geo.region,
    city: geo.city,
    timezone: geo.timezone
  } : {
    country: "N/A",
    region: "N/A",
    city: "Local or Private IP",
    timezone: "UTC"
  };
  // --- Bitiş ---

  // Otomatik meta verilerle log objesini oluştur
  const logData: LogData = {
    id: uuidv4(),
    message,
    level: level || "info",
    ip: ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    location: locationData
  };

  // S3’e kayıt için anahtar oluştur
  const key = `logs/${logData.id}.json`;
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(logData, null, 2),
    ContentType: "application/json"
  };

  // DynamoDB’ye kayıt
  const ddbParams = {
    TableName: "Logs", // Tablo adı env'den de alınabilir ama hardcoded kalmış
    Item: {
      ...logData,
      s3Key: key
    }
  };

  try {
    await s3.send(new PutObjectCommand(s3Params));
    await ddbDocClient.send(new PutCommand(ddbParams));
    res.status(201).json({ status: 'success', logId: logData.id });
  } catch (err) {
    console.error("❌ Error uploading log:", err);
    res.status(500).send('❌ Error uploading log');
  }
});

//
// 📘 3. GELİŞMİŞ LOG LİSTELEME (FİLTRELİ)
//
app.get("/logs", async (req: Request, res: Response) => {
  const { level, ip, search } = req.query;

  try {
    // 1️⃣ DynamoDB'den tüm logları çek
    const command = new ScanCommand({ TableName: "Logs" });
    const data = await ddbDocClient.send(command);

    let logs = (data.Items || []) as LogData[];

    // 2️⃣ Filtreleme işlemleri
    if (level && typeof level === 'string') {
      logs = logs.filter(log => log.level && log.level.toLowerCase() === level.toLowerCase());
    }

    if (ip && typeof ip === 'string') {
      logs = logs.filter(log => log.ip === ip);
    }

    if (search && typeof search === 'string') {
      logs = logs.filter(log => log.message && log.message.toLowerCase().includes(search.toLowerCase()));
    }

    // 3️⃣ Tarihe göre sıralama
    logs.sort((a, b) => (new Date(b.timestamp).getTime() || 0) - (new Date(a.timestamp).getTime() || 0));

    // 4️⃣ Her kayıt için S3 URL’si oluştur
    const logsWithUrl = await Promise.all(
      logs.map(async (log) => {
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
          console.error(`S3 URL oluşturulurken hata (Key: ${log.s3Key}):`, s3Error);
          return { ...log, s3Url: null };
        }
      })
    );

    // 5️⃣ Sonuç döndür
    res.json(logsWithUrl);

  } catch (err) {
    console.error("'/logs' endpointinde bir hata oluştu:", err);
    res.status(500).send("Error fetching filtered logs");
  }
});

//
// ☁️ CLOUDWATCH LOG LİSTELEME ENDPOINTİ
//
app.get("/cloudwatch-logs", async (req: Request, res: Response) => {
  const logGroupName = "/aws/lambda/cloudlog-s3-to-ddb";

  try {
    const describeStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 1
    });

    const streamsResponse = await cloudWatchClient.send(describeStreamsCommand);

    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      return res.json([]);
    }

    const latestStream = streamsResponse.logStreams[0];

    const getLogsCommand = new GetLogEventsCommand({
      logGroupName,
      logStreamName: latestStream.logStreamName,
      startFromHead: false,
      limit: 50
    });

    const logs = await cloudWatchClient.send(getLogsCommand);

    if (logs.events) {
      res.json(logs.events.map((event: OutputLogEvent) => ({
        timestamp: event.timestamp,
        message: event.message,
        id: (event as any).eventId
      })).reverse());
    } else {
      res.json([]);
    }

  } catch (error: any) {
    console.error("CloudWatch logs error:", error);
    res.status(500).json({ message: "Error fetching CloudWatch logs", error: error.name });
  }
});

//
// 🚀 SUNUCU BAŞLAT
//
app.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Server running on port ${process.env.PORT || 3000}`);
});
