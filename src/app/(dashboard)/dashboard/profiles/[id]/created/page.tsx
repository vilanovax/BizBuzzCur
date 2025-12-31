'use client';

/**
 * Profile Created Success Page
 *
 * Shown after quick profile creation.
 * Encourages sharing and offers upgrade path.
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Share2,
  QrCode,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { QUICK_PROFILE_COPY } from '@/types/profile';

interface ProfileCreatedPageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileCreatedPage({ params }: ProfileCreatedPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<{
    id: string;
    slug: string;
    full_name: string;
    headline: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const copy = QUICK_PROFILE_COPY.success;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profiles/${id}`);
      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        router.push('/dashboard/profiles');
      }
    } catch (err) {
      router.push('/dashboard/profiles');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = profile
    ? `${window.location.origin}/${profile.slug}`
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.full_name,
          text: profile?.headline,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-md mx-auto py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <PartyPopper className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.subtitle}</p>
      </div>

      {/* Profile Preview Card */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {profile.full_name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{profile.full_name}</h3>
              <p className="text-sm text-muted-foreground">{profile.headline}</p>
            </div>
          </div>

          {/* Share URL */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2">
            <span className="flex-1 text-sm font-mono truncate" dir="ltr">
              {shareUrl}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Primary Actions */}
      <div className="space-y-3 mb-6">
        <Button size="lg" className="w-full" onClick={handleShare}>
          <Share2 className="w-4 h-4 ml-2" />
          {copy.shareCta}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => setShowQR(!showQR)}
        >
          <QrCode className="w-4 h-4 ml-2" />
          {copy.qrCta}
        </Button>
      </div>

      {/* QR Code (if shown) */}
      {showQR && (
        <Card className="mb-6">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-3">
              {/* QR code placeholder - would use actual QR library */}
              <QrCode className="w-16 h-16 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              این QR Code را اسکن کنید تا پروفایل را ببینید
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upgrade CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                asChild
              >
                <Link href={`/dashboard/profiles/${id}/edit`}>
                  {copy.upgradeCta}
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-0.5">
                {copy.upgradeHelper}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Profile Link */}
      <div className="text-center mt-6">
        <Link
          href={`/${profile.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          مشاهده پروفایل
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
