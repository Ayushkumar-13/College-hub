/**
 * Migration script for existing College Hub data
 * Run: node scripts/migrate.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Branch from '../models/Branch.js';
import Section from '../models/Section.js';
import College from '../models/College.js';
import Assignment from '../models/Assignment.js';
import StudentCredential from '../models/StudentCredential.js';
import { getStudentCoordinator } from '../utils/assignmentHelpers.js';

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected for migration\n');

  let deptMapped = 0;
  let deptFlagged = 0;

  const usersWithDept = await User.find({ department: { $ne: null }, branchId: null });
  for (const user of usersWithDept) {
    if (!user.collegeId || !user.department) continue;
    const branch = await Branch.findOne({
      collegeId: user.collegeId,
      name: { $regex: new RegExp(user.department, 'i') },
    });
    if (branch) {
      user.branchId = branch._id;
      user.courseId = branch.courseId;
      deptMapped++;
      await user.save();
    } else {
      deptFlagged++;
      console.warn(`⚠️  User ${user.email}: department "${user.department}" — no matching branch`);
    }
  }

  const legacyRoles = ['Director', 'HOD', 'Coordinator'];
  const oldRoleUsers = await User.find({ role: { $in: legacyRoles } });
  for (const user of oldRoleUsers) {
    const prevRole = user.role;
    user.role = prevRole === 'HOD' || prevRole === 'Coordinator' ? 'Faculty' : 'Staff';
    await user.save();
    console.log(`Migrated legacy role ${prevRole} → ${user.role} for ${user.email}`);
  }

  const issues = await Issue.find({
    $or: [
      { escalationLevel: { $in: ['assigned', 'Director', 'Owner', null] } },
      { coordinatorId: null },
    ],
    status: { $ne: 'Resolved' },
  });

  let issuesUpdated = 0;
  for (const issue of issues) {
    const reporter = await User.findById(issue.userId);
    if (!reporter) continue;

    if (!issue.collegeId && reporter.collegeId) {
      issue.collegeId = reporter.collegeId;
    }

    if (!issue.categoryId && issue.problemCategoryId) {
      issue.categoryId = issue.problemCategoryId;
    }

    const levelMap = {
      assigned: 'coordinator',
      Director: 'director',
      Owner: 'owner',
    };
    if (levelMap[issue.escalationLevel]) {
      issue.escalationLevel = levelMap[issue.escalationLevel];
    } else if (!issue.escalationLevel) {
      issue.escalationLevel = 'coordinator';
    }

    if (!issue.coordinatorId && reporter.sectionId) {
      const section = await Section.findById(reporter.sectionId);
      if (section?.coordinatorId) {
        issue.coordinatorId = section.coordinatorId;
      } else {
        const coord = await getStudentCoordinator(reporter);
        if (coord) issue.coordinatorId = coord._id;
      }
    }

    if (!issue.currentAssigneeId && issue.assignedTo) {
      issue.currentAssigneeId = issue.assignedTo;
    }

  if (issue.escalationHistory?.length) {
      issue.escalationHistory = issue.escalationHistory.map((h) => ({
        level: h.level || h.role,
        role: h.role || h.level,
        userId: h.userId,
        assignedAt: h.assignedAt || h.escalatedAt,
        escalatedAt: h.escalatedAt,
        action: h.action || 'migrated',
      }));
    }

    await issue.save();
    issuesUpdated++;
  }

  const credentials = await StudentCredential.find({});
  let credMigrated = 0;
  for (const cred of credentials) {
    let changed = false;
    if (!cred.name) {
      cred.name = cred.rollNumber;
      changed = true;
    }
    if (cred.status === undefined) {
      cred.status = cred.used ? 'active' : 'pending';
      changed = true;
    }
    if (cred.usedBy && !cred.userId) {
      cred.userId = cred.usedBy;
      changed = true;
    }
    if (cred.isActive === undefined) {
      cred.isActive = true;
      changed = true;
    }
    if (changed) {
      await cred.save();
      credMigrated++;
    }
  }

  const colleges = await College.find({});
  for (const college of colleges) {
    if (!college.ownerId) {
      const owner = await User.findOne({ collegeId: college._id, role: 'Owner' });
      if (owner) {
        college.ownerId = owner._id;
        await college.save();
      }
    }
    if (!college.directorId) {
      const dir = await Assignment.findOne({ collegeId: college._id, type: 'Director' });
      if (dir) {
        college.directorId = dir.userId;
        await college.save();
      }
    }
  }

  console.log('\n--- Migration summary ---');
  console.log(`Department → branch mapped: ${deptMapped}`);
  console.log(`Department flagged for review: ${deptFlagged}`);
  console.log(`Student credentials migrated: ${credMigrated}`);
  console.log(`Issues updated: ${issuesUpdated}`);
  console.log('Done.\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
