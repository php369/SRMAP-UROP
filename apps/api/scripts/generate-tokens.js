/**
 * GENERATE MOCK AUTH URLS WITH VALID TOKENS
 * Usage: node scripts/generate-tokens.js
 */
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const SECRET = process.env.JWT_SECRET;
const BASE_URL = 'https://projects.srmap.poojanhp.com';

if (!SECRET) {
  console.error('❌ Error: JWT_SECRET not found in .env file');
  process.exit(1);
}

// 7 User Scenarios (Matching mockAuth.ts)
const USERS = [
  {
    key: 'srmap_admin',
    payload: {
      userId: '693a7fbad6cc7eaef99b49c7',
      email: 'krish_nariya@srmap.edu.in',
      name: 'Krish Nariya',
      role: 'admin'
    }
  },
  {
    key: 'srmap_coordinator',
    payload: {
      userId: '693a7fbad6cc7eaef99b49c9',
      email: 'poojan_patel@srmap.edu.in',
      name: 'Poojan Patel',
      role: 'coordinator'
    }
  },
  {
    key: 'srmap_faculty',
    payload: {
      userId: '693a8070ab5b370f9d5076b6',
      email: 'gautamraju_angajala@srmap.edu.in',
      name: 'Gautam Raju Angajala',
      role: 'faculty'
    }
  },
  {
    key: 'srmap_idp',
    payload: {
      userId: '693a804dab5b370f9d5076a1',
      email: 'om_thesia@srmap.edu.in',
      name: 'Om Thesia',
      role: 'idp-student'
    }
  },
  {
    key: 'srmap_urop_leader',
    payload: {
      userId: '693a8059ab5b370f9d5076a9',
      email: 'krishna_s@srmap.edu.in',
      name: 'Krishna Sharma',
      role: 'urop-student'
    }
  },
  {
    key: 'srmap_urop_member',
    payload: {
      userId: '693a8058ab5b370f9d5076a6',
      email: 'rudra_patel@srmap.edu.in',
      name: 'Rudra Patel',
      role: 'urop-student'
    }
  },
  {
    key: 'srmap_capstone',
    payload: {
      userId: '69605fa55c7a6ab6d0e76060',
      email: 'prit_patel@srmap.edu.in',
      name: 'Prit Patel',
      role: 'capstone-student'
    }
  }
];

console.log('🚀 Generating Magic Links...\n');

USERS.forEach(user => {
  // Generate JWT (1 year expiry)
  const token = jwt.sign(user.payload, SECRET, {
    expiresIn: '1y',
    issuer: 'srm-portal-api',
    audience: 'srm-portal-web'
  });

  const url = `${BASE_URL}/?mock_role=${user.key}&mock_token=${token}`;
  
  console.log(`👤 ROLE: ${user.key.toUpperCase()}`);
  console.log(`🔗 Link: ${url}\n`);
});
