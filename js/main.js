/* ============================================================
   GUILDFORD MAVERICKS — main.js
   GSAP + ScrollTrigger, mobile nav, stat counters, chat opener
   ============================================================ */

/* --- GSAP via CDN — loaded in HTML before this file --- */

document.addEventListener('DOMContentLoaded', () => {

  /* ──────────────────────────────────────────────
     1. NAVIGATION
  ────────────────────────────────────────────── */
  const nav        = document.querySelector('.nav');
  const hamburger  = document.querySelector('.nav__hamburger');
  const mobileNav  = document.querySelector('.nav__mobile');

  // Scroll → add .scrolled class
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      nav.classList.toggle('menu-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        nav.classList.remove('menu-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ──────────────────────────────────────────────
     2. GSAP SCROLL ANIMATIONS
  ────────────────────────────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Fade-up elements
    gsap.utils.toArray('.fade-up').forEach(el => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        }
      });
    });

    // Fade-in elements
    gsap.utils.toArray('.fade-in').forEach(el => {
      gsap.to(el, {
        opacity: 1,
        duration: 0.6,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        }
      });
    });

    // Staggered children inside .stagger-parent
    gsap.utils.toArray('.stagger-parent').forEach(parent => {
      const children = parent.querySelectorAll('.stagger-child');
      gsap.to(children, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: parent,
          start: 'top 82%',
          once: true,
        }
      });
    });
  } else {
    // Fallback: make everything visible if GSAP not loaded
    document.querySelectorAll('.fade-up, .fade-in, .stagger-child').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /* ──────────────────────────────────────────────
     2b. HERO — intro reveal + scroll parallax (homepage)
     Uses gsap.from() so the resting state is the visible one:
     if JS/GSAP fails or reduced-motion is on, the hero just shows static.
  ────────────────────────────────────────────── */
  const heroEl = document.querySelector('.hero');
  const heroReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroEl && !heroReduceMotion && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {

    // Load-in: photo settles, headline lines rise from their masks, "92" lifts in.
    // Built paused so GSAP applies the hidden start state immediately (no flash of
    // content), then played only once web fonts are ready — otherwise Barlow Condensed
    // swaps in mid-animation and the headline reflows, which reads as jutter on first load.
    const heroIntro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    heroIntro
      .from('.hero__right img',   { scale: 1.08, duration: 1.3, ease: 'power2.out' }, 0)
      .from('.hero__eyebrow',     { y: 18, opacity: 0, duration: 0.6 }, 0.1)
      .from('.hero-line__inner',  { yPercent: 110, duration: 0.85, stagger: 0.1 }, 0.2)
      .from('.hero__sub',         { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
      .from('.hero .btn-group',   { y: 18, opacity: 0, duration: 0.6 }, '-=0.5')
      .from('.hero__bottom-label',{ opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.hero__number',      { opacity: 0, yPercent: 14, duration: 1.2, ease: 'power2.out' }, '-=1.0')
      // Drop the layer-promotion hints once the intro is done (frees GPU memory)
      .set('.hero-line__inner', { clearProps: 'willChange' });

    let heroIntroPlayed = false;
    const playHeroIntro = () => { if (!heroIntroPlayed) { heroIntroPlayed = true; heroIntro.play(); } };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(playHeroIntro);
    }
    setTimeout(playHeroIntro, 700); // safety net if fonts are slow or blocked

    // Scroll parallax: layers drift at different speeds as the hero scrolls away.
    // Transform-only (no opacity) so each frame composites on the GPU without repainting.
    const heroImg = document.querySelector('.hero__right img');
    const heroScroll = gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
    heroScroll
      .to('.hero__number', { yPercent: -28, xPercent: 6, ease: 'none' }, 0)
      .to('.hero__left',   { yPercent: 12, ease: 'none' }, 0);
    if (heroImg) heroScroll.to(heroImg, { yPercent: 14, ease: 'none' }, 0);
  }

  /* ──────────────────────────────────────────────
     3. STAT COUNTERS
  ────────────────────────────────────────────── */
  const statEls = document.querySelectorAll('[data-count]');
  if (statEls.length) {
    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animateCount = (el, target, suffix, duration = 1800) => {
      const start = performance.now();
      const update = now => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(easeOutExpo(progress) * target);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          setTimeout(() => animateCount(el, target, suffix), i * 180);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.4 });

    statEls.forEach(el => observer.observe(el));
  }

  /* ──────────────────────────────────────────────
     4. FAQ ACCORDION
  ────────────────────────────────────────────── */
  document.querySelectorAll('.accordion__trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion__item');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.accordion__item.open').forEach(openItem => {
        openItem.classList.remove('open');
      });

      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  /* ──────────────────────────────────────────────
     5. (Chat widget removed — all chat CTAs link to join.html)
  ────────────────────────────────────────────── */

  /* ──────────────────────────────────────────────
     6. HEADING UNDERLINE ANIMATION
  ────────────────────────────────────────────── */
  const underlineEls = document.querySelectorAll('.heading-underline');
  if (underlineEls.length) {
    const underlineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          underlineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    underlineEls.forEach(el => underlineObserver.observe(el));
  }

  /* ──────────────────────────────────────────────
     7. SMOOTH SCROLL for anchor links
  ────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return; // bare # — let other handlers deal with it
      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = nav ? nav.offsetHeight + 16 : 80;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      } catch (_) { /* invalid selector — ignore */ }
    });
  });

  /* ──────────────────────────────────────────────
     8. ACTIVE NAV LINK highlight
  ────────────────────────────────────────────── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.style.color = '#ffffff';
      link.style.fontWeight = '700';
    }
  });

  /* ──────────────────────────────────────────────
     9. CARD TILT EFFECT
     Applies to .path-card and .pricing-card
  ────────────────────────────────────────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.path-card, .pricing-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
        card.style.boxShadow = `${x * -12}px ${y * -12}px 40px rgba(200,0,37,0.12), 0 16px 40px rgba(15,28,46,0.15)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  }

  /* ──────────────────────────────────────────────
     10. ANIMATED PROGRESS BARS
  ────────────────────────────────────────────── */
  const progressFills = document.querySelectorAll('.progress-fill[data-width]');
  if (progressFills.length) {
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target;
          setTimeout(() => { fill.style.width = fill.dataset.width + '%'; }, 300);
          barObserver.unobserve(fill);
        }
      });
    }, { threshold: 0.4 });
    progressFills.forEach(el => barObserver.observe(el));
  }

  /* ──────────────────────────────────────────────
     11. COUNTDOWN TIMER
     Target derived from next upcoming home fixture in the fixture table;
     falls back to hardcoded date if no future fixtures are listed.
  ────────────────────────────────────────────── */
  const cdTarget = window.nextHomeGameDate || new Date('2026-04-19T12:00:00');
  const cdDays  = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMins  = document.getElementById('cd-mins');

  if (cdDays && cdHours && cdMins) {
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const diff = cdTarget - Date.now();
      if (diff <= 0) {
        cdDays.textContent = '00'; cdHours.textContent = '00'; cdMins.textContent = '00';
        return;
      }
      cdDays.textContent  = pad(Math.floor(diff / 86400000));
      cdHours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
      cdMins.textContent  = pad(Math.floor((diff % 3600000) / 60000));
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ──────────────────────────────────────────────
     12. STICKY JOIN BAR
  ────────────────────────────────────────────── */
  const stickyBar   = document.getElementById('sticky-join-bar');
  const stickyClose = document.getElementById('sticky-bar-close');

  if (stickyBar) {
    const dismissed = sessionStorage.getItem('stickyBarDismissed');
    if (!dismissed) {
      const heroEl = document.querySelector('.hero, .page-hero, .join-hero');
      const showThreshold = heroEl ? heroEl.offsetHeight * 0.8 : 400;

      const onBarScroll = () => {
        stickyBar.classList.toggle('visible', window.scrollY > showThreshold);
      };
      window.addEventListener('scroll', onBarScroll, { passive: true });
      onBarScroll();
    }

    if (stickyClose) {
      stickyClose.addEventListener('click', () => {
        stickyBar.classList.remove('visible');
        sessionStorage.setItem('stickyBarDismissed', '1');
      });
    }
  }

});

/* NEWS / POSTS — handled by supabase-posts.js */

/* ──────────────────────────────────────────────
   PREFERS REDUCED MOTION
────────────────────────────────────────────── */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  if (typeof gsap !== 'undefined') {
    gsap.globalTimeline.timeScale(10);
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(st => st.kill());
    }
  }
  document.querySelectorAll('.fade-up, .fade-in, .stagger-child').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}
