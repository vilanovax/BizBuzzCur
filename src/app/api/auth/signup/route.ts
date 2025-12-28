import { NextRequest, NextResponse } from 'next/server';
import { signUp, setAuthCookie, validateMobile, validateEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile, email, password, first_name, last_name } = body;

    // Validation
    if (!first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'نام و نام خانوادگی الزامی است' },
        { status: 400 }
      );
    }

    if (!mobile && !email) {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل یا ایمیل الزامی است' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      );
    }

    if (mobile && !validateMobile(mobile)) {
      return NextResponse.json(
        { success: false, error: 'فرمت شماره موبایل نادرست است (مثال: 09123456789)' },
        { status: 400 }
      );
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'فرمت ایمیل نادرست است' },
        { status: 400 }
      );
    }

    const result = await signUp({
      mobile,
      email,
      password,
      first_name,
      last_name,
    });

    if (result.success && result.token) {
      await setAuthCookie(result.token);

      return NextResponse.json({
        success: true,
        user: result.user,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
