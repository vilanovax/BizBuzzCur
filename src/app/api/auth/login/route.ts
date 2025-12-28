import { NextRequest, NextResponse } from 'next/server';
import { login, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, code } = body;

    if (!identifier || !code) {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل/ایمیل و کد تأیید الزامی است' },
        { status: 400 }
      );
    }

    const result = await login(identifier, code);

    if (result.success && result.token) {
      await setAuthCookie(result.token);

      return NextResponse.json({
        success: true,
        user: result.user,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
