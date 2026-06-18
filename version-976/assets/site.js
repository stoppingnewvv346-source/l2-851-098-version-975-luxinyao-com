
(function () {
  const HLS_SRC = "https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js";

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function formatNum(n) {
    const num = Number(n || 0);
    if (num >= 100000000) return (num / 100000000).toFixed(1).replace(/\.0$/, "") + "亿";
    if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, "") + "万";
    return String(num);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeText(str) {
    return String(str || "").trim().toLowerCase();
  }

  function initMobileMenu() {
    const btn = $('[data-menu-btn]');
    const panel = $('[data-mobile-panel]');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const opened = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(opened));
    });

    $all('[data-mobile-panel] a').forEach(link => {
      link.addEventListener('click', () => {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initHeroCarousel() {
    const shell = $('[data-hero-carousel]');
    if (!shell) return;

    const slides = $all('[data-hero-slide]', shell);
    const dots = $all('[data-hero-dot]', shell);
    const prev = $('[data-hero-prev]', shell);
    const next = $('[data-hero-next]', shell);
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    function activate(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    function start() {
      stop();
      timer = window.setInterval(() => activate(index + 1), 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) prev.addEventListener('click', () => { activate(index - 1); start(); });
    if (next) next.addEventListener('click', () => { activate(index + 1); start(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { activate(i); start(); }));

    shell.addEventListener('mouseenter', stop);
    shell.addEventListener('mouseleave', start);

    activate(0);
    start();
  }

  function cardMatches(card, keyword) {
    if (!keyword) return true;
    const hay = [
      card.dataset.title,
      card.dataset.region,
      card.dataset.type,
      card.dataset.genre,
      card.dataset.tags,
      card.dataset.year,
      card.dataset.oneLine
    ].map(normalizeText).join(" ");
    return hay.includes(keyword);
  }

  function initLocalFilters() {
    const form = $('[data-local-filter-form]');
    const input = $('[data-local-filter-input]');
    const select = $('[data-local-filter-select]');
    const count = $('[data-local-filter-count]');
    const cards = $all('[data-card]');
    if (!form || !input || !cards.length) return;

    function apply() {
      const keyword = normalizeText(input.value);
      const typeValue = select ? select.value : 'all';
      let visible = 0;

      cards.forEach(card => {
        const typeOk = typeValue === 'all' || card.dataset.group === typeValue;
        const textOk = cardMatches(card, keyword);
        const show = typeOk && textOk;
        card.style.display = show ? '' : 'none';
        if (show) visible += 1;
      });

      if (count) count.textContent = `找到 ${visible} 条结果`;
    }

    form.addEventListener('submit', evt => {
      evt.preventDefault();
      apply();
    });

    input.addEventListener('input', apply);
    if (select) select.addEventListener('change', apply);
    apply();
  }

  function renderCard(movie, prefix = "") {
    const tags = (movie.tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    const genre = escapeHtml(movie.genre || "");
    const title = escapeHtml(movie.title || "");
    const year = escapeHtml(movie.year || "");
    const region = escapeHtml(movie.region || "");
    const type = escapeHtml(movie.type || "");
    const oneLine = escapeHtml(movie.oneLine || "");
    return `
      <a class="media-card" href="${prefix}detail/${String(movie.id).padStart(4, "0")}.html" data-card
         data-title="${escapeHtml(movie.title || "")}"
         data-region="${escapeHtml(movie.region || "")}"
         data-type="${escapeHtml(movie.type || "")}"
         data-genre="${escapeHtml(movie.genre || "")}"
         data-tags="${escapeHtml((movie.tags || []).join(" "))}"
         data-year="${escapeHtml(movie.year || "")}"
         data-one-line="${escapeHtml(movie.oneLine || "")}">
        <div class="poster">
          <img src="${prefix}${movie.cover}" alt="${title}">
        </div>
        <div class="meta">
          <h3>${title}</h3>
          <div class="sub">
            <span>${year}</span>
            <span>${region}</span>
            <span>${type}</span>
          </div>
          <div class="tag-row">${tags}</div>
        </div>
      </a>
    `;
  }

  function renderRankingItem(movie, index, prefix = "") {
    return `
      <a class="rank-item" href="${prefix}detail/${String(movie.id).padStart(4, "0")}.html">
        <div class="rank-num">${index + 1}</div>
        <div class="rank-title">
          <strong>${escapeHtml(movie.title)}</strong>
          <span>${escapeHtml(movie.year)} · ${escapeHtml(movie.region)} · ${escapeHtml(movie.type)} · ${escapeHtml(movie.genre)}</span>
        </div>
        <div class="rank-stats">
          <div>${formatNum(movie.views)} 次播放</div>
          <div>${formatNum(movie.likes)} 点赞</div>
        </div>
      </a>
    `;
  }

  function initSearchPage() {
    const root = $('[data-search-page]');
    if (!root) return;
    const catalog = window.__CATALOG__ || [];
    const input = $('[data-search-input]', root);
    const region = $('[data-search-region]', root);
    const type = $('[data-search-type]', root);
    const sort = $('[data-search-sort]', root);
    const results = $('[data-search-results]', root);
    const counter = $('[data-search-count]', root);
    const form = $('[data-search-form]', root);

    const initial = new URLSearchParams(window.location.search);
    if (input && initial.get('q')) input.value = initial.get('q');
    if (region && initial.get('region')) region.value = initial.get('region');
    if (type && initial.get('type')) type.value = initial.get('type');

    function apply() {
      const term = normalizeText(input ? input.value : "");
      const regionValue = region ? region.value : "all";
      const typeValue = type ? type.value : "all";
      const sortValue = sort ? sort.value : "hot";

      let list = catalog.filter(item => {
        const regionOk = regionValue === "all" || normalizeText(item.region).includes(normalizeText(regionValue));
        const typeOk = typeValue === "all" || normalizeText(item.type).includes(normalizeText(typeValue));
        const hay = [
          item.title,
          item.region,
          item.type,
          item.genre,
          (item.tags || []).join(" "),
          item.oneLine
        ].map(normalizeText).join(" ");
        const termOk = !term || hay.includes(term);
        return regionOk && typeOk && termOk;
      });

      if (sortValue === "latest") {
        list.sort((a, b) => (b.year - a.year) || (b.id - a.id));
      } else {
        list.sort((a, b) => (b.views - a.views) || (b.likes - a.likes));
      }

      if (counter) counter.textContent = `共找到 ${list.length} 部影片`;

      const html = list.slice(0, 240).map(movie => renderCard(movie)).join("");
      if (results) {
        results.innerHTML = html || `<div class="content-box"><p>没有找到匹配的内容。</p></div>`;
      }
    }

    if (form) {
      form.addEventListener('submit', evt => {
        evt.preventDefault();
        apply();
      });
    }

    [input, region, type, sort].forEach(el => {
      if (!el) return;
      el.addEventListener('change', apply);
      el.addEventListener('input', apply);
    });

    apply();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find(s => s.src === src);
      if (existing) {
        if (window.Hls) return resolve();
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  async function setupPlayer() {
    const movie = window.__MOVIE__;
    const video = $('[data-player-video]');
    const stage = $('[data-player-stage]');
    const status = $('[data-player-status]');
    const lineWrap = $('[data-playlist]');
    const playBtn = $('[data-play-toggle]');
    if (!movie || !video || !stage) return;

    const playlist = Array.isArray(movie.playlist) && movie.playlist.length
      ? movie.playlist
      : [{ label: "线路 1", url: movie.videoUrl }];

    let hls = null;
    let currentUrl = "";

    function setStatus(text) {
      if (status) status.textContent = text;
    }

    function destroyHls() {
      if (hls) {
        try { hls.destroy(); } catch (_) {}
        hls = null;
      }
    }

    async function setSource(url) {
      currentUrl = url;
      destroyHls();
      video.removeAttribute('src');
      video.load();
      setStatus("正在加载线路…");

      const canNative = video.canPlayType('application/vnd.apple.mpegurl');
      if (canNative) {
        video.src = url;
        setStatus("线路已就绪");
        return;
      }

      try {
        if (!window.Hls) {
          await loadScript(HLS_SRC);
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            setStatus("线路已就绪");
          });
          hls.on(window.Hls.Events.ERROR, (evt, data) => {
            if (!data || !data.fatal) return;
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              setStatus("网络异常，正在尝试恢复…");
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              setStatus("媒体异常，正在尝试恢复…");
              hls.recoverMediaError();
            } else {
              setStatus("当前线路不可用");
            }
          });
        } else {
          video.src = url;
          setStatus("已切换到备用播放方式");
        }
      } catch (err) {
        console.warn(err);
        video.src = url;
        setStatus("已切换到直接播放");
      }
    }

    function setActiveButton(button) {
      $all('[data-line-btn]').forEach(btn => btn.classList.remove('active'));
      if (button) button.classList.add('active');
    }

    if (lineWrap) {
      lineWrap.innerHTML = playlist.map((item, idx) => `
        <button type="button" data-line-btn data-url="${escapeHtml(item.url)}" class="${idx === 0 ? 'active' : ''}">
          ${escapeHtml(item.label || `线路 ${idx + 1}`)}
        </button>
      `).join("");

      $all('[data-line-btn]', lineWrap).forEach(btn => {
        btn.addEventListener('click', () => {
          const url = btn.dataset.url;
          setActiveButton(btn);
          setSource(url);
          video.play().catch(() => {});
        });
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => video.play().catch(() => {}));
    }

    video.addEventListener('play', () => setStatus("播放中"));
    video.addEventListener('pause', () => setStatus("已暂停"));
    video.addEventListener('waiting', () => setStatus("缓冲中…"));
    video.addEventListener('error', () => setStatus("播放出错，请切换线路"));

    await setSource(playlist[0].url);
    setActiveButton($('[data-line-btn]'));
  }

  function initTabs() {
    const tabs = $all('[data-tabs]');
    tabs.forEach(root => {
      const buttons = $all('[data-tab-btn]', root);
      const panels = $all('[data-tab-panel]', root);
      if (!buttons.length || !panels.length) return;

      function activate(name) {
        buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.tabBtn === name));
        panels.forEach(panel => panel.hidden = panel.dataset.tabPanel !== name);
      }

      buttons.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.tabBtn)));
      activate(buttons[0].dataset.tabBtn);
    });
  }

  function init() {
    initMobileMenu();
    initHeroCarousel();
    initLocalFilters();
    initSearchPage();
    initTabs();
    setupPlayer();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
