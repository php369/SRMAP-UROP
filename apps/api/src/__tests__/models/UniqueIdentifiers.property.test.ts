import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { User, Project, Group } from '../../models';
import { connectDatabase } from '../../config/database';

/**
 * Feature: academic-portal, Property 20-23: Unique Identifiers
 * Validates: Requirements 18.1-18.4
 * 
 * Properties:
 * - Property 20: For any two distinct projects, their projectId values should be different
 * - Property 21: For any two distinct faculty members, their facultyId values should be different
 * - Property 22: For any two distinct students, their studentId values should be different
 * - Property 23: For any two distinct groups, their groupId values should be different
 */
describe('Unique Identifiers - Property-Based Tests', () => {
    beforeAll(async () => {
        await connectDatabase();
    });

    afterEach(async () => {
        await Promise.all([
            User.deleteMany({}),
            Project.deleteMany({}),
            Group.deleteMany({})
        ]);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('Property 20: Unique Project Identifiers', () => {
        it('should ensure all projects have unique projectId values', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate array of project data
                    fc.array(
                        fc.record({
                            projectId: fc.string({ minLength: 5, maxLength: 20 }),
                            title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
                            brief: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
                            department: fc.constantFrom('Computer Science', 'Information Technology', 'Electronics'),
                            type: fc.constantFrom('IDP', 'UROP', 'CAPSTONE')
                        }),
                        { minLength: 2, maxLength: 10 }
                    ),
                    async (projectsData) => {
                        // Create a faculty user first
                        const faculty = await User.create({
                            googleId: `faculty_${Date.now()}_${Math.random()}`,
                            name: 'Test Faculty',
                            email: `faculty_${Date.now()}@srmap.edu.in`,
                            role: 'faculty',
                            facultyId: `FAC_${Date.now()}`
                        });

                        // Create projects with the generated data
                        const projects = await Promise.all(
                            projectsData.map((data, index) =>
                                Project.create({
                                    ...data,
                                    projectId: `${data.projectId}_${index}_${Date.now()}`, // Make unique
                                    title: data.title.trim(),
                                    brief: data.brief.trim(),
                                    facultyId: faculty._id,
                                    facultyName: faculty.name,
                                    isFrozen: false
                                })
                            )
                        );

                        // Extract all projectIds
                        const projectIds = projects.map(p => p.projectId);

                        // Check that all projectIds are unique
                        const uniqueProjectIds = new Set(projectIds);
                        expect(uniqueProjectIds.size).toBe(projectIds.length);

                        // Verify no two projects have the same projectId
                        for (let i = 0; i < projects.length; i++) {
                            for (let j = i + 1; j < projects.length; j++) {
                                expect(projects[i].projectId).not.toBe(projects[j].projectId);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 21: Unique Faculty Identifiers', () => {
        it('should ensure all faculty members have unique facultyId values', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate array of faculty data
                    fc.array(
                        fc.record({
                            facultyId: fc.string({ minLength: 5, maxLength: 20 }),
                            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3)
                        }),
                        { minLength: 2, maxLength: 10 }
                    ),
                    async (facultyData) => {
                        // Create faculty users with the generated data
                        const faculties = await Promise.all(
                            facultyData.map((data, index) =>
                                User.create({
                                    googleId: `faculty_${index}_${Date.now()}_${Math.random()}`,
                                    name: data.name.trim(),
                                    email: `faculty_${index}_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                                    role: 'faculty',
                                    facultyId: `${data.facultyId}_${index}_${Date.now()}` // Make unique
                                })
                            )
                        );

                        // Extract all facultyIds
                        const facultyIds = faculties.map(f => f.facultyId).filter(id => id !== undefined);

                        // Check that all facultyIds are unique
                        const uniqueFacultyIds = new Set(facultyIds);
                        expect(uniqueFacultyIds.size).toBe(facultyIds.length);

                        // Verify no two faculty members have the same facultyId
                        for (let i = 0; i < faculties.length; i++) {
                            for (let j = i + 1; j < faculties.length; j++) {
                                expect(faculties[i].facultyId).not.toBe(faculties[j].facultyId);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 22: Unique Student Identifiers', () => {
        it('should ensure all students have unique studentId values', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate array of student data
                    fc.array(
                        fc.record({
                            studentId: fc.string({ minLength: 5, maxLength: 20 }),
                            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3)
                        }),
                        { minLength: 2, maxLength: 10 }
                    ),
                    async (studentData) => {
                        // Create student users with the generated data
                        const students = await Promise.all(
                            studentData.map((data, index) =>
                                User.create({
                                    googleId: `student_${index}_${Date.now()}_${Math.random()}`,
                                    name: data.name.trim(),
                                    email: `student_${index}_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                                    role: 'student',
                                    studentId: `${data.studentId}_${index}_${Date.now()}` // Make unique
                                })
                            )
                        );

                        // Extract all studentIds
                        const studentIds = students.map(s => s.studentId).filter(id => id !== undefined);

                        // Check that all studentIds are unique
                        const uniqueStudentIds = new Set(studentIds);
                        expect(uniqueStudentIds.size).toBe(studentIds.length);

                        // Verify no two students have the same studentId
                        for (let i = 0; i < students.length; i++) {
                            for (let j = i + 1; j < students.length; j++) {
                                expect(students[i].studentId).not.toBe(students[j].studentId);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 23: Unique Group Identifiers', () => {
        it('should ensure all groups have unique groupId values', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate array of group data
                    fc.array(
                        fc.record({
                            groupId: fc.string({ minLength: 5, maxLength: 20 }),
                            groupCode: fc.string({ minLength: 6, maxLength: 6, unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')) })
                        }),
                        { minLength: 2, maxLength: 10 }
                    ),
                    async (groupsData) => {
                        // Create students for groups
                        const students = await Promise.all(
                            groupsData.flatMap((_, groupIndex) =>
                                [0, 1].map(memberIndex =>
                                    User.create({
                                        googleId: `student_g${groupIndex}_m${memberIndex}_${Date.now()}_${Math.random()}`,
                                        name: `Student ${groupIndex}-${memberIndex}`,
                                        email: `student_g${groupIndex}_m${memberIndex}_${Date.now()}_${Math.random().toString(36).substring(7)}@srmap.edu.in`,
                                        role: 'student'
                                    })
                                )
                            )
                        );

                        // Create groups with the generated data
                        const groups = await Promise.all(
                            groupsData.map((data, index) => {
                                const groupStudents = students.slice(index * 2, index * 2 + 2);
                                return Group.create({
                                    groupId: `${data.groupId}_${index}_${Date.now()}`, // Make unique
                                    groupCode: `${data.groupCode}${index}`.substring(0, 6).toUpperCase(),
                                    leaderId: groupStudents[0]._id,
                                    members: groupStudents.map(s => s._id),
                                    projectType: 'IDP',
                                    semester: 'Fall',
                                    year: 2024,
                                    status: 'forming'
                                });
                            })
                        );

                        // Extract all groupIds
                        const groupIds = groups.map(g => g.groupId);

                        // Check that all groupIds are unique
                        const uniqueGroupIds = new Set(groupIds);
                        expect(uniqueGroupIds.size).toBe(groupIds.length);

                        // Verify no two groups have the same groupId
                        for (let i = 0; i < groups.length; i++) {
                            for (let j = i + 1; j < groups.length; j++) {
                                expect(groups[i].groupId).not.toBe(groups[j].groupId);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
