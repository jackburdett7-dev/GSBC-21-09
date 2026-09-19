/* GBSC theme (concept, local only): the diamond in the nav bar.
   It is where you are on the current page, run round the bases: first at a
   quarter, second at halfway, third at three-quarters, home at the bottom.
   Bases stay lit once passed. Pages can hand it their own stations with
   GBSC.setStations([...scrollY for 1st, 2nd, 3rd, home]). */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inner = document.querySelector('.nav__inner');
  if (!inner) return;

  // Mark the current page in the bar.
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });

  var wrap = document.querySelector('.nav__diamond');
  if (!wrap) {
    wrap = document.createElement('span');
    wrap.className = 'nav__diamond';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<svg viewBox="0 0 100 100">' +
      '<path class="d-path" d="M50 86 L86 50 L50 14 L14 50 Z"/>' +
      '<rect class="d-base" data-base="1" x="78" y="42" width="16" height="16" transform="rotate(45 86 50)"/>' +
      '<rect class="d-base" data-base="2" x="42" y="6" width="16" height="16" transform="rotate(45 50 14)"/>' +
      '<rect class="d-base" data-base="3" x="6" y="42" width="16" height="16" transform="rotate(45 14 50)"/>' +
      '<path class="d-plate" d="M43 83 H57 V89 L50 95 L43 89 Z"/>' +
      '<circle class="d-runner" cx="50" cy="86" r="7"/></svg>';
    var logo = inner.querySelector('.nav__logo');
    logo.insertAdjacentElement('afterend', wrap);
  }
  var runner = wrap.querySelector('.d-runner'), bases = wrap.querySelectorAll('.d-base');
  var B = [[50, 86], [86, 50], [50, 14], [14, 50], [50, 86]];
  var stations = null, maxT = 0, scored = false, lastY = -1;

  function keys() {
    var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    var s = stations || [max * 0.25, max * 0.5, max * 0.75, max];
    return [0].concat(s.map(function (v) { return Math.min(v, max); }));
  }
  function tAt(y) {
    var k = keys();
    if (y >= k[4] - 2) return 4;
    for (var i = 0; i < 4; i++) if (y < k[i + 1]) return i + Math.max(0, (y - k[i]) / Math.max(1, k[i + 1] - k[i]));
    return 4;
  }
  function draw() {
    var y = scrollY;
    if (y !== lastY) {
      lastY = y;
      var t = tAt(y), i = Math.min(3, Math.floor(t)), f = t - i;
      runner.setAttribute('cx', (B[i][0] + (B[i + 1][0] - B[i][0]) * f).toFixed(2));
      runner.setAttribute('cy', (B[i][1] + (B[i + 1][1] - B[i][1]) * f).toFixed(2));
      maxT = Math.max(maxT, t);
      bases.forEach(function (b) { b.classList.toggle('is-lit', maxT >= +b.getAttribute('data-base') - 0.001); });
      if (t >= 3.995 && !scored) {
        scored = true; wrap.classList.add('is-scored');
        if (!reduce) { wrap.classList.remove('is-flash'); void wrap.offsetWidth; wrap.classList.add('is-flash'); }
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  window.GBSC = window.GBSC || {};
  window.GBSC.diamond = wrap;
  window.GBSC.setStations = function (s) { stations = s; lastY = -1; };
})();
