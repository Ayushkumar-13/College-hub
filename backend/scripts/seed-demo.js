/**
 * Creates demo accounts for recruiters / testing (Ritesh faculty + student).
 * Requires at least one college (add via admin panel if missing).
 *
 * Run: npm run seed-demo
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import College from '../models/College.js';
import Course from '../models/Course.js';
import Branch from '../models/Branch.js';
import Section from '../models/Section.js';
import AcademicYear from '../models/AcademicYear.js';
import StudentCredential from '../models/StudentCredential.js';
import User from '../models/User.js';
import { buildStudentEmail } from '../utils/studentAuthHelpers.js';

export const DEMO = {
  facultyEmail: process.env.DEMO_FACULTY_EMAIL || 'ritesh.demo@collegehub.com',
  facultyPassword: process.env.DEMO_FACULTY_PASSWORD || 'Demo@123',
  facultyName: 'Ritesh Kumar',
  studentRoll: 'DEMO001',
  studentPassword: process.env.DEMO_STUDENT_PASSWORD || 'Demo@123',
  studentName: 'Ritesh',
};

async function upsertFaculty(collegeId, passwordHash) {
  let user = await User.findOne({ email: DEMO.facultyEmail.toLowerCase() });
  if (user) {
    user.name = DEMO.facultyName;
    user.password = passwordHash;
    user.role = 'Faculty';
    user.collegeId = collegeId;
    user.isActive = true;
    user.designation = user.designation || 'Assistant Professor';
    await user.save();
    return user;
  }
  return User.create({
    name: DEMO.facultyName,
    email: DEMO.facultyEmail.toLowerCase(),
    password: passwordHash,
    role: 'Faculty',
    collegeId,
    designation: 'Assistant Professor',
  });
}

async function ensureDemoSection(collegeId) {
  let section = await Section.findOne({ collegeId }).sort({ createdAt: 1 });
  if (section) return section;

  const session = await AcademicYear.findOne({ collegeId }).sort({ isCurrent: -1, startYear: -1 });
  const course = await Course.findOne({ collegeId, isActive: true }).sort({ name: 1 });
  if (!session || !course) {
    throw new Error('Add at least one Session and Course in admin before running seed-demo.');
  }
  const branch = await Branch.findOne({ collegeId, courseId: course._id, isActive: true }).sort({ name: 1 });
  if (!branch) {
    throw new Error('Add at least one Branch in admin before running seed-demo.');
  }

  section = await Section.create({
    collegeId,
    courseId: course._id,
    branchId: branch._id,
    sessionId: session._id,
    year: 1,
    semester: 1,
    name: 'A',
  });
  console.log('  Created demo section A (Year 1, Sem 1)');
  return section;
}

async function upsertStudent(college, section, passwordHash) {
  let credential = await StudentCredential.findOne({
    collegeId: college._id,
    rollNumber: DEMO.studentRoll,
  });

  if (!credential) {
    credential = await StudentCredential.create({
      collegeId: college._id,
      rollNumber: DEMO.studentRoll,
      name: DEMO.studentName,
      courseId: section.courseId,
      branchId: section.branchId,
      year: section.year,
      semester: section.semester,
      sectionId: section._id,
      sessionId: section.sessionId,
      status: 'pending',
    });
    console.log('  Created student credential:', DEMO.studentRoll);
  } else {
    credential.name = DEMO.studentName;
    credential.courseId = section.courseId;
    credential.branchId = section.branchId;
    credential.year = section.year;
    credential.semester = section.semester;
    credential.sectionId = section._id;
    credential.sessionId = section.sessionId;
    credential.isActive = true;
    await credential.save();
  }

  const email = buildStudentEmail(college.code, DEMO.studentRoll, credential.email);
  let user = credential.userId ? await User.findById(credential.userId) : null;

  if (!user) {
    user = await User.findOne({ email });
  }

  if (user) {
    user.name = DEMO.studentName;
    user.password = passwordHash;
    user.role = 'Student';
    user.collegeId = college._id;
    user.courseId = section.courseId;
    user.branchId = section.branchId;
    user.sectionId = section._id;
    user.sessionId = section.sessionId;
    user.year = section.year;
    user.semester = section.semester;
    user.rollNumber = DEMO.studentRoll;
    user.isActive = true;
    await user.save();
  } else {
    user = await User.create({
      name: DEMO.studentName,
      email,
      password: passwordHash,
      role: 'Student',
      collegeId: college._id,
      courseId: section.courseId,
      branchId: section.branchId,
      sectionId: section._id,
      sessionId: section.sessionId,
      year: section.year,
      semester: section.semester,
      rollNumber: DEMO.studentRoll,
    });
  }

  credential.status = 'active';
  credential.userId = user._id;
  await credential.save();
  return { credential, user };
}

async function seedDemo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected — setting up demo accounts (Ritesh)...\n');

  const college = await College.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!college) {
    console.error('❌ No college found. Log in as SuperAdmin and create a college first.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(DEMO.facultyPassword, 10);
  const studentHash = await bcrypt.hash(DEMO.studentPassword, 10);

  const faculty = await upsertFaculty(college._id, passwordHash);
  const section = await ensureDemoSection(college._id);
  const { user: studentUser } = await upsertStudent(college, section, studentHash);

  await section.populate([
    { path: 'sessionId', select: 'label' },
    { path: 'courseId', select: 'name' },
    { path: 'branchId', select: 'name code' },
  ]);

  console.log('\n✅ Demo accounts ready\n');
  console.log('--- Faculty (email login at /login) ---');
  console.log('  Name:    ', faculty.name);
  console.log('  Email:   ', DEMO.facultyEmail);
  console.log('  Password:', DEMO.facultyPassword);
  console.log('\n--- Student (path login at /login/student) ---');
  console.log('  Name:       ', DEMO.studentName);
  console.log('  Roll:       ', DEMO.studentRoll);
  console.log('  Password:   ', DEMO.studentPassword);
  console.log('  Session:    ', section.sessionId?.label || section.sessionId);
  console.log('  Course:     ', section.courseId?.name);
  console.log('  Branch:     ', section.branchId?.name);
  console.log('  Year/Sem:   ', `Year ${section.year}, Semester 1`);
  console.log('  Section:    ', section.name);
  console.log('  Section ID: ', section._id.toString());
  console.log('\nShare these with recruiters for live demo login.\n');

  await mongoose.disconnect();
  process.exit(0);
}

const isDirectRun = process.argv[1]?.includes('seed-demo');
if (isDirectRun) {
  seedDemo().catch((err) => {
    console.error('seed-demo failed:', err.message);
    process.exit(1);
  });
}

export default seedDemo;
