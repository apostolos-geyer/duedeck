import { S3Client } from "@aws-sdk/client-s3";

export const UPLOADS_BUCKET = process.env.S3_BUCKET ?? "uploads";

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
  region: process.env.S3_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "duedeck",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "duedeck123",
  },
  forcePathStyle: true,
});
