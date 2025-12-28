'use client';

import * as React from 'react';
import { X, Mail, Phone, Globe, MapPin, Briefcase, Linkedin, Twitter, Instagram, Github, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Profile } from '@/types/profile';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
}

export function ProfilePreviewModal({ isOpen, onClose, profile }: ProfilePreviewModalProps) {
  if (!isOpen || !profile) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header/Cover */}
        <div
          className="h-24 rounded-t-2xl"
          style={{ backgroundColor: profile.theme_color || '#2563eb' }}
        >
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt="Cover"
              className="w-full h-full object-cover rounded-t-2xl"
            />
          )}
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-12 mb-4">
            <div
              className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden mx-auto"
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
                  <User className="w-10 h-10 text-white/80" />
                </div>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-foreground">
              {profile.full_name || 'کاربر بیزباز'}
            </h2>
            {profile.headline && (
              <p className="text-muted-foreground mt-1">{profile.headline}</p>
            )}

            {/* Company & Job */}
            {(profile.job_title || profile.company) && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
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
              <div className="flex items-center justify-center gap-2 mt-1 text-sm text-muted-foreground">
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
            <p className="text-sm text-foreground leading-relaxed text-center mb-4 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            {displayEmail && (
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground" dir="ltr">{displayEmail}</span>
              </a>
            )}

            {displayPhone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground" dir="ltr">{displayPhone}</span>
              </a>
            )}

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground" dir="ltr">
                  {profile.website.replace(/^https?:\/\//, '')}
                </span>
              </a>
            )}
          </div>

          {/* Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-[#0077b5]/10 hover:bg-[#0077b5]/20 transition-colors"
                >
                  <Linkedin className="w-5 h-5 text-[#0077b5]" />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-[#1da1f2]/10 hover:bg-[#1da1f2]/20 transition-colors"
                >
                  <Twitter className="w-5 h-5 text-[#1da1f2]" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-[#e4405f]/10 hover:bg-[#e4405f]/20 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-[#e4405f]" />
                </a>
              )}
              {socialLinks.telegram && (
                <a
                  href={socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-colors"
                >
                  <Send className="w-5 h-5 text-[#0088cc]" />
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              ساخته شده با{' '}
              <span className="text-primary font-medium">بیزباز</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
