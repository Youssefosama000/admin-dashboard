/**
 * API client for Slyce backend.
 * Login returns HTTP 204 + Set-Cookie: access_token=<JWT>
 * Vite proxies /api → real backend so the cookie is stored for localhost.
 */
const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api';

export const session = {
  isLoggedIn:  () => localStorage.getItem('slyce_admin_logged_in') === 'true',
  setLoggedIn: () => localStorage.setItem('slyce_admin_logged_in', 'true'),
  getName:     () => localStorage.getItem('slyce_admin_name') ?? 'Admin',
  setName:     (n) => localStorage.setItem('slyce_admin_name', n),
  getEmail:    () => localStorage.getItem('slyce_admin_email') ?? '',
  setEmail:    (e) => localStorage.setItem('slyce_admin_email', e),
  clear: () => {
    localStorage.removeItem('slyce_admin_logged_in');
    localStorage.removeItem('slyce_admin_name');
    localStorage.removeItem('slyce_admin_email');
  },
};

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  // 401 = session expired or cookie missing → clear session and reload to login
  if (res.status === 401) {
    session.clear();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const e = await res.json(); msg = e.message ?? e.title ?? msg; } catch { /* */ }
    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const api = {
  get:    (path, opts)       => request(path, { ...opts, method: 'GET' }),
  post:   (path, body, opts) => request(path, { ...opts, method: 'POST',  body }),
  patch:  (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts)       => request(path, { ...opts, method: 'DELETE' }),
};
