/* 
 * FILE: frontend/src/components/Home/FilterBar.jsx
 * PURPOSE: Filter buttons for post types
 */
import React from 'react';
import { POST_FILTERS } from '@/utils/constants';

const FilterBar = ({ filter, setFilter }) => {
  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl shadow-sm border border-border-card p-3 flex gap-2 overflow-x-auto scrollbar-hide ">
      {Object.values(POST_FILTERS).map(filterOption => (
        <button
          key={filterOption}
          onClick={() => setFilter(filterOption)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            filter === filterOption
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-text-dim hover:text-text-main hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
