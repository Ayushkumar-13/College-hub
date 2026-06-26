import AcademicYear from '../models/AcademicYear.js';
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import User from '../models/User.js';

export async function getCurrentSession(collegeId) {
  return AcademicYear.findOne({ collegeId, isCurrent: true, isActive: true });
}

export async function setCurrentSession(collegeId, sessionId) {
  await AcademicYear.updateMany({ collegeId }, { isCurrent: false });
  const session = await AcademicYear.findOneAndUpdate(
    { _id: sessionId, collegeId },
    { isCurrent: true, isActive: true },
    { new: true }
  );
  if (!session) throw new Error('Session not found');
  return session;
}

export function formatSessionLabel(startYear, endYear = startYear + 1) {
  return `${startYear}-${endYear}`;
}

/** Academic session = one year span (e.g. 2023-2024), not full course duration. */
export function normalizeAcademicSession(startYear) {
  const start = Number(startYear);
  if (!Number.isInteger(start) || start < 2000 || start > 2100) {
    throw new Error('Enter a valid session start year (e.g. 2023 for 2023-2024)');
  }
  const end = start + 1;
  return {
    startYear: start,
    endYear: end,
    label: formatSessionLabel(start, end),
  };
}

export async function promoteStudentsToSession({
  collegeId,
  fromSessionId,
  toSessionId,
  studentIds = null,
  passedStudentIds = [],
}) {
  const toSession = await AcademicYear.findOne({ _id: toSessionId, collegeId });
  if (!toSession) throw new Error('Target session not found');

  const filter = {
    collegeId,
    role: 'Student',
    isActive: { $ne: false },
  };
  if (fromSessionId) filter.sessionId = fromSessionId;
  if (studentIds?.length) filter._id = { $in: studentIds };

  const students = await User.find(filter).populate('courseId', 'durationYears');
  const passedSet = new Set(passedStudentIds.map(String));
  const results = { promoted: 0, graduated: 0, skipped: 0, errors: [] };

  for (const student of students) {
    try {
      if (passedStudentIds.length && !passedSet.has(student._id.toString())) {
        results.skipped += 1;
        continue;
      }

      const maxYear = student.courseId?.durationYears || 4;
      let nextYear = student.year || 1;
      let nextSemester = student.semester || 1;

      if (nextSemester === 1) {
        nextSemester = 2;
      } else {
        nextSemester = 1;
        nextYear += 1;
      }

      if (nextYear > maxYear) {
        results.graduated += 1;
        student.sessionId = toSessionId;
        await student.save();
        continue;
      }

      const currentSection = await Section.findById(student.sectionId);
      let nextSection = null;
      if (currentSection) {
        nextSection = await Section.findOne({
          collegeId,
          branchId: student.branchId,
          sessionId: toSessionId,
          year: nextYear,
          semester: nextSemester,
          name: currentSection.name,
          isActive: true,
        });
      }

      student.year = nextYear;
      student.semester = nextSemester;
      student.sessionId = toSessionId;
      if (nextSection) student.sectionId = nextSection._id;
      await student.save();
      results.promoted += 1;
    } catch (err) {
      results.errors.push({ studentId: student._id, error: err.message });
    }
  }

  await setCurrentSession(collegeId, toSessionId);
  return results;
}

export async function countStudentsInSection(sectionId) {
  return User.countDocuments({ role: 'Student', sectionId, isActive: { $ne: false } });
}
