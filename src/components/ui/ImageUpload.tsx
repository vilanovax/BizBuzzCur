'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ImageCropper } from './ImageCropper';

// Image sizes returned from API
export interface ImageSizes {
  original: string;
  large: string;
  medium: string;
  thumbnail: string;
}

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null, sizes?: ImageSizes) => void;
  type?: 'profile_photo' | 'cover_image';
  label?: string;
  labelFa?: string;
  className?: string;
  aspectRatio?: 'square' | 'cover' | 'auto';
  maxSize?: number; // in MB
  disabled?: boolean;
  profileId?: string; // For deterministic image paths
  enableCrop?: boolean; // Enable 1:1 crop for profile photos
}

export function ImageUpload({
  value,
  onChange,
  type = 'profile_photo',
  label = 'Upload Image',
  labelFa = 'آپلود تصویر',
  className,
  aspectRatio = 'square',
  maxSize = 5,
  disabled = false,
  profileId,
  enableCrop = true,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const uploadImage = useCallback(
    async (fileOrBlob: File | Blob) => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', fileOrBlob);
        formData.append('type', type);
        if (profileId) {
          formData.append('profileId', profileId);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Upload failed');
        }

        // For profile photos, we get multiple sizes
        if (result.data.sizes) {
          onChange(result.data.url, result.data.sizes);
        } else {
          onChange(result.data.url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در آپلود');
      } finally {
        setIsUploading(false);
      }
    },
    [type, profileId, onChange]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('فقط فایل‌های تصویری مجاز هستند');
        return;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`حداکثر حجم فایل ${maxSize} مگابایت است`);
        return;
      }

      // For profile photos with crop enabled, show cropper
      if (type === 'profile_photo' && enableCrop && aspectRatio === 'square') {
        setCropFile(file);
        return;
      }

      // Otherwise upload directly
      await uploadImage(file);
    },
    [type, maxSize, enableCrop, aspectRatio, uploadImage]
  );

  const handleCrop = useCallback(
    async (croppedBlob: Blob) => {
      setCropFile(null);
      await uploadImage(croppedBlob);
    },
    [uploadImage]
  );

  const handleCropCancel = useCallback(() => {
    setCropFile(null);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  const aspectClasses = {
    square: 'aspect-square',
    cover: 'aspect-[3/1]',
    auto: '',
  };

  return (
    <>
      <div className={cn('relative', className)}>
        <label className="block text-sm font-medium text-foreground mb-2">
          {labelFa || label}
        </label>

        {value ? (
          <div className={cn('relative rounded-lg overflow-hidden border', aspectClasses[aspectRatio])}>
            <img
              src={value}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 left-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <label
            className={cn(
              'relative block border-2 border-dashed rounded-lg transition-colors',
              aspectClasses[aspectRatio],
              aspectRatio === 'auto' && 'min-h-[150px]',
              dragActive ? 'border-primary bg-primary/5' : 'border-border',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50',
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handleChange}
              disabled={disabled || isUploading}
              className="sr-only"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                  <span className="text-sm text-muted-foreground">در حال آپلود...</span>
                </>
              ) : (
                <>
                  {aspectRatio === 'square' ? (
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    کلیک کنید یا فایل را بکشید
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, HEIC - حداکثر {maxSize} مگابایت
                  </span>
                  {type === 'profile_photo' && enableCrop && (
                    <span className="text-xs text-primary mt-1">
                      تصویر به صورت مربعی برش داده می‌شود
                    </span>
                  )}
                </>
              )}
            </div>
          </label>
        )}

        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Image Cropper Modal */}
      {cropFile && (
        <ImageCropper
          imageFile={cropFile}
          onCrop={handleCrop}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </>
  );
}
