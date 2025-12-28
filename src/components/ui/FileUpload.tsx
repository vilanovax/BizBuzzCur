'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Upload, X, Loader2, FileText, File } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './Button';

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
