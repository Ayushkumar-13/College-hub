import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDeleteModal({
  open,
  title = 'Delete user?',
  description,
  itemName,
  confirmLabel = 'Delete permanently',
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={loading ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="admin-panel w-full max-w-md rounded-xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <h3 id="confirm-delete-title" className="text-lg font-semibold text-text-main">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="admin-sidebar-nav-item rounded-lg p-1.5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-text-dim">{description}</p>
          {itemName && (
            <p className="mt-3 rounded-lg border border-border-card bg-surface px-3 py-2.5 text-sm font-medium text-text-main">
              {itemName}
            </p>
          )}
          <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
            This action is permanent and cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-border-card px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-border-card px-4 py-2 text-sm font-medium text-text-main hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
