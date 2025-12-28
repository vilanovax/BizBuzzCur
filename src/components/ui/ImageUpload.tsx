'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  type?: 'profile_photo' | 'cover_image';
  label?: string;
  labelFa?: string;
  className?: string;
  aspectRatio?: 'square' | 'cover' | 'auto';
  maxSize?: number; // in MB
  disabled?: boolean;
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
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

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

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Upload failed');
        }

        onChange(result.data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در آپلود');
      } finally {
        setIsUploading(false);
      }
    },
    [type, maxSize, onChange]
  );

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
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg transition-colors',
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
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            disabled={disabled || isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
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
                  حداکثر {maxSize} مگابایت
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
