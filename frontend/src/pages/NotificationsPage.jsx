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
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
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
        <p className="text-gray-600 text-center">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500 text-center">No notifications yet 🎉</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-lg shadow-sm border ${
                n.read ? "bg-gray-100 border-gray-300" : "bg-white border-blue-400"
              } flex items-center justify-between`}
            >
              <div>
                <p className="text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-500 mt-1">
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
