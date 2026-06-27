import React, { useEffect } from 'react';
import { Mail, MessageSquare, X } from 'lucide-react';
import UserAvatar from '@/components/Common/UserAvatar';
import { formatContactSubtitle, getContactId } from '@/utils/contactHelpers';

const ProfileModal = ({
  modalUser,
  currentUserId,
  onClose,
  onMessageClick,
  onToggleFollow,
  isFollowing,
}) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!modalUser) return null;

  const modalUserId = getContactId(modalUser);
  const isSelf = modalUserId === currentUserId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-profile-title"
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-border-card bg-surface shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-24 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30 active:scale-95"
            aria-label="Close profile"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-0">
          <div className="-mt-12 mb-5 flex items-end gap-4">
            <UserAvatar
              name={modalUser.name}
              avatar={modalUser.avatar}
              size="xl"
              rounded="2xl"
              className="border-4 border-surface shadow-lg dark:border-slate-900"
            />
            <div className="min-w-0 flex-1 pb-1">
              <h2
                id="contact-profile-title"
                className="truncate text-xl font-bold text-text-main"
              >
                {modalUser.name}
              </h2>
              <p className="mt-1 text-sm text-text-dim">{formatContactSubtitle(modalUser)}</p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <Mail className="shrink-0 text-blue-500" size={18} aria-hidden />
              <span className="truncate text-sm text-text-main">{modalUser.email || '—'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onMessageClick(modalUser)}
              className="flex flex-[1.35] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquare size={17} strokeWidth={2.25} aria-hidden />
              Message
            </button>

            {!isSelf && (
              <button
                type="button"
                onClick={() => onToggleFollow(modalUserId)}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
                  isFollowing
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                    : 'bg-slate-100 text-blue-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
