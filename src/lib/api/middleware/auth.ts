import { NextRequest } from 'next/server';
import { validateAccessToken } from '@/lib/oauth/token-service';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { OAuthScopeName } from '@/lib/oauth/scopes';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  applicationId?: string;
  scopes?: OAuthScopeName[];
  authType?: 'oauth' | 'api_key' | 'session';
  error?: string;
}

// Authenticate request using OAuth token or API key
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Try OAuth Bearer token first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const result = await validateAccessToken(token);

    if (result.valid) {
      return {
        authenticated: true,
        userId: result.userId,
        applicationId: result.applicationId,
        scopes: result.scopes,
        authType: 'oauth',
      };
    }
  }

  // Try API Key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const result = await validateAPIKey(apiKey, request);
    if (result.authenticated) {
      return result;
    }
  }

  return {
    authenticated: false,
    error: 'Authentication required',
  };
}

// Validate API Key
async function validateAPIKey(key: string, request: NextRequest): Promise<AuthResult> {
  const prefix = key.slice(0, 12);

  const keys = await sql`
    SELECT * FROM api_keys
    WHERE key_prefix = ${prefix}
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  `;

  for (const apiKey of keys) {
    const valid = await bcrypt.compare(key, apiKey.key_hash);
    if (valid) {
      // Check IP whitelist
      if (apiKey.allowed_ips && apiKey.allowed_ips.length > 0) {
        const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          'unknown';

        if (!apiKey.allowed_ips.includes(clientIP)) {
          return {
            authenticated: false,
            error: 'IP address not allowed',
          };
        }
      }

      // Check origin
      if (apiKey.allowed_origins && apiKey.allowed_origins.length > 0) {
        const origin = request.headers.get('origin');
        if (origin && !apiKey.allowed_origins.includes(origin)) {
          return {
            authenticated: false,
            error: 'Origin not allowed',
          };
        }
      }

      // Update last used
      await sql`
        UPDATE api_keys
        SET last_used_at = NOW()
        WHERE id = ${apiKey.id}
      `;

      return {
        authenticated: true,
        userId: apiKey.user_id,
        applicationId: apiKey.application_id,
        scopes: apiKey.scopes as OAuthScopeName[],
        authType: 'api_key',
      };
    }
  }

  return {
    authenticated: false,
    error: 'Invalid API key',
  };
}

// Check if authenticated user has required scopes
export function hasScope(auth: AuthResult, requiredScope: OAuthScopeName): boolean {
  if (!auth.authenticated || !auth.scopes) {
    return false;
  }
  return auth.scopes.includes(requiredScope);
}

// Check if authenticated user has any of required scopes
export function hasAnyScope(auth: AuthResult, requiredScopes: OAuthScopeName[]): boolean {
  if (!auth.authenticated || !auth.scopes) {
    return false;
  }
  return requiredScopes.some(scope => auth.scopes!.includes(scope));
}

// Check if authenticated user has all required scopes
export function hasAllScopes(auth: AuthResult, requiredScopes: OAuthScopeName[]): boolean {
  if (!auth.authenticated || !auth.scopes) {
    return false;
  }
  return requiredScopes.every(scope => auth.scopes!.includes(scope));
}

// Middleware helper to create authenticated handler
export function withAuth(
  handler: (request: NextRequest, auth: AuthResult) => Promise<Response>,
  options?: {
    requiredScopes?: OAuthScopeName[];
    anyScope?: boolean;
  }
) {
  return async (request: NextRequest): Promise<Response> => {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'unauthorized', message: auth.error },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer',
          },
        }
      );
    }

    // Check required scopes
    if (options?.requiredScopes && options.requiredScopes.length > 0) {
      const hasRequiredScopes = options.anyScope
        ? hasAnyScope(auth, options.requiredScopes)
        : hasAllScopes(auth, options.requiredScopes);

      if (!hasRequiredScopes) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'insufficient_scope',
              message: `Required scopes: ${options.requiredScopes.join(', ')}`,
            },
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': `Bearer scope="${options.requiredScopes.join(' ')}"`,
            },
          }
        );
      }
    }

    return handler(request, auth);
  };
}
