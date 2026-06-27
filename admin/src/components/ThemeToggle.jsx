import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="admin-sidebar-nav-item flex h-10 w-10 items-center justify-center rounded-xl border border-border-card bg-surface"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <Moon size={18} className="text-blue-400" />
      ) : (
        <Sun size={18} className="text-amber-500" />
      )}
    </button>
  );
};

export default ThemeToggle;
