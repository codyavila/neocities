/* ===== notyet site scripts ===== */

// ---- Year ----
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Theme Toggle (Day / Night) ----
const toggle = document.getElementById('theme-toggle');
if (toggle) {
  if (localStorage.getItem('notyet-theme') === 'day') {
    document.body.classList.add('day-mode');
    toggle.innerHTML = '\u263E stop the sun';
  }
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('day-mode');
    const isDay = document.body.classList.contains('day-mode');
    toggle.innerHTML = isDay ? '\u263E stop the sun' : '\u2606 let the sun in';
    localStorage.setItem('notyet-theme', isDay ? 'day' : 'night');
  });
}

// ---- Hit Counter (localStorage, increments once per session) ----
const counterEl = document.getElementById('hit-counter');
if (counterEl) {
  let count = parseInt(localStorage.getItem('notyet-hits') || '0', 10);
  if (!sessionStorage.getItem('notyet-counted')) {
    count++;
    localStorage.setItem('notyet-hits', count.toString());
    sessionStorage.setItem('notyet-counted', '1');
  }
  counterEl.textContent = count.toString().padStart(6, '0');
}

// ---- Starfield ----
const starsContainer = document.getElementById('stars');
if (starsContainer) {
  const NUM_STARS = 80;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < NUM_STARS; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top  = Math.random() * 100 + '%';
    s.style.setProperty('--dur',   (2 + Math.random() * 4).toFixed(1) + 's');
    s.style.setProperty('--delay', (Math.random() * 5).toFixed(1) + 's');
    s.style.setProperty('--max-opacity', (0.4 + Math.random() * 0.6).toFixed(2));
    const size = Math.random() > 0.85 ? 3 : Math.random() > 0.5 ? 2 : 1;
    s.style.width  = size + 'px';
    s.style.height = size + 'px';
    frag.appendChild(s);
  }
  starsContainer.appendChild(frag);
}

// ---- Cursor Sparkles ----
const sparkleColors = ['#d4943a', '#e07828', '#b84a3a', '#c46848', '#7a9a50'];
let lastSparkle = 0;

document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastSparkle < 80) return;
  lastSparkle = now;

  const dot = document.createElement('div');
  dot.className = 'sparkle';
  dot.style.left = e.clientX + 'px';
  dot.style.top  = e.clientY + 'px';
  dot.style.background = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
  document.body.appendChild(dot);

  setTimeout(() => dot.remove(), 500);
});

// ---- Homepage Guestbook Preview ----
const homeGb = document.getElementById('home-guestbook');
if (homeGb) {
  fetch('https://notyet-guestbook.notyet.workers.dev/messages?page=1&limit=3')
    .then(r => r.json())
    .then(data => {
      if (!data.messages || data.messages.length === 0) {
        homeGb.innerHTML = '<p class="gb-empty">No messages yet. Be the first!</p>';
        return;
      }
      homeGb.innerHTML = data.messages.map(m => {
        const d = new Date(m.created_at + 'Z').toLocaleDateString('en-US', {
          month: '2-digit', day: '2-digit', year: 'numeric'
        });
        const esc = s => { const el = document.createElement('div'); el.textContent = s; return el.innerHTML; };
        return `<div class="gb-entry"><div class="gb-entry-header"><span class="gb-entry-name">${esc(m.name)}</span><span class="gb-entry-date">${d}</span></div><p class="gb-entry-body">${esc(m.message)}</p></div>`;
      }).join('');
    })
    .catch(() => {
      homeGb.innerHTML = '';
    });
}
