import React, { useState, useEffect } from 'react';
import Panel from '../Panel';
import { inputClass, btnPrimary } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';

const emptyOwner = { ownerName: '', ownerEmail: '', ownerPassword: '' };

export default function CollegesPanel({ colleges, onRefresh }) {
  const existing = colleges[0] || null;
  const owner = existing?.ownerId;

  const [form, setForm] = useState({ name: '', code: '', address: '', city: '' });
  const [ownerForm, setOwnerForm] = useState(emptyOwner);
  const [saving, setSaving] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        code: existing.code || '',
        address: existing.address || '',
        city: existing.city || '',
      });
      setOwnerForm({
        ownerName: owner?.name || '',
        ownerEmail: owner?.email || '',
        ownerPassword: '',
      });
    }
  }, [existing, owner?.name, owner?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (existing) {
        await adminApi.updateCollege(existing._id, form);
        window.showToast?.('College saved', 'success');
        onRefresh();
      } else {
        if (!ownerForm.ownerEmail?.trim() || !ownerForm.ownerPassword) {
          window.showToast?.('College admin email and password are required', 'error');
          return;
        }
        await adminApi.createCollege({
          ...form,
          ...ownerForm,
        });
        window.showToast?.('College and admin account created', 'success');
        onRefresh();
      }
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed to save college', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    if (!existing) return;
    setSavingOwner(true);
    try {
      await adminApi.updateCollegeOwnerAccount(existing._id, ownerForm);
      window.showToast?.('College admin login updated', 'success');
      setOwnerForm((prev) => ({ ...prev, ownerPassword: '' }));
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed to update admin login', 'error');
    } finally {
      setSavingOwner(false);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="College Setup">
        <p className="text-sm text-text-dim mb-4">
          One college for the entire platform. This name appears on all registration pages.
        </p>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="College Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className={inputClass}
            placeholder="Code *"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
            disabled={!!existing}
          />
          <input
            className={inputClass}
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <button type="submit" disabled={saving} className={btnPrimary}>
            {existing ? 'Update College' : 'Create College'}
          </button>
        </form>
      </Panel>

      <Panel title="College Admin Login">
        <p className="text-sm text-text-dim mb-4">
          Set the email and password the college uses to sign in to this admin panel.
          SuperAdmin is for platform setup only; day-to-day college management uses this account.
        </p>

        {!existing ? (
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
            <input
              className={inputClass}
              placeholder="Admin Name *"
              value={ownerForm.ownerName}
              onChange={(e) => setOwnerForm({ ...ownerForm, ownerName: e.target.value })}
              required
            />
            <input
              className={inputClass}
              type="email"
              placeholder="Admin Email (login ID) *"
              value={ownerForm.ownerEmail}
              onChange={(e) => setOwnerForm({ ...ownerForm, ownerEmail: e.target.value })}
              required
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Admin Password * (min 6 chars)"
              value={ownerForm.ownerPassword}
              onChange={(e) => setOwnerForm({ ...ownerForm, ownerPassword: e.target.value })}
              required
              minLength={6}
            />
            <p className="md:col-span-2 text-xs text-text-dim">
              Create the college above to save both college details and this admin login together.
            </p>
          </form>
        ) : (
          <form onSubmit={handleOwnerSubmit} className="grid md:grid-cols-2 gap-3">
            <input
              className={inputClass}
              placeholder="Admin Name"
              value={ownerForm.ownerName}
              onChange={(e) => setOwnerForm({ ...ownerForm, ownerName: e.target.value })}
              required
            />
            <input
              className={inputClass}
              type="email"
              placeholder="Admin Email (login ID)"
              value={ownerForm.ownerEmail}
              onChange={(e) => setOwnerForm({ ...ownerForm, ownerEmail: e.target.value })}
              required
            />
            <input
              className={inputClass}
              type="password"
              placeholder={owner ? 'New password (leave blank to keep current)' : 'Admin Password * (min 6 chars)'}
              value={ownerForm.ownerPassword}
              onChange={(e) => setOwnerForm({ ...ownerForm, ownerPassword: e.target.value })}
              minLength={owner && !ownerForm.ownerPassword ? undefined : 6}
              required={!owner}
            />
            <button type="submit" disabled={savingOwner} className={btnPrimary}>
              {owner ? 'Update Admin Login' : 'Create Admin Login'}
            </button>
          </form>
        )}
      </Panel>
    </div>
  );
}
