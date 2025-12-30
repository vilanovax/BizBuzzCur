import { nanoid } from 'nanoid';

// Persian to English character map for common Persian letters
const persianToEnglish: Record<string, string> = {
  'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
  'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
  'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'و': 'v', 'ه': 'h', 'ی': 'y', 'ي': 'y', 'ئ': 'y', 'ء': '',
  'ة': 'h', 'أ': 'a', 'إ': 'e', 'ؤ': 'v', 'ك': 'k',
  // Persian digits
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  // Arabic digits
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Convert Persian/Arabic characters to English equivalent
 */
function transliterate(text: string): string {
  let result = '';
  for (const char of text) {
    if (persianToEnglish[char] !== undefined) {
      result += persianToEnglish[char];
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Generate URL-friendly slug from title
 * Supports Persian and English text
 *
 * @param title - The title to slugify
 * @param addSuffix - Whether to add a unique suffix (default: true)
 * @returns URL-friendly slug
 *
 * Examples:
 * - "همایش بازاریابی دیجیتال" -> "hamayesh-bazaryabi-digital-abc123"
 * - "Tech Meetup 2024" -> "tech-meetup-2024-xyz789"
 */
export function slugify(title: string, addSuffix: boolean = true): string {
  // Transliterate Persian/Arabic characters to English
  let slug = transliterate(title);

  // Convert to lowercase
  slug = slug.toLowerCase();

  // Replace spaces and special characters with hyphens
  slug = slug
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end

  // Ensure minimum length
  if (slug.length < 3) {
    slug = 'event';
  }

  // Truncate if too long (max 50 chars for the base slug)
  if (slug.length > 50) {
    slug = slug.substring(0, 50).replace(/-+$/, '');
  }

  // Add unique suffix if requested
  if (addSuffix) {
    const suffix = nanoid(6);
    slug = `${slug}-${suffix}`;
  }

  return slug;
}

/**
 * Generate a unique slug by checking against existing slugs
 *
 * @param title - The title to slugify
 * @param existingCheck - Function to check if slug exists
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  title: string,
  existingCheck: (slug: string) => Promise<boolean>
): Promise<string> {
  // First try with the standard suffix
  let slug = slugify(title, true);

  // Check if it exists (should be very rare with nanoid)
  let attempts = 0;
  while (await existingCheck(slug) && attempts < 5) {
    slug = slugify(title, true);
    attempts++;
  }

  return slug;
}
