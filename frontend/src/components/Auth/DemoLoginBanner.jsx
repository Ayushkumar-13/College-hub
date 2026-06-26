import React, { useEffect, useState } from 'react';
import { authApi } from '@/api/authApi';

export function DemoLoginBanner({ variant = 'faculty', onUseDemo }) {
  const [demo, setDemo] = useState(null);

  useEffect(() => {
    authApi.getDemoAccounts().then(setDemo).catch(() => setDemo({ available: false }));
  }, []);

  if (!demo?.available) return null;

  const account = variant === 'faculty' ? demo.faculty : demo.student;
  if (!account) return null;

  return (
    <div className="mb-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-sm">
      <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Demo account (for recruiters & testing)</p>
      {variant === 'faculty' ? (
        <>
          <p className="text-text-dim">
            <span className="text-text-main font-medium">{account.name}</span>
            {' · '}{account.email}
            {' · '}Password: <code className="text-text-main">{account.password}</code>
          </p>
          {onUseDemo && (
            <button
              type="button"
              onClick={() => onUseDemo(account)}
              className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Fill demo login →
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-text-dim">
            Roll <code className="text-text-main">{account.rollNumber}</code>
            {' · '}Password: <code className="text-text-main">{account.password}</code>
          </p>
          {account.path && (
            <p className="text-text-dim mt-1 text-xs">
              Path: {account.path.sessionLabel} → {account.path.courseName} → {account.path.branchName}
              → Year {account.path.year} → Sem {account.path.semester} → Section {account.path.sectionName}
            </p>
          )}
          {onUseDemo && (
            <button
              type="button"
              onClick={() => onUseDemo(account)}
              className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Fill demo path →
            </button>
          )}
          <p className="text-xs text-text-dim mt-2">
            Then click Continue, select <strong>{account.name}</strong>, and enter the password above.
          </p>
        </>
      )}
    </div>
  );
}

export default DemoLoginBanner;
