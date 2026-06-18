
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initHero() {
    const slider = document.querySelector("[data-hero-slider]");
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll("[data-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-dot]"));
    const prev = slider.querySelector("[data-prev]");
    const next = slider.querySelector("[data-next]");
    let index = 0;
    let timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, n) => slide.classList.toggle("active", n === index));
      dots.forEach((dot, n) => dot.classList.toggle("active", n === index));
    }

    function start() {
      stop();
      timer = setInterval(() => show(index + 1), 5500);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    prev && prev.addEventListener("click", function () {
      show(index - 1);
      start();
    });
    next && next.addEventListener("click", function () {
      show(index + 1);
      start();
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", function () {
        const n = Number(dot.getAttribute("data-dot")) || 0;
        show(n);
        start();
      });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function cardText(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function initLocalFilter() {
    const scope = document.querySelector("[data-filter-scope]");
    if (!scope) return;

    const search = scope.querySelector("[data-search-input]");
    const year = scope.querySelector("[data-year-filter]");
    const type = scope.querySelector("[data-type-filter]");
    const cards = Array.from(scope.querySelectorAll("[data-movie-card]"));
    const empty = scope.querySelector("[data-empty]");

    function apply() {
      const q = (search && search.value || "").trim().toLowerCase();
      const y = (year && year.value || "").trim();
      const t = (type && type.value || "").trim();
      let visible = 0;

      cards.forEach((card) => {
        const hay = cardText(card);
        const cardYear = card.getAttribute("data-year") || "";
        const cardType = card.getAttribute("data-type") || "";
        const ok = (!q || hay.includes(q)) && (!y || cardYear === y) && (!t || cardType === t);
        card.classList.toggle("hide", !ok);
        if (ok) visible += 1;
      });

      if (empty) empty.classList.toggle("hide", visible !== 0);
    }

    search && search.addEventListener("input", apply);
    year && year.addEventListener("change", apply);
    type && type.addEventListener("change", apply);
    apply();
  }

  function initSearchPanel() {
    const panel = document.querySelector("[data-search-panel]");
    if (!panel) return;

    const input = panel.querySelector("[data-global-search]");
    const output = panel.querySelector("[data-global-results]");
    const data = window.MOVIE_INDEX || [];

    function render(items) {
      if (!output) return;
      if (!items.length) {
        output.innerHTML = '<div class="empty-state">没有找到匹配内容，请尝试更短的关键词。</div>';
        return;
      }

      output.innerHTML = items.slice(0, 24).map(function (item) {
        return (
          '<a class="result-item" href="' + item.url + '">' +
          '<div class="thumb" style="background-image:url(\'' + item.image + '\')"></div>' +
          '<div><div class="title">' + item.title + '</div>' +
          '<div class="meta">' + item.year + ' · ' + item.region + ' · ' + item.type + ' · ' + item.genre + '</div>' +
          '<div class="meta">' + item.summary + '</div></div>' +
          '<div class="chip">查看</div>' +
          '</a>'
        );
      }).join("");
    }

    function searchItems(q) {
      q = (q || "").trim().toLowerCase();
      if (!q) {
        output.innerHTML = '<div class="empty-state">输入关键词后会在全站影片索引中即时检索。</div>';
        return;
      }
      const items = data.filter(function (item) {
        const hay = [
          item.title, item.year, item.region, item.type,
          item.genre, item.tags, item.summary
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
      render(items);
    }

    if (input) {
      input.addEventListener("input", function () {
        searchItems(input.value);
      });
      searchItems(input.value);
    }
  }

  function initCopyLink() {
    const btn = document.querySelector("[data-copy-link]");
    if (!btn) return;
    btn.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(location.href);
        btn.textContent = "已复制链接";
        setTimeout(function () {
          btn.textContent = "复制页面链接";
        }, 1800);
      } catch (e) {
        btn.textContent = "复制失败";
      }
    });
  }

  ready(function () {
    initHero();
    initLocalFilter();
    initSearchPanel();
    initCopyLink();
  });
})();
