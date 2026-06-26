/**
 * Removes all college/demo data from the database.
 * Keeps only the SuperAdmin account so you can log in and add real data via admin panel.
 *
 * Run: npm run clear-data -- --confirm
 * Requires --confirm flag to prevent accidental wipes.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import College from '../models/College.js';
import Course from '../models/Course.js';
import Branch from '../models/Branch.js';
import Section from '../models/Section.js';
import AcademicYear from '../models/AcademicYear.js';
import ProblemCategory from '../models/ProblemCategory.js';
import StudentCredential from '../models/StudentCredential.js';
import Assignment from '../models/Assignment.js';
import DomainAssignment from '../models/DomainAssignment.js';
import Issue from '../models/Issue.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

async function clearData() {
  if (!process.argv.includes('--confirm')) {
    console.error('\n❌ Refusing to clear database without --confirm flag.');
    console.error('   This protects your entered college data from accidental deletion.');
    console.error('   To wipe everything intentionally: npm run clear-data -- --confirm\n');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected — clearing all demo/college data...\n');

  const results = await Promise.all([
    Issue.deleteMany({}),
    Post.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    DomainAssignment.deleteMany({}),
    Assignment.deleteMany({}),
    StudentCredential.deleteMany({}),
    Section.deleteMany({}),
    Branch.deleteMany({}),
    Course.deleteMany({}),
    AcademicYear.deleteMany({}),
    ProblemCategory.deleteMany({}),
    College.deleteMany({}),
    User.deleteMany({ role: { $ne: 'SuperAdmin' } }),
  ]);

  const labels = [
    'Issues', 'Posts', 'Messages', 'Notifications', 'Domain assignments',
    'Assignments', 'Student credentials', 'Sections', 'Branches', 'Courses',
    'Sessions', 'Categories', 'Colleges', 'Non-admin users',
  ];
  labels.forEach((label, i) => console.log(`  ${label}: ${results[i].deletedCount} removed`));

  const superAdmin = await User.findOne({ role: 'SuperAdmin' });
  console.log('\n✅ Database cleared.');
  if (superAdmin) {
    console.log(`   SuperAdmin kept: ${superAdmin.email}`);
  } else {
    console.log('   No SuperAdmin found — run: npm run seed');
  }
  console.log('\nAdd your college and data from the admin panel.\n');

  await mongoose.disconnect();
  process.exit(0);
}

clearData().catch((err) => {
  console.error('Clear failed:', err);
  process.exit(1);
});
