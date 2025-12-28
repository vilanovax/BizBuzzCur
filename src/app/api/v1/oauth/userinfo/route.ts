import { NextRequest, NextResponse } from 'next/server';
import { validateAccessToken } from '@/lib/oauth/token-service';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Bearer token required' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
      );
    }

    const token = authHeader.slice(7);
    const validation = await validateAccessToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: validation.error },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' } }
      );
    }

    // Check for openid scope
    if (!validation.scopes?.includes('openid')) {
      return NextResponse.json(
        { error: 'insufficient_scope', error_description: 'openid scope required' },
        { status: 403, headers: { 'WWW-Authenticate': 'Bearer error="insufficient_scope"' } }
      );
    }

    // Get user info
    const userId = validation.userId!;
    const [user] = await sql`
      SELECT id, first_name, last_name, email, mobile, avatar_url, is_verified, created_at
      FROM users WHERE id = ${userId}
    `;

    if (!user) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'User not found' },
        { status: 401 }
      );
    }

    // Build userinfo response based on scopes
    const userInfo: Record<string, unknown> = {
      sub: user.id,
    };

    // Basic profile info (always included with openid)
    userInfo.name = `${user.first_name} ${user.last_name}`;
    userInfo.given_name = user.first_name;
    userInfo.family_name = user.last_name;

    if (user.avatar_url) {
      userInfo.picture = user.avatar_url;
    }

    // Email scope
    if (validation.scopes.includes('contact:email') && user.email) {
      userInfo.email = user.email;
      userInfo.email_verified = user.is_verified;
    }

    // Phone scope
    if (validation.scopes.includes('contact:phone') && user.mobile) {
      userInfo.phone_number = user.mobile;
      userInfo.phone_number_verified = user.is_verified;
    }

    // Updated at
    userInfo.updated_at = Math.floor(new Date(user.created_at).getTime() / 1000);

    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('Userinfo error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Some clients use POST for userinfo
  return GET(request);
}
