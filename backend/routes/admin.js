/*
 * FILE: backend/routes/admin.js
 * PURPOSE: Admin panel API — colleges, hierarchy, assignments, users, students
 */

import express from 'express';
const router = express.Router();
import authenticateToken from '../middleware/auth.js';
import { authorizeRoles, scopeToCollege } from '../middleware/authorize.js';
import College from '../models/College.js';
import Course from '../models/Course.js';
import Branch from '../models/Branch.js';
import Section from '../models/Section.js';
import AcademicYear from '../models/AcademicYear.js';
import ProblemCategory from '../models/ProblemCategory.js';
import StudentCredential from '../models/StudentCredential.js';
import Assignment from '../models/Assignment.js';
import DomainAssignment from '../models/DomainAssignment.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import {
  getCurrentSession,
  setCurrentSession,
  promoteStudentsToSession,
  countStudentsInSection,
  normalizeAcademicSession,
} from '../utils/sessionHelpers.js';
import {
  assignHODToBranch,
  removeHODFromBranch,
  assignDirector,
  removeDirector,
  assignSectionCoordinator,
  removeSectionCoordinator,
  assignDomainSolver,
  removeDomainSolver,
  revokeAllUserAssignments,
  revokeAssignmentRecord,
  syncUserDesignation,
} from '../utils/designationHelpers.js';

router.use(authenticateToken, authorizeRoles('SuperAdmin', 'Owner', 'Admin'));

const requireSuperAdmin = authorizeRoles('SuperAdmin');

