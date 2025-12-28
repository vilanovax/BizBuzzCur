import { NextResponse } from 'next/server';
import { OAUTH_SCOPES } from '@/lib/oauth/scopes';

export async function GET() {
  const issuer = process.env.OAUTH_ISSUER || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const config = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/api/v1/oauth/token`,
    userinfo_endpoint: `${issuer}/api/v1/oauth/userinfo`,
    revocation_endpoint: `${issuer}/api/v1/oauth/revoke`,
    introspection_endpoint: `${issuer}/api/v1/oauth/introspect`,
    jwks_uri: `${issuer}/api/v1/oauth/jwks`,

    // Supported features
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: Object.keys(OAUTH_SCOPES),
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    code_challenge_methods_supported: ['S256', 'plain'],
    claims_supported: [
      'sub',
      'name',
      'given_name',
      'family_name',
      'email',
      'email_verified',
      'phone_number',
      'phone_number_verified',
      'picture',
      'updated_at',
    ],

    // UI pages
    service_documentation: `${issuer}/developers/docs`,
    ui_locales_supported: ['fa', 'en'],

    // BizBuzz specific
    profile_contexts_supported: ['business_card', 'resume', 'event'],
  };

  return NextResponse.json(config, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
