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
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
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
              className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{modalUser.name}</h2>
              <p className="text-gray-600 font-medium mt-1">
                {modalUser.role} • {modalUser.department || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 bg-slate-50 p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <Mail className="text-blue-600" size={20} />
              <span className="text-slate-700">{modalUser.email}</span>
            </div>

            {modalUser.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-green-600" size={20} />
                <span className="text-slate-700">{modalUser.phone}</span>
              </div>
            )}

            {modalUser.department && (
              <div className="flex items-center gap-3">
                <Briefcase className="text-indigo-600" size={20} />
                <span className="text-slate-700">{modalUser.department}</span>
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
                isFollowing ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gradient-to-r from-indigo-100 to-blue-100 text-blue-700 hover:from-indigo-200 hover:to-blue-200"
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
