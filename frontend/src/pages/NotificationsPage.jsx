import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotification } from '@/hooks';
import Navbar from '@/components/Navbar';
import { getTimeAgo } from '@/utils/helpers';
import {
  getNotificationIcon,
  getNotificationIconClass,
  getNotificationRoute,
} from '@/utils/notificationHelpers';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotification();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (n) => {
    if (!n.read) await markAsRead(n._id);
    navigate(getNotificationRoute(n));
  };

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-text-dim mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {loading && notifications.length === 0 ? (
          <p className="text-text-dim text-center py-12">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-6 bg-surface dark:bg-slate-900 rounded-2xl border border-border-card">
            <Bell size={48} className="mx-auto text-text-dim/40 mb-4" />
            <p className="text-text-main font-medium">No notifications yet</p>
            <p className="text-sm text-text-dim mt-2">
              Likes, messages, follows, and issue updates will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = getNotificationIcon(n.type);
              return (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                    n.read
                      ? 'bg-surface/60 dark:bg-slate-900/40 border-border-card'
                      : 'bg-surface dark:bg-slate-900 border-blue-300 dark:border-blue-700 shadow-sm'
                  }`}
                >
                  <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center overflow-hidden ${getNotificationIconClass(n.type)}`}>
                    {n.fromUser?.avatar ? (
                      <img src={n.fromUser.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {n.title && n.title !== n.message && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-dim mb-0.5">
                        {n.title}
                      </p>
                    )}
                    <p className={`text-sm ${n.read ? 'text-text-dim' : 'text-text-main font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-text-dim/70 mt-1.5">{getTimeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 shrink-0" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
