import { NextRequest, NextResponse } from 'next/server';
import { exchangeAuthorizationCode, refreshAccessToken } from '@/lib/oauth/token-service';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let body: Record<string, string>;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else {
      body = await request.json();
    }

    const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier, refresh_token } = body;

    if (!grant_type) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'grant_type is required' },
        { status: 400 }
      );
    }

    if (!client_id) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'client_id is required' },
        { status: 400 }
      );
    }

    // Authorization Code Grant
    if (grant_type === 'authorization_code') {
      if (!code) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'code is required' },
          { status: 400 }
        );
      }

      if (!redirect_uri) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'redirect_uri is required' },
          { status: 400 }
        );
      }

      const result = await exchangeAuthorizationCode({
        code,
        clientId: client_id,
        clientSecret: client_secret,
        codeVerifier: code_verifier,
        redirectUri: redirect_uri,
      });

      if ('error' in result) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result);
    }

    // Refresh Token Grant
    if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'refresh_token is required' },
          { status: 400 }
        );
      }

      const result = await refreshAccessToken({
        refreshToken: refresh_token,
        clientId: client_id,
        clientSecret: client_secret,
      });

      if ('error' in result) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Unsupported grant type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('OAuth token error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
