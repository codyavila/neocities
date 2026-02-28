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
    fetch('https://notyet-guestbook.notyet.workers.dev/counter')
      .then(r => r.json())
      .then(data => {
        counter.textContent = String(data.count || 0).padStart(6, '0');
      })
      .catch(() => {
        counter.textContent = '------';
      });
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

  /* ---------- Ghost cursor trail ---------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (!prefersReduced && !isTouch) {
    const TRAIL_COUNT = 5;
    const FRICTION = 0.75;
    const SPRING = 0.1;
    const dots = [];
    let mouseX = -100, mouseY = -100;

    const LIGHT_CUR = "assets/guy-cusor-final/Guy-Normal%20select.cur";
    const DARK_CUR  = "assets/guy-cusor-final-dark/Guy-Normal%20select.cur";

    function trailSrc() {
      // Opposite of the active cursor
      return document.body.classList.contains('day-mode') ? LIGHT_CUR : DARK_CUR;
    }

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const el = document.createElement('div');
      el.className = 'trail-dot';
      const size = 28 - i * 3;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.backgroundImage = "url('" + trailSrc() + "')";
      document.body.appendChild(el);
      dots.push({ el, x: -100, y: -100, vx: 0, vy: 0 });
    }

    // Swap trail image when theme toggles
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) toggle.addEventListener('click', () => {
      setTimeout(() => {
        const src = trailSrc();
        dots.forEach(d => d.el.style.backgroundImage = "url('" + src + "')");
      }, 50);
    });

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateTrail() {
      let prevX = mouseX;
      let prevY = mouseY;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        dot.vx = (dot.vx + (prevX - dot.x) * SPRING) * FRICTION;
        dot.vy = (dot.vy + (prevY - dot.y) * SPRING) * FRICTION;
        dot.x += dot.vx;
        dot.y += dot.vy;

        dot.el.style.transform = 'translate(' + dot.x + 'px,' + dot.y + 'px)';
        dot.el.style.opacity = ((1 - i / dots.length) * 0.2).toFixed(3);

        prevX = dot.x;
        prevY = dot.y;
      }
      requestAnimationFrame(animateTrail);
    }

    animateTrail();
  }



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
    if (prefersReduced) { el.textContent = original; return; }
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

  /* ---------- Custom context menu ---------- */
  const ctxMenu = document.createElement('div');
  ctxMenu.className = 'ctx-menu';
  ctxMenu.innerHTML = `
    <div class="ctx-menu-header">notyet</div>
    <a class="ctx-menu-item" href="home.html">/ home</a>
    <a class="ctx-menu-item" href="about.html">/ about</a>
    <a class="ctx-menu-item" href="blog.html">/ blog</a>
    <a class="ctx-menu-item" href="game.html">/ game</a>
    <a class="ctx-menu-item" href="links.html">/ links</a>
    <a class="ctx-menu-item" href="guestbook.html">/ guestbook</a>
    <div class="ctx-divider"></div>
    <div class="ctx-menu-item" data-action="toggle-lights">toggle lights<span class="ctx-key">T</span></div>
    <div class="ctx-divider"></div>
    <div class="ctx-menu-hint">shift + right-click for browser menu</div>
  `;
  document.body.appendChild(ctxMenu);

  document.addEventListener('contextmenu', (e) => {
    /* shift+right-click passes through to the browser's native menu */
    if (e.shiftKey) return;
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    const menuW = 200;
    const menuH = ctxMenu.offsetHeight || 300;
    const posX = x + menuW > window.innerWidth ? x - menuW : x;
    const posY = y + menuH > window.innerHeight ? y - menuH : y;
    ctxMenu.style.left = Math.max(0, posX) + 'px';
    ctxMenu.style.top = Math.max(0, posY) + 'px';
    ctxMenu.classList.add('visible');
  });

  document.addEventListener('click', () => {
    ctxMenu.classList.remove('visible');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') ctxMenu.classList.remove('visible');
  });

  ctxMenu.querySelectorAll('[data-action]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      ctxMenu.classList.remove('visible');

      if (action === 'toggle-lights' && toggle) {
        toggle.click();
      }
    });
  });

})();
