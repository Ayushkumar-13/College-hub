export const USER_ROLES = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  STAFF: 'Staff',
  OWNER: 'Owner',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'SuperAdmin',
};

export const ASSIGNMENT_TYPES = {
  SECTION_COORDINATOR: 'SectionCoordinator',
  HOD: 'HOD',
  DIRECTOR: 'Director',
  DOMAIN_SOLVER: 'DomainSolver',
};

export const ASSIGNMENT_LABELS = {
  SectionCoordinator: 'Section Coordinator',
  HOD: 'HOD',
  Director: 'Director',
  DomainSolver: 'Domain Problem Solver',
};

export const ADMIN_ROLES = [USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER, USER_ROLES.ADMIN];

export function isAdminUser(user) {
  return user && ADMIN_ROLES.includes(user.role);
}

export function sortByName(items, key = 'name') {
  return [...items].sort((a, b) => String(a[key] || '').localeCompare(String(b[key] || '')));
}

/** Absolute semester for a year (Year 1 → 1,2 · Year 2 → 3,4 · etc.) */
export function semesterOptionsForYear(year) {
  const y = Number(year);
  if (!y || y < 1) return [];
  return [(y - 1) * 2 + 1, (y - 1) * 2 + 2];
}

export function toAbsoluteSemester(year, storedSemester) {
  return (Number(year) - 1) * 2 + Number(storedSemester);
}

/** Convert UI absolute semester (1–8) to stored value (1 or 2 within the year) */
export function toStoredSemester(year, absoluteSemester) {
  const sem = Number(absoluteSemester);
  const y = Number(year);
  if (!y || !sem) return sem;
  if (sem <= 2 && y === 1) return sem;
  return ((sem - 1) % 2) + 1;
}

export function yearOptionsForCourse(courses, courseId) {
  if (!courseId) return [];
  const course = courses.find((c) => (c._id || c.id)?.toString() === courseId.toString());
  const duration = course?.durationYears || 0;
  return Array.from({ length: duration }, (_, i) => i + 1);
}
