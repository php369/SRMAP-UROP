import { User } from '../types';

/**
 * MOCK AUTHENTICATION UTILITIES
 * -----------------------------------------------------
 * This file contains mock user data for testing different roles
 * without requiring real Google Authentication.
 * 
 * DELETE THIS FILE BEFORE PRODUCTION
 * -----------------------------------------------------
 */

export const MOCK_USERS: Record<string, User> = {
    // 1. Admin
    srmap_admin: {
        id: '693a7fbad6cc7eaef99b49c7',
        name: 'Krish Nariya',
        email: 'krish_nariya@srmap.edu.in',
        role: 'admin',
        profile: {
            department: 'Computer Science'
        },
        preferences: {
            theme: 'light',
            notifications: true
        },
        createdAt: '2025-12-11T08:24:26.910Z',
        updatedAt: '2025-12-11T08:25:58.746Z'
    },

    // 2. Coordinator
    srmap_coordinator: {
        id: '693a7fbad6cc7eaef99b49c9',
        name: 'Poojan Patel',
        email: 'poojan_patel@srmap.edu.in',
        role: 'coordinator', // Frontend treats this as 'coordinator' role
        profile: {
            department: 'Computer Science'
        },
        preferences: {
            theme: 'light',
            notifications: true
        },
        createdAt: '2025-12-11T08:24:26.957Z',
        updatedAt: '2026-01-09T01:44:26.512Z'
    },

    // 3. Faculty
    srmap_faculty: {
        id: '693a8070ab5b370f9d5076b6',
        name: 'Gautam Raju Angajala',
        email: 'gautamraju_angajala@srmap.edu.in',
        role: 'faculty',
        profile: {},
        preferences: {
            theme: 'light',
            notifications: true
        },
        createdAt: '2025-12-11T08:27:28.992Z',
        updatedAt: '2025-12-11T08:28:11.059Z'
    },

    // 4. IDP Student (Solo)
    srmap_idp: {
        id: '693a804dab5b370f9d5076a1',
        name: 'Om Thesia',
        email: 'om_thesia@srmap.edu.in',
        role: 'student', // Mapped to generic 'student' role in frontend types, but specific in backend
        profile: {},
        preferences: {
            theme: 'light',
            notifications: true
        },
        createdAt: '2025-12-11T08:26:53.589Z',
        updatedAt: '2025-12-11T08:28:20.211Z'
    },

    // 5. UROP Student (Group Leader)
    srmap_urop_leader: {
        id: '693a8059ab5b370f9d5076a9',
        name: 'Krishna Sharma',
        email: 'krishna_s@srmap.edu.in',
        role: 'student',
        profile: {},
        preferences: {
            theme: 'light',
            notifications: true
        },
        createdAt: '2025-12-11T08:27:05.445Z',
        updatedAt: '2025-12-11T08:36:12.311Z'
    },

    // 6. UROP Student (Group Member)
    srmap_urop_member: {
        id: '693a8058ab5b370f9d5076a6',
        name: 'Rudra Patel',
        email: 'rudra_patel@srmap.edu.in',
        role: 'student',
        profile: {},
        preferences: {
            theme: 'light',
            notifications: true
        },
        createdAt: '2025-12-11T08:27:04.989Z',
        updatedAt: '2025-12-11T08:36:37.079Z'
    },

    // 7. Capstone Student (Solo)
    srmap_capstone: {
        id: '69605fa55c7a6ab6d0e76060',
        name: 'Prit Patel',
        email: 'prit_patel@srmap.edu.in',
        role: 'student',
        profile: {},
        preferences: {
            theme: 'light',
            notifications: true
        },
        createdAt: '2026-01-09T01:53:41.528Z',
        updatedAt: '2026-01-09T02:09:18.865Z'
    }
};

export const getMockUser = (mockRoleKey: string): User | null => {
    return MOCK_USERS[mockRoleKey] || null;
};
