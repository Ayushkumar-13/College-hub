import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { CONTACT_FILTER_ROLES } from '@/utils/contactHelpers';

const ContactsHeader = ({ searchQuery, setSearchQuery, selectedRole, setSelectedRole }) => {
  return (
    <div className="mb-8 rounded-2xl border border-border-card bg-surface dark:bg-slate-900/90 shadow-sm">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim"
            size={20}
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full rounded-xl border border-border-card bg-slate-100 py-3 pl-12 pr-4 text-sm text-text-main outline-none transition-colors placeholder:text-text-dim/60 focus:border-blue-500 dark:bg-slate-800/80 dark:focus:border-blue-500"
            aria-label="Search contacts"
          />
        </div>

        <div className="relative w-full shrink-0 sm:w-52">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-border-card bg-slate-100 py-3 pl-4 pr-10 text-sm text-text-main outline-none transition-colors focus:border-blue-500 dark:bg-slate-800/80 dark:focus:border-blue-500"
            aria-label="Filter by role"
          >
            {CONTACT_FILTER_ROLES.map(({ value, label }) => (
              <option key={value} value={value} className="dark:bg-slate-900">
                {label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-dim"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
};

export default ContactsHeader;
