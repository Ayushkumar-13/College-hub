import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Minimal seed — creates/resets SuperAdmin only.
 * Add college, courses, sessions, etc. from the admin panel.
 */
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@collegehub.com';
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123';
    const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

    let superAdmin = await User.findOne({ role: 'SuperAdmin' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Platform Super Admin',
        email: superAdminEmail,
        password: superAdminHash,
        role: 'SuperAdmin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
      });
      console.log('✅ SuperAdmin created:', superAdminEmail);
    } else {
      superAdmin.email = superAdminEmail;
      superAdmin.password = superAdminHash;
      superAdmin.isActive = true;
      await superAdmin.save();
      console.log('✅ SuperAdmin password reset:', superAdminEmail);
    }

    console.log('\n--- Seed complete (SuperAdmin only) ---');
    console.log('Login:', superAdminEmail, '/', superAdminPassword);
    console.log('Then open admin panel → College tab → add your college and structure.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
