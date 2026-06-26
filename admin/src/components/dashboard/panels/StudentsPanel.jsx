import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Panel from '../Panel';
import { inputClass, btnPrimary, btnDanger } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';
import { filterBranches, filterSections } from '@/utils/academicHelpers';
import { sortByName, semesterOptionsForYear, toStoredSemester, yearOptionsForCourse } from '@/utils/constants';

export default function StudentsPanel({ collegeId, credentials, courses, branches, sections, sessions, onRefresh, loading }) {
  const [form, setForm] = useState({
    rollNumber: '', name: '', courseId: '', branchId: '', year: '', semester: '', sectionId: '', sessionId: '', email: '',
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const filteredBranches = filterBranches(branches, form.courseId);
  const filteredSections = filterSections(sections, {
    sessionId: form.sessionId,
    courseId: form.courseId,
    branchId: form.branchId,
    year: form.year,
    semester: form.semester,
  });

  const editBranches = editing ? filterBranches(branches, editForm?.courseId) : [];
  const editSections = editing ? filterSections(sections, {
    sessionId: editForm?.sessionId,
    courseId: editForm?.courseId,
    branchId: editForm?.branchId,
    year: editForm?.year,
    semester: editForm?.semester,
  }) : [];

  const displayed = statusFilter === 'all'
    ? credentials
    : credentials.filter((c) => c.status === statusFilter);

  const studentYearOptions = yearOptionsForCourse(courses, form.courseId);
  const studentSemesterOptions = semesterOptionsForYear(form.year);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createStudentCredential(collegeId, {
        ...form,
        year: Number(form.year),
        semester: toStoredSemester(form.year, form.semester),
      });
      setForm({
        rollNumber: '', name: '', courseId: '', branchId: '', year: '', semester: '',
        sectionId: '', sessionId: form.sessionId, email: '',
      });
      window.showToast?.('Student added', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const startEdit = (c) => {
    setEditing(c._id);
    setEditForm({
      rollNumber: c.rollNumber,
      name: c.name,
      courseId: c.courseId?._id || c.courseId,
      branchId: c.branchId?._id || c.branchId,
      year: c.year,
      semester: c.semester || 1,
      sectionId: c.sectionId?._id || c.sectionId,
      sessionId: c.sessionId?._id || c.sessionId,
      email: c.email || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateStudentCredential(collegeId, editing, editForm);
      setEditing(null);
      setEditForm(null);
      window.showToast?.('Student updated', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pending student?')) return;
    try {
      await adminApi.deleteStudentCredential(collegeId, id);
      window.showToast?.('Student deleted', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this student? They will not be able to log in.')) return;
    try {
      await adminApi.deactivateStudent(collegeId, id);
      window.showToast?.('Student deactivated', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  return (
    <Panel title="Students">
      <p className="text-sm text-text-dim mb-4">
        Add students with roll number and academic path. Students activate their account on the student app (set password on first login).
        Assign a section coordinator on the <strong>Sections</strong> tab — all students in that section inherit that faculty member.
      </p>
      <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-3 mb-6">
        <input className={inputClass} placeholder="Roll Number *" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} required />
        <input className={inputClass} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
          disabled={!form.courseId || studentYearOptions.length === 0}
        >
          <option value="">{studentYearOptions.length === 0 && form.courseId ? 'Set course duration first' : 'Year *'}</option>
          {studentYearOptions.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select
          className={inputClass}
          value={form.semester}
          onChange={(e) => setForm({ ...form, semester: e.target.value, sectionId: '' })}
          required
          disabled={!form.year}
        >
          <option value="">Semester *</option>
          {studentSemesterOptions.map((sem) => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
        <select className={inputClass} value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} required disabled={!form.year || !form.semester}>
          <option value="">Section *</option>
          {filteredSections.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button type="submit" className={btnPrimary}>Add Student</button>
      </form>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'active'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-sm capitalize ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-text-dim'}`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? <p className="text-text-dim">Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-dim border-b border-border-card">
                <th className="py-2">Roll No</th>
                <th className="py-2">Name</th>
                <th className="py-2">Branch</th>
                <th className="py-2">Section</th>
                <th className="py-2">Coordinator</th>
                <th className="py-2">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayed.map((c) => (
                <tr key={c._id} className="border-b border-border-card">
                  <td className="py-2 font-medium">{c.rollNumber}</td>
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.branchId?.name}</td>
                  <td className="py-2">{c.sectionId?.name || '—'}</td>
                  <td className="py-2">{c.sectionId?.coordinatorId?.name || '—'}</td>
                  <td className="py-2 capitalize">
                    {c.isActive === false ? 'deactivated' : c.status}
                  </td>
                  <td className="py-2 flex gap-1">
                    {c.status === 'pending' && (
                      <>
                        <button type="button" onClick={() => startEdit(c)} className="text-sm text-blue-600">Edit</button>
                        <button type="button" onClick={() => handleDelete(c._id)} className={btnDanger}><Trash2 size={16} /></button>
                      </>
                    )}
                    {c.isActive !== false && (
                      <button type="button" onClick={() => handleDeactivate(c._id)} className="text-sm text-red-600">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && editForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg grid gap-3">
            <h3 className="font-semibold text-text-main">Edit Student</h3>
            <input className={inputClass} placeholder="Roll Number" value={editForm.rollNumber} onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })} required />
            <input className={inputClass} placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <select className={inputClass} value={editForm.sessionId} onChange={(e) => setEditForm({ ...editForm, sessionId: e.target.value, sectionId: '' })} required>
              <option value="">Session</option>
              {sessions.map((s) => <option key={s._id} value={s._id}>{s.label}</option>)}
            </select>
            <select className={inputClass} value={editForm.courseId} onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value, branchId: '', sectionId: '' })} required>
              <option value="">Course</option>
              {sortByName(courses).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select className={inputClass} value={editForm.branchId} onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value, sectionId: '' })} required>
              <option value="">Branch</option>
              {editBranches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <select className={inputClass} value={editForm.sectionId} onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value })} required>
              <option value="">Section</option>
              {editSections.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <input className={inputClass} placeholder="Email (optional)" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setEditing(null); setEditForm(null); }} className="px-4 py-2 text-sm">Cancel</button>
              <button type="submit" className={btnPrimary}>Save</button>
            </div>
          </form>
        </div>
      )}
    </Panel>
  );
}
