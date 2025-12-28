export interface User {
  id: string;
  mobile: string | null;
  email: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  user_role: 'user' | 'admin';
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface CreateUserInput {
  mobile?: string;
  email?: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginInput {
  identifier: string; // mobile or email
  code: string; // verification code (123456 for dev)
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  email?: string;
  mobile?: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}
