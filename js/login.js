/* ============================================
   LOGIN.JS — Starfield, Password, Transition
   Backend auth via POST /api/auth/login
   ============================================ */

'use strict';

/* ── BACKEND URL ─────────────────────────────── */
const API_BASE = 'http://localhost:5000/api';

/* ── STARFIELD ──────────────────────────────── */
const canvas = document.getElementById('starCanvas');
const ctx    = canvas.getContext('2d');

let stars  = [];
let width  = 0;
let height = 0;

function resize() {
  width  = canvas.width  = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

function initStars(count = 260) {
  stars = Array.from({ length: count }, () => ({
    x:     Math.random() * width,
    y:     Math.random() * height,
    r:     Math.random() * 1.6 + 0.2,
    alpha: Math.random(),
    delta: (Math.random() * 0.008 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
    speed: Math.random() * 0.12 + 0.02,
    drift: (Math.random() - 0.5) * 0.06,
  }));
}

function drawStars() {
  ctx.clearRect(0, 0, width, height);

  for (const s of stars) {
    s.alpha += s.delta;
    if (s.alpha >= 1 || s.alpha <= 0) s.delta *= -1;

    s.y -= s.speed;
    s.x += s.drift;
    if (s.y < 0) { s.y = height; s.x = Math.random() * width; }
    if (s.x < 0) s.x = width;
    if (s.x > width) s.x = 0;

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, s.alpha))})`;
    ctx.fill();

    if (s.r > 1.2) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5);
      g.addColorStop(0, `rgba(200,180,255,${s.alpha * 0.25})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  requestAnimationFrame(drawStars);
}

/* ── SHOOTING STARS ─────────────────────────── */
function launchShootingStar() {
  const el = document.createElement('div');
  el.className = 'shooting-star';

  const startX = Math.random() * window.innerWidth * 0.7;
  const startY = Math.random() * window.innerHeight * 0.4;
  const angle  = Math.random() * 30 + 20;
  const dist   = Math.random() * 300 + 200;

  el.style.cssText = `
    left: ${startX}px;
    top:  ${startY}px;
    opacity: 1;
    transform: rotate(${angle}deg);
  `;

  document.body.appendChild(el);

  const anim = el.animate([
    { opacity: 1, transform: `rotate(${angle}deg) translateX(0)` },
    { opacity: 0, transform: `rotate(${angle}deg) translateX(${dist}px)` },
  ], { duration: 700 + Math.random() * 400, easing: 'ease-in' });

  anim.onfinish = () => el.remove();
}

function scheduleShootingStar() {
  launchShootingStar();
  const next = Math.random() * 6000 + 3000;
  setTimeout(scheduleShootingStar, next);
}

/* ── PASSWORD TOGGLE ────────────────────────── */
const usernameInput = document.getElementById('usernameInput');
const pwInput       = document.getElementById('passwordInput');
const togglePw      = document.getElementById('togglePw');

togglePw.addEventListener('click', () => {
  const isHidden = pwInput.type === 'password';
  pwInput.type   = isHidden ? 'text' : 'password';
  togglePw.textContent = isHidden ? '🙈' : '👁';
});

/* ── FORM REFS ───────────────────────────────── */
const form           = document.getElementById('loginForm');
const errorMsg       = document.getElementById('errorMsg');
const errorHint      = document.getElementById('errorHint');
const pageTransition = document.getElementById('pageTransition');
const loginBtn       = document.getElementById('loginBtn');

/* ── ERROR HELPERS ──────────────────────────── */
function showError(msg, hint = '') {
  errorMsg.textContent = msg;
  errorMsg.classList.add('show');
  errorHint.textContent = hint;
  if (hint) errorHint.classList.add('show');

  // Shake the card — same animation as before
  const card = form.closest('.login-card');
  card.classList.remove('shake');
  void card.offsetWidth; // force reflow
  card.classList.add('shake');
  card.addEventListener('animationend', () => card.classList.remove('shake'), { once: true });
}

function clearError() {
  errorMsg.classList.remove('show');
  errorHint.classList.remove('show');
}

function setLoading(loading) {
  loginBtn.disabled     = loading;
  loginBtn.textContent  = loading ? '✨ Opening…' : '✨ Enter the Mystery';
  loginBtn.style.opacity = loading ? '0.85' : '1';
}

/* ── CINEMATIC TRANSITION ───────────────────── */
function doTransition() {
  pageTransition.classList.add('fade-in');
  setTimeout(() => { window.location.href = 'birthday.html'; }, 1300);
}

/* ── FORM SUBMIT — calls backend API ─────────── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const username = usernameInput.value.trim().toLowerCase();
  const password = pwInput.value.trim();

  if (!username) {
    showError('✦ Please enter your name…');
    usernameInput.focus();
    return;
  }

  if (!password) {
    showError('✦ Please whisper the magic word…');
    pwInput.focus();
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      showError(
        '✦ Incorrect name or secret word.',
        '✦ Check both fields and try again…'
      );
      pwInput.value = '';
      pwInput.focus();
      return;
    }

    // ── Success ──────────────────────────────────
    // Store JWT + user info
    localStorage.setItem('tum_token', data.token);
    localStorage.setItem('tum_user',  JSON.stringify(data.user));

    // Shooting star burst (same as original)
    for (let i = 0; i < 12; i++) launchShootingStar();

    // Cinematic fade transition (unchanged)
    setTimeout(doTransition, 600);

  } catch (err) {
    // Network / server unreachable
    setLoading(false);
    showError(
      '✦ Cannot reach the server…',
      '✦ Make sure the backend is running on port 5000'
    );
    console.error('[Login] Network error:', err);
  }
});

// Clear error while typing (either field)
pwInput.addEventListener('input', clearError);
usernameInput.addEventListener('input', clearError);

/* ── INIT ───────────────────────────────────── */
window.addEventListener('resize', () => { resize(); initStars(); });

resize();
initStars();
drawStars();
setTimeout(scheduleShootingStar, 2000);

// If already logged in, skip login screen
if (localStorage.getItem('tum_token')) {
  window.location.replace('birthday.html');
}
