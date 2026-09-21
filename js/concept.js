/* Shared runtime for the rebuilt pages: smooth wheel, the scroll engine, the
   same nav behaviour main.js gives every other page, and small helpers the
   page scripts use (window.CX). */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 860px)');
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var CX = window.CX = {
    reduce: reduce, small: small, clamp: clamp,
    lerp: function (a, b, t) { return a + (b - a) * t; },
    ramp: function (p, a, b) { return clamp((p - a) / (b - a)); },
    ease: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    easeOut: function (t) { return 1 - Math.pow(1 - t, 3); },
    sine: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; },
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
    top: function (el) { return el.getBoundingClientRect().top + scrollY; },
    // progress through a pinned act: 0 as its top meets the viewport top, 1 as it un-pins
    pinned: function (el) { var t = CX.top(el); return clamp((scrollY - t) / Math.max(1, el.offsetHeight - innerHeight)); },
    frames: []
  };

  /* smooth wheel (never under reduced motion) */
  // data-live-stack: the page also runs the live site's main.js, which owns the
  // nav, anchors and native scrolling; this runtime then only supplies the engine and helpers.
  var live = document.documentElement.hasAttribute('data-live-stack');
  var lenis = null;
  if (!reduce && !live && window.Lenis) lenis = new Lenis({ wheelMultiplier: 0.85, lerp: 0.09, syncTouch: false });
  CX.lenis = lenis;
  CX.jumpTo = function (y) {
    if (lenis) lenis.scrollTo(y, { duration: 1.5 });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };
  if (window.ScrollCraft) ScrollCraft.mount(document.body);

  /* photo heroes wipe in once their photo is ready (or after a second, whatever happens) */
  CX.$$('.phero').forEach(function (h) {
    var go = function () { h.classList.add('is-in'); }, img = h.querySelector('img');
    if (img && img.decode) img.decode().then(go, go); else go();
    setTimeout(go, 1200);
  });

  /* Content that arrives late (the news cards, fixtures) moves every act below
     it. Re-measure the engine and GSAP's triggers when the page's height changes. */
  if (window.ScrollCraft && window.ResizeObserver) {
    var docH = 0, relayT = 0;
    new ResizeObserver(function () {
      var h = document.documentElement.scrollHeight;
      if (Math.abs(h - docH) < 2) return;
      docH = h; clearTimeout(relayT);
      relayT = setTimeout(function () {
        ScrollCraft.instances.forEach(function (i) { i.layout(); });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        if (CX.invalidate) CX.invalidate();
        dispatchEvent(new Event('cx:relayout'));
      }, 120);
    }).observe(document.body);
  }

  /* nav: the same behaviour as main.js on every other page */
  var nav = CX.$('.nav'), burger = CX.$('.nav__hamburger'), mob = CX.$('.nav__mobile');
  function onScroll() { if (nav && !live) nav.classList.toggle('scrolled', scrollY > 60); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() {
    burger.classList.remove('open'); mob.classList.remove('open'); nav.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; if (lenis) lenis.start();
  }
  if (burger && mob && !live) {
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('open');
      mob.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    mob.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && mob.classList.contains('open')) { closeMenu(); burger.focus(); } });
  }
  /* in-page anchors glide (and clear the fixed bar) */
  if (!live) CX.$$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var el = document.querySelector(id); if (!el) return;
      e.preventDefault(); CX.jumpTo(CX.top(el) + (el.hasAttribute('data-sc-act') ? 2 : -70));
    });
  });

  /* photo cameras: put an image point at a screen point, then keep the
     photograph covering the viewport */
  CX.IMG = { W: 2560, H: 1702 };
  CX.cover = function (fx, fy, zoom) {
    var s = Math.max(innerWidth / CX.IMG.W, innerHeight / CX.IMG.H) * (zoom || 1);
    return { s: s, ox: (innerWidth - CX.IMG.W * s) * fx, oy: (innerHeight - CX.IMG.H * s) * fy };
  };
  CX.camAt = function (pt, sx, sy, zoom) {
    var s = Math.max(innerWidth / CX.IMG.W, innerHeight / CX.IMG.H) * zoom;
    return { s: s, ox: clamp(sx * innerWidth - s * pt[0], innerWidth - CX.IMG.W * s, 0), oy: clamp(sy * innerHeight - s * pt[1], innerHeight - CX.IMG.H * s, 0) };
  };
  CX.place = function (el, cam, pivot, k, tx, ty) {
    var X = cam.ox + cam.s * (pivot[0] * (1 - k) + (tx || 0)), Y = cam.oy + cam.s * (pivot[1] * (1 - k) + (ty || 0));
    el.style.transform = 'translate3d(' + X.toFixed(2) + 'px,' + Y.toFixed(2) + 'px,0) scale(' + (cam.s * k).toFixed(5) + ')';
  };
  // the pitch: linear in x, a gravity curve in y, receding as it goes
  var BALL0 = [1203, 286], MITT = [1498, 1088], PIV = [1500, 1020];
  CX.MITT = MITT; CX.PIV = PIV;
  CX.placeBall = function (el, cam, kb, f) {
    var q = [CX.lerp(BALL0[0], MITT[0], f), CX.lerp(BALL0[1], MITT[1], Math.pow(f, 1.25))];
    var sx = cam.ox + cam.s * (PIV[0] * (1 - kb) + kb * q[0]), sy = cam.oy + cam.s * (PIV[1] * (1 - kb) + kb * q[1]);
    var size = cam.s * kb * 72 * (1 - 0.16 * f);
    el.style.transform = 'translate3d(' + (sx - size / 2).toFixed(2) + 'px,' + (sy - size / 2).toFixed(2) + 'px,0) scale(' + (size / 72).toFixed(4) + ')';
  };
  CX.decoded = function (imgs) {
    return Promise.all(imgs.map(function (im) { return im && im.decode ? im.decode().catch(function () {}) : Promise.resolve(); }));
  };

  /* one frame loop for every page script */
  var lastY = -1, lastW = -1;
  function frame(now) {
    if (lenis) lenis.raf(now);
    if (scrollY !== lastY || innerWidth !== lastW) {
      lastY = scrollY; lastW = innerWidth;
      for (var i = 0; i < CX.frames.length; i++) CX.frames[i](scrollY);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  CX.invalidate = function () { lastY = -1; };
  addEventListener('resize', CX.invalidate);
  addEventListener('load', CX.invalidate);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(CX.invalidate);

  /* season status + noticeboard, shared by any page that asks */
  CX.season = function (el, base) {
    fetch((base || '') + 'data/schedule.json').then(function (r) { return r.json(); }).then(function (d) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var all = [];
      ['mavericks', 'millers'].forEach(function (k) {
        (d[k] && d[k].fixtures || []).forEach(function (f) { all.push({ f: f, team: k.charAt(0).toUpperCase() + k.slice(1), d: new Date(f.date + 'T12:00:00') }); });
      });
      var next = all.filter(function (x) { return x.f.home && x.d >= today; }).sort(function (a, b) { return a.d - b.d; })[0];
      var last = all.map(function (x) { return x.d; }).sort(function (a, b) { return a - b; }).pop();
      el.textContent = next
        ? 'In season. Next home game: ' + next.f.dateFormatted + ', ' + next.team + ' v ' + next.f.opponent + ', at Kings College.'
        : (last && last < today && today.getMonth() >= 7)
          ? 'The ' + d.season + ' season has finished. Training starts again in the new year: register now and the club will send you the dates.'
          : 'Pre-season. Beginners’ sessions run before the season starts in April: register and the club will send you the dates.';
    }).catch(function () {});
  };
  CX.posts = function (list, n) {
    fetch('data/posts.json').then(function (r) { return r.json(); }).then(function (posts) {
      posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      list.innerHTML = posts.slice(0, n || 3).map(function (p) {
        return '<li><time datetime="' + p.date + '">' + p.dateFormatted + '</time><a href="' + p.url + '">' + p.title.replace(/[<>&]/g, '') + ' <span class="arrow" aria-hidden="true">&rarr;</span></a></li>';
      }).join('');
    }).catch(function () {});
  };
})();
