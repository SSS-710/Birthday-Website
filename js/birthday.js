/* ============================================
   BIRTHDAY.JS — Floating Elements, Cake, Confetti
   ============================================ */

'use strict';

/* ── ACCESS GUARD ───────────────────────────── */
// Allow direct access for development; in production check sessionStorage
// sessionStorage.setItem('unlocked', 'true') is set after login

/* ── FLOATING BACKGROUND ────────────────────── */
const bgLayer = document.getElementById('bgLayer');

// Balloon colours
const BALLOON_COLORS = [
  'linear-gradient(160deg,#f9a8d4,#ec4899)',
  'linear-gradient(160deg,#fcd34d,#f59e0b)',
  'linear-gradient(160deg,#c4b5fd,#a855f7)',
  'linear-gradient(160deg,#6ee7b7,#10b981)',
  'linear-gradient(160deg,#fdba74,#f97316)',
  'linear-gradient(160deg,#fbcfe8,#f472b6)',
  'linear-gradient(160deg,#fde68a,#fbbf24)',
];

const HEARTS = ['❤️','💕','💖','💗','💝','💓','🌸','✨'];
const BUTTERFLIES = ['🦋','🌸','🌺','🌼'];

function createCloud() {
  const el = document.createElement('div');
  el.className = 'cloud';
  const w   = Math.random() * 180 + 100;
  const h   = Math.random() * 55  + 35;
  const top = Math.random() * 70  + 5;
  const dur = Math.random() * 25  + 20;

  el.style.cssText = `
    position: absolute;
    width: ${w}px;
    height: ${h}px;
    top: ${top}%;
    left: ${Math.random() < 0.5 ? '-' + w + 'px' : '110%'};
    background: rgba(255,255,255,0.55);
    border-radius: 60px;
    filter: blur(18px);
    animation: cloudDrift ${dur}s linear infinite;
    pointer-events: none;
  `;

  /* pseudo-cloud bumps via box-shadow */
  el.style.boxShadow = `
    ${w * 0.25}px ${-h * 0.4}px 0 ${h * 0.2}px rgba(255,255,255,0.45),
    ${w * 0.55}px ${-h * 0.25}px 0 ${h * 0.1}px rgba(255,255,255,0.4)
  `;

  bgLayer.appendChild(el);
}

function createBalloon() {
  const el = document.createElement('div');
  el.className = 'balloon';
  const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
  const size  = Math.random() * 24 + 30;
  const left  = Math.random() * 100;
  const dur   = Math.random() * 14 + 12;
  const delay = Math.random() * 8;

  el.style.cssText = `
    left: ${left}%;
    width: ${size}px;
    height: ${size * 1.3}px;
    background: ${color};
    animation-duration: ${dur}s;
    animation-delay: ${delay}s;
    box-shadow: inset -4px -4px 10px rgba(0,0,0,0.1), inset 3px 3px 8px rgba(255,255,255,0.4);
  `;
  bgLayer.appendChild(el);
}

function createHeart() {
  const el = document.createElement('div');
  el.className = 'heart-float';
  el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  const left  = Math.random() * 100;
  const dur   = Math.random() * 10 + 10;
  const delay = Math.random() * 12;
  const size  = Math.random() * 12 + 14;

  el.style.cssText = `
    left: ${left}%;
    font-size: ${size}px;
    animation-duration: ${dur}s;
    animation-delay: ${delay}s;
  `;
  bgLayer.appendChild(el);
}

function createSparkle() {
  const el = document.createElement('div');
  el.className = 'sparkle';
  const left = Math.random() * 100;
  const top  = Math.random() * 100;
  const dur  = Math.random() * 3 + 2;
  const delay = Math.random() * 5;
  const size = Math.random() * 5 + 3;

  el.style.cssText = `
    left: ${left}%;
    top:  ${top}%;
    width: ${size}px;
    height: ${size}px;
    animation-duration: ${dur}s;
    animation-delay: ${delay}s;
  `;
  bgLayer.appendChild(el);
}

