import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User, JWTPayload, AuthResponse, CreateUserInput } from '@/types/user';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bizbuzz-super-secret-jwt-key-change-in-production'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// For development: simple verification code
const DEV_VERIFICATION_CODE = '123456';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export async function generateToken(user: User): Promise<string> {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email ?? undefined,
    mobile: user.mobile ?? undefined,
    role: user.user_role,
  };

  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .setIssuer(process.env.OAUTH_ISSUER || 'bizbuzz')
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: process.env.OAUTH_ISSUER || 'bizbuzz',
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// Check if mobile exists
export async function checkMobileExists(mobile: string): Promise<boolean> {
  const result = await sql`SELECT id FROM users WHERE mobile = ${mobile} LIMIT 1`;
  return result.length > 0;
}

// Check if email exists
export async function checkEmailExists(email: string): Promise<boolean> {
  const result = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  return result.length > 0;
}

// Sign up new user
export async function signUp(input: CreateUserInput): Promise<AuthResponse> {
  try {
    // Check if identifier already exists
    if (input.mobile) {
      const mobileExists = await checkMobileExists(input.mobile);
      if (mobileExists) {
        return { success: false, error: 'این شماره موبایل قبلاً ثبت شده است' };
      }
    }

    if (input.email) {
      const emailExists = await checkEmailExists(input.email);
      if (emailExists) {
        return { success: false, error: 'این ایمیل قبلاً ثبت شده است' };
      }
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const [user] = await sql<User[]>`
      INSERT INTO users (mobile, email, password_hash, first_name, last_name)
      VALUES (${input.mobile || null}, ${input.email || null}, ${passwordHash}, ${input.first_name}, ${input.last_name})
      RETURNING *
    `;

    // Generate token
    const token = await generateToken(user);

    return { success: true, user, token };
  } catch (error) {
    console.error('SignUp error:', error);
    return { success: false, error: 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.' };
  }
}

// Login user
export async function login(identifier: string, code: string): Promise<AuthResponse> {
  try {
    // For development: check if code is 123456
    if (code !== DEV_VERIFICATION_CODE) {
      return { success: false, error: 'کد تأیید نادرست است' };
    }

    // Find user by mobile or email
    const [user] = await sql<User[]>`
      SELECT * FROM users
      WHERE mobile = ${identifier} OR email = ${identifier}
      LIMIT 1
    `;

    if (!user) {
      return { success: false, error: 'کاربری با این مشخصات یافت نشد' };
    }

    if (!user.is_active) {
      return { success: false, error: 'حساب کاربری غیرفعال است' };
    }

    // Update last login
    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    // Generate token
    const token = await generateToken(user);

    return { success: true, user, token };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'خطا در ورود. لطفاً دوباره تلاش کنید.' };
  }
}

// Get user from token
export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const [user] = await sql<User[]>`
    SELECT * FROM users WHERE id = ${payload.userId} LIMIT 1
  `;

  return user || null;
}

// Get current user from cookies
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('bizbuzz_token')?.value;

  if (!token) return null;

  return getUserFromToken(token);
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('bizbuzz_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Clear auth cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('bizbuzz_token');
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const [user] = await sql<User[]>`
    SELECT * FROM users WHERE id = ${userId} LIMIT 1
  `;
  return user || null;
}

// Update user
export async function updateUser(
  userId: string,
  data: Partial<Pick<User, 'first_name' | 'last_name' | 'avatar_url'>>
): Promise<User | null> {
  const [user] = await sql<User[]>`
    UPDATE users
    SET
      first_name = COALESCE(${data.first_name ?? null}, first_name),
      last_name = COALESCE(${data.last_name ?? null}, last_name),
      avatar_url = COALESCE(${data.avatar_url ?? null}, avatar_url),
      updated_at = NOW()
    WHERE id = ${userId}
    RETURNING *
  `;
  return user || null;
}

// Check if user is admin
export function isAdmin(user: User): boolean {
  return user.user_role === 'admin';
}

// Validate mobile number (Iranian format)
export function validateMobile(mobile: string): boolean {
  const iranMobileRegex = /^09[0-9]{9}$/;
  return iranMobileRegex.test(mobile);
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
