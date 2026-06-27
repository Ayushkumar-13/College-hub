import React from 'react';
import { MessageSquare } from 'lucide-react';
import UserAvatar from '@/components/Common/UserAvatar';
import { getContactId } from '@/utils/contactHelpers';

const ContactCard = ({ user, openModal, onMessageClick, currentUserId }) => {
  const userId = getContactId(user);
  const isCurrentUser = userId === currentUserId;

  return (
    <article className="rounded-2xl border border-border-card bg-surface p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:bg-slate-900 dark:hover:border-slate-700">
      <button
        type="button"
        onClick={() => openModal(user)}
        className="mb-5 flex w-full items-center gap-4 text-left"
      >
        <UserAvatar
          name={user.name}
          avatar={user.avatar}
          size="lg"
          rounded="2xl"
          className="ring-1 ring-slate-200 dark:ring-slate-700"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-text-main">
            {user.name}
            {isCurrentUser && (
              <span className="ml-1 font-normal text-text-dim">(you)</span>
            )}
          </h3>
          <p className="mt-0.5 text-sm text-text-dim">{user.role || 'User'}</p>
        </div>
      </button>

      <div className="flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-xl border border-border-card py-2.5 text-sm font-medium text-text-main transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-blue-500/60 dark:hover:bg-blue-950/30"
          onClick={() => openModal(user)}
        >
          View Profile
        </button>

        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => onMessageClick(user)}
        >
          <MessageSquare size={16} strokeWidth={2.25} aria-hidden />
          Message
        </button>
      </div>
    </article>
  );
};

export default ContactCard;
