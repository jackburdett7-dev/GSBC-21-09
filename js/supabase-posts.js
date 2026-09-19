/* ============================================================
   SUPABASE POSTS — fetch new posts from Supabase + merge with
   existing posts.json, render into news-grid containers.
   ============================================================ */
(function () {
  var SUPABASE_URL      = 'https://wajvgngjfwbdnitggakn.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhanZnbmdqZndiZG5pdGdnYWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODM2NzksImV4cCI6MjA5MTY1OTY3OX0.0-wOI9VAy6NFxnrBJEpunqPbmq2mP2D3ZEec_V5m8gk';

  var inNewsDir = window.location.pathname.replace(/\\/g, '/').indexOf('/news') !== -1;
  var postsPath = inNewsDir ? '../data/posts.json' : 'data/posts.json';
  var imgBase   = inNewsDir ? '../' : '';

  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function renderPostCards(posts, containerId, limit) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var items = limit ? posts.slice(0, limit) : posts;
    el.innerHTML = items.map(function (p) {
      // Supabase posts use image_url (full URL) and link to dynamic post.html
      var imgSrc = p.image_url ? p.image_url : (imgBase + p.image);
      var url    = p.image_url
        ? (inNewsDir ? 'post.html?slug=' : 'news/post.html?slug=') + encodeURIComponent(p.slug)
        : (imgBase + p.url);
      return '<a href="' + url + '" class="post-card stagger-child">' +
        '<div class="post-card__img"><img src="' + imgSrc + '" alt="' + p.title + '" loading="lazy"></div>' +
        '<div class="post-card__body">' +
          '<div class="post-card__meta">' + p.category + ' &middot; ' + (p.dateFormatted || formatDate(p.date)) + '</div>' +
          '<h3 class="post-card__title">' + p.title + '</h3>' +
          '<p class="post-card__excerpt">' + p.excerpt + '</p>' +
          '<span class="post-card__link">Read more &rarr;</span>' +
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
    return fetch(SUPABASE_URL + '/rest/v1/posts?select=*&order=date.desc', {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    })
    .then(function (r) {
      if (!r.ok) {
        console.warn('Supabase posts fetch failed — status:', r.status,
          '— Check that RLS on the posts table has a public SELECT policy enabled.');
        return [];
      }
      return r.json();
    })
    .then(function (data) {
      console.log('Supabase posts loaded:', data.length, 'posts');
      return data;
    })
    .catch(function (err) {
      console.warn('Supabase posts fetch error:', err);
      return [];
    });
  }

  function fetchJsonPosts() {
    return fetch(postsPath)
      .then(function (r) { return r.json(); })
      .catch(function () { return []; });
  }

  Promise.all([fetchSupabasePosts(), fetchJsonPosts()])
    .then(function (results) {
      var supabasePosts = results[0] || [];
      var jsonPosts     = results[1] || [];

      // Merge and sort newest first
      var all = supabasePosts.concat(jsonPosts).sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      renderPostCards(all, 'latest-posts', 3);
      renderPostCards(all, 'all-posts', 0);
    });
}());
