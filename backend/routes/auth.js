/*
 * FILE: backend/routes/auth.js
 * PURPOSE: Authentication — student activate/login, faculty/staff email login
 */

import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import College from '../models/College.js';
import Course from '../models/Course.js';
import Branch from '../models/Branch.js';
import Section from '../models/Section.js';
import AcademicYear from '../models/AcademicYear.js';
import StudentCredential from '../models/StudentCredential.js';
import { signToken } from '../utils/jwt.js';
import { formatUser } from '../utils/userHelpers.js';
import { getRegistrationCollege, getRegistrationCollegeWithMeta } from '../utils/collegeHelpers.js';
import { getUserAssignments } from '../utils/assignmentHelpers.js';
import { getCurrentSession } from '../utils/sessionHelpers.js';
import {
  activateStudentAccount,
  loginStudentAccount,
} from '../utils/studentAuthHelpers.js';
import { DEMO } from '../scripts/seed-demo.js';

async function buildAuthResponse(user) {
  const assignments = await getUserAssignments(user._id);
  const formatted = await formatUser(user, { includeAssignments: true });
  formatted.assignments = assignments;
  const token = signToken({
    id: user._id,
    role: user.role,
    collegeId: user.collegeId?.toString() || null,
  });
  return { success: true, token, user: formatted };
}

// Single college for student app (configured in admin panel)
router.get('/demo-accounts', async (req, res) => {
  try {
    const faculty = await User.findOne({ email: DEMO.facultyEmail.toLowerCase() }).select('name email role');
    const credential = await StudentCredential.findOne({ rollNumber: DEMO.studentRoll, isActive: { $ne: false } })
      .populate('sessionId', 'label')
      .populate('courseId', 'name')
      .populate('branchId', 'name code')
      .populate('sectionId', 'name year semester');

    if (!faculty && !credential) {
      return res.json({
        available: false,
        message: 'Demo accounts not set up. Admin: run npm run seed-demo in backend.',
      });
    }

    const section = credential?.sectionId;
    const absoluteSemester = section
      ? (Number(section.year) - 1) * 2 + Number(section.semester || 1)
      : 1;

    res.json({
      available: true,
      faculty: faculty
        ? {
            name: faculty.name,
            email: DEMO.facultyEmail,
            password: DEMO.facultyPassword,
          }
        : null,
      student: credential && section
        ? {
            name: credential.name,
            rollNumber: DEMO.studentRoll,
            password: DEMO.studentPassword,
            path: {
              sessionId: credential.sessionId?._id || credential.sessionId,
              sessionLabel: credential.sessionId?.label,
              courseId: credential.courseId?._id || credential.courseId,
              courseName: credential.courseId?.name,
              branchId: credential.branchId?._id || credential.branchId,
              branchName: credential.branchId?.name,
              year: section.year,
              semester: absoluteSemester,
              sectionId: section._id,
              sectionName: section.name,
            },
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ available: false, error: error.message });
  }
});

router.get('/college', async (req, res) => {
  try {
    const college = await getRegistrationCollegeWithMeta();
    res.json(college);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

router.get('/colleges/:collegeId/courses', async (req, res) => {
  try {
    const college = await getRegistrationCollege();
    if (req.params.collegeId !== college._id.toString()) {
      return res.status(400).json({ success: false, error: 'Invalid college' });
    }
    const courses = await Course.find({ collegeId: college._id, isActive: true }).sort({ name: 1 });
    res.json(courses);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

router.get('/colleges/:collegeId/sessions', async (req, res) => {
  try {
    const college = await getRegistrationCollege();
    if (req.params.collegeId !== college._id.toString()) {
      return res.status(400).json({ success: false, error: 'Invalid college' });
    }
    const sessions = await AcademicYear.find({ collegeId: college._id }).sort({ startYear: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

router.get('/colleges/:collegeId/courses/:courseId/branches', async (req, res) => {
  try {
    const college = await getRegistrationCollege();
    const branches = await Branch.find({
      collegeId: college._id,
      courseId: req.params.courseId,
      isActive: true,
    }).sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

router.get('/colleges/:collegeId/branches/:branchId/sections', async (req, res) => {
  try {
    const college = await getRegistrationCollege();
    const currentSession = await getCurrentSession(college._id);
    const { year, sessionId, semester } = req.query;
    const filter = {
      collegeId: college._id,
      branchId: req.params.branchId,
      isActive: true,
    };
    if (sessionId) filter.sessionId = sessionId;
    else if (currentSession) filter.sessionId = currentSession._id;
    if (year) filter.year = Number(year);
    if (semester) filter.semester = Number(semester);
    const sections = await Section.find(filter).sort({ year: 1, semester: 1, name: 1 });
    res.json(sections);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

router.get('/students-in-section', async (req, res) => {
  try {
    const { sectionId } = req.query;
    if (!sectionId) {
      return res.status(400).json({ success: false, error: 'sectionId is required' });
    }

    const college = await getRegistrationCollege();
    const section = await Section.findOne({ _id: sectionId, collegeId: college._id, isActive: true });
    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    const credentials = await StudentCredential.find({
      collegeId: college._id,
      sectionId,
      isActive: { $ne: false },
    })
      .select('rollNumber name status')
      .sort({ name: 1, rollNumber: 1 });

    res.json({
      success: true,
      students: credentials.map((c) => ({
        rollNumber: c.rollNumber,
        name: c.name,
        status: c.status,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/student/activate', async (req, res) => {
  try {
    const { sectionId, rollNumber, password } = req.body;
    if (!sectionId || !rollNumber || !password) {
      return res.status(400).json({ success: false, error: 'sectionId, rollNumber, and password are required' });
    }

    const college = await getRegistrationCollege();
    const user = await activateStudentAccount({
      collegeId: college._id,
      sectionId,
      rollNumber,
      password,
    });

    res.status(201).json(await buildAuthResponse(user));
  } catch (error) {
    console.error('Student activate error:', error);
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

router.post('/student/login', async (req, res) => {
  try {
    const { sectionId, rollNumber, password } = req.body;
    if (!sectionId || !rollNumber || !password) {
      return res.status(400).json({ success: false, error: 'sectionId, rollNumber, and password are required' });
    }

    const college = await getRegistrationCollege();
    const user = await loginStudentAccount({
      collegeId: college._id,
      sectionId,
      rollNumber,
      password,
    });

    res.json(await buildAuthResponse(user));
  } catch (error) {
    console.error('Student login error:', error);
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email, isActive: { $ne: false } });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.role === 'Student') {
      return res.status(400).json({
        success: false,
        error: 'Students must log in using the student login flow (academic path + roll number).',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }

    res.json(await buildAuthResponse(user));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disabled — all users are created from the admin panel
router.post('/register/student', (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Student self-registration is disabled. Contact your college admin to be added, then activate your account.',
  });
});

router.post('/register/employee', (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Employee self-registration is disabled. Contact your college admin to create your account.',
  });
});

router.post('/verify-roll', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'This endpoint is no longer available. Use the student login flow instead.',
  });
});

router.post('/register', (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Self-registration is disabled. Accounts are created by your college admin.',
  });
});

export default router;
