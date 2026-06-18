
(function () {
  const onReady = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const esc = (s) => String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  const hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const hueTriplet = (seed) => {
    const h = hash(seed);
    return [h % 360, (h + 37) % 360, (h + 173) % 360];
  };

  const posterVars = (seed) => {
    const [a, b, c] = hueTriplet(seed);
    return {
      '--g1': `hsl(${a} 95% 58%)`,
      '--g2': `hsl(${b} 92% 54%)`,
      '--g3': `hsl(${c} 88% 46%)`
    };
  };

  const applyPosterVars = (el, seed) => {
    const vars = posterVars(seed);
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
  };

  const initMobileMenu = () => {
    const toggle = qs('[data-menu-toggle]');
    const panel = qs('[data-mobile-panel]');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', String(!open));
    });
  };

  const initHeroSlider = () => {
    const root = qs('[data-hero-slider]');
    if (!root) return;
    const slides = qsa('.hero-slide', root);
    const dots = qsa('[data-hero-dot]', root);
    if (slides.length < 2) return;
    let index = 0;
    let timer = null;

    const activate = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, idx) => slide.classList.toggle('active', idx === index));
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === index));
    };

    const start = () => {
      stop();
      timer = setInterval(() => activate(index + 1), 5200);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    dots.forEach((dot, idx) => dot.addEventListener('click', () => {
      activate(idx);
      start();
    }));

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    activate(0);
    start();
  };

  const filterCards = (root, query) => {
    const cards = qsa('[data-title]', root);
    const q = query.trim().toLowerCase();
    let shown = 0;
    cards.forEach((card) => {
      const hay = [
        card.dataset.title,
        card.dataset.tags,
        card.dataset.year,
        card.dataset.category,
        card.dataset.genre
      ].join(' ').toLowerCase();
      const match = !q || hay.includes(q);
      card.classList.toggle('hidden', !match);
      if (match) shown += 1;
    });
    const countNode = qs('[data-filter-count]', root);
    if (countNode) countNode.textContent = String(shown);
  };

  const initLocalFilters = () => {
    qsa('[data-filter-form]').forEach((form) => {
      const input = qs('[data-filter-input]', form);
      const list = qs('[data-card-list]');
      const sort = qs('[data-sort]', form);
      if (!input || !list) return;

      const apply = () => {
        filterCards(list, input.value || '');
        const cards = qsa('.movie-card', list).filter((card) => !card.classList.contains('hidden'));
        if (sort) {
          const mode = sort.value;
          cards.sort((a, b) => {
            const av = Number(a.dataset.score || '0');
            const bv = Number(b.dataset.score || '0');
            const ay = Number(a.dataset.year || '0');
            const by = Number(b.dataset.year || '0');
            if (mode === 'hot') return bv - av;
            if (mode === 'new') return by - ay || bv - av;
            return 0;
          });
          cards.forEach((card) => list.appendChild(card));
        }
      };

      input.addEventListener('input', apply);
      if (sort) sort.addEventListener('change', apply);
      apply();
    });
  };

  const loadSearchIndex = async () => {
    if (Array.isArray(window.SEARCH_INDEX) && window.SEARCH_INDEX.length) return window.SEARCH_INDEX;
    try {
      const res = await fetch('assets/search-index.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('index load failed');
      return res.json();
    } catch (err) {
      return [];
    }
  };

  const renderSearch = async () => {
    const root = qs('[data-search-page]');
    if (!root) return;

    const params = new URLSearchParams(location.search);
    const qInput = qs('[data-search-input]', root);
    const resultWrap = qs('[data-search-results]', root);
    const countNode = qs('[data-search-count]', root);
    const emptyNode = qs('[data-search-empty]', root);

    let index = [];
    try {
      index = await loadSearchIndex();
    } catch (err) {
      if (resultWrap) resultWrap.innerHTML = `<div class="center-empty">搜索索引加载失败，请稍后重试。</div>`;
      return;
    }

    const render = (value) => {
      const q = (value || '').trim().toLowerCase();
      const items = !q ? index.slice(0, 60) : index.filter((item) => {
        const hay = [item.title, item.tags, item.oneLine, item.summary, item.genre, item.category, item.region, item.type, item.year].join(' ').toLowerCase();
        return hay.includes(q);
      });

      if (countNode) countNode.textContent = String(items.length);
      if (emptyNode) emptyNode.classList.toggle('hidden', items.length !== 0);

      if (!resultWrap) return;
      resultWrap.innerHTML = items.map((item) => {
        const [a, b, c] = hueTriplet(`${item.id}-${item.title}`);
        const posterStyle = `--g1:hsl(${a} 95% 58%);--g2:hsl(${b} 92% 54%);--g3:hsl(${c} 88% 46%)`;
        const tags = (item.tags || '').split(/[，,、/\/\s]+/).filter(Boolean).slice(0, 4).map(t => `<span class="chip">${esc(t)}</span>`).join('');
        return `
          <article class="result-card">
            <a class="poster poster-md" href="${esc(item.url)}" style="${posterStyle}">
              <span class="poster-chip">${esc(item.category || item.genre || '影片')}</span>
              <span class="poster-title">${esc(item.title)}</span>
              <span class="poster-meta">${esc(item.year)} · ${esc(item.region)} · ${esc(item.type)}</span>
              <span class="poster-play">▶</span>
            </a>
            <div class="result-body">
              <h3><a href="${esc(item.url)}">${esc(item.title)}</a></h3>
              <p>${esc(item.oneLine || item.summary || '')}</p>
              <div class="chip-row" style="margin-top:10px">${tags}</div>
            </div>
          </article>
        `;
      }).join('');
    };

    if (qInput) {
      qInput.value = params.get('q') || '';
      qInput.addEventListener('input', () => render(qInput.value));
    }
    render(qInput ? qInput.value : params.get('q') || '');
  };

  const initPlayer = () => {
    qsa('[data-player]').forEach((shell) => {
      const video = qs('video', shell);
      const overlay = qs('[data-player-overlay]', shell);
      const sourceBtns = qsa('[data-source-btn]', shell);
      const note = qs('[data-player-note]', shell);
      if (!video) return;

      let hls = null;
      let currentSrc = shell.dataset.source || '';
      const poster = shell.dataset.poster || '';

      const setNote = (text) => { if (note) note.textContent = text; };

      const destroyHls = () => {
        if (hls && typeof hls.destroy === 'function') {
          try { hls.destroy(); } catch (e) {}
        }
        hls = null;
      };

      const attachSource = (url, label = '线路') => {
        if (!url) return;
        currentSrc = url;
        sourceBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.src === url));
        destroyHls();
        video.pause();
        video.removeAttribute('src');
        video.load();

        if (poster) video.setAttribute('poster', poster);

        const tryNative = () => {
          video.src = url;
          const p = video.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        };

        if (window.Hls && Hls.isSupported()) {
          try {
            hls = new Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setNote(`当前使用 ${label}，可直接播放。`);
              const p = video.play();
              if (p && typeof p.catch === 'function') p.catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data && data.fatal) {
                setNote('播放源暂时加载失败，已自动回退为原生播放模式。');
                tryNative();
              }
            });
          } catch (e) {
            setNote('HLS 初始化失败，尝试原生播放。');
            tryNative();
          }
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          setNote(`当前使用 ${label}。`);
          tryNative();
        } else {
          setNote('当前浏览器不支持 HLS 播放。');
        }
      };

      sourceBtns.forEach((btn) => btn.addEventListener('click', () => attachSource(btn.dataset.src, btn.textContent || '线路')));
      if (overlay) overlay.addEventListener('click', () => attachSource(currentSrc, '默认线路'));
      video.addEventListener('click', () => {
        if (video.paused) {
          const p = video.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
          if (overlay) overlay.classList.add('hidden');
        } else {
          video.pause();
        }
      });
      video.addEventListener('play', () => overlay && overlay.classList.add('hidden'));
      video.addEventListener('pause', () => overlay && overlay.classList.remove('hidden'));
      if (currentSrc) attachSource(currentSrc, '默认线路');
    });
  };

  const initPagePosterStyles = () => {
    qsa('[data-poster-seed]').forEach((el) => {
      applyPosterVars(el, el.getAttribute('data-poster-seed') || '');
    });
  };

  const initJumpSearch = () => {
    qsa('[data-search-form]').forEach((form) => {
      const input = qs('[data-search-term]', form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const term = (input ? input.value : '').trim();
        location.href = `search.html?q=${encodeURIComponent(term)}`;
      });
    });
  };

  onReady(() => {
    initMobileMenu();
    initHeroSlider();
    initLocalFilters();
    renderSearch();
    initPlayer();
    initPagePosterStyles();
    initJumpSearch();
  });
})();
