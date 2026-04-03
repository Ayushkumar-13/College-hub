import React from 'react';
import { Mail, Phone, Briefcase, Building } from 'lucide-react';

const UserProfileCard = ({ user }) => {
  if (!user) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800/60 overflow-hidden sticky top-[5.5rem]">
      {/* Cover Photo */}
      <div className="h-16 w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 relative flex flex-col items-center">
        {/* Avatar */}
        <div className="h-16 w-16 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 absolute -top-8 overflow-hidden shadow-sm">
          <img 
            src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
            alt={user.name} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="mt-10 text-center w-full">
          <h2 className="font-bold text-[17px] text-slate-900 dark:text-slate-100 leading-tight">
            {user.name}
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-snug break-words">
            {user.bio || `${user.role} | ${user.department || 'College Hub'}`}
          </p>
        </div>
      </div>

      {/* Details Section */}
      <div className="border-t border-slate-100 dark:border-slate-800/60 py-3">
        <div className="flex flex-col gap-3 px-5 py-2">
          
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Mail size={16} className="text-slate-400 shrink-0" />
            <span className="text-[13px] font-medium truncate" title={user.email}>
              {user.email || 'No email provided'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Phone size={16} className="text-slate-400 shrink-0" />
            <span className="text-[13px] font-medium truncate">
              {user.phone || 'No phone provided'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Briefcase size={16} className="text-slate-400 shrink-0" />
            <span className="text-[13px] font-medium capitalize truncate">
              {user.role || 'User'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Building size={16} className="text-slate-400 shrink-0" />
            <span className="text-[13px] font-medium truncate">
              {user.department || 'No department'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
