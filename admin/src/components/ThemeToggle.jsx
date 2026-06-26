import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {isDark ? <Moon size={18} className="text-yellow-400" /> : <Sun size={18} className="text-orange-500" />}
    </button>
  );
};

export default ThemeToggle;
