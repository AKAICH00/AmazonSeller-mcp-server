import crypto from 'crypto';

// In-memory token storage (use Redis/DB in production)
const tokens = new Map();
const authCodes = new Map();

// OAuth Configuration
const OAUTH_CONFIG = {
  clientId: process.env.OAUTH_CLIENT_ID || 'amazon-mcp-server',
  clientSecret: process.env.OAUTH_CLIENT_SECRET || crypto.randomBytes(32).toString('hex'),
  redirectUri: process.env.OAUTH_REDIRECT_URI || 'https://chat.openai.com/aip/g-<GPT-ID>/oauth/callback',
  scope: 'amazon-sp-api',
};

/**
 * Generate authorization code
 */
export function generateAuthCode() {
  const code = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

  authCodes.set(code, {
    expiresAt,
    used: false
  });

  return code;
}

/**
 * Validate authorization code
 */
export function validateAuthCode(code) {
  const authCode = authCodes.get(code);

  if (!authCode) {
    return { valid: false, error: 'Invalid authorization code' };
  }

  if (authCode.used) {
    return { valid: false, error: 'Authorization code already used' };
  }

  if (Date.now() > authCode.expiresAt) {
    authCodes.delete(code);
    return { valid: false, error: 'Authorization code expired' };
  }

  // Mark as used
  authCode.used = true;

  return { valid: true };
}

/**
 * Generate access token
 */
export function generateAccessToken() {
  const accessToken = `mcp_${crypto.randomBytes(32).toString('hex')}`;
  const refreshToken = `mcpr_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

  tokens.set(accessToken, {
    refreshToken,
    expiresAt,
    scope: OAUTH_CONFIG.scope
  });

  tokens.set(refreshToken, {
    accessToken,
    type: 'refresh'
  });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: OAUTH_CONFIG.scope
  };
}

/**
 * Validate access token
 */
export function validateAccessToken(token) {
  const tokenData = tokens.get(token);

  if (!tokenData || tokenData.type === 'refresh') {
    return { valid: false, error: 'Invalid access token' };
  }

  if (Date.now() > tokenData.expiresAt) {
    tokens.delete(token);
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true, scope: tokenData.scope };
}

/**
 * Refresh access token
 */
export function refreshAccessToken(refreshToken) {
  const tokenData = tokens.get(refreshToken);

  if (!tokenData || tokenData.type !== 'refresh') {
    return { success: false, error: 'Invalid refresh token' };
  }

  // Revoke old tokens
  tokens.delete(tokenData.accessToken);
  tokens.delete(refreshToken);

  // Generate new tokens
  return { success: true, tokens: generateAccessToken() };
}

/**
 * Revoke token
 */
export function revokeToken(token) {
  const tokenData = tokens.get(token);

  if (tokenData) {
    // If access token, revoke refresh token too
    if (tokenData.refreshToken) {
      tokens.delete(tokenData.refreshToken);
    }
    // If refresh token, revoke access token too
    if (tokenData.accessToken) {
      tokens.delete(tokenData.accessToken);
    }
    tokens.delete(token);
  }

  return true;
}

export { OAUTH_CONFIG };
