import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from '../../config/database';
import { User } from '../../models/User';
import authRoutes from '../../routes/auth';
import { generateTokenPair } from '../../services/jwtService';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';
import { afterEach } from 'node:test';

// Mock external services
const mockGoogleAuth = require('../../services/googleAuth');

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(async () => {
    await connectDatabase();
    
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /auth/google/url', () => {
    it('should generate Google OAuth URL', async () => {
      const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?test=true';
      mockGoogleAuth.generateAuthUrl.mockReturnValue(mockAuthUrl);

      const response = await request(app)
        .get('/auth/google/url')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          authUrl: mockAuthUrl,
          message: 'Use this URL to authenticate with Google',
        },
      });

      expect(mockGoogleAuth.generateAuthUrl).toHaveBeenCalledWith(undefined);
    });

    it('should generate Google OAuth URL with state parameter', async () => {
      const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?test=true';
      const state = 'test-state';
      mockGoogleAuth.generateAuthUrl.mockReturnValue(mockAuthUrl);

      const response = await request(app)
        .get('/auth/google/url')
        .query({ state })
        .expect(200);

      expect(mockGoogleAuth.generateAuthUrl).toHaveBeenCalledWith(state);
    });

    it('should handle auth URL generation failure', async () => {
      mockGoogleAuth.generateAuthUrl.mockImplementation(() => {
        throw new Error('Auth URL generation failed');
      });

      const response = await request(app)
        .get('/auth/google/url')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'AUTH_URL_GENERATION_FAILED',
          message: 'Failed to generate authentication URL',
        },
      });
    });
  });

  describe('POST /auth/google', () => {
    const mockGoogleUser = {
      googleId: '123456789',
      name: 'Test User',
      email: 'test@srmap.edu.in',
      avatarUrl: 'https://example.com/avatar.jpg',
      hostedDomain: 'srmap.edu.in',
    };

    const mockTokens = {
      idToken: 'mock-id-token',
      accessToken: 'mock-access-token',
    };

    beforeEach(() => {
      mockGoogleAuth.exchangeCodeForTokens.mockResolvedValue(mockTokens);
      mockGoogleAuth.verifyGoogleIdToken.mockResolvedValue(mockGoogleUser);
      mockGoogleAuth.verifyDomainRestriction.mockReturnValue(true);
    });

    it('should authenticate new user successfully', async () => {
      const response = await request(app)
        .post('/auth/google')
        .send({ code: 'valid-auth-code' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.user).toMatchObject({
        name: mockGoogleUser.name,
        email: mockGoogleUser.email,
        role: 'student',
      });

      // Verify user was created in database
      const user = await User.findOne({ googleId: mockGoogleUser.googleId });
      expect(user).toBeTruthy();
      expect(user!.email).toBe(mockGoogleUser.email);
    });

    it('should authenticate existing user successfully', async () => {
      // Create existing user
      const existingUser = new User({
        googleId: mockGoogleUser.googleId,
        name: 'Old Name',
        email: mockGoogleUser.email,
        role: 'faculty',
      });
      await existingUser.save();

      const response = await request(app)
        .post('/auth/google')
        .send({ code: 'valid-auth-code' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('faculty'); // Should keep existing role
      expect(response.body.data.user.name).toBe(mockGoogleUser.name); // Should update name

      // Verify user was updated
      const user = await User.findOne({ googleId: mockGoogleUser.googleId });
      expect(user!.name).toBe(mockGoogleUser.name);
    });

    it('should reject invalid request data', async () => {
      const response = await request(app)
        .post('/auth/google')
        .send({}) // Missing code
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: expect.any(Array),
        },
      });
    });

    it('should reject non-srmap.edu.in domain', async () => {
      mockGoogleAuth.verifyDomainRestriction.mockReturnValue(false);

      const response = await request(app)
        .post('/auth/google')
        .send({ code: 'valid-auth-code' })
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'DOMAIN_RESTRICTION_FAILED',
          message: 'Access restricted to @srmap.edu.in email addresses only',
          details: {
            email: mockGoogleUser.email,
            requiredDomain: 'srmap.edu.in',
          },
        },
      });
    });

    it('should handle invalid Google token', async () => {
      mockGoogleAuth.verifyGoogleIdToken.mockRejectedValue(
        new Error('Token verification failed')
      );

      const response = await request(app)
        .post('/auth/google')
        .send({ code: 'invalid-auth-code' })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired Google token',
        },
      });
    });

    it('should handle unverified email', async () => {
      mockGoogleAuth.verifyGoogleIdToken.mockRejectedValue(
        new Error('Email not verified')
      );

      const response = await request(app)
        .post('/auth/google')
        .send({ code: 'valid-auth-code' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Google account email must be verified',
        },
      });
    });
  });

  describe('GET /auth/me', () => {
    let testUser: any;
    let validToken: string;

    beforeEach(async () => {
      testUser = new User({
        googleId: '123456789',
        name: 'Test User',
        email: 'test@srmap.edu.in',
        role: 'student',
      });
      await testUser.save();

      const tokens = generateTokenPair({
        userId: testUser._id.toString(),
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });
      validToken = tokens.accessToken;
    });

    it('should return user information with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: testUser._id.toString(),
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
      });
      expect(response.body.data.permissions).toEqual([
        'assessments:read',
        'submissions:create',
        'submissions:read:own',
        'grades:read:own',
      ]);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authorization token required',
        },
      });
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
        },
      });
    });
  });

  describe('POST /auth/refresh', () => {
    let testUser: any;
    let validRefreshToken: string;

    beforeEach(async () => {
      testUser = new User({
        googleId: '123456789',
        name: 'Test User',
        email: 'test@srmap.edu.in',
        role: 'student',
      });
      await testUser.save();

      const tokens = generateTokenPair({
        userId: testUser._id.toString(),
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });
      validRefreshToken = tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.expiresIn).toBe(900);
    });

    it('should reject invalid request data', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({}) // Missing refreshToken
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: expect.any(Array),
        },
      });
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        },
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    });
  });
});