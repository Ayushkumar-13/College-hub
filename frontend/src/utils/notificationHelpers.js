import {
  Heart, MessageSquare, UserPlus, Flag, MessageCircle, Megaphone,
} from 'lucide-react';

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'object') return value._id?.toString?.() || value.toString?.();
  return String(value);
}

export function getNotificationRoute(notification) {
  if (!notification) return '/notifications';

  const relatedUserId = idOf(notification.relatedUserId) || idOf(notification.fromUser);
  const postId = idOf(notification.postId);
  const issueId = idOf(notification.issueId);

  switch (notification.type) {
    case 'message':
      return relatedUserId ? `/messages?userId=${relatedUserId}` : '/messages';
    case 'issue':
      return issueId ? `/issues?issue=${issueId}` : '/issues';
    case 'follow':
      return '/contacts';
    case 'like':
    case 'comment':
    case 'post':
      return postId ? `/?post=${postId}` : '/';
    default:
      return '/notifications';
  }
}

export function getNotificationIcon(type) {
  switch (type) {
    case 'like':
      return Heart;
    case 'comment':
      return MessageCircle;
    case 'follow':
      return UserPlus;
    case 'message':
      return MessageSquare;
    case 'issue':
      return Flag;
    case 'post':
      return Megaphone;
    default:
      return MessageSquare;
  }
}

export function getNotificationIconClass(type) {
  switch (type) {
    case 'like':
      return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
    case 'comment':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'follow':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    case 'message':
      return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'issue':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
}

export function normalizeNotification(raw) {
  if (!raw) return null;
  return {
    ...raw,
    _id: raw._id || raw.id,
    fromUser: raw.fromUser && typeof raw.fromUser === 'object'
      ? raw.fromUser
      : raw.fromUser ? { _id: raw.fromUser } : null,
  };
}

export async function requestBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;
  if (!document.hidden) return null;

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
    if (typeof options.onClick === 'function') {
      notification.onclick = () => {
        window.focus();
        options.onClick();
        notification.close();
      };
    }
    return notification;
  } catch {
    return null;
  }
}
