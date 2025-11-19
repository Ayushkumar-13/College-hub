// FILE: src/components/contacts/ContactsHeader.jsx
import React from "react";
import { Search } from "lucide-react";
import { USER_ROLES } from "@/utils/constants";

const ContactsHeader = ({ searchQuery, setSearchQuery, selectedRole, setSelectedRole }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors duration-200"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full md:w-56 border-2 border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 cursor-pointer transition-colors duration-200 outline-none"
        >
          <option value="all">All Roles</option>
          {Object.values(USER_ROLES).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ContactsHeader;
    