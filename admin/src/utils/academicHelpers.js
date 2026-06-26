import { toStoredSemester } from '@/utils/constants';

export function filterBranches(branches, courseId) {
  if (!courseId) return branches;
  return branches.filter((b) => b.courseId === courseId || b.courseId?._id === courseId);
}

export function filterSections(sections, { sessionId, courseId, branchId, year, semester } = {}) {
  const storedSemester = year && semester
    ? toStoredSemester(year, semester)
    : semester
      ? Number(semester)
      : null;

  return sections.filter((s) => {
    const sid = s.sessionId?._id || s.sessionId;
    if (sessionId && sid !== sessionId) return false;
    const cid = s.courseId?._id || s.courseId;
    if (courseId && cid !== courseId) return false;
    const bid = s.branchId?._id || s.branchId;
    if (branchId && bid !== branchId) return false;
    if (year && s.year !== Number(year)) return false;
    if (storedSemester && s.semester !== storedSemester) return false;
    return true;
  });
}
