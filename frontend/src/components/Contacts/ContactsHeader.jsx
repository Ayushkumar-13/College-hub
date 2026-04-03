// FILE: src/components/contacts/ContactsHeader.jsx
import React from "react";
import { Search } from "lucide-react";
import { USER_ROLES } from "@/utils/constants";

const ContactsHeader = ({ searchQuery, setSearchQuery, selectedRole, setSelectedRole }) => {
  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl shadow-lg border border-border-card p-6 mb-8 ">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-text-dim" size={20} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 text-text-main border-2 border-border-card rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-500  placeholder:text-text-dim/60"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full md:w-56 bg-slate-100 dark:bg-slate-800 text-text-main border-2 border-border-card rounded-xl py-3 px-4 focus:border-blue-500 dark:focus:border-blue-500 cursor-pointer  outline-none"
        >
          <option value="all" className="dark:bg-slate-900">All Roles</option>
          {Object.values(USER_ROLES).map((r) => (
            <option key={r} value={r} className="dark:bg-slate-900">
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ContactsHeader;
    
