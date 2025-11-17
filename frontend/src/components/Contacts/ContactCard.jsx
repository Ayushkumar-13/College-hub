// FILE: src/components/contacts/ContactCard.jsx
import React from "react";
import { MessageSquare } from "lucide-react";

const ContactCard = ({
  user,
  openModal,
  onMessageClick,
  currentUserId,  // <-- add this if not already present
}) => {
  const isCurrentUser = (user._id || user.id) === currentUserId;

  return (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-xl p-6 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
      onClick={() => openModal(user)}
    >
      <div className="flex items-start gap-4">
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
          alt={user.name}
          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-800 truncate">
            {user.name}{" "}
            {isCurrentUser && (
              <span className="text-xs text-gray-400">(you)</span>
            )}
          </h3>
          <p className="text-sm text-gray-600">{user.role}</p>
          <p className="text-sm text-gray-500 truncate">
            {user.department || "—"}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          className="flex-1 border-2 border-gray-200 py-2 rounded-xl hover:border-blue-400 hover:bg-blue-50 text-sm font-medium transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            openModal(user);
          }}
        >
          View Profile
        </button>

        <button
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:scale-[1.03] transition-transform duration-200 shadow-md hover:shadow-lg active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onMessageClick(user);
          }}
        >
          <MessageSquare size={16} className="inline mr-1 mb-0.5" />
          Message
        </button>
      </div>
    </div>
  );
};

export default ContactCard;
