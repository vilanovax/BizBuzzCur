import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'ir-thr-at1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || 'bizbuzz';

export interface UploadResult {
  key: string;
  url: string;
}

// Upload file to S3
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  return {
    key,
    url: `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`,
  };
}

// Get signed URL for private files
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Get signed URL for upload
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Delete file from S3
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

// List files with prefix
export async function listFiles(prefix: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  return response.Contents?.map((item) => item.Key || '') || [];
}

// Generate public URL
export function getPublicUrl(key: string): string {
  return `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;
}

// Upload profile image
export async function uploadProfileImage(
  userId: string,
  file: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  const ext = filename.split('.').pop() || 'jpg';
  const key = `profiles/${userId}/${Date.now()}.${ext}`;
  return uploadFile(key, file, contentType);
}

// Upload QR code
export async function uploadQRCode(
  type: 'profile' | 'event' | 'meeting',
  id: string,
  qrBuffer: Buffer
): Promise<UploadResult> {
  const key = `qr-codes/${type}/${id}.png`;
  return uploadFile(key, qrBuffer, 'image/png');
}

export { s3Client, BUCKET };
