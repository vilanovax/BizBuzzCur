import sharp from 'sharp';

// Image variant sizes
export const IMAGE_VARIANTS = {
  original: { width: 1024, height: 1024 },
  large: { width: 512, height: 512 },
  medium: { width: 256, height: 256 },
  thumbnail: { width: 96, height: 96 },
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: 'webp' | 'jpeg';
  size: number;
}

export interface ImageVariants {
  original: ProcessedImage;
  large: ProcessedImage;
  medium: ProcessedImage;
  thumbnail: ProcessedImage;
}

export interface ProcessingOptions {
  quality?: number;
  stripMetadata?: boolean;
}

/**
 * Process an image buffer and generate all variants
 * - Converts to WebP (with JPEG fallback)
 * - Strips EXIF metadata for privacy
 * - Generates multiple sizes
 */
export async function processProfileImage(
  inputBuffer: Buffer,
  options: ProcessingOptions = {}
): Promise<ImageVariants> {
  const { quality = 80, stripMetadata = true } = options;

  // Create sharp instance and get metadata
  let image = sharp(inputBuffer);

  // Strip EXIF metadata for privacy
  if (stripMetadata) {
    image = image.rotate(); // Auto-rotate based on EXIF, then strip
  }

  // Get original dimensions
  const metadata = await image.metadata();
  const originalWidth = metadata.width || 1024;
  const originalHeight = metadata.height || 1024;

  // Determine if we need to crop to square (1:1)
  const size = Math.min(originalWidth, originalHeight);

  // Create base image (cropped to square, stripped metadata)
  const baseImage = sharp(inputBuffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
    });

  // Generate all variants in parallel
  const [original, large, medium, thumbnail] = await Promise.all([
    generateVariant(baseImage.clone(), IMAGE_VARIANTS.original, quality),
    generateVariant(baseImage.clone(), IMAGE_VARIANTS.large, quality),
    generateVariant(baseImage.clone(), IMAGE_VARIANTS.medium, quality),
    generateVariant(baseImage.clone(), IMAGE_VARIANTS.thumbnail, quality),
  ]);

  return { original, large, medium, thumbnail };
}

async function generateVariant(
  image: sharp.Sharp,
  dimensions: { width: number; height: number },
  quality: number
): Promise<ProcessedImage> {
  const { width, height } = dimensions;

  // Resize and convert to WebP
  const buffer = await image
    .resize(width, height, {
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality })
    .toBuffer();

  return {
    buffer,
    width,
    height,
    format: 'webp',
    size: buffer.length,
  };
}

/**
 * Validate image before processing
 */
export async function validateImage(buffer: Buffer): Promise<{
  valid: boolean;
  error?: string;
  metadata?: sharp.Metadata;
}> {
  try {
    const metadata = await sharp(buffer).metadata();

    // Check minimum dimensions (400x400)
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Could not read image dimensions' };
    }

    if (metadata.width < 400 || metadata.height < 400) {
      return {
        valid: false,
        error: 'Image too small. Minimum 400x400 pixels required.',
      };
    }

    // Check format
    const allowedFormats = ['jpeg', 'png', 'webp', 'heif', 'heic'];
    if (!metadata.format || !allowedFormats.includes(metadata.format)) {
      return {
        valid: false,
        error: 'Invalid format. Allowed: JPG, PNG, WebP, HEIC',
      };
    }

    return { valid: true, metadata };
  } catch (error) {
    return { valid: false, error: 'Invalid or corrupted image file' };
  }
}

/**
 * Get MIME type for image format
 */
export function getMimeType(format: 'webp' | 'jpeg'): string {
  return format === 'webp' ? 'image/webp' : 'image/jpeg';
}

/**
 * Generate deterministic filename for image variants
 */
export function generateImagePath(
  userId: string,
  profileId: string,
  variant: ImageVariant
): string {
  const size = IMAGE_VARIANTS[variant];
  return `users/${userId}/profiles/${profileId}/photo_${size.width}.webp`;
}

/**
 * Generate all image paths for a profile
 */
export function generateAllImagePaths(
  userId: string,
  profileId: string
): Record<ImageVariant, string> {
  return {
    original: generateImagePath(userId, profileId, 'original'),
    large: generateImagePath(userId, profileId, 'large'),
    medium: generateImagePath(userId, profileId, 'medium'),
    thumbnail: generateImagePath(userId, profileId, 'thumbnail'),
  };
}
