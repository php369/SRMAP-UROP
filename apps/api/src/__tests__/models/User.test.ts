import mongoose from 'mongoose';
import { User, IUser } from '../../models/User';
import { connectDatabase } from '../../config/database';
import { afterEach } from 'node:test';

describe('User Model', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const validUserData = {
    googleId: '123456789',
    name: 'Test User',
    email: 'test@srmap.edu.in',
    role: 'student' as const,
    profile: {
      department: 'Computer Science',
      year: 3,
      skills: ['JavaScript', 'React'],
      bio: 'Test bio',
    },
    preferences: {
      theme: 'light' as const,
      notifications: true,
    },
  };

  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.googleId).toBe(validUserData.googleId);
      expect(savedUser.name).toBe(validUserData.name);
      expect(savedUser.email).toBe(validUserData.email);
      expect(savedUser.role).toBe(validUserData.role);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should create user with default preferences', async () => {
      const userData = { ...validUserData };
      delete userData.preferences;

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.preferences.theme).toBe('light');
      expect(savedUser.preferences.notifications).toBe(true);
    });

    it('should create user with empty profile by default', async () => {
      const userData = { ...validUserData };
      delete userData.profile;

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.profile).toBeDefined();
      expect(savedUser.profile.department).toBeUndefined();
      expect(savedUser.profile.year).toBeUndefined();
      expect(savedUser.profile.skills).toEqual([]);
      expect(savedUser.profile.bio).toBeUndefined();
    });
  });

  describe('User Validation', () => {
    it('should require googleId', async () => {
      const userData = { ...validUserData };
      delete userData.googleId;

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/googleId.*required/);
    });

    it('should require name', async () => {
      const userData = { ...validUserData };
      delete userData.name;

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/name.*required/);
    });

    it('should require email', async () => {
      const userData = { ...validUserData };
      delete userData.email;

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/email.*required/);
    });

    it('should validate email format', async () => {
      const userData = { ...validUserData, email: 'invalid-email' };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/Email must be from @srmap.edu.in domain/);
    });

    it('should use default role when not specified', async () => {
      const userData = { ...validUserData };
      delete userData.role;

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.role).toBe('student'); // Default role
    });

    it('should validate role enum', async () => {
      const userData = { ...validUserData, role: 'invalid-role' as any };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/role.*enum/);
    });

    it('should validate theme enum in preferences', async () => {
      const userData = {
        ...validUserData,
        preferences: {
          theme: 'invalid-theme' as any,
          notifications: true,
        },
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/theme.*enum/);
    });
  });

  describe('User Uniqueness', () => {
    it('should enforce unique googleId', async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User({
        ...validUserData,
        email: 'different@srmap.edu.in',
      });

      await expect(user2.save()).rejects.toThrow(/duplicate key error.*googleId/);
    });

    it('should enforce unique email', async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User({
        ...validUserData,
        googleId: '987654321',
      });

      await expect(user2.save()).rejects.toThrow(/duplicate key error.*email/);
    });
  });

  describe('User Methods', () => {
    it('should update timestamps on save', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();
      
      const originalUpdatedAt = savedUser.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      savedUser.name = 'Updated Name';
      const updatedUser = await savedUser.save();
      
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should find user by googleId', async () => {
      const user = new User(validUserData);
      await user.save();

      const foundUser = await User.findOne({ googleId: validUserData.googleId });
      
      expect(foundUser).toBeTruthy();
      expect(foundUser!.googleId).toBe(validUserData.googleId);
    });

    it('should find user by email', async () => {
      const user = new User(validUserData);
      await user.save();

      const foundUser = await User.findOne({ email: validUserData.email });
      
      expect(foundUser).toBeTruthy();
      expect(foundUser!.email).toBe(validUserData.email);
    });
  });
});