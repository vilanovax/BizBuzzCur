import { NextRequest, NextResponse } from 'next/server';
import { revokeToken } from '@/lib/oauth/token-service';

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

    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'token is required' },
        { status: 400 }
      );
    }

    await revokeToken(token);

    // RFC 7009: Always return 200, even if token was already revoked
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Token revocation error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
