/* ============================================================
   SUPABASE POSTS: every post lives in Supabase (the older ones
   were imported and keep their own static page in `url`), render
   into news-grid containers. Archived posts still show here; they
   only drop off the home page. data/posts.json is a fallback for
   when Supabase can't be reached.
   ============================================================ */
(function () {
  var SUPABASE_URL      = 'https://wajvgngjfwbdnitggakn.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhanZnbmdqZndiZG5pdGdnYWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODM2NzksImV4cCI6MjA5MTY1OTY3OX0.0-wOI9VAy6NFxnrBJEpunqPbmq2mP2D3ZEec_V5m8gk';

  var inNewsDir = window.location.pathname.replace(/\\/g, '/').indexOf('/news') !== -1;
  var postsPath = inNewsDir ? '../data/posts.json' : 'data/posts.json';
  var base      = inNewsDir ? '../' : '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c];
    });
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function imgSrc(p) {
    var s = p.image_url || p.image || '';
    return /^https?:/.test(s) ? s : base + s.replace(/^\//, '');
  }
  function href(p) {
    return p.url ? base + p.url : base + 'news/post.html?slug=' + encodeURIComponent(p.slug);
  }
  // A set focus crops to it; without one, a portrait image (a poster) is shown whole.
  function focus(p) {
    var f = p.image_focus || p.imageFocus;
    return f ? ' style="object-position:' + esc(f) + '"'
             : ' onload="if(this.naturalHeight>this.naturalWidth)this.classList.add(\'whole\')"';
  }

  function renderPostCards(posts, containerId, limit) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var items = limit ? posts.slice(0, limit) : posts;
    el.innerHTML = items.map(function (p) {
      return '<a href="' + href(p) + '" class="post-card stagger-child">' +
        '<div class="post-card__img"><img src="' + esc(imgSrc(p)) + '" alt="' + esc(p.title) + '" loading="lazy"' + focus(p) + '>' +
          (p.signup_enabled ? '<span class="post-card__flag">Sign-ups open</span>' : '') + '</div>' +
        '<div class="post-card__body">' +
          '<div class="post-card__meta">' + esc(p.category) + ' &middot; ' + (p.dateFormatted || formatDate(p.date)) + '</div>' +
          '<h3 class="post-card__title">' + esc(p.title) + '</h3>' +
          '<p class="post-card__excerpt">' + esc(p.excerpt) + '</p>' +
          (p.signup_enabled
            ? '<span class="post-card__link post-card__link--signup">Details &amp; sign up &rarr;</span>'
            : '<span class="post-card__link">Read more &rarr;</span>') +
        '</div>' +
      '</a>';
    }).join('');

    // GSAP runs before posts load, so cards are stuck at opacity:0.
    // Make them visible immediately, then let ScrollTrigger re-scan.
    el.querySelectorAll('.stagger-child').forEach(function (child) {
      child.style.opacity  = '1';
      child.style.transform = 'none';
    });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  function fetchSupabasePosts() {
    return fetch(SUPABASE_URL + '/rest/v1/posts?select=*&hidden=eq.false&order=date.desc,created_at.desc', {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    })
    .then(function (r) {
      if (!r.ok) { console.warn('Supabase posts fetch failed, status:', r.status); return null; }
      return r.json();
    })
    .catch(function (err) {
      console.warn('Supabase posts fetch error:', err);
      return null;
    });
  }

  function fetchJsonPosts() {
    return fetch(postsPath)
      .then(function (r) { return r.json(); })
      .catch(function () { return []; });
  }

  fetchSupabasePosts()
    .then(function (rows) { return rows && rows.length ? rows : fetchJsonPosts(); })
    .then(function (all) {
      all = (all || []).slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
      renderPostCards(all, 'latest-posts', 3);
      renderPostCards(all, 'all-posts', 0);
    });
}());
