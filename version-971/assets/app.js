(function () {
  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function pagePrefix() {
    var path = location.pathname.replace(/\\/g, "/");
    if (path.indexOf("/movies/") !== -1 || path.indexOf("/category/") !== -1) {
      return "../";
    }
    return "";
  }

  function normalize(text) {
    return String(text || "").toLowerCase().trim();
  }

  function linkFor(url) {
    return pagePrefix() + String(url || "").replace(/^\.\//, "");
  }

  function showImageFallbacks() {
    all("img").forEach(function (img) {
      img.addEventListener("error", function () {
        img.classList.add("is-missing");
      }, { once: true });
    });
  }

  function setupMenu() {
    var button = one("[data-menu-toggle]");
    var menu = one("[data-mobile-nav]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
      button.setAttribute("aria-expanded", menu.classList.contains("is-open") ? "true" : "false");
    });
  }

  function renderQuickResults(input, box) {
    var keyword = normalize(input.value);
    if (!keyword || !window.SearchIndex) {
      box.classList.remove("is-open");
      box.innerHTML = "";
      return;
    }
    var results = window.SearchIndex.filter(function (item) {
      var pool = normalize([item.title, item.year, item.region, item.genre, item.tags].join(" "));
      return pool.indexOf(keyword) !== -1;
    }).slice(0, 8);
    if (!results.length) {
      box.innerHTML = '<div class="empty-state">没有找到匹配影片</div>';
      box.classList.add("is-open");
      return;
    }
    box.innerHTML = results.map(function (item) {
      return '' +
        '<a class="search-result-item" href="' + linkFor(item.url) + '">' +
          '<span class="search-result-thumb"><img src="' + linkFor(item.image) + '" alt="' + item.title + '"></span>' +
          '<span>' +
            '<span class="search-result-title">' + item.title + '</span>' +
            '<span class="search-result-meta">' + item.year + ' · ' + item.region + ' · ' + item.genre + '</span>' +
          '</span>' +
        '</a>';
    }).join("");
    box.classList.add("is-open");
  }

  function setupHeaderSearch() {
    all("[data-site-search]").forEach(function (input) {
      var shell = input.closest("[data-search-shell]");
      var box = shell ? one("[data-search-results]", shell) : null;
      if (!box) {
        return;
      }
      input.addEventListener("input", function () {
        renderQuickResults(input, box);
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && input.value.trim()) {
          location.href = pagePrefix() + "search.html?q=" + encodeURIComponent(input.value.trim());
        }
      });
      document.addEventListener("click", function (event) {
        if (!shell.contains(event.target)) {
          box.classList.remove("is-open");
        }
      });
    });
  }

  function setupHero() {
    var hero = one("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = all("[data-hero-slide]", hero);
    var dots = all("[data-hero-dot]", hero);
    var active = 0;
    function setActive(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle("is-active", idx === active);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle("is-active", idx === active);
      });
    }
    dots.forEach(function (dot, idx) {
      dot.addEventListener("click", function () {
        setActive(idx);
      });
    });
    if (slides.length > 1) {
      setInterval(function () {
        setActive(active + 1);
      }, 5200);
    }
    setActive(0);
  }

  function setupFilters() {
    all("[data-filter-root]").forEach(function (root) {
      var input = one("[data-filter-input]", root);
      var buttons = all("[data-filter-year]", root);
      var cards = all("[data-filter-card]", root);
      var year = "all";
      function apply() {
        var keyword = normalize(input ? input.value : "");
        cards.forEach(function (card) {
          var text = normalize(card.getAttribute("data-filter-text"));
          var cardYear = card.getAttribute("data-year") || "";
          var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
          var matchYear = year === "all" || cardYear === year;
          card.style.display = matchKeyword && matchYear ? "" : "none";
        });
      }
      if (input) {
        input.addEventListener("input", apply);
      }
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          year = button.getAttribute("data-filter-year") || "all";
          buttons.forEach(function (item) {
            item.classList.toggle("is-active", item === button);
          });
          apply();
        });
      });
      apply();
    });
  }

  function setupSearchPage() {
    var input = one("[data-search-page-input]");
    var results = one("[data-search-page-results]");
    if (!input || !results || !window.SearchIndex) {
      return;
    }
    var params = new URLSearchParams(location.search);
    var initial = params.get("q") || "";
    input.value = initial;
    function card(item) {
      return '' +
        '<a class="movie-card" href="' + item.url + '">' +
          '<span class="card-media"><img src="' + item.image + '" alt="' + item.title + '"><span class="play-badge">▶</span><span class="card-year">' + item.year + '</span></span>' +
          '<span class="card-body">' +
            '<h3>' + item.title + '</h3>' +
            '<p class="card-meta">' + item.region + ' · ' + item.genre + '</p>' +
            '<p class="card-text">' + item.oneLine + '</p>' +
          '</span>' +
        '</a>';
    }
    function apply() {
      var keyword = normalize(input.value);
      var list = window.SearchIndex.filter(function (item) {
        var pool = normalize([item.title, item.year, item.region, item.genre, item.tags, item.oneLine].join(" "));
        return !keyword || pool.indexOf(keyword) !== -1;
      }).slice(0, 60);
      if (!list.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配影片</div>';
        return;
      }
      results.innerHTML = list.map(card).join("");
      showImageFallbacks();
    }
    input.addEventListener("input", apply);
    apply();
  }

  function setupPlayer() {
    var box = one("[data-player-box]");
    if (!box) {
      return;
    }
    var video = one("video", box);
    var overlay = one("[data-play-overlay]", box);
    if (!video || !overlay) {
      return;
    }
    var streamUrl = video.getAttribute("data-stream");
    var ready = false;
    function prepare() {
      if (ready || !streamUrl) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        ready = true;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        ready = true;
        return;
      }
      video.src = streamUrl;
      ready = true;
    }
    function start() {
      prepare();
      var action = video.play();
      if (action && action.then) {
        action.then(function () {
          overlay.classList.add("is-hidden");
        }).catch(function () {
          overlay.classList.remove("is-hidden");
        });
      } else {
        overlay.classList.add("is-hidden");
      }
    }
    overlay.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener("play", function () {
      overlay.classList.add("is-hidden");
    });
    video.addEventListener("ended", function () {
      overlay.classList.remove("is-hidden");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    showImageFallbacks();
    setupMenu();
    setupHeaderSearch();
    setupHero();
    setupFilters();
    setupSearchPage();
    setupPlayer();
  });
})();
