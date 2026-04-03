/* 
 * FILE: frontend/src/components/Home/FilterBar.jsx
 * PURPOSE: Filter buttons for post types
 */
import React from 'react';
import { POST_FILTERS } from '@/utils/constants';

const FilterBar = ({ filter, setFilter }) => {
  return (
    <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-2 flex gap-2 overflow-x-auto scrollbar-hide mb-2">
      {Object.values(POST_FILTERS).map(filterOption => (
        <button
          key={filterOption}
          onClick={() => setFilter(filterOption)}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out whitespace-nowrap ${
            filter === filterOption
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-100'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 scale-95 hover:scale-100'
          }`}
        >
          {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
