/**
 * Format a date as relative time in Persian (e.g., "۲ دقیقه پیش")
 */
export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'همین الان';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} دقیقه پیش`;
  }
  if (diffHours < 24) {
    return `${diffHours} ساعت پیش`;
  }
  if (diffDays === 1) {
    return 'دیروز';
  }
  if (diffDays < 7) {
    return `${diffDays} روز پیش`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks} هفته پیش`;
  }
  if (diffMonths < 12) {
    return `${diffMonths} ماه پیش`;
  }

  return date.toLocaleDateString('fa-IR');
}

/**
 * Format a date in Persian locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date and time in Persian locale
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
