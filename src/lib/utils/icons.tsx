import * as React from 'react';
import {
  Briefcase,
  Building2,
  Code,
  Laptop,
  Landmark,
  Scale,
  HeartPulse,
  Stethoscope,
  GraduationCap,
  Palette,
  Megaphone,
  Truck,
  Wrench,
  ShoppingBag,
  User,
  Users,
  XCircle,
  Check,
  Search,
  Eye,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Github,
  Twitter,
  Instagram,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

// Map of icon names (from database) to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  // Professional domains
  'briefcase': Briefcase,
  'building-2': Building2,
  'code': Code,
  'laptop': Laptop,
  'landmark': Landmark,
  'scale': Scale,
  'heart-pulse': HeartPulse,
  'stethoscope': Stethoscope,
  'graduation-cap': GraduationCap,
  'palette': Palette,
  'megaphone': Megaphone,
  'truck': Truck,
  'wrench': Wrench,
  'shopping-bag': ShoppingBag,
  // General
  'user': User,
  'users': Users,
  'x-circle': XCircle,
  'check': Check,
  'search': Search,
  'eye': Eye,
  'clock': Clock,
  'calendar': Calendar,
  'map-pin': MapPin,
  'phone': Phone,
  'mail': Mail,
  'globe': Globe,
  // Social
  'linkedin': Linkedin,
  'github': Github,
  'twitter': Twitter,
  'instagram': Instagram,
  // Other
  'file-text': FileText,
  'settings': Settings,
};

// Map of icon names to emoji fallbacks
const EMOJI_MAP: Record<string, string> = {
  'briefcase': '\u{1F4BC}',      // 💼
  'building-2': '\u{1F3E2}',     // 🏢
  'code': '\u{1F4BB}',           // 💻
  'laptop': '\u{1F4BB}',         // 💻
  'landmark': '\u{1F3DB}',       // 🏛️
  'scale': '\u{2696}',           // ⚖️
  'heart-pulse': '\u{2764}',     // ❤️
  'stethoscope': '\u{1FA7A}',    // 🩺
  'graduation-cap': '\u{1F393}', // 🎓
  'palette': '\u{1F3A8}',        // 🎨
  'megaphone': '\u{1F4E2}',      // 📢
  'truck': '\u{1F69A}',          // 🚚
  'wrench': '\u{1F527}',         // 🔧
  'shopping-bag': '\u{1F6CD}',   // 🛍️
  'user': '\u{1F464}',           // 👤
  'users': '\u{1F465}',          // 👥
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  fallback?: 'emoji' | 'text' | 'none';
}

/**
 * Render a Lucide icon by name (from database)
 */
export function DynamicIcon({ name, className, size = 20, fallback = 'emoji' }: IconProps) {
  const normalizedName = name?.toLowerCase().replace(/_/g, '-');
  const IconComponent = ICON_MAP[normalizedName];

  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }

  // Fallback
  if (fallback === 'emoji') {
    const emoji = EMOJI_MAP[normalizedName];
    if (emoji) {
      return <span className={className}>{emoji}</span>;
    }
  }

  if (fallback === 'text') {
    return <span className={className}>{name}</span>;
  }

  // Default fallback - pin emoji
  return <span className={className}>{'\u{1F4CC}'}</span>;
}

/**
 * Get emoji for icon name
 */
export function getIconEmoji(iconName: string): string {
  const normalizedName = iconName?.toLowerCase().replace(/_/g, '-');
  return EMOJI_MAP[normalizedName] || '\u{1F4CC}'; // 📌
}

/**
 * Check if an icon exists
 */
export function hasIcon(name: string): boolean {
  const normalizedName = name?.toLowerCase().replace(/_/g, '-');
  return !!ICON_MAP[normalizedName];
}
