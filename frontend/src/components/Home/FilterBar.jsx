/* 
 * FILE: frontend/src/components/Home/FilterBar.jsx
 * PURPOSE: Filter buttons for post types
 */
import React from 'react';
import { POST_FILTERS } from '@/utils/constants';

const FilterBar = ({ filter, setFilter }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 flex gap-2 overflow-x-auto">
      {Object.values(POST_FILTERS).map(filterOption => (
        <button
          key={filterOption}
          onClick={() => setFilter(filterOption)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
            filter === filterOption
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;