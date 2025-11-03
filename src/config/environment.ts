import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Google OAuth & Calendar
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  GOOGLE_REDIRECT_URI: z.string().url('Invalid Google Redirect URI'),
  GOOGLE_CALENDAR_API_KEY: z.string().optional(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary Cloud Name is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API Key is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API Secret is required'),
  
  // App Configuration
  FRONTEND_URL: z.string().url('Invalid Frontend URL').default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().optional(),
  
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
  GOOGLE_CALENDAR_API_KEY,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  FRONTEND_URL,
  ALLOWED_ORIGINS,
  BCRYPT_ROUNDS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
} = config;