import * as jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'coordinator' | 'admin';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate JWT access token
 * @param payload - User information to encode
 * @returns JWT access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  try {
    const options: jwt.SignOptions = {
      expiresIn: config.JWT_EXPIRES_IN as any,
      issuer: 'srm-portal-api',
      audience: 'srm-portal-web',
    };
    
    const token = jwt.sign(payload, config.JWT_SECRET, options);

    logger.debug(`Access token generated for user: ${payload.email}`);
    return token;

  } catch (error) {
    logger.error('Access token generation failed:', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate JWT refresh token
 * @param payload - User information to encode
 * @returns JWT refresh token
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  try {
    const options: jwt.SignOptions = {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
      issuer: 'srm-portal-api',
      audience: 'srm-portal-web',
    };
    
    const token = jwt.sign(payload, config.JWT_REFRESH_SECRET, options);

    logger.debug(`Refresh token generated for user: ${payload.email}`);
    return token;

  } catch (error) {
    logger.error('Refresh token generation failed:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Generate both access and refresh tokens
 * @param payload - User information to encode
 * @returns Token pair with expiration info
 */
export function generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  // Calculate expiration time in seconds
  const expiresIn = getTokenExpirationTime(config.JWT_EXPIRES_IN);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify JWT access token
 * @param token - JWT token to verify
 * @returns Decoded payload
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'srm-portal-api',
      audience: 'srm-portal-web',
    }) as JwtPayload;

    return payload;

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      logger.error('Access token verification failed:', error);
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Verify JWT refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded payload
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: 'srm-portal-api',
      audience: 'srm-portal-web',
    }) as JwtPayload;

    return payload;

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Refresh token verification failed:', error);
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns JWT token or null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Convert time string to seconds
 * @param timeString - Time string like '15m', '1h', '7d'
 * @returns Time in seconds
 */
function getTokenExpirationTime(timeString: string): number {
  const units: { [key: string]: number } = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid time format');
  }

  const [, value, unit] = match;
  return parseInt(value, 10) * units[unit];
}

/**
 * Check if token is about to expire (within 5 minutes)
 * @param payload - JWT payload with exp claim
 * @returns true if token expires soon
 */
export function isTokenExpiringSoon(payload: JwtPayload): boolean {
  if (!payload.exp) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;
  
  return payload.exp - now < fiveMinutes;
}