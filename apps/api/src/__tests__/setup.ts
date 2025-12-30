import { config } from '../config/environment';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock external services
jest.mock('../services/googleAuth', () => ({
  verifyGoogleIdToken: jest.fn(),
  verifyDomainRestriction: jest.fn(),
  generateAuthUrl: jest.fn(),
  exchangeCodeForTokens: jest.fn(),
}));

jest.mock('../services/storageService', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  fileExists: jest.fn(),
}));

// Mock Winston logger to avoid console spam during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_URI__: string;
      __MONGO_DB_NAME__: string;
    }
  }
}

export {};