import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { uploadFile } from '@/lib/storage/s3';
import { nanoid } from 'nanoid';
import {
  processProfileImage,
  validateImage,
  getMimeType,
  IMAGE_VARIANTS,
  type ImageVariant,
} from '@/lib/image/processor';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Max file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Additional allowed file types for attachments
const ALLOWED_ATTACHMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-zip-compressed',
];

type UploadType = 'profile_photo' | 'cover_image' | 'resume' | 'document' | 'qr_code' | 'image' | 'attachment';

interface UploadConfig {
  folder: string;
  allowedTypes: string[];
  maxSize: number;
  processImage?: boolean;
}

const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  profile_photo: {
    folder: 'users',
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: MAX_IMAGE_SIZE,
    processImage: true, // Enable image processing pipeline
  },
  cover_image: {
    folder: 'profiles/covers',
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: MAX_IMAGE_SIZE,
  },
  resume: {
    folder: 'profiles/resumes',
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    maxSize: MAX_DOCUMENT_SIZE,
  },
  document: {
    folder: 'documents',
    allowedTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES],
    maxSize: MAX_DOCUMENT_SIZE,
  },
  qr_code: {
    folder: 'qr-codes',
    allowedTypes: ['image/png'],
    maxSize: MAX_IMAGE_SIZE,
  },
  // Generic image upload (for banners, event images, etc.)
  image: {
    folder: 'images',
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: MAX_IMAGE_SIZE,
  },
  // Generic attachment upload (for event attachments, etc.)
  attachment: {
    folder: 'attachments',
    allowedTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_ATTACHMENT_TYPES],
    maxSize: MAX_DOCUMENT_SIZE,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('bizbuzz_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Invalid token' } },
        { status: 401 }
      );
    }

    const userId = payload.userId as string;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as UploadType | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'missing_file', message: 'No file provided' } },
        { status: 400 }
      );
    }

    if (!type || !UPLOAD_CONFIGS[type]) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_type', message: 'Invalid upload type' } },
        { status: 400 }
      );
    }

    const config = UPLOAD_CONFIGS[type];

    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'invalid_file_type',
            message: `File type not allowed. Allowed: ${config.allowedTypes.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > config.maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'file_too_large',
            message: `File too large. Max size: ${config.maxSize / 1024 / 1024}MB`,
          },
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process profile photos with image pipeline
    if (config.processImage && type === 'profile_photo') {
      // Validate image
      const validation = await validateImage(buffer);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'invalid_image',
              message: validation.error || 'Invalid image',
            },
          },
          { status: 400 }
        );
      }

      // Get profile ID from form data (optional, for deterministic paths)
      const profileId = (formData.get('profileId') as string) || nanoid(12);

      // Process image and generate variants
      const variants = await processProfileImage(buffer, { quality: 80 });

      // Upload all variants in parallel
      const uploadPromises = (Object.keys(variants) as ImageVariant[]).map(
        async (variantName) => {
          const variant = variants[variantName];
          const size = IMAGE_VARIANTS[variantName];
          const key = `users/${userId}/profiles/${profileId}/photo_${size.width}.webp`;

          const result = await uploadFile(
            key,
            variant.buffer,
            getMimeType(variant.format)
          );

          return { variant: variantName, ...result, size: variant.size };
        }
      );

      const uploadResults = await Promise.all(uploadPromises);

      // Create response with all variant URLs
      const urls: Record<string, string> = {};
      const keys: Record<string, string> = {};
      let totalSize = 0;

      uploadResults.forEach((result) => {
        urls[result.variant] = result.url;
        keys[result.variant] = result.key;
        totalSize += result.size;
      });

      return NextResponse.json({
        success: true,
        data: {
          urls,
          keys,
          // Primary URL for backward compatibility (use medium for most UI)
          url: urls.medium,
          key: keys.medium,
          // All sizes for different use cases
          sizes: {
            original: urls.original, // 1024px - storage only
            large: urls.large,       // 512px - profile page
            medium: urls.medium,     // 256px - cards, lists
            thumbnail: urls.thumbnail, // 96px - avatars
          },
          filename: file.name,
          originalSize: file.size,
          processedSize: totalSize,
          format: 'webp',
        },
      });
    }

    // Regular file upload (non-processed)
    const ext = file.name.split('.').pop() || getExtensionFromMime(file.type);
    const uniqueId = nanoid(12);
    const key = `${config.folder}/${userId}/${uniqueId}.${ext}`;

    // Upload to S3
    const result = await uploadFile(key, buffer, file.type);

    return NextResponse.json({
      success: true,
      data: {
        key: result.key,
        url: result.url,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Upload failed' } },
      { status: 500 }
    );
  }
}

function getExtensionFromMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-zip-compressed': 'zip',
  };
  return extensions[mimeType] || 'bin';
}
