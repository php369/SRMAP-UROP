import { config } from '../config/environment';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloudinary';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock external services
jest.mock('../services/googleAuth', () => ({
  verifyGoogleIdToken: jest.fn(),
  verifyDomainRestriction: jest.fn(),
  generateAuthUrl: jest.fn(),
  exchangeCodeForTokens: jest.fn(),
  exchangeCodeForCalendarTokens: jest.fn(),
}));

jest.mock('../services/googleCalendar', () => ({
  createCalendarEvent: jest.fn(),
  updateCalendarEvent: jest.fn(),
  deleteCalendarEvent: jest.fn(),
}));

jest.mock('../services/cloudinaryService', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  generateSignedUploadUrl: jest.fn(),
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