// ---------- COLLEGES ----------
router.get('/colleges', requireSuperAdmin, async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 });
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/colleges/:id', scopeToCollege, async (req, res) => {
  try {
    const college = await College.findById(req.params.id)
      .populate('directorId', 'name email role')
      .populate('ownerId', 'name email role');
    if (!college) return res.status(404).json({ error: 'College not found' });
    if (req.currentUser.role !== 'SuperAdmin' && college._id.toString() !== req.currentUser.collegeId?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/colleges/:id', scopeToCollege, async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ error: 'College not found' });
    if (req.currentUser.role !== 'SuperAdmin' && college._id.toString() !== req.currentUser.collegeId?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { name, address, city, logo, isActive } = req.body;
    if (name) college.name = name;
    if (address !== undefined) college.address = address;
    if (city !== undefined) college.city = city;
    if (logo !== undefined) college.logo = logo;
    if (isActive !== undefined && req.currentUser.role === 'SuperAdmin') college.isActive = isActive;
    await college.save();
    res.json(college);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Legacy superadmin college CRUD
router.post('/colleges', requireSuperAdmin, async (req, res) => {
  try {
    const existing = await College.countDocuments();
    if (existing >= 1) {
      return res.status(400).json({ error: 'Only one college is allowed. Edit the existing college instead.' });
    }
    const { name, code, address, city } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
    const college = await College.create({ name, code, address, city });
    res.status(201).json(college);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/colleges/:id', requireSuperAdmin, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!college) return res.status(404).json({ error: 'College not found' });
    res.json(college);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/colleges/:id', requireSuperAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments({ collegeId: req.params.id });
    if (userCount > 0) return res.status(400).json({ error: 'Cannot delete college with existing users' });
    await College.findByIdAndDelete(req.params.id);
    res.json({ message: 'College deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- DASHBOARD ----------
router.get('/dashboard', scopeToCollege, async (req, res) => {
  try {
    const collegeId = req.collegeId || req.currentUser.collegeId;
    if (!collegeId && req.currentUser.role !== 'SuperAdmin') {
      return res.status(400).json({ error: 'collegeId required' });
    }
    const filter = collegeId ? { collegeId } : {};
    const [
      faculty,
      staff,
      students,
      pendingStudents,
      courses,
      branches,
      sections,
      categories,
      assignments,
    ] = await Promise.all([
      User.countDocuments({ ...filter, role: 'Faculty' }),
      User.countDocuments({ ...filter, role: 'Staff' }),
      StudentCredential.countDocuments(filter),
      StudentCredential.countDocuments({ ...filter, status: 'pending' }),
      Course.countDocuments({ ...filter, isActive: true }),
      Branch.countDocuments({ ...filter, isActive: true }),
      Section.countDocuments({ ...filter, isActive: true }),
      ProblemCategory.countDocuments({ ...filter, isActive: true }),
      Assignment.countDocuments(filter),
    ]);
    const college = collegeId ? await College.findById(collegeId) : null;
    res.json({
      college,
      stats: {
        faculty,
        staff,
        students,
        pendingStudents,
        courses,
        branches,
        sections,
        categories,
        assignments,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- COURSES ----------
router.get('/courses', scopeToCollege, async (req, res) => {
  try {
    const filter = req.collegeId ? { collegeId: req.collegeId } : {};
    const courses = await Course.find(filter).sort({ name: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/courses', scopeToCollege, async (req, res) => {
  try {
    const { name, code, durationYears } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
    const course = await Course.create({
      collegeId: req.collegeId,
      name,
      code,
      durationYears: durationYears || 4,
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/courses/:id', scopeToCollege, async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, collegeId: req.collegeId },
      req.body,
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/courses/:id', scopeToCollege, async (req, res) => {
  try {
    await Course.findOneAndDelete({ _id: req.params.id, collegeId: req.collegeId });
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- BRANCHES ----------
router.get('/branches', scopeToCollege, async (req, res) => {
  try {
    const filter = { collegeId: req.collegeId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const branches = await Branch.find(filter).populate('courseId', 'name code').populate('hodId', 'name email').sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/branches', scopeToCollege, async (req, res) => {
  try {
    const { name, code, courseId } = req.body;
    if (!name || !code || !courseId) return res.status(400).json({ error: 'Name, code, and courseId required' });
    const branch = await Branch.create({ collegeId: req.collegeId, courseId, name, code });
    res.status(201).json(branch);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/branches/:id', scopeToCollege, async (req, res) => {
  try {
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, collegeId: req.collegeId },
      req.body,
      { new: true }
    );
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/branches/:id', scopeToCollege, async (req, res) => {
  try {
    await Branch.findOneAndDelete({ _id: req.params.id, collegeId: req.collegeId });
    res.json({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- SECTIONS ----------
router.get('/sections', scopeToCollege, async (req, res) => {
  try {
    const filter = { collegeId: req.collegeId };
    if (req.query.branchId) filter.branchId = req.query.branchId;
    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.sessionId) filter.sessionId = req.query.sessionId;
    if (req.query.year) filter.year = Number(req.query.year);
    if (req.query.semester) filter.semester = Number(req.query.semester);
    const sections = await Section.find(filter)
      .populate('branchId', 'name code')
      .populate('courseId', 'name code durationYears')
      .populate('sessionId', 'label startYear endYear isCurrent')
      .populate('coordinatorId', 'name email role')
      .sort({ year: 1, semester: 1, name: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sections/:id/students', scopeToCollege, async (req, res) => {
  try {
    const section = await Section.findOne({ _id: req.params.id, collegeId: req.collegeId });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    const students = await User.find({
      role: 'Student',
      sectionId: section._id,
      isActive: { $ne: false },
    }).select('name email rollNumber year semester sessionId');
    res.json({ count: students.length, students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sections', scopeToCollege, async (req, res) => {
  try {
    const { name, year, semester, branchId, courseId, sessionId } = req.body;
    if (!name || !year || !branchId || !courseId || !sessionId) {
      return res.status(400).json({ error: 'name, year, branchId, courseId, sessionId required' });
    }
    const section = await Section.create({
      collegeId: req.collegeId,
      courseId,
      branchId,
      sessionId,
      year: Number(year),
      semester: Number(semester) || 1,
      name,
    });
    const populated = await Section.findById(section._id)
      .populate('branchId', 'name code')
      .populate('courseId', 'name code')
      .populate('sessionId', 'label');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/sections/:id', scopeToCollege, async (req, res) => {
  try {
    const section = await Section.findOneAndUpdate(
      { _id: req.params.id, collegeId: req.collegeId },
      req.body,
      { new: true }
    );
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json(section);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/sections/:id/coordinator', scopeToCollege, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const { section, previousCoordinatorId } = await assignSectionCoordinator({
      collegeId: req.collegeId,
      sectionId: req.params.id,
      userId,
      assignedBy: req.currentUser._id,
    });

    const populated = await Section.findById(section._id).populate('coordinatorId', 'name email role designation');
    res.json({ section: populated, previousCoordinatorId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/sections/:id/coordinator', scopeToCollege, async (req, res) => {
  try {
    const { previousCoordinatorId } = await removeSectionCoordinator({
      collegeId: req.collegeId,
      sectionId: req.params.id,
    });
    res.json({ message: 'Coordinator removed', previousCoordinatorId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/sections/:id', scopeToCollege, async (req, res) => {
  try {
    await Section.findOneAndDelete({ _id: req.params.id, collegeId: req.collegeId });
    res.json({ message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- ACADEMIC SESSIONS (years) ----------
router.get('/years', scopeToCollege, async (req, res) => {
  try {
    const years = await AcademicYear.find({ collegeId: req.collegeId }).sort({ startYear: -1 });
    res.json(years);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/years/current', scopeToCollege, async (req, res) => {
  try {
    const session = await getCurrentSession(req.collegeId);
    res.json(session || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/years', scopeToCollege, async (req, res) => {
  try {
    const { startYear } = req.body;
    if (!startYear) {
      return res.status(400).json({ error: 'startYear is required (e.g. 2023 creates session 2023-2024)' });
    }

    const session = normalizeAcademicSession(startYear);
    const isFirst = (await AcademicYear.countDocuments({ collegeId: req.collegeId })) === 0;

    const year = await AcademicYear.create({
      collegeId: req.collegeId,
      label: session.label,
      startYear: session.startYear,
      endYear: session.endYear,
      isCurrent: isFirst,
    });
    res.status(201).json(year);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This academic session already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.patch('/years/:id/set-current', scopeToCollege, async (req, res) => {
  try {
    const session = await setCurrentSession(req.collegeId, req.params.id);
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/years/:id/promote-students', scopeToCollege, async (req, res) => {
  try {
    const { fromSessionId, passedStudentIds, studentIds } = req.body;
    const toSession = await AcademicYear.findOne({ _id: req.params.id, collegeId: req.collegeId });
    if (!toSession) return res.status(404).json({ error: 'Target session not found' });

    const fromSession = fromSessionId
      ? await AcademicYear.findOne({ _id: fromSessionId, collegeId: req.collegeId })
      : await getCurrentSession(req.collegeId);

    if (fromSession && toSession.startYear !== fromSession.startYear + 1) {
      return res.status(400).json({
        error: `Can only promote to the next session (${fromSession.startYear}-${fromSession.startYear + 1} → ${toSession.startYear}-${toSession.endYear})`,
      });
    }

    const results = await promoteStudentsToSession({
      collegeId: req.collegeId,
      fromSessionId: fromSession?._id || fromSessionId || null,
      toSessionId: req.params.id,
      passedStudentIds: passedStudentIds || [],
      studentIds: studentIds || null,
    });
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/years/:id', scopeToCollege, async (req, res) => {
  try {
    const year = await AcademicYear.findOneAndUpdate(
      { _id: req.params.id, collegeId: req.collegeId },
      req.body,
      { new: true }
    );
    if (!year) return res.status(404).json({ error: 'Academic year not found' });
    res.json(year);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/years/:id', scopeToCollege, async (req, res) => {
  try {
    const session = await AcademicYear.findOne({ _id: req.params.id, collegeId: req.collegeId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const [sectionCount, studentCount, userCount] = await Promise.all([
      Section.countDocuments({ sessionId: session._id, collegeId: req.collegeId }),
      StudentCredential.countDocuments({ sessionId: session._id, collegeId: req.collegeId }),
      User.countDocuments({ sessionId: session._id, collegeId: req.collegeId, role: 'Student' }),
    ]);

    if (sectionCount > 0 || studentCount > 0 || userCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete session linked to sections or students. Remove those first.',
      });
    }

    await session.deleteOne();

    if (session.isCurrent) {
      await AcademicYear.updateMany({ collegeId: req.collegeId }, { isCurrent: false });
      const nextSession = await AcademicYear.findOne({
        collegeId: req.collegeId,
        startYear: { $gt: session.startYear },
      }).sort({ startYear: 1 });
      const fallback = await AcademicYear.findOne({ collegeId: req.collegeId }).sort({ startYear: -1 });
      const toActivate = nextSession || fallback;
      if (toActivate) {
        toActivate.isCurrent = true;
        await toActivate.save();
      }
    }

    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- CATEGORIES ----------
const categoryRoutes = (basePath) => {
  router.get(basePath, scopeToCollege, async (req, res) => {
    try {
      const categories = await ProblemCategory.find({ collegeId: req.collegeId }).sort({ name: 1 });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post(basePath, scopeToCollege, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const category = await ProblemCategory.create({ collegeId: req.collegeId, name, description });
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put(`${basePath}/:id`, scopeToCollege, async (req, res) => {
    try {
      const category = await ProblemCategory.findOneAndUpdate(
        { _id: req.params.id, collegeId: req.collegeId },
        req.body,
        { new: true }
      );
      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete(`${basePath}/:id`, scopeToCollege, async (req, res) => {
    try {
      await ProblemCategory.findOneAndDelete({ _id: req.params.id, collegeId: req.collegeId });
      res.json({ message: 'Category deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

categoryRoutes('/categories');
categoryRoutes('/problem-categories');

// ---------- STUDENT CREDENTIALS ----------
router.get('/students', scopeToCollege, async (req, res) => {
  try {
    const filter = { collegeId: req.collegeId };
    if (req.query.status) filter.status = req.query.status;
    const credentials = await StudentCredential.find(filter)
      .populate('courseId', 'name code')
      .populate('branchId', 'name code')
      .populate({
        path: 'sectionId',
        select: 'name year semester coordinatorId',
        populate: { path: 'coordinatorId', select: 'name email' },
      })
      .populate('sessionId', 'label startYear endYear')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/students', scopeToCollege, async (req, res) => {
  try {
    const { rollNumber, name, courseId, branchId, year, sectionId, sessionId, semester, email } = req.body;
    if (!rollNumber || !name || !courseId || !branchId || !year || !sectionId || !sessionId) {
      return res.status(400).json({
        error: 'rollNumber, name, courseId, branchId, year, sectionId, sessionId required',
      });
    }
    const credential = await StudentCredential.create({
      collegeId: req.collegeId,
      rollNumber: rollNumber.trim(),
      name: name.trim(),
      courseId,
      branchId,
      year: Number(year),
      semester: Number(semester) || 1,
      sessionId,
      sectionId,
      email: email || null,
      status: 'pending',
    });
    res.status(201).json(credential);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Roll number already exists for this college' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.patch('/students/:id', scopeToCollege, async (req, res) => {
  try {
    const credential = await StudentCredential.findOne({
      _id: req.params.id,
      collegeId: req.collegeId,
      status: 'pending',
    });
    if (!credential) return res.status(404).json({ error: 'Student not found or already activated' });

    const allowed = ['rollNumber', 'name', 'courseId', 'branchId', 'year', 'sectionId', 'sessionId', 'semester', 'email'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'rollNumber' || key === 'name') credential[key] = String(req.body[key]).trim();
        else if (key === 'year' || key === 'semester') credential[key] = Number(req.body[key]);
        else credential[key] = req.body[key] || null;
      }
    }
    await credential.save();
    res.json(credential);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Roll number already exists for this college' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.patch('/students/:id/deactivate', scopeToCollege, async (req, res) => {
  try {
    const credential = await StudentCredential.findOne({ _id: req.params.id, collegeId: req.collegeId });
    if (!credential) return res.status(404).json({ error: 'Student not found' });

    credential.isActive = false;
    await credential.save();

    if (credential.userId) {
      await User.findByIdAndUpdate(credential.userId, { isActive: false });
    }

    res.json({ message: 'Student deactivated', credential });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/students/:id', scopeToCollege, async (req, res) => {
  try {
    const result = await StudentCredential.findOneAndDelete({
      _id: req.params.id,
      collegeId: req.collegeId,
      status: 'pending',
    });
    if (!result) return res.status(404).json({ error: 'Student not found or already activated' });
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- USERS ----------
router.post('/users', scopeToCollege, async (req, res) => {
  try {
    const { name, email, password, role, phone, designation, branchId, employeeId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }

    if (!['Faculty', 'Staff'].includes(role)) {
      return res.status(400).json({ error: 'Only Faculty or Staff can be created from admin panel' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || null,
      role,
      collegeId: req.collegeId,
      branchId: branchId || null,
      designation: designation || null,
      employeeId: employeeId || null,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });

    const safe = user.toObject();
    delete safe.password;
    res.status(201).json(safe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/users', scopeToCollege, async (req, res) => {
  try {
    const filter = req.collegeId ? { collegeId: req.collegeId } : {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    const users = await User.find(filter, '-password')
      .populate('branchId', 'name code')
      .populate('sectionId', 'name year')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:id/promote-admin', scopeToCollege, async (req, res) => {
  try {
    const target = await User.findOne({ _id: req.params.id, collegeId: req.collegeId });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (!['Faculty', 'Staff'].includes(target.role)) {
      return res.status(400).json({ error: 'Only Faculty or Staff can be promoted to Admin' });
    }
    target.role = 'Admin';
    await target.save();
    await syncUserDesignation(target._id, req.collegeId);
    res.json({ message: 'User promoted to Admin', user: target });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/users/:id/demote-admin', scopeToCollege, async (req, res) => {
  try {
    const target = await User.findOne({ _id: req.params.id, collegeId: req.collegeId });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'Owner') return res.status(400).json({ error: 'Cannot demote the Owner' });
    if (target.role !== 'Admin') return res.status(400).json({ error: 'User is not an Admin' });
    const { revertRole } = req.body;
    if (!['Faculty', 'Staff'].includes(revertRole)) {
      return res.status(400).json({ error: 'revertRole must be Faculty or Staff' });
    }
    target.role = revertRole;
    await target.save();
    await syncUserDesignation(target._id, req.collegeId);
    res.json({ message: 'Admin demoted', user: target });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/users/:id/deactivate', scopeToCollege, async (req, res) => {
  try {
    const target = await User.findOne({ _id: req.params.id, collegeId: req.collegeId });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'Owner') return res.status(400).json({ error: 'Cannot deactivate the Owner' });
    await revokeAllUserAssignments(target._id, req.collegeId);
    target.isActive = false;
    await target.save();
    res.json({ message: 'User deactivated and responsibilities revoked', user: target });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ---------- ASSIGNMENTS (legacy + spec endpoints) ----------
router.get('/assignments', scopeToCollege, async (req, res) => {
  try {
    const [assignments, domains] = await Promise.all([
      Assignment.find({ collegeId: req.collegeId })
        .populate('userId', 'name email role avatar')
        .populate('studentId', 'name rollNumber email year semester')
        .populate('sectionId', 'name year semester')
        .populate('branchId', 'name code')
        .populate('courseId', 'name code')
        .populate('sessionId', 'label startYear endYear')
        .populate('problemCategoryId', 'name')
        .sort({ createdAt: -1 }),
      DomainAssignment.find({ collegeId: req.collegeId, isActive: true })
        .populate('solverId', 'name email role avatar')
        .populate('categoryId', 'name'),
    ]);
    res.json({ assignments, domainAssignments: domains });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/assignments/hod', scopeToCollege, async (req, res) => {
  try {
    const { userId, branchId } = req.body;
    const { branch, previousHodId } = await assignHODToBranch({
      collegeId: req.collegeId,
      branchId,
      userId,
      assignedBy: req.currentUser._id,
    });
    res.status(201).json({
      message: previousHodId ? 'HOD changed' : 'HOD assigned',
      branch,
      previousHodId,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/assignments/hod', scopeToCollege, async (req, res) => {
  try {
    const { branchId } = req.body;
    const { previousHodId } = await removeHODFromBranch({ collegeId: req.collegeId, branchId });
    res.json({ message: 'HOD assignment removed', previousHodId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/assignments/director', scopeToCollege, async (req, res) => {
  try {
    const { userId } = req.body;
    const { previousDirectorId } = await assignDirector({
      collegeId: req.collegeId,
      userId,
      assignedBy: req.currentUser._id,
    });
    res.status(201).json({
      message: previousDirectorId ? 'Director changed' : 'Director assigned',
      directorId: userId,
      previousDirectorId,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/assignments/director', scopeToCollege, async (req, res) => {
  try {
    const { previousDirectorId } = await removeDirector({ collegeId: req.collegeId });
    res.json({ message: 'Director assignment removed', previousDirectorId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/assignments/domain', scopeToCollege, async (req, res) => {
  try {
    const { userId, categoryId } = req.body;
    const { previousSolverId } = await assignDomainSolver({
      collegeId: req.collegeId,
      userId,
      categoryId,
      assignedBy: req.currentUser._id,
    });
    const domain = await DomainAssignment.findOne({ collegeId: req.collegeId, categoryId })
      .populate('solverId', 'name email role designation')
      .populate('categoryId', 'name');
    res.status(201).json({ ...domain.toObject(), previousSolverId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/assignments/domain', scopeToCollege, async (req, res) => {
  try {
    const { categoryId } = req.body;
    const { previousSolverId } = await removeDomainSolver({ collegeId: req.collegeId, categoryId });
    res.json({ message: 'Domain solver removed', previousSolverId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/assignments', scopeToCollege, async (req, res) => {
  try {
    const {
      userId, type, sectionId, branchId, courseId, sessionId, year, semester,
      problemCategoryId, studentId,
    } = req.body;
    const user = await User.findOne({ _id: userId, collegeId: req.collegeId });
    if (!user) return res.status(404).json({ error: 'User not found in this college' });

    if (type === 'SectionCoordinator') {
      if (!sectionId) return res.status(400).json({ error: 'sectionId required for coordinator' });

      const { section, previousCoordinatorId } = await assignSectionCoordinator({
        collegeId: req.collegeId,
        sectionId,
        userId,
        assignedBy: req.currentUser._id,
      });

      const studentCount = await countStudentsInSection(sectionId);

      const coordinatorAssignment = await Assignment.findOne({
        sectionId,
        type: 'SectionCoordinator',
      });

      const populated = await Assignment.findById(coordinatorAssignment._id)
        .populate('userId', 'name email role designation')
        .populate('sectionId', 'name year semester')
        .populate('sessionId', 'label')
        .populate('branchId', 'name')
        .populate('courseId', 'name code');

      return res.status(201).json({
        ...populated.toObject(),
        studentCount,
        previousCoordinatorId,
      });
    }

    if (type === 'HOD') {
      if (!branchId) return res.status(400).json({ error: 'branchId required for HOD' });
      const { branch, previousHodId } = await assignHODToBranch({
        collegeId: req.collegeId,
        branchId,
        userId,
        assignedBy: req.currentUser._id,
      });
      const hodAssignment = await Assignment.findOne({ branchId, type: 'HOD' });
      return res.status(201).json({
        message: previousHodId ? 'HOD changed' : 'HOD assigned',
        assignment: hodAssignment,
        branch,
        previousHodId,
      });
    }

    const assignment = await Assignment.create({
      userId,
      collegeId: req.collegeId,
      type,
      sectionId: sectionId || null,
      branchId: branchId || null,
      problemCategoryId: problemCategoryId || null,
      studentId: studentId || null,
      assignedBy: req.currentUser._id,
    });

    await assignment.populate([
      { path: 'userId', select: 'name email role avatar' },
      { path: 'sectionId', select: 'name year' },
      { path: 'branchId', select: 'name code' },
      { path: 'problemCategoryId', select: 'name' },
    ]);

    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/assignments/:id', scopeToCollege, async (req, res) => {
  try {
    const result = await Assignment.findOneAndDelete({ _id: req.params.id, collegeId: req.collegeId });
    if (!result) return res.status(404).json({ error: 'Assignment not found' });
    await revokeAssignmentRecord(result, req.collegeId);
    res.json({ message: 'Assignment revoked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
