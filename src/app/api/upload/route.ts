import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { uploadFile, getPublicUrl } from '@/lib/storage/s3';
import { nanoid } from 'nanoid';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Max file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

type UploadType = 'profile_photo' | 'cover_image' | 'resume' | 'document' | 'qr_code';

interface UploadConfig {
  folder: string;
  allowedTypes: string[];
  maxSize: number;
}

const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  profile_photo: {
    folder: 'profiles/photos',
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: MAX_IMAGE_SIZE,
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

    // Generate unique filename
    const ext = file.name.split('.').pop() || getExtensionFromMime(file.type);
    const uniqueId = nanoid(12);
    const key = `${config.folder}/${userId}/${uniqueId}.${ext}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

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
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };
  return extensions[mimeType] || 'bin';
}
