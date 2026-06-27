import React, { useState, useEffect } from 'react';
import Panel from '../Panel';
import { inputClass, btnPrimary } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';
import { filterBranches, filterSections } from '@/utils/academicHelpers';
import {
  ASSIGNMENT_TYPES,
  ASSIGNMENT_LABELS,
  sortByName,
  semesterOptionsForYear,
  toAbsoluteSemester,
  yearOptionsForCourse,
} from '@/utils/constants';

export default function AssignmentsPanel({
  collegeId,
  assignments,
  users,
  branches,
  sections,
  courses,
  sessions,
  categories,
  onRefresh,
  loading,
}) {
  const [form, setForm] = useState({
    userId: '',
    type: ASSIGNMENT_TYPES.SECTION_COORDINATOR,
    sessionId: '',
    courseId: '',
    branchId: '',
    year: '',
    semester: '',
    sectionId: '',
    categoryId: '',
  });
  const [studentCount, setStudentCount] = useState(null);

  const list = assignments?.assignments || [];
  const domains = assignments?.domainAssignments || [];
  const facultyOnly = users.filter((u) => u.role === 'Faculty');
  const facultyStaff = users.filter((u) => ['Faculty', 'Staff'].includes(u.role));
  const assignmentTypes = Object.entries(ASSIGNMENT_LABELS).filter(([k]) => k !== 'HOD');

  const filteredBranches = filterBranches(branches, form.courseId);
  const filteredSections = filterSections(sections, {
    sessionId: form.sessionId,
    courseId: form.courseId,
    branchId: form.branchId,
    year: form.year,
    semester: form.semester,
  });

  const assignmentYearOptions = yearOptionsForCourse(courses, form.courseId);
  const assignmentSemesterOptions = semesterOptionsForYear(form.year);

  useEffect(() => {
    if (!form.sectionId || form.type !== ASSIGNMENT_TYPES.SECTION_COORDINATOR) {
      setStudentCount(null);
      return;
    }
    adminApi.getSectionStudents(collegeId, form.sectionId).then((r) => setStudentCount(r.count)).catch(() => setStudentCount(null));
  }, [collegeId, form.sectionId, form.type]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (form.type === ASSIGNMENT_TYPES.DIRECTOR) {
        await adminApi.assignDirector(collegeId, form.userId);
      } else if (form.type === ASSIGNMENT_TYPES.DOMAIN_SOLVER) {
        await adminApi.assignDomainSolver(collegeId, { userId: form.userId, categoryId: form.categoryId });
      } else {
        await adminApi.createAssignment(collegeId, { userId: form.userId, type: form.type, sectionId: form.sectionId });
      }
      window.showToast?.('Assignment saved', 'success');
      setForm({
        userId: '', type: ASSIGNMENT_TYPES.SECTION_COORDINATOR,
        sessionId: form.sessionId, courseId: '', branchId: '', year: '', semester: '', sectionId: '', categoryId: '',
      });
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Assignment failed', 'error');
    }
  };

  return (
    <Panel title="Responsibility Assignments">
      <p className="text-sm text-text-dim mb-4">
        Assign coordinators on the <strong>Sections</strong> tab (one faculty per section).
        Students inherit their section&apos;s coordinator automatically for issues and contacts.
        You can also use the Assignments tab for the same purpose.
      </p>
      <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-3 mb-6 p-4 admin-subtle rounded-xl">
        <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {assignmentTypes.map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className={inputClass} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required>
          <option value="">Select Faculty/Staff *</option>
          {(form.type === ASSIGNMENT_TYPES.SECTION_COORDINATOR ? facultyOnly : facultyStaff).map((u) => (
            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
          ))}
        </select>
        {form.type === ASSIGNMENT_TYPES.SECTION_COORDINATOR && (
          <>
            <select className={inputClass} value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value, sectionId: '' })} required>
              <option value="">Session *</option>
              {sessions.map((s) => <option key={s._id} value={s._id}>{s.label}</option>)}
            </select>
            <select className={inputClass} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value, branchId: '', sectionId: '', year: '', semester: '' })} required>
              <option value="">Course *</option>
              {sortByName(courses).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select className={inputClass} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value, sectionId: '' })} required>
              <option value="">Branch *</option>
              {filteredBranches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <select
              className={inputClass}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value, semester: '', sectionId: '' })}
              required
              disabled={!form.courseId || assignmentYearOptions.length === 0}
            >
              <option value="">{assignmentYearOptions.length === 0 && form.courseId ? 'Set course duration first' : 'Year *'}</option>
              {assignmentYearOptions.map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value, sectionId: '' })}
              required
              disabled={!form.year}
            >
              <option value="">Semester *</option>
              {assignmentSemesterOptions.map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            <select className={inputClass} value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} required>
              <option value="">Section *</option>
              {filteredSections.map((s) => (
                <option key={s._id} value={s._id}>Section {s.name}</option>
              ))}
            </select>
            {studentCount !== null && (
              <p className="text-sm text-text-dim md:col-span-2">{studentCount} student(s) in this section</p>
            )}
          </>
        )}
        {form.type === ASSIGNMENT_TYPES.DOMAIN_SOLVER && (
          <select className={inputClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
            <option value="">Category *</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
        <button type="submit" className={btnPrimary}>Assign</button>
      </form>
      {loading ? <p className="text-text-dim">Loading...</p> : (
        <>
          {branches.filter((b) => b.hodId).map((b) => (
            <div key={`hod-${b._id}`} className="p-3 mb-2 admin-subtle rounded-lg text-sm">
              HOD: <span className="font-medium">{b.hodId?.name || b.hodId}</span> → Branch {b.name}
            </div>
          ))}
          {sections.filter((s) => s.coordinatorId).map((s) => (
            <div key={s._id} className="p-3 mb-2 admin-subtle rounded-lg text-sm">
              Coordinator: {s.coordinatorId?.name} → {s.sessionId?.label || 'Session'} · Year {s.year} · Sem {toAbsoluteSemester(s.year, s.semester)} · {s.name}
            </div>
          ))}
          {list.map((a) => (
            <div key={a._id} className="flex justify-between p-3 mb-2 admin-subtle rounded-lg">
              <div>
                <p className="font-medium">{a.userId?.name}</p>
                <p className="text-sm text-text-dim">
                  {ASSIGNMENT_LABELS[a.type]}
                  {a.sessionId?.label ? ` · ${a.sessionId.label}` : ''}
                  {a.year ? ` · Year ${a.year} · Sem ${toAbsoluteSemester(a.year, a.semester || 1)}` : ''}
                </p>
              </div>
            </div>
          ))}
          {domains.map((d) => (
            <div key={d._id} className="p-3 mb-2 admin-subtle rounded-lg text-sm">
              {d.solverId?.name} → {d.categoryId?.name}
            </div>
          ))}
        </>
      )}
    </Panel>
  );
}
