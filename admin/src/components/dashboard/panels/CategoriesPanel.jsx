import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Panel from '../Panel';
import { inputClass, btnPrimary, btnDanger } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';

export default function CategoriesPanel({ collegeId, categories, onRefresh, loading }) {
  const [form, setForm] = useState({ name: '', description: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createProblemCategory(collegeId, form);
      setForm({ name: '', description: '' });
      window.showToast?.('Category added', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminApi.deleteCategory(collegeId, id);
      window.showToast?.('Category deleted', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  return (
    <Panel title="Problem Categories">
      <p className="text-sm text-text-dim mb-4">e.g. Hostel, Electricity, Wi-Fi, Cafeteria</p>
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 mb-6">
        <input className={inputClass} placeholder="Category name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={inputClass} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button type="submit" className={btnPrimary}>Add Category</button>
      </form>
      {loading ? <p className="text-text-dim">Loading...</p> : categories.map((c) => (
        <div key={c._id} className="flex justify-between items-center p-3 mb-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-text-main">
          <div>
            <p className="font-medium">{c.name}</p>
            {c.description && <p className="text-sm text-text-dim">{c.description}</p>}
          </div>
          <button type="button" onClick={() => handleDelete(c._id)} className={btnDanger} aria-label="Delete category">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </Panel>
  );
}
