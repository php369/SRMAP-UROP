/**
 * Admin User Seeder
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates an admin user with a pending googleId (updated on first Google login).
 *
 * USAGE:
 *   pnpm --filter @srm-portal/api tsx src/scripts/create-admin.ts \
 *     --name "Dr. Ravi Shankar" \
 *     --email "ravi.shankar@srmap.edu.in" \
 *     --department "Computer Science"
 *
 * OPTIONS:
 *   --name        Full display name (required)
 *   --email       SRM AP email address @srmap.edu.in (required)
 *   --department  Department name (optional, defaults to "Administration")
 *   --force       Overwrite role if user already exists (optional flag)
 *
 * NOTES:
 *   - The script uses a placeholder googleId (pending-<email>) which gets
 *     replaced the first time the admin signs in with Google OAuth.
 *   - If the email already exists as a different role, use --force to upgrade
 *     them to admin. Without --force the script exits safely.
 *   - Requires MONGODB_URI in your .env file.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the api package root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Parse CLI arguments ──────────────────────────────────────────────────────

function parseArgs(): {
  name: string;
  email: string;
  department: string;
  force: boolean;
} {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const name = get('--name');
  const email = get('--email');
  const department = get('--department') ?? 'Administration';
  const force = args.includes('--force');

  if (!name || !email) {
    console.error('\n❌  Missing required arguments.');
    console.error('    Usage: tsx src/scripts/create-admin.ts --name "Full Name" --email "x@srmap.edu.in"\n');
    process.exit(1);
  }

  if (!email.endsWith('@srmap.edu.in')) {
    console.error(`\n❌  Email must be an @srmap.edu.in address. Got: "${email}"\n`);
    process.exit(1);
  }

  return { name: name.trim(), email: email.trim().toLowerCase(), department: department.trim(), force };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { name, email, department, force } = parseArgs();

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('\n❌  MONGODB_URI is not set in your .env file.\n');
    process.exit(1);
  }

  console.log('\n🔌  Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected.\n');

  // Import model after connection to avoid schema warnings
  const { User } = await import('../models/User');

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`ℹ️   User "${email}" is already an admin. Nothing to do.\n`);
      await mongoose.disconnect();
      return;
    }

    if (!force) {
      console.error(`❌  User "${email}" already exists with role "${existing.role}".`);
      console.error('    Use --force to upgrade them to admin.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Upgrade existing user to admin
    existing.role = 'admin';
    existing.name = name;
    existing.department = department;
    await existing.save();

    console.log('✅  Existing user upgraded to admin:\n');
    printSummary(existing);
    await mongoose.disconnect();
    return;
  }

  // Create a brand-new admin user
  const adminUser = new User({
    googleId: `pending-${email}`,  // Replaced on first Google login
    name,
    email,
    role: 'admin',
    department,
    lastSeen: new Date(),
  });

  await adminUser.save();

  console.log('🎉  Admin user created successfully:\n');
  printSummary(adminUser);
  await mongoose.disconnect();
}

function printSummary(user: any) {
  console.log('  ┌─────────────────────────────────────────┐');
  console.log(`  │  Name        : ${user.name}`);
  console.log(`  │  Email       : ${user.email}`);
  console.log(`  │  Role        : ${user.role}`);
  console.log(`  │  Department  : ${user.department ?? '—'}`);
  console.log(`  │  DB ID       : ${user._id}`);
  console.log('  └─────────────────────────────────────────┘');
  console.log('\n  ⚠️  This user\'s googleId is "pending" until they sign in via Google OAuth.');
  console.log('  ⚠️  Make sure their Google account uses this exact email address.\n');
}

main().catch((err) => {
  console.error('\n❌  Script failed:', err.message ?? err);
  mongoose.disconnect();
  process.exit(1);
});
