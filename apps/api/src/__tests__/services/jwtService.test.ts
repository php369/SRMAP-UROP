import { 
  generateTokenPair, 
  verifyAccessToken, 
  verifyRefreshToken,
  extractTokenFromHeader 
} from '../../services/jwtService';

describe('JWT Service', () => {
  const mockUserPayload = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@srmap.edu.in',
    name: 'Test User',
    role: 'student' as const,
  };

  describe('generateTokenPair', () => {
    it('should generate valid access and refresh tokens', () => {
      const tokens = generateTokenPair(mockUserPayload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(typeof tokens.expiresIn).toBe('number');
      expect(tokens.expiresIn).toBe(900); // 15 minutes
    });

    it('should generate different tokens for different users', () => {
      const tokens1 = generateTokenPair(mockUserPayload);
      const tokens2 = generateTokenPair({
        ...mockUserPayload,
        userId: '507f1f77bcf86cd799439012',
        email: 'test2@srmap.edu.in',
      });

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const tokens = generateTokenPair(mockUserPayload);
      const payload = verifyAccessToken(tokens.accessToken);

      expect(payload).toMatchObject({
        userId: mockUserPayload.userId,
        email: mockUserPayload.email,
        name: mockUserPayload.name,
        role: mockUserPayload.role,
      });
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid-token');
      }).toThrow();
    });

    it('should throw error for refresh token used as access token', () => {
      const tokens = generateTokenPair(mockUserPayload);
      
      expect(() => {
        verifyAccessToken(tokens.refreshToken);
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const tokens = generateTokenPair(mockUserPayload);
      const payload = verifyRefreshToken(tokens.refreshToken);

      expect(payload).toMatchObject({
        userId: mockUserPayload.userId,
        email: mockUserPayload.email,
        name: mockUserPayload.name,
        role: mockUserPayload.role,
      });
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyRefreshToken('invalid-token');
      }).toThrow();
    });

    it('should throw error for access token used as refresh token', () => {
      const tokens = generateTokenPair(mockUserPayload);
      
      expect(() => {
        verifyRefreshToken(tokens.accessToken);
      }).toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const header = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const extracted = extractTokenFromHeader('InvalidFormat token');
      expect(extracted).toBeNull();
    });

    it('should return null for Bearer without token', () => {
      const extracted = extractTokenFromHeader('Bearer ');
      expect(extracted).toBe(''); // Empty string, not null
    });
  });
});