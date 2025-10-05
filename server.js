require('dotenv').config();
const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient} = require('@aws-sdk/client-dynamodb');  
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');  
const { v4: uuidv4 } = require('uuid');
const stream = require('stream');
const util = require('util');
const app = express();
app.use(express.json());

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
// DynamoDB istemcisi
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Bu endpoint S3 e log yükler
app.post("/log", async (req, res) => {
  const logMessage = req.body.message;
  if(!logMessage) return res.status(400).send('Message missing');

  const key = `logs/${Date.now()}.txt`;

  // 1. S3’e yükle
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: logMessage
  };

  // 2. DynamoDB’ye kaydet
  const ddbParams = {
    TableName: "Logs",
    Item: {
      id: uuidv4(),
      message: logMessage,
      s3Key: key,
      timestamp: new Date().toISOString()
    }
  };

  try {
    await s3.send(new PutObjectCommand(s3Params));
    await ddbDocClient.send(new PutCommand(ddbParams));
    res.send('Log uploaded to S3 and saved in DynamoDB!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading log');
  }
});


// Bu endpoint S3 ten logları listeler
app.get("/logs", async (req, res) => {
  try {
    // 1. Bucket içindeki objeleri listele
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: "logs/"
    });
    const data = await s3.send(listCommand);

    if (!data.Contents) return res.json([]);

    // 2. Objeleri mapleyerek signed URL oluştur
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
  }});

// Sunucuyu başlat

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
