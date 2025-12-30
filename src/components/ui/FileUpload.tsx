'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Upload, X, Loader2, FileText, File, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './Button';
import { ImageCropper } from './ImageCropper';

interface FileUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  type?: 'resume' | 'document';
  label?: string;
  labelFa?: string;
  accept?: string;
  className?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function FileUpload({
  value,
  onChange,
  type = 'document',
  label = 'Upload File',
  labelFa = 'آپلود فایل',
  accept = '.pdf,.doc,.docx',
  className,
  maxSize = 10,
  disabled = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`حداکثر حجم فایل ${maxSize} مگابایت است`);
        return;
      }

      setIsUploading(true);
      setFileName(file.name);

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
        setFileName(null);
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
    setFileName(null);
    setError(null);
  }, [onChange]);

  const getFileIcon = () => {
    if (fileName?.endsWith('.pdf')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    return <File className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-foreground mb-2">
        {labelFa || label}
      </label>

      {value ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {fileName || 'فایل آپلود شده'}
            </p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              مشاهده فایل
            </a>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <label
          className={cn(
            'relative block border-2 border-dashed rounded-lg p-6 transition-colors',
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
            accept={accept}
            onChange={handleChange}
            disabled={disabled || isUploading}
            className="sr-only"
          />

          <div className="flex flex-col items-center justify-center text-center pointer-events-none">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <span className="text-sm text-muted-foreground">در حال آپلود...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  کلیک کنید یا فایل را بکشید
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {accept.split(',').join(', ')} - حداکثر {maxSize} مگابایت
                </span>
              </>
            )}
          </div>
        </label>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Image Upload Component with optional crop support
interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  maxSize?: number;
  aspectRatio?: 'square' | 'banner' | 'auto';
  disabled?: boolean;
  enableCrop?: boolean; // Enable 1:1 crop for logos
  outputSize?: number; // Output size in pixels (default: 512 for square, 1200 for banner)
}

export function ImageUpload({
  value,
  onChange,
  label,
  className,
  maxSize = 5,
  aspectRatio = 'auto',
  disabled = false,
  enableCrop = false,
  outputSize,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  // Determine output size based on aspect ratio
  const getOutputSize = () => {
    if (outputSize) return outputSize;
    return aspectRatio === 'square' ? 512 : aspectRatio === 'banner' ? 1200 : 800;
  };

  const uploadImage = useCallback(async (fileOrBlob: File | Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileOrBlob);
      formData.append('type', aspectRatio === 'square' ? 'company_logo' : 'cover_image');

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
  }, [aspectRatio, onChange]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('فقط فایل تصویری مجاز است');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`حداکثر حجم تصویر ${maxSize} مگابایت است`);
      return;
    }

    // If crop is enabled for square images, show cropper
    if (enableCrop && aspectRatio === 'square') {
      setCropFile(file);
      return;
    }

    // Otherwise upload directly
    await uploadImage(file);
  }, [maxSize, enableCrop, aspectRatio, uploadImage]);

  const handleCrop = useCallback(async (croppedBlob: Blob) => {
    setCropFile(null);
    await uploadImage(croppedBlob);
  }, [uploadImage]);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const heightClass = aspectRatio === 'banner' ? 'h-48' : aspectRatio === 'square' ? 'h-40' : 'h-32';

  return (
    <>
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}

        {value ? (
          <div className={cn('relative rounded-xl overflow-hidden', heightClass)}>
            <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <label
            className={cn(
              'relative block border-2 border-dashed rounded-xl transition-colors',
              heightClass,
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

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
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
                    تصویر را بکشید یا کلیک کنید
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, HEIC - حداکثر {maxSize} مگابایت
                  </span>
                  {enableCrop && aspectRatio === 'square' && (
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

// Multi File Upload Component
interface MultiFileUploadProps {
  values: { url: string; name: string; type?: string; size?: number }[];
  onChange: (files: { url: string; name: string; type?: string; size?: number }[]) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiFileUpload({
  values = [],
  onChange,
  accept = '*/*',
  maxSize = 10,
  maxFiles = 5,
  label,
  className,
  disabled = false,
}: MultiFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    if (values.length + files.length > maxFiles) {
      setError(`حداکثر ${maxFiles} فایل می‌توانید آپلود کنید`);
      return;
    }

    setError(null);
    setIsUploading(true);

    const newFiles: { url: string; name: string; type?: string; size?: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > maxSize * 1024 * 1024) {
        setError(`حجم فایل ${file.name} بیشتر از ${maxSize} مگابایت است`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'attachment');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          newFiles.push({
            url: data.data.url,
            name: file.name,
            type: file.type,
            size: file.size,
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    if (newFiles.length > 0) {
      onChange([...values, ...newFiles]);
    }

    setIsUploading(false);
  };

  const removeFile = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      {values.length < maxFiles && !disabled && (
        <label
          className={cn(
            'block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
            'border-muted hover:border-primary/50',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          <input
            type="file"
            accept={accept}
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="sr-only"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">در حال آپلود...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                افزودن فایل (حداکثر {maxSize}MB)
              </span>
            </div>
          )}
        </label>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}

      {values.length > 0 && (
        <div className="space-y-2 mt-3">
          {values.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
              <File className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                {file.size && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-background rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
