/** Helpers for user profile photos (uploaded avatars only — no generated avatars). */

export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function hasUserAvatar(avatar) {
  if (!avatar || typeof avatar !== 'string') return false;
  const trimmed = avatar.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('blob:')) return true;
  if (trimmed.includes('dicebear.com')) return false;
  return true;
}

export function resolveUserAvatar(avatar) {
  return hasUserAvatar(avatar) ? avatar : null;
}
