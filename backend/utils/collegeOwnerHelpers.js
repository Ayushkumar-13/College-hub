import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const MIN_PASSWORD_LENGTH = 6;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function createCollegeOwner({ collegeId, name, email, password }) {
  const ownerName = String(name || 'College Admin').trim();
  const ownerEmail = normalizeEmail(email);
  const ownerPassword = String(password || '');

  if (!ownerEmail) {
    throw new Error('College admin email is required');
  }
  if (ownerPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`College admin password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const existingOwner = await User.findOne({ collegeId, role: 'Owner' });
  if (existingOwner) {
    throw new Error('This college already has an admin account');
  }

  const emailTaken = await User.findOne({ email: ownerEmail });
  if (emailTaken) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(ownerPassword, 10);
  const owner = await User.create({
    name: ownerName,
    email: ownerEmail,
    password: hashedPassword,
    role: 'Owner',
    collegeId,
    isActive: true,
  });

  return owner;
}

export async function updateCollegeOwner({ college, name, email, password }) {
  if (!college.ownerId) {
    return createCollegeOwner({
      collegeId: college._id,
      name,
      email,
      password,
    });
  }

  const owner = await User.findById(college.ownerId);
  if (!owner || owner.role !== 'Owner') {
    throw new Error('College admin account not found');
  }

  if (name?.trim()) {
    owner.name = name.trim();
  }

  if (email) {
    const ownerEmail = normalizeEmail(email);
    if (!ownerEmail) throw new Error('College admin email is required');
    const emailTaken = await User.findOne({
      email: ownerEmail,
      _id: { $ne: owner._id },
    });
    if (emailTaken) throw new Error('Email already registered');
    owner.email = ownerEmail;
  }

  if (password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`College admin password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    owner.password = await bcrypt.hash(password, 10);
  }

  owner.isActive = true;
  await owner.save();
  return owner;
}

export function sanitizeOwner(owner) {
  if (!owner) return null;
  const doc = typeof owner.toObject === 'function' ? owner.toObject() : owner;
  return {
    _id: doc._id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isActive: doc.isActive,
  };
}
