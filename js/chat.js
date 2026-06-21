/* ============================================================
   CHAT.JS — Our Little Space ❤️
   Real-time chat via Socket.IO + MongoDB REST history
   Identity from JWT (window.TUM_AUTH set by auth.js)
   ============================================================ */

'use strict';

/* ── CONFIG ─────────────────────────────────────────────────── */
const API_BASE   = 'http://https://birthday-website-api.onrender.com/api';
const SOCKET_URL = 'http://https://birthday-website-api.onrender.com';

/* ── CURRENT USER (from auth.js → localStorage) ─────────────── */
const ME    = window.TUM_AUTH.getUser();
const TOKEN = window.TUM_AUTH.getToken();

if (!ME || !TOKEN) {
  window.location.replace('index.html');
  throw new Error('Not authenticated');
}

/* ── EMOJIS ─────────────────────────────────────────────────── */
const EMOJIS = [
  '❤️','💕','💖','💗','💝','💓','🌸','🌺','🌹',
  '✨','🌟','💫','⭐','🎀','🎁','🎂','🍰','🧁',
  '😊','😍','🥰','😘','🤗','😂','🥹','😭','🙈',
  '🌈','🦋','🌙','☀️','🌻','🌼','🍓','🍒','🍑',
  '💌','📸','🎵','🎶','🎉','🎊','🥂','💐','🕊️',
  '👑','💎','🌷','🫶','💞','🩷','🫀','🤍','🩵',
];

/* ── STATE ──────────────────────────────────────────────────── */
let socket           = null;
let otherUser        = null;
let typingTimer      = null;
let isTyping         = false;
let seenObserver     = null;
let typingIndicatorEl = null;
const renderedIds    = new Set();

/* ── DOM REFS ───────────────────────────────────────────────── */
const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const chatSend     = document.getElementById('chatSend');
const emojiPicker  = document.getElementById('emojiPicker');
const emojiToggle  = document.getElementById('emojiToggle');
const chatStatus   = document.getElementById('chatStatus');
const connStatus   = document.getElementById('firebaseStatus');
const chatAvatarEl = document.getElementById('chatAvatar');

/* ── PAGE FADE IN (same as before) ─────────────────────────── */
document.body.style.opacity    = '0';
document.body.style.transition = 'opacity 0.8s ease';
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.body.style.opacity = '1';
}));

/* ============================================================
   INIT — runs on load
   ============================================================ */
async function init() {
  try {
    connStatus.textContent = '⏳ Connecting…';
    connStatus.style.color = 'rgba(190,24,93,0.45)';

    // 1. Find the other user
    otherUser = await fetchOtherUser();

    // 2. Update header avatar & online status
    updateHeader();

    // 3. Load message history from MongoDB
    await loadHistory();

    // 4. Connect Socket.IO with JWT
    connectSocket();

    // 5. Build emoji picker
    buildEmojiPicker();

    // 6. Wire up input
    setupInput();

    // 7. IntersectionObserver for auto-marking messages as seen
    setupSeenObserver();

  } catch (err) {
    console.error('[Chat] Init failed:', err);
    connStatus.textContent = '❌ Failed to load — please refresh';
    connStatus.style.color = 'rgba(239,68,68,0.65)';
  }
}

/* ============================================================
   USERS
   ============================================================ */
