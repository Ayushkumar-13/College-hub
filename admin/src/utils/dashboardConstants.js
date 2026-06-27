import {
  LayoutDashboard, Building2, BookOpen, GitBranch, Layers,
  Tags, UserCog, Users, GraduationCap, Calendar, KeyRound,
} from 'lucide-react';

export const STUDENT_APP_URL = import.meta.env.VITE_STUDENT_APP_URL || 'http://localhost:3000';

export const DASHBOARD_STAT_ORDER = [
  'faculty', 'staff', 'students', 'pendingStudents',
  'courses', 'branches', 'sections', 'categories', 'assignments',
];

export const DASHBOARD_STAT_LABELS = {
  faculty: 'Faculty',
  staff: 'Staff',
  students: 'Students',
  pendingStudents: 'Pending Students',
  courses: 'Courses',
  branches: 'Branches',
  sections: 'Sections',
  categories: 'Categories',
  assignments: 'Assignments',
};

export const DASHBOARD_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'colleges', label: 'College', icon: Building2, superOnly: true },
  { id: 'adminAccount', label: 'Admin Login', icon: KeyRound, ownerOnly: true },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'assignments', label: 'Assignments', icon: UserCog },
  { id: 'users', label: 'Users', icon: Users },
];

export function getDashboardTabLabel(tabId) {
  return DASHBOARD_TABS.find((t) => t.id === tabId)?.label || 'Dashboard';
}
