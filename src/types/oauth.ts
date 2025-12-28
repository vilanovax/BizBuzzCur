// OAuth Scopes
export const OAUTH_SCOPES = {
  'profile:read': 'Read basic profile information',
  'profile:business_card:read': 'Read business card profile',
  'profile:resume:read': 'Read resume profile',
  'profile:event:read': 'Read event networking profile',
  'profile:write': 'Update profile information',

  'contact:email': 'Access email address',
  'contact:phone': 'Access phone number',
  'contact:address': 'Access physical address',

  'event:read': 'View events',
  'event:register': 'Register for events',
  'event:checkin': 'Check-in to events',
  'event:create': 'Create events',
  'event:manage': 'Manage event attendees',

  'meeting:read': 'View personal meetings',
  'meeting:create': 'Create personal meetings',
  'meeting:manage': 'Manage meeting attendees',

  'company:read': 'Read company information',

  'openid': 'OpenID Connect authentication',
  'offline_access': 'Refresh token access',
} as const;

export type OAuthScope = keyof typeof OAUTH_SCOPES;

export interface OAuthApplication {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  homepage_url: string | null;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;
  client_id: string;
  client_secret_prefix: string;
  redirect_uris: string[];
  allowed_scopes: OAuthScope[];
  grant_types: string[];
  token_endpoint_auth_method: string;
  owner_user_id: string;
  requires_pkce: boolean;
  access_token_ttl: number;
  refresh_token_ttl: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OAuthAuthorizationCode {
  id: string;
  code: string;
  application_id: string;
  user_id: string;
  redirect_uri: string;
  scope: OAuthScope[];
  code_challenge: string | null;
  code_challenge_method: string;
  state: string | null;
  nonce: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface OAuthAccessToken {
  id: string;
  token_hash: string;
  token_prefix: string;
  application_id: string;
  user_id: string;
  authorization_code_id: string | null;
  scope: OAuthScope[];
  token_type: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface OAuthRefreshToken {
  id: string;
  token_hash: string;
  token_prefix: string;
  application_id: string;
  user_id: string;
  access_token_id: string | null;
  scope: OAuthScope[];
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface OAuthUserConsent {
  id: string;
  user_id: string;
  application_id: string;
  granted_scopes: OAuthScope[];
  granted_at: string;
  updated_at: string;
  revoked_at: string | null;
}

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  environment: 'live' | 'test';
  scopes: OAuthScope[];
  allowed_origins: string[] | null;
  allowed_ips: string[] | null;
  application_id: string | null;
  user_id: string;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

// OAuth Request/Response Types
export interface AuthorizeRequest {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256' | 'plain';
  nonce?: string;
}

export interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret?: string;
  code_verifier?: string;
  refresh_token?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

export interface TokenErrorResponse {
  error: string;
  error_description?: string;
}

export interface TokenIntrospectionResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  aud?: string;
  iss?: string;
}

export interface UserInfoResponse {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
}

export interface CreateApplicationInput {
  name: string;
  description?: string;
  homepage_url?: string;
  redirect_uris: string[];
  allowed_scopes?: OAuthScope[];
}

export interface CreateAPIKeyInput {
  name: string;
  environment: 'live' | 'test';
  scopes: OAuthScope[];
  application_id?: string;
  allowed_origins?: string[];
  expires_in_days?: number;
}