async function fetchOtherUser() {
  const res  = await fetch(`${API_BASE}/users`, {
    headers: window.TUM_AUTH.authHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error('Failed to load users');

  const other = data.data.find((u) => u._id !== ME._id);
  if (!other) throw new Error('Other user not found');
  return other;
}

function updateHeader() {
  if (!otherUser) return;
  // Set avatar from user profile
  chatAvatarEl.textContent = otherUser.avatar || '💝';
  // Set online status
  setOnlineStatus(otherUser.isOnline, null);
}

function setOnlineStatus(online, lastSeenDate) {
  if (online) {
    chatStatus.textContent = '● Online';
    chatStatus.style.color = '#22c55e';
    chatAvatarEl.classList.remove('offline');
  } else {
    if (lastSeenDate) {
      const t = new Date(lastSeenDate).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
      chatStatus.textContent = `● Last seen ${t}`;
    } else {
      chatStatus.textContent = '● Offline';
    }
    chatStatus.style.color = 'rgba(190,24,93,0.45)';
    chatAvatarEl.classList.add('offline');
  }
}

/* ============================================================
   HISTORY — load from REST API
   ============================================================ */
async function loadHistory() {
  const res  = await fetch(`${API_BASE}/messages?limit=100`, {
    headers: window.TUM_AUTH.authHeaders(),
  });
  const data = await res.json();
  if (!data.success) return;

  const messages = data.data?.messages || [];

  if (messages.length === 0) {
    showWelcomeMessage();
    return;
  }

  // Group by date
  const todayStr = todayLabel();
  let   lastDate = '';

  messages.forEach((msg) => {
    const d = new Date(msg.createdAt).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    if (d !== lastDate) {
      showDateDivider(d === todayStr ? `Today — ${d}` : d);
      lastDate = d;
    }
    appendMessage(msg, false);
  });

  scrollToBottom();
}

/* ============================================================
   SOCKET.IO
   ============================================================ */
function connectSocket() {
  socket = io(SOCKET_URL, {
    auth:                 { token: TOKEN },
    reconnection:         true,
    reconnectionAttempts: 20,
    reconnectionDelay:    1500,
    transports:           ['websocket', 'polling'],
  });

  socket.on('connect',         onConnect);
  socket.on('disconnect',      onDisconnect);
  socket.on('connect_error',   onConnectError);
  socket.on('receive-message', onReceiveMessage);
  socket.on('typing',          onTyping);
  socket.on('stop-typing',     onStopTyping);
  socket.on('message-seen',    onMessageSeen);
  socket.on('message-deleted', onMessageDeleted);
  socket.on('user-online',     onUserOnline);
  socket.on('user-offline',    onUserOffline);
}

/* ── Socket event handlers ──────────────────────────────────── */

function onConnect() {
  connStatus.textContent = '🔗 Live — connected ✨';
  connStatus.style.color = 'rgba(34,197,94,0.65)';
}

function onDisconnect(reason) {
  connStatus.textContent = '⚡ Reconnecting…';
  connStatus.style.color = 'rgba(234,179,8,0.65)';
}

function onConnectError(err) {
  connStatus.textContent = '❌ Cannot connect — retrying…';
  connStatus.style.color = 'rgba(239,68,68,0.65)';
  console.error('[Socket] connect_error:', err.message);
}

function onReceiveMessage(msg) {
  const id = msg._id?.toString();
  if (id && renderedIds.has(id)) return; // dedup

  removeTypingIndicator();
  appendMessage(msg, true);
  scrollToBottom();

  // Auto-mark seen if window is focused
  if (document.hasFocus() && id) {
    const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
    markSeen(id, senderId);
  }
}

function onTyping({ senderId }) {
  if (senderId?.toString() === otherUser?._id?.toString()) {
    showTypingIndicator();
    scrollToBottom();
  }
}

function onStopTyping({ senderId }) {
  if (senderId?.toString() === otherUser?._id?.toString()) {
    removeTypingIndicator();
  }
}

function onMessageSeen({ messageId }) {
  // Update ✓ → ✓✓ on the sent bubble
  const row = chatMessages.querySelector(`[data-id="${messageId}"]`);
  if (!row) return;
  const tick = row.querySelector('.msg-tick');
  if (tick && !tick.classList.contains('seen')) {
    tick.textContent = '✓✓';
    tick.classList.add('seen');
  }
}

function onMessageDeleted({ messageId }) {
  const row = chatMessages.querySelector(`[data-id="${messageId}"]`);
  if (!row) return;
  const bubble = row.querySelector('.msg-bubble');
  if (bubble) bubble.innerHTML = '<em style="opacity:0.5;">🚫 Message deleted</em>';
}

function onUserOnline({ userId }) {
  if (userId?.toString() === otherUser?._id?.toString()) {
    setOnlineStatus(true, null);
  }
}

function onUserOffline({ userId, lastSeen }) {
  if (userId?.toString() === otherUser?._id?.toString()) {
    setOnlineStatus(false, lastSeen);
  }
}

/* ============================================================
   SEND MESSAGE
   ============================================================ */
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || !socket?.connected || !otherUser) return;

  // Optimistic ID
  const tempId = `tmp_${Date.now()}`;

  // 1. Clear input
  chatInput.value        = '';
  chatInput.style.height = 'auto';
  chatInput.focus();

  // 2. Optimistic bubble — appears instantly on right
  appendMessage({
    _id:         tempId,
    sender:      ME,
    receiver:    otherUser._id,
    message:     text,
    seen:        false,
    createdAt:   new Date().toISOString(),
    _optimistic: true,
  }, true);
  scrollToBottom();

  // 3. Button animation + heart burst
  chatSend.classList.add('sending');
  setTimeout(() => chatSend.classList.remove('sending'), 400);
  spawnMsgHeart();

  // 4. Stop typing signal
  sendStopTyping();

  // 5. Emit via socket
  socket.emit('send-message', {
    receiverId: otherUser._id,
    message:    text,
  }, (ack) => {
    const optimisticRow = chatMessages.querySelector(`[data-id="${tempId}"]`);

    if (ack?.success) {
      // Swap temp ID for real MongoDB ID
      const realId = ack.message?._id?.toString();
      if (optimisticRow && realId) {
        optimisticRow.dataset.id = realId;
        renderedIds.delete(tempId);
        renderedIds.add(realId);
      }
    } else {
      // Mark failed
      if (optimisticRow) {
        const bubble = optimisticRow.querySelector('.msg-bubble');
        const tick   = optimisticRow.querySelector('.msg-tick');
        if (bubble) bubble.style.opacity = '0.5';
        if (tick)   { tick.textContent = '✗'; tick.style.color = '#ef4444'; }
      }
    }
  });
}

