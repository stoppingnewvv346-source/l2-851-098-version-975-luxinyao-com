(function () {
  'use strict';

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initMobileMenu() {
    var toggle = qs('[data-menu-toggle]');
    var panel = qs('[data-mobile-panel]');

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function initHero() {
    var hero = qs('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });

      dots.forEach(function (dot) {
        dot.classList.toggle('active', Number(dot.getAttribute('data-hero-dot')) === index);
      });
    }

    function autoplay() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        autoplay();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        autoplay();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        autoplay();
      });
    }

    show(0);
    autoplay();
  }

  function initFilters() {
    var scope = qs('[data-filter-scope]');

    if (!scope) {
      return;
    }

    var keyword = qs('[data-filter-keyword]', scope);
    var year = qs('[data-filter-year]', scope);
    var region = qs('[data-filter-region]', scope);
    var reset = qs('[data-filter-reset]', scope);
    var cards = qsa('.filter-results article');

    function applyFilters() {
      var key = normalize(keyword && keyword.value);
      var yearValue = normalize(year && year.value);
      var regionValue = normalize(region && region.value);

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-region'),
          card.getAttribute('data-genre'),
          card.textContent
        ].join(' '));
        var matchKeyword = !key || haystack.indexOf(key) !== -1;
        var matchYear = !yearValue || normalize(card.getAttribute('data-year')) === yearValue;
        var matchRegion = !regionValue || normalize(card.getAttribute('data-region')).indexOf(regionValue) !== -1;

        card.classList.toggle('hidden-by-filter', !(matchKeyword && matchYear && matchRegion));
      });
    }

    [keyword, year, region].forEach(function (input) {
      if (input) {
        input.addEventListener('input', applyFilters);
        input.addEventListener('change', applyFilters);
      }
    });

    if (reset) {
      reset.addEventListener('click', function () {
        if (keyword) {
          keyword.value = '';
        }
        if (year) {
          year.value = '';
        }
        if (region) {
          region.value = '';
        }
        applyFilters();
      });
    }
  }

  function initPlayer() {
    qsa('[data-player-start]').forEach(function (button) {
      button.addEventListener('click', function () {
        var player = button.closest('.video-player');
        var video = qs('video', player);
        var source = player && player.getAttribute('data-video');

        if (!player || !video || !source) {
          return;
        }

        player.classList.add('is-loading');
        video.setAttribute('controls', 'controls');

        function playNow() {
          player.classList.remove('is-loading');
          player.classList.add('is-ready');
          button.remove();
          var promise = video.play();

          if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
              video.controls = true;
            });
          }
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', playNow, { once: true });
          video.load();
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, playNow);
          hls.on(window.Hls.Events.ERROR, function (_, data) {
            if (data && data.fatal) {
              video.src = source;
              video.load();
              playNow();
            }
          });
          return;
        }

        video.src = source;
        video.load();
        playNow();
      });
    });
  }

  function movieCardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card">',
      '  <a class="poster-wrap" href="' + movie.file + '" aria-label="观看 ' + escapeHtml(movie.title) + '">',
      '    <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="poster-badge">' + escapeHtml(movie.duration) + '</span>',
      '    <span class="poster-play">▶</span>',
      '  </a>',
      '  <div class="card-body">',
      '    <div class="card-meta-row">',
      '      <span>' + escapeHtml(movie.score) + '分 · ' + escapeHtml(movie.year) + '</span>',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '    </div>',
      '    <h3><a href="' + movie.file + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var results = qs('[data-search-results]');
    var input = qs('[data-search-input]');
    var status = qs('[data-search-status]');

    if (!results || !input || !status) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;

    function render() {
      var q = normalize(input.value);
      var movies = window.SITE_MOVIES || [];

      if (!q) {
        var featured = movies.slice(0, 24);
        results.innerHTML = featured.map(movieCardTemplate).join('');
        status.textContent = '请输入关键词搜索，当前展示片库前 24 部内容。';
        return;
      }

      var matches = movies.filter(function (movie) {
        return normalize(movie.search).indexOf(q) !== -1;
      }).slice(0, 120);

      results.innerHTML = matches.map(movieCardTemplate).join('');
      status.textContent = '关键词“' + q + '”共匹配到 ' + matches.length + ' 条结果。';
    }

    input.addEventListener('input', render);
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initFilters();
    initPlayer();
    initSearchPage();
  });
})();
