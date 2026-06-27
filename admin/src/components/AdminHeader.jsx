import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks';
import ThemeToggle from '@/components/ThemeToggle';

const AdminHeader = ({ onMenuClick, title = 'Dashboard' }) => {
  const { user, logout } = useAuth();

  return (
    <header className="admin-header sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="admin-sidebar-nav-item rounded-lg p-2 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="truncate text-base font-semibold text-text-main sm:text-lg">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <span className="hidden max-w-[220px] truncate text-sm text-text-dim md:inline">
          {user?.email}
        </span>
        <button
          type="button"
          onClick={logout}
          className="admin-sidebar-nav-item rounded-lg p-2 hover:!text-red-600 dark:hover:!text-red-400"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
