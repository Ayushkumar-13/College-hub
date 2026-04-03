/**
 * FILE: frontend/src/components/Common/ThemeToggle.jsx
 * PURPOSE: Sunlight/Moonlight switch for theme toggling
 */
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      aria-label="Toggle dark mode"
      title="Toggle theme"
    >
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
          isDark ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <Sun size={20} className="text-orange-500 fill-current" />
      </div>
      
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
          isDark ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
        }`}
      >
        <Moon size={20} className="text-yellow-400 fill-current" />
      </div>
    </button>
  );
};

export default ThemeToggle;
