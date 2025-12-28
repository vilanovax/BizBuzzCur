'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface QRCodeWithLogoProps {
  value: string;
  size?: number;
  logoUrl?: string;
  logoSize?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
  showActions?: boolean;
  profileName?: string;
}

export function QRCodeWithLogo({
  value,
  size = 256,
  logoUrl = '/bizbuzz-logo.svg',
  logoSize = 50,
  bgColor = '#ffffff',
  fgColor = '#000000',
  className,
  showActions = true,
  profileName = 'profile',
}: QRCodeWithLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [value, size, logoUrl, logoSize, bgColor, fgColor]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !value) return;

    try {
      setError(null);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Generate QR code
      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: 'H', // High error correction for logo
      });

      // Add logo in the center
      if (logoUrl) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;

          // Draw white background for logo
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.roundRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10, 8);
          ctx.fill();

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        };
        logo.onerror = () => {
          // If logo fails to load, still show QR without logo
          console.warn('Failed to load QR code logo');
        };
        logo.src = logoUrl;
      }
    } catch (err) {
      console.error('QR generation error:', err);
      setError('خطا در ساخت QR Code');
    }
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `${profileName}-qrcode.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const shareQR = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob(resolve, 'image/png');
      });

      if (blob && navigator.share) {
        const file = new File([blob], `${profileName}-qrcode.png`, { type: 'image/png' });
        await navigator.share({
          title: `QR Code - ${profileName}`,
          text: 'اسکن کنید تا پروفایل من را ببینید',
          files: [file],
        });
      }
    } catch (err) {
      // Share cancelled or not supported
      console.log('Share cancelled or not supported');
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* QR Code Canvas */}
      <div className="relative bg-white p-4 rounded-xl shadow-sm border">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-lg"
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      {/* URL Display */}
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <p className="flex-1 text-xs text-muted-foreground truncate text-center" dir="ltr">
            {value}
          </p>
          <button
            type="button"
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title="کپی لینک"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadQR}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            دانلود PNG
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={shareQR}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              اشتراک‌گذاری
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-muted-foreground text-center">
        این QR Code را در کارت ویزیت، پاورپوینت یا هر جای دیگری استفاده کنید
      </p>
    </div>
  );
}

// Simplified QR code component without logo (for smaller uses)
interface SimpleQRCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  className?: string;
}

export function SimpleQRCode({
  value,
  size = 128,
  fgColor = '#000000',
  className,
}: SimpleQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: {
        dark: fgColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }).catch(console.error);
  }, [value, size, fgColor]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={cn('rounded', className)}
    />
  );
}
