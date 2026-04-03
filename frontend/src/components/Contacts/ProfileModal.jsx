// FILE: src/components/contacts/ProfileModal.jsx
import React from "react";
import { Mail, Phone, Briefcase, MessageSquare, X } from "lucide-react";

const ProfileModal = ({ modalUser, onClose, onMessageClick, onToggleFollow, isFollowing }) => {
  if (!modalUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-surface dark:bg-slate-900 rounded-3xl shadow-2xl border border-border-card overflow-hidden "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-24 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-all duration-200 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <div className="flex items-start gap-6 -mt-16">
            <img
              src={modalUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${modalUser.name}`}
              alt={modalUser.name}
              className="w-32 h-32 rounded-2xl border-4 border-surface dark:border-slate-800 shadow-xl object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text-main">{modalUser.name}</h2>
              <p className="text-text-dim/80 font-medium mt-1">
                {modalUser.role} • {modalUser.department || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl ">
            <div className="flex items-center gap-3">
              <Mail className="text-blue-500" size={20} />
              <span className="text-text-main">{modalUser.email}</span>
            </div>

            {modalUser.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-green-500" size={20} />
                <span className="text-text-main">{modalUser.phone}</span>
              </div>
            )}

            {modalUser.department && (
              <div className="flex items-center gap-3">
                <Briefcase className="text-indigo-500" size={20} />
                <span className="text-text-main">{modalUser.department}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => onMessageClick(modalUser)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] transition-transform duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              <MessageSquare size={18} className="inline mr-2" />
              Message
            </button>

            <button
              onClick={() => onToggleFollow(modalUser._id)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isFollowing 
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600" 
                  : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
