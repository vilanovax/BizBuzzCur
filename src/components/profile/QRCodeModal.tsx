'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, Download, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileSlug: string;
  profileTitle: string;
  themeColor?: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  profileSlug,
  profileTitle,
  themeColor = '#2563eb',
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${profileSlug}`
    : `/${profileSlug}`;

  useEffect(() => {
    if (isOpen) {
      generateQR();
    }
  }, [isOpen, profileSlug]);

  const generateQR = async () => {
    setLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(profileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: themeColor,
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `bizbuzz-${profileSlug}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">کد QR پروفایل</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div
              className="p-4 bg-white rounded-xl shadow-inner border"
              style={{ minWidth: 200, minHeight: 200 }}
            >
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${profileTitle}`}
                  className="w-full h-auto"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  خطا در تولید QR
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center mb-6">
            <p className="font-medium text-foreground">{profileTitle}</p>
            <p className="text-sm text-muted-foreground mt-1" dir="ltr">
              {profileUrl}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 ml-2 text-green-500" />
                  کپی شد
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 ml-2" />
                  کپی لینک
                </>
              )}
            </Button>

            <Button
              onClick={handleDownload}
              disabled={!qrDataUrl || loading}
              className="flex-1"
            >
              <Download className="w-4 h-4 ml-2" />
              دانلود QR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
