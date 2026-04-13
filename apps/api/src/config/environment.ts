import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file only if not in production
// This prevents local .env from overriding production environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),

  // JWT
  // IMPORTANT: Keep these in sync with frontend/src/utils/persistent-auth.ts
  // ACCESS TOKEN: Short-lived, refreshed silently in the background every ~10 min.
  // REFRESH TOKEN: Long-lived. This defines the true "stay logged in" duration.
  //   Frontend SESSION_DURATION and ACTIVITY_TIMEOUT must be <= JWT_REFRESH_EXPIRES_IN.
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),          // Access token: 15 minutes
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),  // Refresh token: 30 days (frontend SESSION_DURATION=30d)

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  GOOGLE_REDIRECT_URI: z.string().url('Invalid Google Redirect URI'),

  // Supabase
  SUPABASE_URL: z.string().min(1, 'Supabase URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase Service Role Key is required'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key is required'),

  // App Configuration
  FRONTEND_URL: z.string().url('Invalid Frontend URL').default('http://localhost:5173').transform(url => url.replace(/\/$/, '')),
  ALLOWED_ORIGINS: z.string().optional(),
  ADMIN_EMAIL: z.string().email('Invalid admin email').optional(),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

// Validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  parseResult.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const config = parseResult.data;

// OAuth Configuration Validation and Logging
export function validateOAuthConfig() {
  console.log('🔐 OAuth Configuration:');
  console.log(`  Client ID: ${config.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
  console.log(`  Redirect URI: ${config.GOOGLE_REDIRECT_URI}`);
  console.log(`  Frontend URL: ${config.FRONTEND_URL}`);

  // Validate redirect URI format
  try {
    new URL(config.GOOGLE_REDIRECT_URI);
  } catch (error) {
    console.error('❌ Invalid GOOGLE_REDIRECT_URI format');
    process.exit(1);
  }

  // Check if redirect URI matches expected pattern
  const expectedRedirectUri = `${config.FRONTEND_URL}/auth/callback`;
  if (config.GOOGLE_REDIRECT_URI !== expectedRedirectUri) {
    console.warn(`⚠️  Redirect URI mismatch:`);
    console.warn(`  Configured: ${config.GOOGLE_REDIRECT_URI}`);
    console.warn(`  Expected:   ${expectedRedirectUri}`);
  }

  console.log('✅ OAuth configuration validated');
}

// Export individual configs for convenience
export const {
  NODE_ENV,
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  FRONTEND_URL,
  ALLOWED_ORIGINS,
  ADMIN_EMAIL,
  BCRYPT_ROUNDS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
} = config;