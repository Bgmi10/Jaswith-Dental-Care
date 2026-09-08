import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
  } from "@aws-sdk/client-s3";
  import crypto from "crypto";
  
  const s3 = new S3Client({
    region: process.env.S3_REGION!,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
  
  const BUCKET = process.env.S3_BUCKET_NAME!;
  
  export async function uploadToS3(file: File, folder: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
  
    const ext = file.name.split(".").pop();
    const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );
  
    return `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  }
  
  export async function deleteFromS3(url: string) {
    // extract the key from the stored URL
    const key = url.split(`.amazonaws.com/`)[1];
    if (!key) return;
  
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  }