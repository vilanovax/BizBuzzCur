import { NextRequest, NextResponse } from 'next/server';
import { introspectToken } from '@/lib/oauth/token-service';

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

    const result = await introspectToken(token);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Token introspection error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
