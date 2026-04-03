// src/pages/NotificationPage.jsx
import React, { useEffect } from "react";
import { useNotification } from "@/hooks";

const NotificationPage = () => {
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotification();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-main">Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-text-dim text-center">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-text-dim/80 text-center">No notifications yet 🎉</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-xl shadow-sm border transition-all duration-200 ${
                n.read 
                  ? "bg-slate-100 dark:bg-slate-800/40 border-border-card" 
                  : "bg-surface dark:bg-slate-800 border-blue-400 dark:border-blue-500 shadow-md"
              } flex items-center justify-between`}
            >
              <div>
                <p className={n.read ? "text-text-dim" : "text-text-main font-medium"}>{n.message}</p>
                <p className="text-xs text-text-dim/60 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markAsRead(n._id)}
                  className="ml-4 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
