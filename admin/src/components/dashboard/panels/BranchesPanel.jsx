import React, { useState } from 'react';
import Panel from '../Panel';
import { inputClass, btnPrimary } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';
import { sortByName } from '@/utils/constants';

export default function BranchesPanel({ collegeId, courses, branches, faculty, onRefresh, loading }) {
  const [form, setForm] = useState({ name: '', code: '', courseId: '' });
  const [hodAssign, setHodAssign] = useState({});

  const handleCreate = async (e) => {
    e.preventDefault();
    await adminApi.createBranch(collegeId, form);
    setForm({ name: '', code: '', courseId: '' });
    window.showToast?.('Branch added', 'success');
    onRefresh();
  };

  const handleAssignHOD = async (branchId) => {
    const userId = hodAssign[branchId];
    if (!userId) return;
    const branch = branches.find((b) => b._id === branchId);
    const newFaculty = faculty.find((f) => f._id === userId);
    const currentHod = branch?.hodId;
    if (currentHod && String(currentHod._id || currentHod) !== userId) {
      const msg = `Replace ${currentHod.name} with ${newFaculty?.name} as HOD for ${branch.name}? The previous HOD will be demoted to their base designation.`;
      if (!window.confirm(msg)) return;
    }
    try {
      const result = await adminApi.assignHOD(collegeId, { userId, branchId });
      window.showToast?.(
        result.previousHodId ? 'HOD changed — designations updated' : 'HOD assigned',
        'success'
      );
      setHodAssign((p) => ({ ...p, [branchId]: '' }));
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || 'Failed to assign HOD', 'error');
    }
  };

  const handleRemoveHOD = async (branchId) => {
    const branch = branches.find((b) => b._id === branchId);
    const hodName = branch?.hodId?.name || 'this HOD';
    if (!window.confirm(`Remove ${hodName} as HOD from ${branch?.name}? Their designation will be updated.`)) return;
    try {
      await adminApi.removeHOD(collegeId, branchId);
      window.showToast?.('HOD removed', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || 'Failed', 'error');
    }
  };

  return (
    <Panel title="Branches / Departments">
      <p className="text-sm text-text-dim mb-4">
        Each branch can have its own HOD (Head of Department). Changing HOD automatically updates
        designations — the previous HOD is demoted to their base title (e.g. Professor).
      </p>
      <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-3 mb-6">
        <select className={inputClass} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
          <option value="">Select Course *</option>
          {sortByName(courses).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input className={inputClass} placeholder="Branch name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={inputClass} placeholder="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <button type="submit" className={btnPrimary}>Add Branch</button>
      </form>
      {loading ? <p className="text-text-dim">Loading...</p> : (
        <div className="space-y-3">
          {branches.map((b) => (
            <div key={b._id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-border-card">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <div>
                  <p className="font-medium text-text-main">{b.name} ({b.code})</p>
                  <p className="text-sm text-text-dim">{b.courseId?.name || 'Course'}</p>
                </div>
                <div className="text-sm">
                  <span className="text-text-dim">HOD: </span>
                  <span className="font-medium text-text-main">
                    {b.hodId?.name || <span className="text-amber-600">Not assigned</span>}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className={inputClass + ' max-w-xs'}
                  value={hodAssign[b._id] || ''}
                  onChange={(e) => setHodAssign((p) => ({ ...p, [b._id]: e.target.value }))}
                >
                  <option value="">Select Faculty as HOD</option>
                  {faculty.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => handleAssignHOD(b._id)} className={btnPrimary}>
                  {b.hodId ? 'Change HOD' : 'Assign HOD'}
                </button>
                {b.hodId && (
                  <button type="button" onClick={() => handleRemoveHOD(b._id)} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
