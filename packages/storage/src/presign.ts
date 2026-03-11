import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, UPLOADS_BUCKET } from "./client.js";

export async function createPresignedUpload(opts: {
  key: string;
  contentType: string;
  maxSize?: number;
}) {
  const command = new PutObjectCommand({
    Bucket: UPLOADS_BUCKET,
    Key: opts.key,
    ContentType: opts.contentType,
    ...(opts.maxSize ? { ContentLength: opts.maxSize } : {}),
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return { url, key: opts.key };
}
