import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Panel from '../Panel';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { inputClass, btnPrimary, btnDangerOutline } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';
import { USER_ROLES } from '@/utils/constants';

export default function UsersPanel({
  collegeId,
  users,
  currentUser,
  userSearch,
  userRoleFilter,
  onSearchChange,
  onRoleFilterChange,
  onRefresh,
  loading,
}) {
  const isOwner = currentUser?.role === USER_ROLES.OWNER;
  const isSuper = currentUser?.role === USER_ROLES.SUPER_ADMIN;
  const canDelete = isOwner || isSuper;

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'Faculty', phone: '', designation: '',
  });

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createUser(collegeId, form);
      setForm({ name: '', email: '', password: '', role: 'Faculty', phone: '', designation: '' });
      setShowForm(false);
      window.showToast?.('User created', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const promote = async (userId) => {
    try {
      await adminApi.promoteAdmin(collegeId, userId);
      window.showToast?.('Promoted to Admin', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const demote = async (userId, revertRole) => {
    try {
      await adminApi.demoteAdmin(collegeId, userId, revertRole);
      window.showToast?.('Admin demoted', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const deactivate = async (userId) => {
    if (!window.confirm('Deactivate this user? They will not be able to log in.')) return;
    try {
      await adminApi.deactivateUser(collegeId, userId);
      window.showToast?.('User deactivated', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed', 'error');
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const result = await adminApi.deleteUser(collegeId, deleteTarget._id);
      window.showToast?.(result.message || 'User deleted', 'success');
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => u.role !== 'Student');

  return (
    <Panel title="Faculty & Staff">
      <p className="text-sm text-text-dim mb-4">
        Create faculty and staff accounts here. They log in on the student app with email and password.
        Deactivated users cannot sign in; deleted users are removed permanently along with their assignments.
      </p>
      <button type="button" onClick={() => setShowForm(!showForm)} className={btnPrimary + ' mb-4'}>
        {showForm ? 'Cancel' : 'Add User'}
      </button>
      {showForm && (
        <form onSubmit={createUser} className="grid md:grid-cols-2 gap-3 mb-6 p-4 admin-subtle rounded-xl">
          <input className={inputClass} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputClass} type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className={inputClass} type="password" placeholder="Password * (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="Faculty">Faculty</option>
            <option value="Staff">Staff</option>
          </select>
          <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={inputClass} placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <button type="submit" className={btnPrimary}>Create User</button>
        </form>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'Faculty', 'Staff', 'Admin'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRoleFilterChange(r)}
            className={`px-3 py-1 rounded-lg text-sm ${userRoleFilter === r ? 'bg-blue-600 text-white' : 'admin-subtle text-text-dim'}`}
          >
            {r === 'all' ? 'All' : r}
          </button>
        ))}
      </div>
      <input
        className={inputClass + ' mb-4'}
        placeholder="Search by name or email..."
        value={userSearch}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {loading ? <p className="text-text-dim">Loading...</p> : (
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-text-dim">No users found.</p>
          ) : (
            filteredUsers.map((u) => (
              <div key={u._id} className="flex flex-col gap-3 p-3 admin-subtle rounded-lg sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-main">{u.name}</p>
                  <p className="text-sm text-text-dim break-words">
                    {u.email} · {u.role}
                    {u.designation ? ` · ${u.designation}` : ''}
                    {u.isActive === false && ' · Deactivated'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {isOwner && ['Faculty', 'Staff'].includes(u.role) && (
                    <button type="button" onClick={() => promote(u._id)} className={btnPrimary}>Promote to Admin</button>
                  )}
                  {isOwner && u.role === 'Admin' && (
                    <>
                      <button type="button" onClick={() => demote(u._id, 'Faculty')} className="text-sm text-amber-600 hover:underline">Demote to Faculty</button>
                      <button type="button" onClick={() => demote(u._id, 'Staff')} className="text-sm text-amber-600 hover:underline">Demote to Staff</button>
                    </>
                  )}
                  {isOwner && u.role !== 'Owner' && u.isActive !== false && (
                    <button type="button" onClick={() => deactivate(u._id)} className="text-sm text-amber-600 hover:underline">
                      Deactivate
                    </button>
                  )}
                  {canDelete && u.role !== 'Owner' && u._id !== currentUser?._id && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(u)}
                      className={btnDangerOutline}
                      aria-label={`Delete ${u.name}`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Trash2 size={14} />
                        Delete
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete user permanently?"
        description="This removes the account, revokes all admin assignments, and deletes their messages and posts. Issues they reported will also be removed."
        itemName={deleteTarget ? `${deleteTarget.name} · ${deleteTarget.email}` : ''}
        confirmLabel="Delete user"
        loading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDeleteUser}
      />
    </Panel>
  );
}
