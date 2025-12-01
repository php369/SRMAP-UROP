import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { connectDatabase } from '../../config/database';

/**
 * Feature: academic-portal, Property 1: Email Domain Validation
 * Validates: Requirements 1.1, 17.5
 * 
 * Property: For any authentication attempt, if the email does not end with @srmap.edu.in,
 * the system should reject the authentication.
 */
describe('User Model - Property-Based Tests', () => {
    beforeAll(async () => {
        await connectDatabase();
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('Property 1: Email Domain Validation', () => {
        it('should reject any email not ending with @srmap.edu.in', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate random email addresses that don't end with @srmap.edu.in
                    fc.emailAddress().filter(email => !email.endsWith('@srmap.edu.in')),
                    fc.string({ minLength: 5, maxLength: 20 }), // googleId
                    fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3), // name
                    async (invalidEmail, googleId, name) => {
                        const user = new User({
                            googleId,
                            name: name.trim(),
                            email: invalidEmail,
                            role: 'student'
                        });

                        // Expect validation to fail
                        await expect(user.save()).rejects.toThrow(/Email must be from @srmap.edu.in domain/);
                    }
                ),
                { numRuns: 100 } // Run 100 iterations as specified in design
            );
        });

        it('should accept any email ending with @srmap.edu.in', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate random local parts for email
                    fc.string({ minLength: 1, maxLength: 20, unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789._-'.split('')) }),
                    fc.string({ minLength: 5, maxLength: 20 }), // googleId
                    fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3), // name
                    async (localPart, googleId, name) => {
                        // Ensure local part is valid (starts with alphanumeric)
                        const validLocalPart = localPart.replace(/^[^a-z0-9]+/, 'a');
                        // Make email unique by adding timestamp and random number
                        const validEmail = `${validLocalPart}_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`;

                        const user = new User({
                            googleId: `unique_${googleId}_${Date.now()}_${Math.random()}`,
                            name: name.trim(),
                            email: validEmail,
                            role: 'student'
                        });

                        // Should save successfully
                        const savedUser = await user.save();
                        expect(savedUser.email).toBe(validEmail.toLowerCase());
                        expect(savedUser.email).toMatch(/@srmap\.edu\.in$/);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject emails with @srmap.edu.in in the middle but different domain', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 20 }), // local part
                    fc.domain(), // random domain
                    fc.string({ minLength: 5, maxLength: 20 }), // googleId
                    fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3), // name
                    async (localPart, domain, googleId, name) => {
                        // Create email like: user@srmap.edu.in.otherdomain.com
                        const invalidEmail = `${localPart}@srmap.edu.in.${domain}`;

                        const user = new User({
                            googleId,
                            name: name.trim(),
                            email: invalidEmail,
                            role: 'student'
                        });

                        // Should fail validation
                        await expect(user.save()).rejects.toThrow(/Email must be from @srmap.edu.in domain/);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle case-insensitive email validation', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 20, unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789._-'.split('')) }),
                    fc.string({ minLength: 5, maxLength: 20 }), // googleId
                    fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3), // name
                    fc.constantFrom('SRMAP', 'SrMap', 'srmap', 'SRmap'), // different cases
                    async (localPart, googleId, name, domainCase) => {
                        const validLocalPart = localPart.replace(/^[^a-z0-9]+/, 'a');
                        // Make email unique by adding timestamp and random number
                        const uniqueEmail = `${validLocalPart}_${Date.now()}_${Math.random().toString(36).substring(7)}@${domainCase}.edu.in`;

                        const user = new User({
                            googleId: `unique_${googleId}_${Date.now()}_${Math.random()}`,
                            name: name.trim(),
                            email: uniqueEmail,
                            role: 'student'
                        });

                        // Should save successfully and normalize to lowercase
                        const savedUser = await user.save();
                        expect(savedUser.email).toBe(uniqueEmail.toLowerCase());
                        expect(savedUser.email).toMatch(/@srmap\.edu\.in$/);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
