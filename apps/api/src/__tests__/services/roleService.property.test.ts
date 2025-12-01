import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { User, Group } from '../../models';
import { isGroupLeader, isCoordinator, getEnhancedUserRole } from '../../services/roleService';
import { connectDatabase } from '../../config/database';

/**
 * Feature: academic-portal, Property 2: Group Leader Role Assignment
 * Validates: Requirements 1.3, 6.5
 * 
 * Property: For any student who creates a group, the system should automatically
 * assign them the Group_Leader role.
 */
describe('Role Service - Property-Based Tests', () => {
    beforeAll(async () => {
        await connectDatabase();
    });

    afterEach(async () => {
        await Promise.all([
            User.deleteMany({}),
            Group.deleteMany({})
        ]);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('Property 2: Group Leader Role Assignment', () => {
        it('should automatically assign Group_Leader role to any student who creates a group', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate array of student data
                    fc.array(
                        fc.record({
                            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
                            groupName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3)
                        }),
                        { minLength: 1, maxLength: 5 }
                    ),
                    async (studentsData) => {
                        // Create students
                        const students = await Promise.all(
                            studentsData.map((data, index) =>
                                User.create({
                                    googleId: `student_${index}_${Date.now()}_${Math.random()}`,
                                    name: data.name.trim(),
                                    email: `student_${index}_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                                    role: 'student'
                                })
                            )
                        );

                        // Each student creates a group (becomes leader) - sequential to avoid duplicate codes
                        const groups = [];
                        for (let index = 0; index < students.length; index++) {
                            const student = students[index];
                            // Create additional member for the group
                            const member = await User.create({
                                googleId: `member_${index}_${Date.now()}_${Math.random()}`,
                                name: `Member ${index}`,
                                email: `member_${index}_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                                role: 'student'
                            });

                            const group = await Group.create({
                                groupId: `GRP_${index}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                groupCode: `${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
                                groupName: studentsData[index].groupName.trim(),
                                leaderId: student._id,
                                members: [student._id, member._id],
                                projectType: 'IDP',
                                semester: 'Fall',
                                year: 2024,
                                status: 'forming'
                            });
                            groups.push(group);
                        }

                        // Verify each student who created a group is identified as a group leader
                        for (let i = 0; i < students.length; i++) {
                            const student = students[i];
                            const group = groups[i];

                            // Check if student is group leader
                            const isLeader = await isGroupLeader(student._id);
                            expect(isLeader).toBe(true);

                            // Verify the group's leaderId matches the student
                            expect(group.leaderId.toString()).toBe(student._id.toString());

                            // Check enhanced role information
                            const roleInfo = await getEnhancedUserRole(student._id);
                            expect(roleInfo).not.toBeNull();
                            expect(roleInfo!.isGroupLeader).toBe(true);
                            expect(roleInfo!.baseRole).toBe('student');
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should not assign Group_Leader role to students who are not group leaders', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3)
                        }),
                        { minLength: 2, maxLength: 4 } // Max 4 to respect group size limit
                    ),
                    async (studentsData) => {
                        // Create students
                        const students = await Promise.all(
                            studentsData.map((data, index) =>
                                User.create({
                                    googleId: `student_${index}_${Date.now()}_${Math.random()}`,
                                    name: data.name.trim(),
                                    email: `student_${index}_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                                    role: 'student'
                                })
                            )
                        );

                        // Create a group with first student as leader
                        const leader = students[0];
                        const members = students.slice(1);

                        await Group.create({
                            groupId: `GRP_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                            groupCode: `${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
                            groupName: 'Test Group',
                            leaderId: leader._id,
                            members: [leader._id, ...members.map(m => m._id)],
                            projectType: 'IDP',
                            semester: 'Fall',
                            year: 2024,
                            status: 'forming'
                        });

                        // Verify leader is identified as group leader
                        const leaderIsLeader = await isGroupLeader(leader._id);
                        expect(leaderIsLeader).toBe(true);

                        // Verify non-leader members are NOT identified as group leaders
                        for (const member of members) {
                            const memberIsLeader = await isGroupLeader(member._id);
                            expect(memberIsLeader).toBe(false);

                            const roleInfo = await getEnhancedUserRole(member._id);
                            expect(roleInfo).not.toBeNull();
                            expect(roleInfo!.isGroupLeader).toBe(false);
                            expect(roleInfo!.baseRole).toBe('student');
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should maintain Group_Leader role across different group statuses', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('forming', 'complete', 'applied', 'approved', 'frozen'),
                    fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
                    async (groupStatus, studentName) => {
                        // Create leader
                        const leader = await User.create({
                            googleId: `leader_${Date.now()}_${Math.random()}`,
                            name: studentName.trim(),
                            email: `leader_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                            role: 'student'
                        });

                        // Create member
                        const member = await User.create({
                            googleId: `member_${Date.now()}_${Math.random()}`,
                            name: 'Member',
                            email: `member_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                            role: 'student'
                        });

                        // Create group with specific status
                        await Group.create({
                            groupId: `GRP_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                            groupCode: `${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
                            groupName: 'Test Group',
                            leaderId: leader._id,
                            members: [leader._id, member._id],
                            projectType: 'IDP',
                            semester: 'Fall',
                            year: 2024,
                            status: groupStatus as any
                        });

                        // Verify leader is identified as group leader regardless of status
                        const isLeader = await isGroupLeader(leader._id);
                        expect(isLeader).toBe(true);

                        const roleInfo = await getEnhancedUserRole(leader._id);
                        expect(roleInfo).not.toBeNull();
                        expect(roleInfo!.isGroupLeader).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 3: Coordinator Role Assignment', () => {
        it('should assign coordinator role to faculty with isCoordinator flag set to true', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
                            isCoordinator: fc.boolean()
                        }),
                        { minLength: 1, maxLength: 5 }
                    ),
                    async (facultyData) => {
                        // Create faculty users
                        const faculties = await Promise.all(
                            facultyData.map((data, index) =>
                                User.create({
                                    googleId: `faculty_${index}_${Date.now()}_${Math.random()}`,
                                    name: data.name.trim(),
                                    email: `faculty_${index}_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                                    role: 'faculty',
                                    isCoordinator: data.isCoordinator
                                })
                            )
                        );

                        // Verify each faculty's coordinator status
                        for (let i = 0; i < faculties.length; i++) {
                            const faculty = faculties[i];
                            const expectedCoordinator = facultyData[i].isCoordinator;

                            const isCoord = await isCoordinator(faculty._id);
                            expect(isCoord).toBe(expectedCoordinator);

                            const roleInfo = await getEnhancedUserRole(faculty._id);
                            expect(roleInfo).not.toBeNull();
                            expect(roleInfo!.isCoordinator).toBe(expectedCoordinator);
                            expect(roleInfo!.baseRole).toBe('faculty');
                            expect(roleInfo!.effectiveRole).toBe(expectedCoordinator ? 'coordinator' : 'faculty');
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should not assign coordinator role to non-faculty users', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('student', 'admin'),
                    fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
                    async (role, name) => {
                        const user = await User.create({
                            googleId: `user_${Date.now()}_${Math.random()}`,
                            name: name.trim(),
                            email: `user_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                            role: role as any,
                            isCoordinator: true // Try to set coordinator flag
                        });

                        // Non-faculty users should not be coordinators even with flag set
                        const isCoord = await isCoordinator(user._id);
                        expect(isCoord).toBe(false);

                        const roleInfo = await getEnhancedUserRole(user._id);
                        expect(roleInfo).not.toBeNull();
                        expect(roleInfo!.isCoordinator).toBe(false);
                        expect(roleInfo!.baseRole).toBe(role);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
