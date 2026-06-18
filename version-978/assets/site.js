(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    initYear();
    initMobileMenu();
    initHeroSlider();
    initFilters();
    initPosterFallbacks();
    initPlayer();
  });

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function initMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHeroSlider() {
    var root = document.querySelector('[data-hero]');

    if (!root) {
      return;
    }

    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));

    if (slides.length <= 1) {
      return;
    }

    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    start();
  }

  function initFilters() {
    var grid = document.querySelector('[data-filter-grid]');

    if (!grid) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.filter-card'));
    var search = document.querySelector('[data-filter-search]');
    var region = document.querySelector('[data-filter-region]');
    var type = document.querySelector('[data-filter-type]');
    var year = document.querySelector('[data-filter-year]');
    var empty = document.querySelector('[data-filter-empty]');

    function includesText(value, query) {
      return String(value || '').toLowerCase().indexOf(query) !== -1;
    }

    function apply() {
      var query = search ? search.value.trim().toLowerCase() : '';
      var regionValue = region ? region.value : '';
      var typeValue = type ? type.value : '';
      var yearValue = year ? year.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = [
          card.dataset.title,
          card.dataset.region,
          card.dataset.type,
          card.dataset.year,
          card.dataset.tags
        ].join(' ').toLowerCase();
        var matchQuery = !query || includesText(text, query);
        var matchRegion = !regionValue || card.dataset.region === regionValue;
        var matchType = !typeValue || card.dataset.type === typeValue;
        var matchYear = !yearValue || card.dataset.year === yearValue;
        var isVisible = matchQuery && matchRegion && matchType && matchYear;

        card.classList.toggle('is-hidden-card', !isVisible);
        if (isVisible) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [search, region, type, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
  }

  function initPosterFallbacks() {
    document.querySelectorAll('.poster-img, .hero-card img, .rank-feature img, .rank-row img, .category-covers img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('is-missing');
        img.removeAttribute('src');
      });
    });
  }

  function initPlayer() {
    var video = document.querySelector('#movie-player');

    if (!video) {
      return;
    }

    var source = video.getAttribute('data-src');
    var overlay = document.querySelector('[data-player-overlay]');
    var startButton = document.querySelector('[data-player-start]');
    var hlsInstance = null;
    var isLoaded = false;

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    }

    function loadPlayer(shouldPlay) {
      if (!source) {
        return;
      }

      if (isLoaded) {
        if (shouldPlay) {
          video.play().catch(function () {});
        }
        return;
      }

      isLoaded = true;

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          if (shouldPlay) {
            video.play().catch(function () {});
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        if (shouldPlay) {
          video.play().catch(function () {});
        }
      } else {
        video.src = source;
        if (shouldPlay) {
          video.play().catch(function () {});
        }
      }

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    }

    if (startButton) {
      startButton.addEventListener('click', function () {
        hideOverlay();
        loadPlayer(true);
      });
    }

    video.addEventListener('play', hideOverlay);
    video.addEventListener('click', function () {
      loadPlayer(false);
    });
  }
}());
