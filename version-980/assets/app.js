(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function toNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function setupMenu() {
    var button = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }
    function start() {
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        if (timer) {
          window.clearInterval(timer);
        }
        show(i);
        start();
      });
    });
    start();
  }

  function sortCards(grid, mode) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
    cards.sort(function (a, b) {
      if (mode === 'title') {
        return normalize(a.dataset.title).localeCompare(normalize(b.dataset.title), 'zh-Hans-CN');
      }
      if (mode === 'year') {
        return toNumber(b.dataset.year) - toNumber(a.dataset.year);
      }
      if (mode === 'score') {
        return toNumber(b.dataset.score) - toNumber(a.dataset.score);
      }
      return toNumber(b.dataset.views) - toNumber(a.dataset.views);
    });
    cards.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  function filterCards(grid, query, region) {
    var q = normalize(query);
    var r = normalize(region);
    Array.prototype.forEach.call(grid.querySelectorAll('.movie-card'), function (card) {
      var haystack = normalize([
        card.dataset.title,
        card.dataset.tags,
        card.dataset.region,
        card.dataset.type,
        card.dataset.year
      ].join(' '));
      var regionOk = !r || normalize(card.dataset.region).indexOf(r) !== -1;
      var queryOk = !q || haystack.indexOf(q) !== -1;
      card.classList.toggle('is-hidden', !(regionOk && queryOk));
    });
  }

  function setupSearchPage() {
    var grid = document.getElementById('movieGrid');
    var input = document.getElementById('searchInput');
    var region = document.getElementById('regionFilter');
    var sort = document.getElementById('sortFilter');
    if (!grid || !input || !sort) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    input.value = initial;
    function update() {
      sortCards(grid, sort.value);
      filterCards(grid, input.value, region ? region.value : '');
    }
    input.addEventListener('input', update);
    if (region) {
      region.addEventListener('change', update);
    }
    sort.addEventListener('change', update);
    update();
  }

  function setupCategoryPage() {
    var page = document.querySelector('[data-category-page]');
    if (!page) {
      return;
    }
    var grid = page.querySelector('#movieGrid');
    var input = page.querySelector('.category-search');
    var sort = page.querySelector('.category-sort');
    if (!grid || !input || !sort) {
      return;
    }
    function update() {
      sortCards(grid, sort.value);
      filterCards(grid, input.value, '');
    }
    input.addEventListener('input', update);
    sort.addEventListener('change', update);
    update();
  }

  function setupPlayers() {
    Array.prototype.forEach.call(document.querySelectorAll('.player-card'), function (card) {
      var video = card.querySelector('video');
      var button = card.querySelector('.play-button');
      if (!video || !button) {
        return;
      }
      var sourceTag = video.querySelector('source');
      var source = sourceTag ? sourceTag.getAttribute('src') : video.currentSrc;
      var attached = false;
      function attach() {
        if (attached || !source) {
          return;
        }
        attached = true;
        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          card._hls = hls;
        } else {
          video.src = source;
        }
      }
      function play() {
        attach();
        var result = video.play();
        if (result && typeof result.catch === 'function') {
          result.catch(function () {
            card.classList.remove('is-playing');
          });
        }
        card.classList.add('is-playing');
      }
      button.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        card.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        card.classList.remove('is-playing');
      });
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupSearchPage();
    setupCategoryPage();
    setupPlayers();
  });
}());
