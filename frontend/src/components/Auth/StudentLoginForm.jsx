import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { authApi } from '@/api/authApi';
import { ROUTES, semesterOptionsForYear, toStoredSemester } from '@/utils/constants';
import DemoLoginBanner from '@/components/Auth/DemoLoginBanner';

const inputClass =
  'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-text-main border border-border-card rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-text-dim/50';

function formatStudentLabel(student, duplicateNames) {
  if (duplicateNames.has(student.name)) {
    return `${student.name} (Roll: ${student.rollNumber})`;
  }
  return student.name;
}

const StudentLoginForm = () => {
  const { studentActivate, studentLogin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [college, setCollege] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [path, setPath] = useState({
    sessionId: '',
    courseId: '',
    branchId: '',
    year: '',
    semester: '',
    sectionId: '',
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authApi.getRegistrationCollege()
      .then((data) => {
        setCollege(data);
        return authApi.getSessions(data._id || data.id);
      })
      .then(setSessions)
      .catch(() => setError('Could not load college data. Contact your admin.'));
  }, []);

  useEffect(() => {
    if (!college?._id && !college?.id) return;
    const collegeId = college._id || college.id;
    if (path.courseId) {
      authApi.getBranches(collegeId, path.courseId).then(setBranches).catch(() => setBranches([]));
    } else {
      setBranches([]);
    }
  }, [college, path.courseId]);

  useEffect(() => {
    if (!college) return;
    const collegeId = college._id || college.id;
    authApi.getCourses(collegeId).then(setCourses).catch(() => setCourses([]));
  }, [college]);

  useEffect(() => {
    if (!college || !path.branchId || !path.sessionId) {
      setSections([]);
      return;
    }
    const collegeId = college._id || college.id;
    authApi
      .getSections(collegeId, path.branchId, {
        year: path.year,
        sessionId: path.sessionId,
        semester: toStoredSemester(path.year, path.semester),
      })
      .then(setSections)
      .catch(() => setSections([]));
  }, [college, path.branchId, path.sessionId, path.year, path.semester]);

  const selectedCourse = courses.find((c) => (c._id || c.id) === path.courseId);
  const maxYear = selectedCourse?.durationYears || 4;
  const semesterOptions = semesterOptionsForYear(path.year);

  const loadStudents = async () => {
    if (!path.sectionId) {
      setError('Please complete the academic path');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await authApi.getStudentsInSection(path.sectionId);
      setStudents(data.students || []);
      if ((data.students || []).length === 0) {
        setError('No students found in this section. Contact your admin.');
      } else {
        setStep(2);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handlePathNext = (e) => {
    e.preventDefault();
    if (!path.sessionId || !path.courseId || !path.branchId || !path.year || !path.semester || !path.sectionId) {
      setError('Please select session, course, branch, year, semester, and section');
      return;
    }
    loadStudents();
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStep(3);
    setError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        sectionId: path.sectionId,
        rollNumber: selectedStudent.rollNumber,
        password,
      };

      const result = selectedStudent.status === 'pending'
        ? await studentActivate(payload)
        : await studentLogin(payload);

      if (result.success) {
        navigate(ROUTES.HOME);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err?.error || err?.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const nameCounts = students.reduce((acc, s) => {
    acc[s.name] = (acc[s.name] || 0) + 1;
    return acc;
  }, {});
  const duplicateNames = new Set(
    Object.entries(nameCounts).filter(([, count]) => count > 1).map(([name]) => name)
  );

  return (
    <>
      <DemoLoginBanner
        variant="student"
        onUseDemo={(account) => {
          if (!account.path) return;
          setPath({
            sessionId: account.path.sessionId,
            courseId: account.path.courseId,
            branchId: account.path.branchId,
            year: account.path.year,
            semester: account.path.semester,
            sectionId: account.path.sectionId,
          });
          setError('');
        }}
      />
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handlePathNext} className="space-y-4">
          <p className="text-sm text-text-dim">Step 1 — Select your academic path</p>
          <select
            className={inputClass}
            value={path.sessionId}
            onChange={(e) => setPath({ ...path, sessionId: e.target.value, sectionId: '' })}
            required
          >
            <option value="">Session</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>{s.label}</option>
            ))}
          </select>
          <select
            className={inputClass}
            value={path.courseId}
            onChange={(e) => setPath({ ...path, courseId: e.target.value, branchId: '', sectionId: '' })}
            required
          >
            <option value="">Course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            className={inputClass}
            value={path.branchId}
            onChange={(e) => setPath({ ...path, branchId: e.target.value, sectionId: '' })}
            required
          >
            <option value="">Branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          <select
            className={inputClass}
            value={path.year}
            onChange={(e) => setPath({ ...path, year: Number(e.target.value), semester: '', sectionId: '' })}
            required
            disabled={!path.courseId}
          >
            <option value="">Year</option>
            {Array.from({ length: maxYear }, (_, i) => i + 1).map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
          <select
            className={inputClass}
            value={path.semester}
            onChange={(e) => setPath({ ...path, semester: Number(e.target.value), sectionId: '' })}
            required
            disabled={!path.year}
          >
            <option value="">Semester</option>
            {semesterOptions.map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
          <select
            className={inputClass}
            value={path.sectionId}
            onChange={(e) => setPath({ ...path, sectionId: e.target.value })}
            required
            disabled={!path.semester}
          >
            <option value="">Section</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Continue'}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-text-dim">Step 2 — Select your name</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.rollNumber}
                type="button"
                onClick={() => handleSelectStudent(s)}
                className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-border-card rounded-xl hover:border-blue-500 transition-colors"
              >
                <span className="font-medium text-text-main">{formatStudentLabel(s, duplicateNames)}</span>
                {s.status === 'pending' && (
                  <span className="ml-2 text-xs text-amber-600">— activate</span>
                )}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep(1)} className="text-sm text-text-dim hover:text-text-main">
            ← Back to path selection
          </button>
        </div>
      )}

      {step === 3 && selectedStudent && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <p className="text-sm text-text-dim">
            Step 3 — {selectedStudent.status === 'pending' ? 'Create your password' : 'Enter your password'}
          </p>
          <p className="text-text-main font-medium">
            {formatStudentLabel(selectedStudent, duplicateNames)}
          </p>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={selectedStudent.status === 'pending' ? 'Create password (min 6 chars)' : 'Password'}
              className={inputClass}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-text-dim hover:text-text-main"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : selectedStudent.status === 'pending'
                ? 'Activate & Login'
                : 'Login'}
          </button>
          <button type="button" onClick={() => setStep(2)} className="text-sm text-text-dim hover:text-text-main">
            ← Back to name selection
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-text-dim text-sm space-y-2">
        <p>
          Faculty or staff?{' '}
          <Link to={ROUTES.LOGIN} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Email login
          </Link>
        </p>
      </div>
    </>
  );
};

export default StudentLoginForm;
