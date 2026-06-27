import React, { useEffect } from 'react';
import { Mail, Phone, Briefcase, Building, UserCheck, GraduationCap } from 'lucide-react';
import UserAvatar from '@/components/Common/UserAvatar';
import { useAuth } from '@/hooks';
import { userApi } from '@/api/userApi';
import { USER_ROLES } from '@/utils/constants';

const UserProfileCard = ({ user: userProp }) => {
  const { user: authUser, updateUser } = useAuth();
  const user = userProp || authUser;

  useEffect(() => {
    userApi.getProfile().then((data) => {
      if (updateUser) updateUser(data);
    }).catch(() => {});
  }, [updateUser]);

  if (!user) return null;

  const collegeName = user.collegeId?.name || user.college || 'College Hub';
  const coordinator = user.coordinator;
  const coordinatorStudents = user.coordinatorStudents || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800/60 overflow-hidden w-full">
      <div className="h-16 w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
      </div>

      <div className="px-4 pb-4 relative flex flex-col items-center">
        <div className="h-16 w-16 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 absolute -top-8 overflow-hidden shadow-sm">
          <UserAvatar name={user.name} avatar={user.avatar} size="lg" className="w-full h-full" />
        </div>

        <div className="mt-10 text-center w-full">
          <h2 className="font-bold text-[17px] text-slate-900 dark:text-slate-100 leading-tight">
            {user.name}
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-snug break-words">
            {user.bio || `${user.role} | ${user.department || collegeName}`}
          </p>
        </div>
      </div>

      {user.role === USER_ROLES.STUDENT && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
            <UserCheck size={14} /> Your Coordinator
          </p>
          {coordinator ? (
            <div className="flex items-center gap-2">
              <UserAvatar name={coordinator.name} avatar={coordinator.avatar} size="md" />
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{coordinator.name}</p>
                <p className="text-xs text-slate-500 truncate">{coordinator.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No coordinator assigned yet.</p>
          )}
        </div>
      )}

      {user.role === USER_ROLES.FACULTY && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
            <GraduationCap size={14} /> My Students ({coordinatorStudents.length})
          </p>
          {coordinatorStudents.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {coordinatorStudents.map((s) => (
                <li key={s._id} className="flex items-center gap-2">
                  <UserAvatar name={s.name} avatar={s.avatar} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {s.rollNumber || '—'}
                      {s.branchId?.name ? ` · ${s.branchId.name}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No students assigned yet.</p>
          )}
        </div>
      )}

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
              {user.department || collegeName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
