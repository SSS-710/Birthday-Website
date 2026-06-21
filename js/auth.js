/* ============================================
   auth.js — JWT Guard for Protected Pages
   Runs immediately. Redirects to index.html
   if no valid token is found in localStorage.
   ============================================ */

(function () {
  'use strict';

  const TOKEN_KEY = 'tum_token';
  const USER_KEY  = 'tum_user';
  const LOGIN_URL = 'index.html';

  /* ── Read token ───────────────────────────── */
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    // No token at all → send to login immediately
    window.location.replace(LOGIN_URL);
    return;
  }

  /* ── Lightweight client-side expiry check ── */
  // JWT payload is the middle base64 segment
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const nowSecs = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < nowSecs) {
      // Token has expired — clear storage and redirect
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace(LOGIN_URL);
      return;
    }
  } catch (_) {
    // Malformed token → treat as unauthenticated
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.replace(LOGIN_URL);
    return;
  }

  /* ── Expose helpers on window for other scripts ── */
  window.TUM_AUTH = {
    /** Returns the raw JWT string */
    getToken: () => localStorage.getItem(TOKEN_KEY),

    /** Returns the stored user object or null */
    getUser: () => {
      try { return JSON.parse(localStorage.getItem(USER_KEY)); }
      catch (_) { return null; }
    },

    /** Clears session and redirects to login */
    logout: async () => {
      try {
        const t = localStorage.getItem(TOKEN_KEY);
        if (t) {
          await fetch('http://localhost:5000/api/auth/logout', {
            method:  'POST',
            headers: { Authorization: `Bearer ${t}` },
          });
        }
      } catch (_) { /* network error — still clear local session */ }
      finally {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.replace(LOGIN_URL);
      }
    },

    /** Attaches Bearer token to a fetch options object */
    authHeaders: () => ({
      Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      'Content-Type': 'application/json',
    }),
  };
})();
