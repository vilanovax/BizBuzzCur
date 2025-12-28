// OAuth 2.0 Scopes Definition
export const OAUTH_SCOPES = {
  // Profile Scopes
  'profile:read': {
    description: 'Read basic profile information',
    description_fa: 'خواندن اطلاعات پایه پروفایل',
  },
  'profile:business_card:read': {
    description: 'Read business card profile',
    description_fa: 'خواندن پروفایل کارت ویزیت',
  },
  'profile:resume:read': {
    description: 'Read resume profile',
    description_fa: 'خواندن پروفایل رزومه',
  },
  'profile:event:read': {
    description: 'Read event networking profile',
    description_fa: 'خواندن پروفایل شبکه‌سازی رویداد',
  },
  'profile:write': {
    description: 'Update profile information',
    description_fa: 'به‌روزرسانی اطلاعات پروفایل',
  },

  // Contact Scopes
  'contact:email': {
    description: 'Access email address',
    description_fa: 'دسترسی به آدرس ایمیل',
  },
  'contact:phone': {
    description: 'Access phone number',
    description_fa: 'دسترسی به شماره تلفن',
  },
  'contact:address': {
    description: 'Access physical address',
    description_fa: 'دسترسی به آدرس فیزیکی',
  },

  // Event Scopes
  'event:read': {
    description: 'View events',
    description_fa: 'مشاهده رویدادها',
  },
  'event:register': {
    description: 'Register for events',
    description_fa: 'ثبت‌نام در رویدادها',
  },
  'event:checkin': {
    description: 'Check-in to events',
    description_fa: 'چک‌این در رویدادها',
  },
  'event:create': {
    description: 'Create events',
    description_fa: 'ایجاد رویداد',
  },
  'event:manage': {
    description: 'Manage event attendees',
    description_fa: 'مدیریت شرکت‌کنندگان رویداد',
  },

  // Meeting Scopes
  'meeting:read': {
    description: 'View personal meetings',
    description_fa: 'مشاهده جلسات شخصی',
  },
  'meeting:create': {
    description: 'Create personal meetings',
    description_fa: 'ایجاد جلسات شخصی',
  },
  'meeting:manage': {
    description: 'Manage meeting attendees',
    description_fa: 'مدیریت شرکت‌کنندگان جلسه',
  },

  // Company Scopes
  'company:read': {
    description: 'Read company information',
    description_fa: 'خواندن اطلاعات شرکت',
  },

  // OpenID Connect
  'openid': {
    description: 'OpenID Connect authentication',
    description_fa: 'احراز هویت OpenID Connect',
  },
  'offline_access': {
    description: 'Refresh token access',
    description_fa: 'دسترسی به توکن تازه‌سازی',
  },
} as const;

export type OAuthScopeName = keyof typeof OAUTH_SCOPES;

export function validateScopes(scopes: string[]): OAuthScopeName[] {
  return scopes.filter((scope): scope is OAuthScopeName =>
    scope in OAUTH_SCOPES
  );
}

export function getScopeDescription(scope: OAuthScopeName, lang: 'en' | 'fa' = 'fa'): string {
  const scopeData = OAUTH_SCOPES[scope];
  return lang === 'fa' ? scopeData.description_fa : scopeData.description;
}

export function getScopeDescriptions(scopes: OAuthScopeName[], lang: 'en' | 'fa' = 'fa'): string[] {
  return scopes.map(scope => getScopeDescription(scope, lang));
}

// Default scopes for new applications
export const DEFAULT_SCOPES: OAuthScopeName[] = ['profile:read'];

// Scope groups for UI
export const SCOPE_GROUPS = {
  profile: ['profile:read', 'profile:business_card:read', 'profile:resume:read', 'profile:event:read', 'profile:write'] as OAuthScopeName[],
  contact: ['contact:email', 'contact:phone', 'contact:address'] as OAuthScopeName[],
  event: ['event:read', 'event:register', 'event:checkin', 'event:create', 'event:manage'] as OAuthScopeName[],
  meeting: ['meeting:read', 'meeting:create', 'meeting:manage'] as OAuthScopeName[],
  company: ['company:read'] as OAuthScopeName[],
  openid: ['openid', 'offline_access'] as OAuthScopeName[],
};
