/* ============================================================
   js/api.js — Frontend ↔ Backend Connector
   Drop this in your frontend /js/ folder and import in chat.html
   ============================================================ */

'use strict';

/* ── CONFIG ─────────────────────────────────────────────────── */
// Change this to your deployed backend URL when live
const API_BASE =
  window.BACKEND_URL ||
  'https://birthday-website-api.onrender.com/api';const SOCKET_URL = window.BACKEND_URL
  ? window.BACKEND_URL.replace('/api', '')
: 'https://birthday-website-api.onrender.com';
/* ── Token Storage ──────────────────────────────────────────── */
const TokenStore = {
  get:    ()      => localStorage.getItem('tum_token'),
  set:    (token) => localStorage.setItem('tum_token', token),
  clear:  ()      => localStorage.removeItem('tum_token'),
  exists: ()      => !!localStorage.getItem('tum_token'),
};

/* ── Base fetch wrapper ─────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = TokenStore.get();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

/* ── Auth API ───────────────────────────────────────────────── */
const AuthAPI = {
  login: async (username, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body:   { username, password },
    });
    if (data.token) TokenStore.set(data.token);
    return data;
  },

  getMe: () => apiFetch('/auth/me'),

  logout: async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (_) {}
    TokenStore.clear();
    sessionStorage.clear();
  },

  isLoggedIn: () => TokenStore.exists(),
};

/* ── Message API ────────────────────────────────────────────── */
const MessageAPI = {
  getHistory: (page = 1, limit = 50) =>
    apiFetch(`/messages?page=${page}&limit=${limit}`),

  send: (receiverId, message) =>
    apiFetch('/messages', { method: 'POST', body: { receiverId, message } }),

  delete: (id) =>
    apiFetch(`/messages/${id}`, { method: 'DELETE' }),

  edit: (id, message) =>
    apiFetch(`/messages/${id}`, { method: 'PUT', body: { message } }),

  markSeen: (messageIds) =>
    apiFetch('/messages/seen', { method: 'PUT', body: { messageIds } }),
};

/* ── User API ───────────────────────────────────────────────── */
const UserAPI = {
  getAll: () => apiFetch('/users'),
  getById: (id) => apiFetch(`/users/${id}`),
  updateAvatar: (avatar) =>
    apiFetch('/users/avatar', { method: 'PUT', body: { avatar } }),
};

/* ── Socket.IO Client Helper ────────────────────────────────── */
// Requires Socket.IO client CDN loaded before this file
// <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
class ChatSocket {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    const token = TokenStore.get();
    if (!token) throw new Error('No auth token — login first');

    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth:         { token },
      transports:   ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay:    1500,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
      this._emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      this._emit('disconnected', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  /* ── Send message ─────────────────────────────────────────── */
  sendMessage(receiverId, message) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) return reject(new Error('Socket not connected'));
      this.socket.emit('send-message', { receiverId, message }, (ack) => {
        if (ack?.success) resolve(ack.message);
        else reject(new Error(ack?.error || 'Failed to send'));
      });
    });
  }

  /* ── Typing ───────────────────────────────────────────────── */
  sendTyping(receiverId)     { this.socket?.emit('typing',      { receiverId }); }
  sendStopTyping(receiverId) { this.socket?.emit('stop-typing', { receiverId }); }

  /* ── Mark seen ────────────────────────────────────────────── */
  markSeen(messageId, senderId) {
    this.socket?.emit('message-seen', { messageId, senderId });
  }

  /* ── Event listeners ──────────────────────────────────────── */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    this.socket?.on(event, callback);
    return this;
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach((cb) => cb(data));
  }
}

/* ── Exports ─────────────────────────────────────────────────── */
window.TUM = {
  AuthAPI,
  MessageAPI,
  UserAPI,
  ChatSocket,
  TokenStore,
  SOCKET_URL,
  API_BASE,
};

console.log('✦ The Unknown Man — API connector loaded');
