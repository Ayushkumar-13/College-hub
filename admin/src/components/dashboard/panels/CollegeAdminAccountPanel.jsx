import React, { useState, useEffect } from 'react';
import Panel from '../Panel';
import { inputClass, btnPrimary } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';

export default function CollegeAdminAccountPanel({ currentUser, onRefresh }) {
  const [form, setForm] = useState({
    ownerName: currentUser?.name || '',
    ownerEmail: currentUser?.email || '',
    ownerPassword: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      ownerName: currentUser?.name || '',
      ownerEmail: currentUser?.email || '',
    }));
  }, [currentUser?.name, currentUser?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateMyOwnerAccount(form);
      window.showToast?.('Admin login updated', 'success');
      setForm((prev) => ({ ...prev, ownerPassword: '' }));
      onRefresh?.();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed to update login', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="College Admin Login">
      <p className="text-sm text-text-dim mb-4">
        Update the email and password your college uses to access this admin panel.
      </p>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3 max-w-2xl">
        <input
          className={inputClass}
          placeholder="Admin Name"
          value={form.ownerName}
          onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
          required
        />
        <input
          className={inputClass}
          type="email"
          placeholder="Admin Email (login ID)"
          value={form.ownerEmail}
          onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
          required
        />
        <input
          className={inputClass}
          type="password"
          placeholder="New password (leave blank to keep current)"
          value={form.ownerPassword}
          onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
          minLength={form.ownerPassword ? 6 : undefined}
        />
        <button type="submit" disabled={saving} className={btnPrimary}>
          Save Login Details
        </button>
      </form>
    </Panel>
  );
}
