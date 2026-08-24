// api/client.js
// Thin fetch wrapper around the Squally Line API.
//
// Handles: JSON vs FormData bodies, bearer tokens, query strings, and a single
// transparent retry after refreshing an expired access token. Concurrent 401s
// share one refresh request so a page with six widgets doesn't fire six refreshes
// (and, with ROTATE_REFRESH_TOKENS on, blacklist its own token five times).

import { API_ROOT, STORAGE_KEYS } from './config';

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------- token store

export const tokenStore = {
  getAccess: () => localStorage.getItem(STORAGE_KEYS.access),
  getRefresh: () => localStorage.getItem(STORAGE_KEYS.refresh),
  getUser: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: ({ access, refresh, user }) => {
    if (access) localStorage.setItem(STORAGE_KEYS.access, access);
    if (refresh) localStorage.setItem(STORAGE_KEYS.refresh, refresh);
    if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  },
  clear: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

// Lets AuthProvider react to a session dying deep inside some component's fetch.
let onSessionExpired = null;
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

// ------------------------------------------------------------------- refresh

let refreshInFlight = null;

const refreshAccessToken = async () => {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;

  // Collapse parallel refreshes into one request.
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_ROOT}/accounts/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const access = data.access || data.tokens?.access;
        if (!access) return null;

        // ROTATE_REFRESH_TOKENS is on, so a new refresh token comes back too.
        tokenStore.set({ access, refresh: data.refresh || data.tokens?.refresh });
        return access;
      } catch {
        return null;
      } finally {
        // Release the lock on the next tick so waiters read the stored token.
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }

  return refreshInFlight;
};

// ------------------------------------------------------------------- request

const buildUrl = (path, params) => {
  const url = `${API_ROOT}${path.startsWith('/') ? '' : '/'}${path}`;
  if (!params) return url;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else {
      search.append(key, value);
    }
  });

  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
};

const parseBody = async (response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// DRF errors arrive in several shapes: {message}, {detail}, {error},
// or {errors: {field: [msg]}}. Flatten to one readable line.
const extractMessage = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === 'string') return data.slice(0, 300);
  if (data.message) return data.message;
  if (data.detail) return data.detail;

  const errors = data.errors || data;
  if (typeof errors === 'object') {
    const parts = [];
    Object.entries(errors).forEach(([field, value]) => {
      const text = Array.isArray(value) ? value.join(' ') : value;
      if (typeof text !== 'string') return;
      parts.push(field === 'error' || field === 'non_field_errors' ? text : `${field}: ${text}`);
    });
    if (parts.length) return parts.join('\n');
  }

  return fallback;
};

const request = async (path, { method = 'GET', body, params, auth = true, headers = {}, signal } = {}) => {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const send = async (token) => {
    const finalHeaders = { Accept: 'application/json', ...headers };
    if (!isFormData && body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    if (token) finalHeaders.Authorization = `Bearer ${token}`;

    return fetch(buildUrl(path, params), {
      method,
      headers: finalHeaders,
      signal,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  };

  let response;
  try {
    response = await send(auth ? tokenStore.getAccess() : null);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the server. Check your connection.', { status: 0 });
  }

  // Expired access token: refresh once, then replay the request.
  if (response.status === 401 && auth && tokenStore.getRefresh()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await send(newToken);
    } else {
      tokenStore.clear();
      if (onSessionExpired) onSessionExpired();
      throw new ApiError('Your session has expired. Please sign in again.', { status: 401 });
    }
  }

  const data = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(extractMessage(data, `Request failed (${response.status})`), {
      status: response.status,
      data,
    });
  }

  return data;
};

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  raw: request,
};

export default api;