function createButterfly() {
  const el = document.createElement('div');
  el.className = 'butterfly';
  el.textContent = BUTTERFLIES[Math.floor(Math.random() * BUTTERFLIES.length)];
  const left  = Math.random() * 90;
  const dur   = Math.random() * 15 + 15;
  const delay = Math.random() * 20;
  const size  = Math.random() * 10 + 20;

  el.style.cssText = `
    left: ${left}%;
    font-size: ${size}px;
    animation-duration: ${dur}s;
    animation-delay: ${delay}s;
  `;
  bgLayer.appendChild(el);
}

// Initialise background layer
(function initBackground() {
  for (let i = 0; i < 14; i++) createBalloon();
  for (let i = 0; i < 20; i++) createHeart();
  for (let i = 0; i < 40; i++) createSparkle();
  for (let i = 0; i < 8;  i++) createButterfly();
  for (let i = 0; i < 6;  i++) createCloud();

  // Keep spawning fresh balloons every 14 s so screen stays lively
  setInterval(() => {
    if (bgLayer.querySelectorAll('.balloon').length < 22) createBalloon();
  }, 14000);
})();

/* ── HAMBURGER NAV ──────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });
}

/* ── CAKE CUT INTERACTION ───────────────────── */
const cutBtn     = document.getElementById('cutCakeBtn');
const cake       = document.getElementById('cake');
const flames     = document.querySelectorAll('.flame');
let   cakeCut    = false;

cutBtn.addEventListener('click', () => {
  if (cakeCut) return;
  cakeCut = true;

  cutBtn.disabled = true;
  cutBtn.style.opacity = '0.6';
  cutBtn.textContent = '🎊 Yay!';

  // 1. Blow out candles with stagger
  flames.forEach((flame, i) => {
    setTimeout(() => {
      flame.classList.add('out');
    }, i * 120);
  });

  // 2. Cake cutting animation
  setTimeout(() => {
    cake.classList.add('cutting');
  }, 700);

  // 3. Confetti explosion
  setTimeout(() => {
    launchConfetti(180);
  }, 900);

  // 4. Navigate to memories page
  setTimeout(() => {
    fadeOutToPage('memories.html');
  }, 4000);
});

/* ── CONFETTI ────────────────────────────────── */
const CONFETTI_COLORS = [
  '#ec4899','#f9a8d4','#fcd34d','#a855f7',
  '#34d399','#fb923c','#60a5fa','#f472b6',
  '#fbbf24','#c084fc','#4ade80','#f87171',
];

function launchConfetti(count) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnConfettiPiece(), Math.random() * 1200);
  }
}

function spawnConfettiPiece() {
  const el    = document.createElement('div');
  el.className = 'confetti-piece';

  const color  = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const left   = Math.random() * 100;
  const drift  = (Math.random() - 0.5) * 200;
  const dur    = Math.random() * 2.5 + 2;
  const size   = Math.random() * 8 + 5;
  const shapes = ['2px','50%','0'];
  const shape  = shapes[Math.floor(Math.random() * shapes.length)];

  el.style.cssText = `
    left:${left}vw;
    top:-20px;
    width:${size}px;
    height:${size}px;
    background:${color};
    border-radius:${shape};
    --drift:${drift}px;
    animation-duration:${dur}s;
    animation-delay:${Math.random() * 0.4}s;
    opacity:1;
  `;

  document.body.appendChild(el);
  setTimeout(() => el.remove(), (dur + 0.5) * 1000);
}

/* ── PAGE FADE HELPER ───────────────────────── */
function fadeOutToPage(url) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:linear-gradient(160deg,#fff0f8,#fce7f3,#fbcfe8);
    opacity:0;pointer-events:all;
    transition:opacity 1.2s cubic-bezier(0.25,0.46,0.45,0.94);
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  });
  setTimeout(() => { window.location.href = url; }, 1300);
}

/* ── ENTRANCE ANIMATION ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.8s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { document.body.style.opacity = '1'; });
  });
});