/* ============================================================
   TYPING SIGNALS
   ============================================================ */
function sendTyping() {
  if (!socket?.connected || !otherUser) return;
  if (!isTyping) {
    isTyping = true;
    socket.emit('typing', { receiverId: otherUser._id });
  }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(sendStopTyping, 2000);
}

function sendStopTyping() {
  if (!socket?.connected || !otherUser) return;
  isTyping = false;
  clearTimeout(typingTimer);
  socket.emit('stop-typing', { receiverId: otherUser._id });
}

/* ============================================================
   SEEN RECEIPTS
   ============================================================ */
function markSeen(messageId, senderId) {
  if (!socket?.connected || !messageId || !senderId) return;
  socket.emit('message-seen', { messageId, senderId });
}

function setupSeenObserver() {
  seenObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const row      = entry.target;
      const msgId    = row.dataset.id;
      const senderIdAttr = row.dataset.senderId;
      if (msgId && senderIdAttr && !msgId.startsWith('tmp_')) {
        markSeen(msgId, senderIdAttr);
        seenObserver.unobserve(row);
      }
    });
  }, { root: chatMessages, threshold: 0.6 });
}

/* ============================================================
   TYPING INDICATOR (DOM)
   ============================================================ */
function showTypingIndicator() {
  if (typingIndicatorEl) return;
  typingIndicatorEl = document.createElement('div');
  typingIndicatorEl.className = 'typing-indicator';
  typingIndicatorEl.id        = 'typingIndicator';
  typingIndicatorEl.innerHTML = `
    <div class="msg-avatar-mini" style="background:linear-gradient(135deg,#fce7f3,#fbcfe8)">
      ${otherUser?.avatar || '💝'}
    </div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  chatMessages.appendChild(typingIndicatorEl);
}

function removeTypingIndicator() {
  if (!typingIndicatorEl) return;
  typingIndicatorEl.remove();
  typingIndicatorEl = null;
}

/* ============================================================
   RENDER MESSAGE
   ============================================================ */
function appendMessage(msg, animate = true) {
  const id = msg._id?.toString();

  // Dedup: skip non-temp IDs already rendered
  if (id && !id.startsWith('tmp_') && renderedIds.has(id)) return;
  if (id) renderedIds.add(id);

  // Determine direction: am I the sender?
  const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
  const isSent   = senderId === ME._id;

  // Avatar
  const avatarEmoji = isSent
    ? (ME.avatar || '💝')
    : (otherUser?.avatar || '💝');

  // Timestamp
  const time = formatTime(new Date(msg.createdAt));

  // Seen tick — only on outgoing messages
  const tickHtml = isSent
    ? `<span class="msg-tick${msg.seen ? ' seen' : ''}">${msg.seen ? '✓✓' : '✓'}</span>`
    : '';

  // Content (handle soft-deleted)
  const bubbleContent = msg.deleted
    ? '<em style="opacity:0.5">🚫 Message deleted</em>'
    : formatMsgText(msg.message || '');

  const row         = document.createElement('div');
  row.className     = `msg-row ${isSent ? 'sent' : 'received'}`;
  row.dataset.id    = id || '';

  // Store senderId on received rows so seenObserver can use it
  if (!isSent && id && !id.startsWith('tmp_')) {
    row.dataset.senderId = senderId;
  }

  row.innerHTML = `
    <div class="msg-avatar-mini" aria-hidden="true">${avatarEmoji}</div>
    <div class="msg-group">
      <div class="msg-bubble">${bubbleContent}</div>
      <span class="msg-time">${time}${tickHtml}</span>
    </div>
  `;

  chatMessages.appendChild(row);

  // Slide-in animation (identical to original)
  if (animate) {
    row.style.opacity   = '0';
    row.style.transform = isSent ? 'translateX(20px)' : 'translateX(-20px)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.style.transition = 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        row.style.opacity    = '1';
        row.style.transform  = 'translateX(0)';
      });
    });
  }

  // Watch received messages for auto-seen
  if (!isSent && seenObserver && id && !id.startsWith('tmp_')) {
    seenObserver.observe(row);
  }
}

/* ============================================================
   WELCOME / DATE DIVIDER
   ============================================================ */
function showWelcomeMessage() {
  appendMessage({
    _id:       'welcome-msg',
    sender:    { _id: 'system', displayName: 'The Unknown Man', avatar: '🌙' },
    message:   "Welcome to Our Little Space ❤️\nThis is your private corner of the world — say anything, no matter how small. I'm always here. 🌸",
    seen:      false,
    createdAt: new Date().toISOString(),
  }, true);
}

function showDateDivider(label) {
  const div       = document.createElement('div');
  div.className   = 'date-divider';
  div.textContent = label;
  chatMessages.appendChild(div);
}

/* ============================================================
   EMOJI PICKER
   ============================================================ */
function buildEmojiPicker() {
  const frag = document.createDocumentFragment();
  EMOJIS.forEach((emoji) => {
    const btn       = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'emoji-btn';
    btn.textContent = emoji;
    btn.setAttribute('aria-label', emoji);
    btn.addEventListener('click', () => {
      const pos = chatInput.selectionStart;
      const val = chatInput.value;
      chatInput.value = val.slice(0, pos) + emoji + val.slice(pos);
      chatInput.selectionStart = chatInput.selectionEnd = pos + emoji.length;
      chatInput.focus();
      closeEmojiPicker();
    });
    frag.appendChild(btn);
  });
  emojiPicker.appendChild(frag);
}

function toggleEmojiPicker() {
  const open = emojiPicker.classList.toggle('open');
  emojiToggle.setAttribute('aria-expanded', String(open));
}

function closeEmojiPicker() {
  emojiPicker.classList.remove('open');
  emojiToggle.setAttribute('aria-expanded', 'false');
}

emojiToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleEmojiPicker();
});

document.addEventListener('click', (e) => {
  if (!emojiPicker.contains(e.target) && e.target !== emojiToggle) {
    closeEmojiPicker();
  }
});

/* ============================================================
   INPUT SETUP
   ============================================================ */
function setupInput() {
  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 130) + 'px';
    sendTyping();
  });

  // Enter = send, Shift+Enter = new line
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chatSend.addEventListener('click', sendMessage);
}

/* ============================================================
   CLEAR CHAT
   ============================================================ */
document.getElementById('clearChatBtn').addEventListener('click', () => {
  if (!confirm('Clear chat view? 💔\n(Messages are still saved on the server)')) return;
  chatMessages.innerHTML = '';
  renderedIds.clear();
  showWelcomeMessage();
});

/* ============================================================
   FLOATING HEART ON SEND (unchanged)
   ============================================================ */
function spawnMsgHeart() {
  const el      = document.createElement('div');
  el.className  = 'msg-heart';
  el.textContent = ['💗','💖','❤️','🌸','✨'][Math.floor(Math.random() * 5)];
  const rect    = chatSend.getBoundingClientRect();
  el.style.cssText = `
    position:fixed;
    left:${rect.left + rect.width / 2 - 12}px;
    top:${rect.top - 10}px;
    font-size:1.5rem;
    pointer-events:none;
    z-index:9999;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/* ============================================================
   HELPERS
   ============================================================ */
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMsgText(str) {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

/* ============================================================
   START
   ============================================================ */
init();
