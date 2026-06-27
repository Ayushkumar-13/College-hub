import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Panel from '../Panel';
import { inputClass, btnPrimary, btnDanger } from '@/utils/styles';
import { adminApi } from '@/api/adminApi';

export default function SessionsPanel({ collegeId, sessions, onRefresh, loading }) {
  const [startYear, setStartYear] = useState('');

  const sortedSessions = [...sessions].sort((a, b) => a.startYear - b.startYear);
  const currentSession = sortedSessions.find((s) => s.isCurrent);

  const sessionPreview = startYear
    ? `${startYear}-${Number(startYear) + 1}`
    : '';

  const isNextSession = (session) =>
    currentSession && session.startYear === currentSession.startYear + 1;

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createYear(collegeId, { startYear: Number(startYear) });
      setStartYear('');
      window.showToast?.('Session created', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed to create session', 'error');
    }
  };

  const setCurrent = async (id) => {
    await adminApi.setCurrentSession(collegeId, id);
    window.showToast?.('Current session updated', 'success');
    onRefresh();
  };

  const promote = async (toSessionId) => {
    const target = sortedSessions.find((s) => s._id === toSessionId);
    if (!currentSession || !target || target.startYear !== currentSession.startYear + 1) {
      window.showToast?.('You can only promote to the next session (e.g. 2023-2024 → 2024-2025)', 'error');
      return;
    }
    if (!window.confirm(`Promote students from ${currentSession.label} to ${target.label}?`)) return;
    try {
      const result = await adminApi.promoteStudents(collegeId, toSessionId, {
        fromSessionId: currentSession._id,
        passedStudentIds: [],
      });
      window.showToast?.(`Promoted: ${result.promoted}, Graduated: ${result.graduated}`, 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Promotion failed', 'error');
    }
  };

  const handleDelete = async (id, label, isCurrentSession) => {
    const message = isCurrentSession
      ? `Delete ${label}? It is marked Current — the next session will become current automatically.`
      : `Delete session ${label}?`;
    if (!window.confirm(message)) return;
    try {
      await adminApi.deleteYear(collegeId, id);
      window.showToast?.('Session deleted', 'success');
      onRefresh();
    } catch (err) {
      window.showToast?.(err?.response?.data?.error || err?.error || 'Failed to delete session', 'error');
    }
  };

  return (
    <Panel title="Academic Sessions">
      <p className="text-sm text-text-dim mb-4">
        Sessions are academic years (2023 → 2023-2024). Set the active year as <strong>Current</strong>.
        Promote students only to the <strong>next</strong> session when a year ends.
      </p>
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs text-text-dim mb-1">Session start year *</label>
          <input
            type="number"
            className={inputClass}
            placeholder="e.g. 2023"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            required
            min={2000}
            max={2100}
          />
        </div>
        {sessionPreview && (
          <p className="text-sm text-text-main pb-2">
            Session: <span className="font-medium">{sessionPreview}</span>
          </p>
        )}
        <button type="submit" className={btnPrimary}>Add Session</button>
      </form>
      {loading ? <p className="text-text-dim">Loading...</p> : sortedSessions.length === 0 ? (
        <p className="text-sm text-text-dim">No sessions yet. Add 2023 to create 2023-2024.</p>
      ) : sortedSessions.map((s) => (
        <div key={s._id} className="flex flex-wrap justify-between items-center gap-2 p-3 mb-2 admin-subtle rounded-lg">
          <div>
            <p className="font-medium text-text-main">
              {s.label || `${s.startYear}-${s.startYear + 1}`}
              {s.isCurrent && <span className="text-xs text-green-600 ml-2">(Current)</span>}
            </p>
            <p className="text-sm text-text-dim">
              {s.startYear} – {s.endYear || s.startYear + 1}
              {isNextSession(s) && ' · Next promotion target'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {!s.isCurrent && (
              <button type="button" onClick={() => setCurrent(s._id)} className={btnPrimary}>Set Current</button>
            )}
            {isNextSession(s) && (
              <button type="button" onClick={() => promote(s._id)} className="text-sm text-blue-600 hover:underline">
                Promote students here
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(s._id, s.label || `${s.startYear}-${s.startYear + 1}`, s.isCurrent)}
              className={btnDanger}
              aria-label="Delete session"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </Panel>
  );
}
