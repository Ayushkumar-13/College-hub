import bcrypt from 'bcryptjs';
import College from '../models/College.js';
import Branch from '../models/Branch.js';
import Section from '../models/Section.js';
import StudentCredential from '../models/StudentCredential.js';
import User from '../models/User.js';

export function buildStudentEmail(collegeCode, rollNumber, providedEmail) {
  if (providedEmail) return providedEmail.toLowerCase().trim();
  const safeRoll = rollNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeCode = (collegeCode || 'college').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${safeRoll}@${safeCode}.students.collegehub`;
}

export async function validateCredentialSection(credential, section) {
  if (!credential || !section) return false;
  if (credential.sectionId.toString() !== section._id.toString()) return false;
  if (credential.branchId.toString() !== section.branchId.toString()) return false;
  if (credential.year !== section.year) return false;
  if ((credential.semester || 1) !== (section.semester || 1)) return false;

  const credSession = credential.sessionId?.toString() || null;
  const sectionSession = section.sessionId?.toString() || null;
  if (credSession && sectionSession && credSession !== sectionSession) return false;

  const branch = await Branch.findById(section.branchId);
  if (!branch) return false;
  if (credential.courseId.toString() !== branch.courseId.toString()) return false;
  if (credential.branchId.toString() !== branch._id.toString()) return false;

  return true;
}

export async function findStudentCredentialForAuth({ collegeId, sectionId, rollNumber }) {
  const section = await Section.findOne({ _id: sectionId, collegeId, isActive: true });
  if (!section) {
    const err = new Error('Invalid academic path — section not found');
    err.status = 404;
    throw err;
  }

  const credential = await StudentCredential.findOne({
    collegeId,
    rollNumber: rollNumber.trim(),
    isActive: { $ne: false },
  });

  if (!credential) {
    const err = new Error('Roll number not found for this college');
    err.status = 404;
    throw err;
  }

  if (credential.sectionId.toString() !== sectionId) {
    const err = new Error('Roll number does not match the selected academic path');
    err.status = 400;
    throw err;
  }

  const matches = await validateCredentialSection(credential, section);
  if (!matches) {
    const err = new Error('Academic path does not match admin records for this roll number');
    err.status = 400;
    throw err;
  }

  return { credential, section };
}

export async function activateStudentAccount({ collegeId, sectionId, rollNumber, password }) {
  if (!password || password.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    throw err;
  }

  const { credential } = await findStudentCredentialForAuth({ collegeId, sectionId, rollNumber });

  if (credential.status === 'active') {
    const err = new Error('Account already activated. Please log in with your password.');
    err.status = 400;
    throw err;
  }

  const college = await College.findById(collegeId);
  const email = buildStudentEmail(college?.code, rollNumber, credential.email);

  const emailTaken = await User.findOne({ email });
  if (emailTaken) {
    const err = new Error('Email already in use. Contact your college admin.');
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: credential.name,
    email,
    password: hashedPassword,
    role: 'Student',
    collegeId,
    courseId: credential.courseId,
    branchId: credential.branchId,
    year: credential.year,
    semester: credential.semester || 1,
    sessionId: credential.sessionId || null,
    sectionId: credential.sectionId,
    rollNumber: credential.rollNumber.trim(),
  });

  credential.status = 'active';
  credential.userId = user._id;
  await credential.save();

  return user;
}

export async function loginStudentAccount({ collegeId, sectionId, rollNumber, password }) {
  if (!password) {
    const err = new Error('Password is required');
    err.status = 400;
    throw err;
  }

  const { credential } = await findStudentCredentialForAuth({ collegeId, sectionId, rollNumber });

  if (credential.status === 'pending') {
    const err = new Error('Account not activated. Please set your password to activate.');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(credential.userId);
  if (!user || user.isActive === false) {
    const err = new Error('Account deactivated. Contact your college admin.');
    err.status = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid password');
    err.status = 400;
    throw err;
  }

  return user;
}
