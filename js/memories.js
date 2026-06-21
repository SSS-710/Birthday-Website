/* ============================================
   MEMORIES.JS — Polaroid Gallery + Lightbox
   ============================================ */

'use strict';

/* ── PHOTO DATA ─────────────────────────────── */
const PHOTOS = [
  {
    src:     'assets/images/WhatsApp Image 2026-06-21 at 4.57.58 PM.jpeg',
    caption: 'A beautiful memory ✨',
    date:    'June 2026',
  },
  {
    src:     'assets/images/WhatsApp Image 2026-06-21 at 4.57.58 PM (1).jpeg',
    caption: 'Unforgettable moments 🌸',
    date:    'June 2026',
  },
  {
    src:     'assets/images/WhatsApp Image 2026-06-21 at 4.57.58 PM (2).jpeg',
    caption: 'Always smiling 💕',
    date:    'June 2026',
  },
  {
    src:     'assets/images/WhatsApp Image 2026-06-21 at 4.57.59 PM.jpeg',
    caption: 'The brightest soul 🌙',
    date:    'June 2026',
  },
  {
    src:     'assets/images/WhatsApp Image 2026-06-21 at 4.57.59 PM (1).jpeg',
    caption: 'Simply radiant 🌹',
    date:    'June 2026',
  },
  {
    src:     'assets/images/WhatsApp Image 2026-06-21 at 4.59.38 PM.jpeg',
    caption: 'A smile that stops time 💖',
    date:    'June 2026',
  },
];

/* ── ROTATION ARRAY ─────────────────────────── */
const ROTS = [-3, 1.5, -2, 2.5, -1.5, 3];

/* ── BUILD GALLERY ──────────────────────────── */
const grid = document.getElementById('galleryGrid');

PHOTOS.forEach((photo, i) => {
  const rot = ROTS[i % ROTS.length];

  const card = document.createElement('article');
  card.className = 'polaroid';
  card.style.setProperty('--rot', `${rot}deg`);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Photo ${i + 1}: ${photo.caption}`);

  card.innerHTML = `
    <div class="polaroid-img-placeholder" style="padding:0;overflow:hidden;">
      <img
        src="${photo.src}"
        alt="${photo.caption}"
        style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;"
        loading="lazy"
      />
    </div>
    <div class="polaroid-caption">${photo.caption}</div>
    <div class="polaroid-date">${photo.date}</div>
  `;

  card.addEventListener('click', () => openModal(i));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(i); }
  });

  grid.appendChild(card);
});

/* ── INTERSECTION OBSERVER ──────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.polaroid').forEach((el, i) => {
  el.style.animationDelay = `${i * 0.08}s`;
  observer.observe(el);
});

/* ── LIGHTBOX MODAL ─────────────────────────── */
const overlay   = document.getElementById('modalOverlay');
const modalImg  = document.getElementById('modalImg');
const modalCap  = document.getElementById('modalCaption');
const modalCtr  = document.getElementById('modalCounter');
const closeBtn  = document.getElementById('modalClose');
const prevBtn   = document.getElementById('modalPrev');
const nextBtn   = document.getElementById('modalNext');

let currentIdx = 0;

function openModal(idx) {
  currentIdx = idx;
  renderModal();
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderModal() {
  const photo = PHOTOS[currentIdx];
  modalImg.style.background = 'none';
  modalImg.innerHTML = `
    <img
      src="${photo.src}"
      alt="${photo.caption}"
      style="width:100%;height:100%;object-fit:contain;display:block;border-radius:8px;"
    />
  `;
  modalCap.textContent = photo.caption;
  modalCtr.textContent = `${currentIdx + 1} / ${PHOTOS.length}`;
}

function navigate(dir) {
  currentIdx = (currentIdx + dir + PHOTOS.length) % PHOTOS.length;

  // Animate out/in
  modalImg.style.transition = 'opacity 0.2s, transform 0.2s';
  modalImg.style.opacity    = '0';
  modalImg.style.transform  = `translateX(${dir * 30}px)`;

  setTimeout(() => {
    renderModal();
    modalImg.style.transform = `translateX(${-dir * 30}px)`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modalImg.style.opacity   = '1';
        modalImg.style.transform = 'translateX(0)';
      });
    });
  }, 200);
}

closeBtn.addEventListener('click', closeModal);
prevBtn.addEventListener('click',  () => navigate(-1));
nextBtn.addEventListener('click',  () => navigate(1));

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (!overlay.classList.contains('open')) return;
  if (e.key === 'Escape')       closeModal();
  if (e.key === 'ArrowLeft')    navigate(-1);
  if (e.key === 'ArrowRight')   navigate(1);
});

/* ── SPARKLES IN BACKGROUND ─────────────────── */
const bgLayer = document.getElementById('bgLayer');

function createSparkle() {
  const el    = document.createElement('div');
  el.className = 'sparkle';
  const size  = Math.random() * 5 + 3;
  const dur   = Math.random() * 3 + 1.5;
  const delay = Math.random() * 6;

  el.style.cssText = `
    left:${Math.random()*100}%;
    top:${Math.random()*100}%;
    width:${size}px;height:${size}px;
    animation-duration:${dur}s;
    animation-delay:${delay}s;
  `;
  bgLayer.appendChild(el);
}

for (let i = 0; i < 50; i++) createSparkle();

/* ── PAGE FADE IN ───────────────────────────── */
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.8s ease';
requestAnimationFrame(() => {
  requestAnimationFrame(() => { document.body.style.opacity = '1'; });
});
