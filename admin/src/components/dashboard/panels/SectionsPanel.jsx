import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Panel from '../Panel';
import { inputClass, btnPrimary, btnDanger } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';
import { filterBranches } from '@/utils/academicHelpers';
import { sortByName, semesterOptionsForYear, toStoredSemester, toAbsoluteSemester, yearOptionsForCourse } from '@/utils/constants';

export default function SectionsPanel({
  collegeId,
  courses,
  branches,
  sections,
  sessions,
  faculty,
  onRefresh,
  loading,
}) {
  const [form, setForm] = useState({
    name: '', year: '', semester: '', branchId: '', courseId: '', sessionId: '',
  });
  const [coordinatorAssign, setCoordinatorAssign] = useState({});

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createSection(collegeId, {
        ...form,
        year: Number(form.year),
        semester: toStoredSemester(form.year, form.semester),
      });
      setForm({
        name: '', year: '', semester: '', branchId: '', courseId: '', sessionId: form.sessionId,
      });
      window.showToast?.('Section added', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await adminApi.deleteSection(collegeId, id);
      window.showToast?.('Section deleted', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const handleAssignCoordinator = async (sectionId) => {
    const userId = coordinatorAssign[sectionId];
    if (!userId) return;
    const section = sections.find((s) => s._id === sectionId);
    const newFaculty = faculty.find((f) => f._id === userId);
    const current = section?.coordinatorId;
    if (current && String(current._id || current) !== userId) {
      const msg = `Replace ${current.name} with ${newFaculty?.name} as coordinator for section ${section.name}? All students in this section will report to the new coordinator.`;
      if (!window.confirm(msg)) return;
    }
    try {
      await adminApi.assignCoordinator(collegeId, sectionId, userId);
      window.showToast?.('Section coordinator assigned', 'success');
      setCoordinatorAssign((p) => ({ ...p, [sectionId]: '' }));
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || 'Failed to assign coordinator', 'error');
    }
  };

  const handleRemoveCoordinator = async (sectionId) => {
    const section = sections.find((s) => s._id === sectionId);
    const name = section?.coordinatorId?.name || 'coordinator';
    if (!window.confirm(`Remove ${name} as coordinator from section ${section?.name}?`)) return;
    try {
      await adminApi.removeCoordinator(collegeId, sectionId);
      window.showToast?.('Coordinator removed', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || 'Failed', 'error');
    }
  };

  const filteredBranches = filterBranches(branches, form.courseId);
  const yearOptions = yearOptionsForCourse(courses, form.courseId);
  const sectionSemesterOptions = semesterOptionsForYear(form.year);

  return (
    <Panel title="Sections">
      <p className="text-sm text-text-dim mb-4">
        Assign a <strong>Section Coordinator</strong> (faculty) to each section. All students in that section
        automatically use this coordinator for issues and contacts — you do not assign coordinators per student.
      </p>
      <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-3 mb-6">
        <select className={inputClass} value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })} required>
          <option value="">Session *</option>
          {sessions.map((s) => <option key={s._id} value={s._id}>{s.label}{s.isCurrent ? ' (Current)' : ''}</option>)}
        </select>
        <select className={inputClass} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value, branchId: '', year: '', semester: '' })} required>
          <option value="">Course *</option>
          {sortByName(courses).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className={inputClass} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required disabled={!form.courseId}>
          <option value="">Branch *</option>
          {filteredBranches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
        <select
          className={inputClass}
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value, semester: '' })}
          required
          disabled={!form.courseId || yearOptions.length === 0}
        >
          <option value="">{yearOptions.length === 0 && form.courseId ? 'Set course duration first' : 'Year *'}</option>
          {yearOptions.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select
          className={inputClass}
          value={form.semester}
          onChange={(e) => setForm({ ...form, semester: e.target.value })}
          required
          disabled={!form.year}
        >
          <option value="">Semester *</option>
          {sectionSemesterOptions.map((sem) => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Section name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <button type="submit" className={btnPrimary} disabled={!form.year || !form.semester}>Add Section</button>
      </form>
      {loading ? <p className="text-text-dim">Loading...</p> : sections.length === 0 ? (
        <p className="text-sm text-text-dim">No sections yet. Add sessions, courses, and branches first.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => (
            <div key={s._id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-border-card">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <div>
                  <p className="font-medium text-text-main">
                    {s.sessionId?.label || 'Session'} · Year {s.year} · Sem {toAbsoluteSemester(s.year, s.semester)} · Section {s.name}
                  </p>
                  <p className="text-sm text-text-dim">{s.branchId?.name} · {s.courseId?.name}</p>
                </div>
                <div className="text-sm">
                  <span className="text-text-dim">Coordinator: </span>
                  <span className="font-medium text-text-main">
                    {s.coordinatorId?.name || <span className="text-amber-600">Not assigned</span>}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className={inputClass + ' max-w-xs'}
                  value={coordinatorAssign[s._id] || ''}
                  onChange={(e) => setCoordinatorAssign((p) => ({ ...p, [s._id]: e.target.value }))}
                >
                  <option value="">Select Faculty as Coordinator</option>
                  {faculty.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => handleAssignCoordinator(s._id)} className={btnPrimary}>
                  {s.coordinatorId ? 'Change Coordinator' : 'Assign Coordinator'}
                </button>
                {s.coordinatorId && (
                  <button type="button" onClick={() => handleRemoveCoordinator(s._id)} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(s._id)} className={btnDanger} aria-label="Delete section">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
