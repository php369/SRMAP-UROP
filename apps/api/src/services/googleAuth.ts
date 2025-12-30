import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Initialize Google OAuth2 client
const oauth2Client = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

export interface GoogleTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  hd?: string; // Hosted domain for G Suite accounts
  exp: number;
  iat: number;
}

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  hostedDomain?: string;
}

/**
 * Verify Google ID token and extract user information
 * @param idToken - Google ID token from client
 * @returns Verified user information
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  try {
    // Verify the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload() as GoogleTokenPayload;
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    // Verify token properties
    if (payload.aud !== config.GOOGLE_CLIENT_ID) {
      throw new Error('Invalid audience');
    }

    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
      throw new Error('Invalid issuer');
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }

    // Verify email is verified
    if (!payload.email_verified) {
      throw new Error('Email not verified');
    }

    // Extract user information
    const user: VerifiedGoogleUser = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
      emailVerified: payload.email_verified,
      hostedDomain: payload.hd,
    };

    logger.info(`Google token verified for user: ${user.email}`);
    return user;

  } catch (error) {
    logger.error('Google token verification failed:', error);
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify that user email belongs to SRM domain
 * @param email - User email address
 * @param hostedDomain - Google hosted domain (if available)
 * @returns true if domain is valid
 */
export function verifyDomainRestriction(email: string, hostedDomain?: string): boolean {
  const requiredDomain = 'srmap.edu.in';
  
  // Check hosted domain first (more reliable for G Suite accounts)
  if (hostedDomain) {
    return hostedDomain === requiredDomain;
  }
  
  // Fallback to email domain check
  return email.endsWith(`@${requiredDomain}`);
}

/**
 * Generate Google OAuth authorization URL
 * @param state - Optional state parameter for CSRF protection
 * @returns Authorization URL
 */
export function generateAuthUrl(state?: string): string {
  const scopes = [
    'openid',
    'email',
    'profile'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    state: state,
    prompt: 'consent', // Force consent to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 * @param code - Authorization code from Google
 * @returns Token information
 */
export async function exchangeCodeForTokens(code: string) {
  try {
    logger.info(`Attempting token exchange with code: ${code.substring(0, 20)}...`);
    logger.info(`OAuth2 Client Config - Client ID: ${config.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
    logger.info(`OAuth2 Client Config - Redirect URI: ${config.GOOGLE_REDIRECT_URI}`);
    
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.id_token) {
      throw new Error('No ID token received');
    }

    logger.info('Token exchange successful');
    return {
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    };

  } catch (error: any) {
    logger.error('Token exchange failed:', {
      error: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
      config: {
        clientId: config.GOOGLE_CLIENT_ID.substring(0, 20) + '...',
        redirectUri: config.GOOGLE_REDIRECT_URI,
      }
    });
    
    // Provide specific error messages based on error type
    if (error.message?.includes('invalid_grant')) {
      if (error.response?.data?.error_description?.includes('Bad Request')) {
        throw new Error('OAuth configuration mismatch: The redirect URI used to obtain the authorization code does not match the redirect URI configured in Google Cloud Console. Please verify your OAuth settings.');
      } else if (error.response?.data?.error_description?.includes('Malformed auth code')) {
        throw new Error('Authorization code is malformed or has already been used. Please try logging in again.');
      } else {
        throw new Error('Authorization code is invalid or expired. Please try logging in again.');
      }
    } else if (error.message?.includes('invalid_client')) {
      throw new Error('OAuth client configuration error: Invalid client ID or secret. Please check your Google Cloud Console settings.');
    }
    
    throw new Error(`Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export { oauth2Client };