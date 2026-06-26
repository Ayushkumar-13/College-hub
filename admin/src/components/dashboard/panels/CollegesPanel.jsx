import React, { useState, useEffect } from 'react';
import Panel from '../Panel';
import { inputClass, btnPrimary } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';

export default function CollegesPanel({ colleges, onRefresh }) {
  const existing = colleges[0] || null;
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        code: existing.code || '',
        address: existing.address || '',
        city: existing.city || '',
      });
    }
  }, [existing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (existing) {
        await adminApi.updateCollege(existing._id, form);
      } else {
        await adminApi.createCollege(form);
      }
      window.showToast?.('College saved', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || 'Failed to save college', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="College Setup">
      <p className="text-sm text-text-dim mb-4">
        One college for the entire platform. This name appears on all registration pages.
      </p>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
        <input className={inputClass} placeholder="College Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={inputClass} placeholder="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required disabled={!!existing} />
        <input className={inputClass} placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className={inputClass} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <button type="submit" disabled={saving} className={btnPrimary}>
          {existing ? 'Update College' : 'Create College'}
        </button>
      </form>
    </Panel>
  );
}
