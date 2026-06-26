import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Panel from '../Panel';
import { inputClass, btnPrimary, btnDanger } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';
import { sortByName } from '@/utils/constants';

export default function CoursesPanel({ collegeId, courses, onRefresh, loading }) {
  const [form, setForm] = useState({ name: '', code: '', durationYears: '' });

  const sortedCourses = sortByName(courses);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createCourse(collegeId, {
        ...form,
        durationYears: Number(form.durationYears),
      });
      setForm({ name: '', code: '', durationYears: '' });
      window.showToast?.('Course added', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete course?')) return;
    await adminApi.deleteCourse(collegeId, id);
    onRefresh();
  };

  return (
    <Panel title="Courses">
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 mb-6">
        <input className={inputClass} placeholder="Course name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={inputClass} placeholder="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <input type="number" className={inputClass} placeholder="Duration (years) *" value={form.durationYears}
          onChange={(e) => setForm({ ...form, durationYears: e.target.value })} required min={1} max={6} />
        <button type="submit" className={btnPrimary}><Plus size={16} className="inline mr-1" />Add</button>
      </form>
      {loading ? <p className="text-text-dim">Loading...</p> : (
        <div className="space-y-2">
          {sortedCourses.map((c) => (
            <div key={c._id} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-text-main">{c.name} ({c.code}) · {c.durationYears} yr</span>
              <button type="button" onClick={() => handleDelete(c._id)} className={btnDanger}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
