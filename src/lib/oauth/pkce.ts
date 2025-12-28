import crypto from 'crypto';

// Generate code verifier (43-128 characters)
export function generateCodeVerifier(): string {
  const buffer = crypto.randomBytes(32);
  return base64URLEncode(buffer);
}

// Generate code challenge from verifier (S256 method)
export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64URLEncode(hash);
}

// Verify PKCE challenge
export function verifyPKCE(
  challenge: string,
  verifier: string,
  method: 'S256' | 'plain' = 'S256'
): boolean {
  if (method === 'plain') {
    return challenge === verifier;
  }

  // S256 method
  const expectedChallenge = generateCodeChallenge(verifier);
  return challenge === expectedChallenge;
}

// Base64 URL encode (RFC 4648)
function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Validate code verifier format
export function isValidCodeVerifier(verifier: string): boolean {
  // Must be 43-128 characters, alphanumeric + "-._~"
  if (verifier.length < 43 || verifier.length > 128) {
    return false;
  }

  const validChars = /^[A-Za-z0-9\-._~]+$/;
  return validChars.test(verifier);
}

// Validate code challenge format
export function isValidCodeChallenge(challenge: string): boolean {
  // Base64 URL encoded string, 43 characters for SHA256
  if (challenge.length < 43 || challenge.length > 128) {
    return false;
  }

  const validChars = /^[A-Za-z0-9\-_]+$/;
  return validChars.test(challenge);
}
