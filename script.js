/* =============================================
   notyet -- script.js
   memorable interactions
   ============================================= */

(() => {
  'use strict';

  /* ---------- Theme toggle ---------- */
  const toggle = document.getElementById('theme-toggle');
  if (localStorage.getItem('theme') === 'day') document.body.classList.add('day-mode');
  if (toggle) {
    toggle.textContent = document.body.classList.contains('day-mode') ? 'lights off' : 'lights on';
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('day-mode');
      const isDay = document.body.classList.contains('day-mode');
      toggle.textContent = isDay ? 'lights off' : 'lights on';
      localStorage.setItem('theme', isDay ? 'day' : 'night');
    });
  }

  /* ---------- Year in footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Hit counter ---------- */
  const counter = document.getElementById('hit-counter');
  if (counter) {
    let c = parseInt(localStorage.getItem('hit-count') || '0', 10) + 1;
    localStorage.setItem('hit-count', c);
    counter.textContent = String(c).padStart(6, '0');
  }

  /* ---------- Fireflies / particles ---------- */
  const starBox = document.getElementById('stars');
  if (starBox) {
    for (let i = 0; i < 25; i++) {
      const d = document.createElement('div');
      d.className = 'firefly';
      const size = Math.random() * 2 + 1;
      d.style.cssText = `
        width:${size}px; height:${size}px;
        top:${Math.random()*100}%; left:${Math.random()*100}%;
        background:rgba(200,200,200,0.6);
        --dur:${(Math.random()*6+4).toFixed(1)}s;
        --delay:${(Math.random()*4).toFixed(1)}s;
        --dx:${(Math.random()*60-30).toFixed(0)}px;
        --dy:${(Math.random()*60-30).toFixed(0)}px;
        --peak:${(Math.random()*0.3+0.2).toFixed(2)};
      `;
      starBox.appendChild(d);
    }
  }

  /* ---------- Ink cursor trail ---------- */
  let lastInk = 0;
  const inkInterval = 60; // ms between drops

  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastInk < inkInterval) return;
    lastInk = now;

    const drop = document.createElement('div');
    drop.className = 'ink-drop';
    const size = Math.random() * 4 + 2;
    drop.style.width = size + 'px';
    drop.style.height = size + 'px';
    drop.style.left = (e.clientX - size / 2) + 'px';
    drop.style.top = (e.clientY - size / 2) + 'px';
    document.body.appendChild(drop);
    drop.addEventListener('animationend', () => drop.remove());
  });

  /* ---------- 3D card tilt ---------- */
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (y - 0.5) * -6;
      const rotateY = (x - 0.5) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ---------- Magnetic nav links ---------- */
  document.querySelectorAll('.site-nav a').forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.15;
      const dy = (e.clientY - cy) * 0.25;
      link.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    link.addEventListener('mouseleave', () => {
      link.style.transform = '';
      link.style.transition = 'transform 0.4s ease';
      setTimeout(() => { link.style.transition = ''; }, 400);
    });
  });

  /* ---------- Text scramble effect ---------- */
  const scrambleChars = '!<>-_\\/[]{}=+*^?#_~|';

  function scrambleText(el) {
    const original = el.dataset.scramble || el.textContent;
    el.dataset.scramble = original;
    const len = original.length;
    let iteration = 0;
    const maxIterations = len * 3;

    const timer = setInterval(() => {
      el.textContent = original
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (i < iteration / 3) return original[i];
          return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        })
        .join('');
      iteration++;
      if (iteration > maxIterations) {
        el.textContent = original;
        clearInterval(timer);
      }
    }, 30);
  }

  // Run scramble on headings when they enter viewport
  const scrambleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        scrambleText(entry.target);
        scrambleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-scramble]').forEach(el => {
    scrambleObserver.observe(el);
  });

  /* ---------- Redacted text --------- */
  document.querySelectorAll('.redacted').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('revealed');
    });
  });

  /* ---------- Parallax on hero ASCII ---------- */
  const heroAscii = document.querySelector('.hero-ascii');
  if (heroAscii) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      heroAscii.style.transform = `translateY(${scrolled * 0.3}px)`;
    }, { passive: true });
  }

  /* ---------- Fade-in observer ---------- */
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

  /* ---------- Homepage mini-guestbook ---------- */
  const API = 'https://notyet-guestbook.notyet.workers.dev';

  const homeGB = document.getElementById('home-guestbook');
  if (homeGB) {
    fetch(`${API}/messages?limit=3`)
      .then(r => r.json())
      .then(data => {
        const msgs = data.messages || [];
        homeGB.innerHTML = msgs.length === 0
          ? '<p class="gb-empty">no entries yet -- be the first</p>'
          : msgs.map(m => `
            <div class="gb-entry">
              <div class="gb-entry-header">
                <span class="gb-entry-name">${esc(m.name)}</span>
                <span class="gb-entry-date">${fmtDate(m.created_at)}</span>
              </div>
              <p class="gb-entry-body">${esc(m.message)}</p>
            </div>`).join('');
      })
      .catch(() => {
        homeGB.innerHTML = '<p class="gb-error">could not load entries</p>';
      });
  }

  /* Homepage GB form */
  const gbForm = document.getElementById('guestbook-form');
  const gbStatus = document.getElementById('gb-status');
  if (gbForm && document.querySelector('.gb-form')) {
    gbForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('gb-name')?.value.trim();
      const message = document.getElementById('gb-message')?.value.trim();
      if (!name || !message) return;

      if (gbStatus) gbStatus.textContent = 'sending...';
      fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message })
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            gbForm.reset();
            if (gbStatus) gbStatus.textContent = 'message sent';
            if (homeGB) {
              const entry = document.createElement('div');
              entry.className = 'gb-entry';
              entry.innerHTML = `
                <div class="gb-entry-header">
                  <span class="gb-entry-name">${esc(name)}</span>
                  <span class="gb-entry-date">just now</span>
                </div>
                <p class="gb-entry-body">${esc(message)}</p>`;
              homeGB.prepend(entry);
            }
          } else {
            if (gbStatus) gbStatus.textContent = data.error || 'something went wrong';
          }
        })
        .catch(() => {
          if (gbStatus) gbStatus.textContent = 'could not send -- try again later';
        });
    });
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

})();
