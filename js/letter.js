/* ============================================
   LETTER.JS — Envelope, Unfold, Typewriter
   ============================================ */

'use strict';

/* ── LETTER TEXT ────────────────────────────── */
const LETTER_TEXT = `To the Girl with the Most Beautiful Smile,

Happy Birthday, Bhumika. 🤍

I don't know if you'll ever know who made this little surprise for you, and maybe that's okay. Today isn't about revealing an identity—it's simply about wishing someone truly special the happiest birthday.

We've only met a couple of times, but somehow every time you came near me or looked at me, my heartbeat became a little faster. I never had the courage to tell you what I felt, so maybe this is the closest I'll ever get.

There is something about your smile that can brighten anyone's day, and your eyes... they're simply unforgettable.

I genuinely hope life gives you everything you've ever wished for. May you always stay happy, healthy, successful, and surrounded by people who truly value you.

If this little surprise managed to bring even a tiny smile to your face, then I've already received the best gift in return.

Keep smiling, because the world looks a little more beautiful when you do.

Happy Birthday once again. ❤️

— The Unknown Man 🌙`;

/* ── DATE ───────────────────────────────────── */
const dateEl = document.getElementById('letterDate');
const now    = new Date();
dateEl.textContent = now.toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

/* ── ENVELOPE ───────────────────────────────── */
const envelope    = document.getElementById('envelope');
const letterWrap  = document.getElementById('letterWrapper');
let   opened      = false;

function openEnvelope() {
  if (opened) return;
  opened = true;

  envelope.classList.add('open');
  envelope.setAttribute('aria-pressed', 'true');
  envelope.querySelector('.envelope-hint').style.display = 'none';

  // After flap opens, reveal paper
  setTimeout(() => {
    letterWrap.classList.add('unfolded');
    // Start typewriter after paper unfolds
    setTimeout(startTypewriter, 1600);
  }, 900);
}

envelope.addEventListener('click', openEnvelope);
envelope.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
});

/* ── TYPEWRITER ─────────────────────────────── */
const bodyEl   = document.getElementById('letterBody');
const cursor   = document.getElementById('cursor');
const signEl   = document.getElementById('letterSign');
const nextBtn  = document.getElementById('nextBtn');

const CHARS_PER_TICK = 1;
const BASE_DELAY     = 28; // ms per character

let   charIndex = 0;
let   textNode  = null;
let   timer     = null;

function startTypewriter() {
  // Insert text node before cursor
  textNode = document.createTextNode('');
  bodyEl.insertBefore(textNode, cursor);

  typeNextChar();
}

function typeNextChar() {
  if (charIndex >= LETTER_TEXT.length) {
    // Done — show signature & next button
    cursor.classList.add('hidden');
    setTimeout(() => {
      signEl.classList.add('visible');
      nextBtn.classList.add('visible');
    }, 600);
    return;
  }

  const ch = LETTER_TEXT[charIndex++];
  textNode.textContent += ch;

  // Auto-scroll
  bodyEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Variable speed: pause at punctuation
  let delay = BASE_DELAY;
  if ('.!?'.includes(ch)) delay = 420;
  else if (',;:'.includes(ch)) delay = 180;
  else if (ch === '\n') delay = 300;
  else delay = BASE_DELAY + Math.random() * 18;

  timer = setTimeout(typeNextChar, delay);
}

/* ── FLOATING AMBIENT HEARTS ────────────────── */
const heartsLayer = document.getElementById('heartsLayer');
heartsLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0;';

const HEART_EMOJIS = ['❤️','💕','💖','💗','🌸','✨','💌'];

function spawnHeart() {
  const el = document.createElement('div');
  el.className = 'heart-ambient';
  el.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
  const left = Math.random() * 100;
  const dur  = Math.random() * 12 + 12;
  const hx   = (Math.random() - 0.5) * 120;
  el.style.cssText = `
    left:${left}%;
    --hx:${hx}px;
    animation-duration:${dur}s;
    animation-delay:${Math.random() * 8}s;
    font-size:${Math.random() * 14 + 12}px;
  `;
  heartsLayer.appendChild(el);
}

for (let i = 0; i < 22; i++) spawnHeart();

/* ── PAGE FADE IN ───────────────────────────── */
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.8s ease';
requestAnimationFrame(() => {
  requestAnimationFrame(() => { document.body.style.opacity = '1'; });
});
