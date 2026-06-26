import { useState, useCallback } from 'react';
import { adminApi } from '@/api/adminApi';

export function useDashboardData({ isSuper, defaultCollege, activeTab, userSearch, userRoleFilter }) {
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(defaultCollege || '');
  const [dashboard, setDashboard] = useState(null);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState({ assignments: [], domainAssignments: [] });
  const [studentCredentials, setStudentCredentials] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const collegeId = isSuper ? selectedCollege : defaultCollege;

  const loadColleges = useCallback(async () => {
    if (!isSuper) return;
    const data = await adminApi.getColleges();
    setColleges(data);
    if (data.length > 0) {
      setSelectedCollege(data[0]._id);
    }
  }, [isSuper]);

  const refresh = useCallback(async () => {
    if (!collegeId && activeTab !== 'colleges') return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'dashboard' && collegeId) {
        setDashboard(await adminApi.getDashboard(collegeId));
      }
      if (activeTab === 'courses' && collegeId) {
        setCourses(await adminApi.getCourses(collegeId));
      }
      if (activeTab === 'branches' && collegeId) {
        const [c, b, u] = await Promise.all([
          adminApi.getCourses(collegeId),
          adminApi.getBranches(collegeId),
          adminApi.getUsers(collegeId, { role: 'Faculty' }),
        ]);
        setCourses(c);
        setBranches(b);
        setUsers(u);
      }
      if (activeTab === 'sessions' && collegeId) {
        setSessions(await adminApi.getYears(collegeId));
      }
      if (activeTab === 'sections' && collegeId) {
        const [c, b, s, sess, u] = await Promise.all([
          adminApi.getCourses(collegeId),
          adminApi.getBranches(collegeId),
          adminApi.getSections(collegeId),
          adminApi.getYears(collegeId),
          adminApi.getUsers(collegeId, { role: 'Faculty' }),
        ]);
        setCourses(c);
        setBranches(b);
        setSections(s);
        setSessions(sess);
        setUsers(u);
      }
      if (activeTab === 'categories' && collegeId) {
        setCategories(await adminApi.getCategories(collegeId));
      }
      if (activeTab === 'students' && collegeId) {
        const [creds, c, b, s, sess] = await Promise.all([
          adminApi.getStudentCredentials(collegeId),
          adminApi.getCourses(collegeId),
          adminApi.getBranches(collegeId),
          adminApi.getSections(collegeId),
          adminApi.getYears(collegeId),
        ]);
        setStudentCredentials(creds);
        setCourses(c);
        setBranches(b);
        setSections(s);
        setSessions(sess);
      }
      if (activeTab === 'assignments' && collegeId) {
        const [a, u, cat, sec, br, sess, crs] = await Promise.all([
          adminApi.getAssignments(collegeId),
          adminApi.getUsers(collegeId),
          adminApi.getCategories(collegeId),
          adminApi.getSections(collegeId),
          adminApi.getBranches(collegeId),
          adminApi.getYears(collegeId),
          adminApi.getCourses(collegeId),
        ]);
        setAssignments(a);
        setUsers(u);
        setCategories(cat);
        setSections(sec);
        setBranches(br);
        setSessions(sess);
        setCourses(crs);
      }
      if (activeTab === 'users' && collegeId) {
        const params = {};
        if (userSearch) params.search = userSearch;
        if (userRoleFilter && userRoleFilter !== 'all') params.role = userRoleFilter;
        setUsers(await adminApi.getUsers(collegeId, params));
      }
    } catch (err) {
      setError(err?.error || err?.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, collegeId, userSearch, userRoleFilter]);

  return {
    collegeId,
    colleges,
    dashboard,
    courses,
    branches,
    sections,
    sessions,
    categories,
    assignments,
    studentCredentials,
    users,
    error,
    loading,
    loadColleges,
    refresh,
  };
}
