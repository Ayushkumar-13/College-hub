import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotification } from '@/hooks';
import { getTimeAgo } from '@/utils/helpers';
import {
  getNotificationIcon,
  getNotificationIconClass,
  getNotificationRoute,
} from '@/utils/notificationHelpers';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const recent = notifications.slice(0, 8);

  const handleItemClick = async (n) => {
    if (!n.read) await markAsRead(n._id);
    setOpen(false);
    navigate(getNotificationRoute(n));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group active:scale-95"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={22} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,380px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[60]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-text-main">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {recent.length === 0 ? (
              <p className="p-6 text-center text-sm text-text-dim">You&apos;re all caught up</p>
            ) : (
              recent.map((n) => {
                const Icon = getNotificationIcon(n.type);
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                      !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${getNotificationIconClass(n.type)}`}>
                      {n.fromUser?.avatar ? (
                        <img src={n.fromUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.read ? 'text-text-dim' : 'text-text-main font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-text-dim/70 mt-1">{getTimeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => { setOpen(false); navigate('/notifications'); }}
            className="w-full py-3 text-sm font-medium text-blue-600 dark:text-blue-400 border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            See all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
