import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import type { Profile } from '@/types/profile';
import {
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  Send,
  Calendar,
  Download,
  ExternalLink,
  MessageCircle,
  UserPlus,
  Bookmark,
  Share2,
  Shield,
  Flag,
} from 'lucide-react';
import { ProfileActions } from '@/components/profile/ProfileActions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch profile by slug (active and public)
async function getProfile(slug: string): Promise<Profile | null> {
  try {
    // Decode slug if URL encoded
    const decodedSlug = decodeURIComponent(slug);
    console.log('Looking for profile with slug:', decodedSlug);

    const [profile] = await sql<Profile[]>`
      SELECT * FROM profiles
      WHERE slug = ${decodedSlug}
        AND is_active = true
        AND is_public = true
        AND deleted_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
    console.log('Found profile:', profile?.id || 'none');
    return profile || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Get profile owner info
async function getProfileOwner(userId: string) {
  try {
    const [owner] = await sql<{ id: string; first_name: string; last_name: string; avatar_url: string | null }[]>`
      SELECT id, first_name, last_name, avatar_url
      FROM users WHERE id = ${userId}
    `;
    return owner || null;
  } catch (error) {
    return null;
  }
}

// Get welcome message if exists
async function getWelcomeMessage(profileId: string) {
  try {
    const [welcome] = await sql<{
      message: string;
      attachments: { type: string; url: string; name: string }[];
      is_active: boolean;
    }[]>`
      SELECT message, attachments, is_active
      FROM profile_welcome_messages
      WHERE profile_id = ${profileId} AND is_active = true
    `;
    return welcome || null;
  } catch (error) {
    return null;
  }
}

// Check if profile exists but is inactive
async function checkProfileExists(slug: string): Promise<{ exists: boolean; isInactive: boolean }> {
  try {
    const [profile] = await sql<{ is_public: boolean; is_active: boolean }[]>`
      SELECT is_public, is_active FROM profiles
      WHERE slug = ${slug} AND deleted_at IS NULL
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
    const { exists, isInactive } = await checkProfileExists(slug);

    if (exists && isInactive) {
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

  // Increment view count
  incrementViewCount(profile.id);

  // Get profile owner
  const owner = await getProfileOwner(profile.user_id);

  // Get welcome message
  const welcomeMessage = await getWelcomeMessage(profile.id);

  // Social links
  const socialLinks = profile.social_links || {};

  // Format phone/email based on visibility
  const formatPhone = (phone: string | null, visibility: string) => {
    if (!phone) return null;
    if (visibility === 'hidden') return null;
    if (visibility === 'masked') {
      return phone.slice(0, 4) + '****' + phone.slice(-3);
    }
    return phone;
  };

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

  // Prepare profile data for client component
  const profileData = {
    id: profile.id,
    slug: profile.slug,
    title: profile.title,
    full_name: profile.full_name,
    headline: profile.headline,
    bio: profile.bio,
    photo_url: profile.photo_url,
    theme_color: profile.theme_color,
    cta_type: profile.cta_type,
    cta_url: profile.cta_url,
    user_id: profile.user_id,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header/Cover */}
      <div
        className="h-32 md:h-48 relative"
        style={{ backgroundColor: profile.theme_color || '#2563eb' }}
      >
        {profile.cover_url && (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}

        {/* Context Badge - for event/meeting context */}
        {profile.profile_type === 'event' && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 shadow-sm">
            پروفایل رویداد
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto px-4 pb-12 -mt-16 md:-mt-20">
        <div className="bg-card rounded-2xl shadow-xl border overflow-visible pt-16 md:pt-20">
          {/* Profile Header */}
          <div className="pb-6 px-6 text-center relative">
            {/* Share Button - Top Right */}
            <div className="absolute top-0 left-4 flex items-center gap-2" style={{ top: '-48px' }}>
              <button
                className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                title="اشتراک‌گذاری"
              >
                <Share2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Avatar - positioned above the card */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-28 md:-top-32">
              <div
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-card shadow-lg overflow-hidden"
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

          {/* Welcome Message (if exists) */}
          {welcomeMessage && (
            <div className="px-6 py-4 border-t bg-primary/5">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: profile.theme_color || '#2563eb' }}
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">
                    پیام خوش‌آمدگویی
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {welcomeMessage.message}
                  </p>
                  {welcomeMessage.attachments && welcomeMessage.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {welcomeMessage.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Download className="w-3 h-3" />
                          {att.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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

          {/* Action Buttons - Client Component */}
          <ProfileActions
            profile={profileData}
            ownerId={profile.user_id}
          />

          {/* Trust & Privacy Footer */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>اطلاعات انتخاب‌شده توسط صاحب پروفایل</span>
              </div>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Flag className="w-3 h-3" />
                گزارش
              </button>
            </div>
            <div className="mt-3 pt-3 border-t text-center">
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

        {/* Signup CTA for Guests */}
        <div className="mt-6 bg-card rounded-xl border p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            می‌خواهید این ارتباط را حفظ کنید؟
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            ساخت حساب رایگان
          </a>
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
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.full_name || 'پروفایل بیزباز',
      description: profile.headline || 'پروفایل دیجیتال',
      images: profile.photo_url ? [profile.photo_url] : [],
    },
  };
}
