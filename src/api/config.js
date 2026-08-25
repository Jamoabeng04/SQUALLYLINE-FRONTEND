// api/config.js
// Where the Django API lives.
//
// The backend is served on the LAN so phones and tablets on the same Wi-Fi can
// use the app. Rather than hardcode one IP, we reuse whatever host the browser
// used to load the frontend and swap in the API port — so http://172.20.10.4:3000
// talks to http://172.20.10.4:8001 automatically, and localhost talks to localhost.
//
// Port 8001 (not the usual 8000) because another project already owns 8000 on
// the dev machine.

const API_PORT = process.env.REACT_APP_API_PORT || '8000';

const resolveBaseUrl = () => {
  // An explicit override always wins (set REACT_APP_API_URL in .env for staging/prod).
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    // return `http://127.0.0.1:${API_PORT}`;
    return 'https://squallyline-api.up.railway.app/'
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${API_PORT}`;
};

export const API_BASE_URL = resolveBaseUrl();

// Every DRF route is mounted under /api/.
export const API_ROOT = `${API_BASE_URL}/api`;

// Keys used for the persisted session.
export const STORAGE_KEYS = {
  access: 'sl_access_token',
  refresh: 'sl_refresh_token',
  user: 'sl_user',
};

// Media/image paths come back relative ("/media/products/x.jpg"); make them absolute.
export const mediaUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
