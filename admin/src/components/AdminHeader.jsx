import React from 'react';
import { LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/hooks';
import ThemeToggle from '@/components/ThemeToggle';

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const studentAppUrl = import.meta.env.VITE_STUDENT_APP_URL || 'http://localhost:3000';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-border-card sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-600" size={22} />
          <span className="font-bold text-text-main">College Hub Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={studentAppUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline hidden sm:inline"
          >
            Student App
          </a>
          <ThemeToggle />
          <span className="text-sm text-text-dim hidden md:inline">{user?.name} · {user?.role}</span>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-dim"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
