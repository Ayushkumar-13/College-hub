/** Live backend + Socket.IO server on Render */
export const LIVE_BACKEND_URL = 'https://college-hub.onrender.com';

export const API_URL =
  import.meta.env.VITE_API_URL || `${LIVE_BACKEND_URL}/api`;

/** Live student app on Vercel */
export const LIVE_STUDENT_APP_URL = 'https://college-hub-pi.vercel.app';

/** Live admin panel on Vercel */
export const LIVE_ADMIN_APP_URL = 'https://college-hub-eyfi.vercel.app';

export const STUDENT_APP_URL =
  import.meta.env.VITE_STUDENT_APP_URL || LIVE_STUDENT_APP_URL;

export const ADMIN_APP_URL =
  import.meta.env.VITE_ADMIN_URL || LIVE_ADMIN_APP_URL;

/** Socket.IO connects to the backend host (not /api path) */
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || LIVE_BACKEND_URL;
