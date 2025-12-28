import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { DynamicIcon } from '@/lib/utils/icons';
import type { Profile } from '@/types/profile';
import {
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Building2,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  Send,
  Calendar,
  Download,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch profile by slug (active and public)
async function getProfile(slug: string): Promise<Profile | null> {
  try {
    const [profile] = await sql<Profile[]>`
      SELECT * FROM profiles
      WHERE slug = ${slug}
        AND is_active = true
        AND is_public = true
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
    return profile || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Check if profile exists but is inactive
async function checkProfileExists(slug: string): Promise<{ exists: boolean; isInactive: boolean }> {
  try {
    const [profile] = await sql<{ is_public: boolean; is_active: boolean }[]>`
      SELECT is_public, is_active FROM profiles
      WHERE slug = ${slug}
    `;
    if (!profile) return { exists: false, isInactive: false };
    return { exists: true, isInactive: !profile.is_public || !profile.is_active };
  } catch (error) {
    return { exists: false, isInactive: false };
  }
}

// Increment view count
async function incrementViewCount(profileId: string) {
  try {
    await sql`
      UPDATE profiles
      SET view_count = view_count + 1
      WHERE id = ${profileId}
    `;
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    // Check if profile exists but is inactive
    const { exists, isInactive } = await checkProfileExists(slug);

    if (exists && isInactive) {
      // Show inactive profile message
      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              پروفایل غیرفعال است
            </h1>
            <p className="text-muted-foreground mb-6">
              این پروفایل در حال حاضر غیرفعال شده است و قابل مشاهده نیست.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Globe className="w-5 h-5" />
              بازگشت به صفحه اصلی
            </a>
            <div className="mt-8 pt-6 border-t">
              <p className="text-xs text-muted-foreground">
                ساخته شده با{' '}
                <a href="/" className="text-primary hover:underline font-medium">
                  بیزباز
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    notFound();
  }

  // Increment view count (fire and forget)
  incrementViewCount(profile.id);

  // Get social links
  const socialLinks = profile.social_links || {};

  // Format phone for display
  const formatPhone = (phone: string | null, visibility: string) => {
    if (!phone) return null;
    if (visibility === 'hidden') return null;
    if (visibility === 'masked') {
      return phone.slice(0, 4) + '****' + phone.slice(-3);
    }
    return phone;
  };

  // Format email for display
  const formatEmail = (email: string | null, visibility: string) => {
    if (!email) return null;
    if (visibility === 'hidden') return null;
    if (visibility === 'masked') {
      const [name, domain] = email.split('@');
      return name.slice(0, 2) + '***@' + domain;
    }
    return email;
  };

  const displayPhone = formatPhone(profile.phone, profile.phone_visibility);
  const displayEmail = formatEmail(profile.email, profile.email_visibility);

  // CTA button config
  const ctaConfig = {
    connect: { label: 'اتصال', icon: User },
    message: { label: 'ارسال پیام', icon: MessageCircle },
    book_meeting: { label: 'رزرو جلسه', icon: Calendar },
    download_cv: { label: 'دانلود رزومه', icon: Download },
    visit_website: { label: 'مشاهده سایت', icon: ExternalLink },
    none: null,
  };

  const cta = ctaConfig[profile.cta_type];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header/Cover */}
      <div
        className="h-32 md:h-48"
        style={{ backgroundColor: profile.theme_color || '#2563eb' }}
      >
        {profile.cover_url && (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 md:-mt-20 pb-12">
        <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 text-center relative">
            {/* Avatar */}
            <div className="mx-auto -mt-20 mb-4">
              <div
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-card shadow-lg overflow-hidden mx-auto"
                style={{ backgroundColor: profile.theme_color || '#e5e7eb' }}
              >
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 md:w-16 md:h-16 text-white/80" />
                  </div>
                )}
              </div>
            </div>

            {/* Name & Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {profile.full_name || 'کاربر بیزباز'}
            </h1>
            {profile.headline && (
              <p className="text-muted-foreground mt-2 text-lg">
                {profile.headline}
              </p>
            )}

            {/* Company & Job */}
            {(profile.job_title || profile.company) && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                <span>
                  {profile.job_title}
                  {profile.job_title && profile.company && ' در '}
                  {profile.company}
                </span>
              </div>
            )}

            {/* Location */}
            {(profile.city || profile.country) && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {profile.city}
                  {profile.city && profile.country && '، '}
                  {profile.country}
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="px-6 py-4 border-t">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Contact Info */}
          <div className="px-6 py-4 border-t space-y-3">
            {displayEmail && (
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-foreground" dir="ltr">{displayEmail}</span>
              </a>
            )}

            {displayPhone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-foreground" dir="ltr">{displayPhone}</span>
              </a>
            )}

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-foreground" dir="ltr">
                  {profile.website.replace(/^https?:\/\//, '')}
                </span>
              </a>
            )}
          </div>

          {/* Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="px-6 py-4 border-t">
              <div className="flex flex-wrap justify-center gap-3">
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#0077b5]/10 hover:bg-[#0077b5]/20 transition-colors"
                  >
                    <Linkedin className="w-6 h-6 text-[#0077b5]" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#1da1f2]/10 hover:bg-[#1da1f2]/20 transition-colors"
                  >
                    <Twitter className="w-6 h-6 text-[#1da1f2]" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#e4405f]/10 hover:bg-[#e4405f]/20 transition-colors"
                  >
                    <Instagram className="w-6 h-6 text-[#e4405f]" />
                  </a>
                )}
                {socialLinks.telegram && (
                  <a
                    href={socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-colors"
                  >
                    <Send className="w-6 h-6 text-[#0088cc]" />
                  </a>
                )}
                {socialLinks.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-foreground/10 hover:bg-foreground/20 transition-colors"
                  >
                    <Github className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* CTA Button */}
          {cta && (
            <div className="px-6 py-6 border-t">
              <button
                className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: profile.theme_color || '#2563eb' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <cta.icon className="w-5 h-5" />
                  {cta.label}
                </span>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">
              ساخته شده با{' '}
              <a
                href="/"
                className="text-primary hover:underline font-medium"
              >
                بیزباز
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    return {
      title: 'پروفایل یافت نشد',
    };
  }

  return {
    title: `${profile.full_name || 'پروفایل'} | بیزباز`,
    description: profile.headline || profile.bio?.slice(0, 160) || 'پروفایل دیجیتال',
    openGraph: {
      title: profile.full_name || 'پروفایل بیزباز',
      description: profile.headline || 'پروفایل دیجیتال',
      images: profile.photo_url ? [{ url: profile.photo_url }] : [],
    },
  };
}
