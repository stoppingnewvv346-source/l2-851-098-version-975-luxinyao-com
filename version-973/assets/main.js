(function () {
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let current = 0;
    let timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function startTimer() {
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        window.clearInterval(timer);
        showSlide(dotIndex);
        startTimer();
      });
    });

    showSlide(0);
    startTimer();
  }

  const filterForm = document.querySelector('[data-filter-form]');

  if (filterForm) {
    const cards = Array.from(document.querySelectorAll('[data-movie-card]'));
    const searchInput = filterForm.querySelector('[data-filter-search]');
    const categorySelect = filterForm.querySelector('[data-filter-category]');
    const regionSelect = filterForm.querySelector('[data-filter-region]');
    const yearSelect = filterForm.querySelector('[data-filter-year]');
    const countNode = document.querySelector('[data-filter-count]');
    const emptyState = document.querySelector('[data-empty-state]');
    const resetButton = filterForm.querySelector('[data-filter-reset]');

    function normalize(value) {
      return (value || '').toString().trim().toLowerCase();
    }

    function applyFilters() {
      const keyword = normalize(searchInput && searchInput.value);
      const category = normalize(categorySelect && categorySelect.value);
      const region = normalize(regionSelect && regionSelect.value);
      const year = normalize(yearSelect && yearSelect.value);
      let visible = 0;

      cards.forEach(function (card) {
        const text = normalize(card.dataset.search);
        const cardCategory = normalize(card.dataset.category);
        const cardRegion = normalize(card.dataset.region);
        const cardYear = normalize(card.dataset.year);
        const matchesKeyword = !keyword || text.includes(keyword);
        const matchesCategory = !category || cardCategory === category;
        const matchesRegion = !region || cardRegion === region;
        const matchesYear = !year || cardYear === year;
        const isVisible = matchesKeyword && matchesCategory && matchesRegion && matchesYear;

        card.hidden = !isVisible;

        if (isVisible) {
          visible += 1;
        }
      });

      if (countNode) {
        countNode.textContent = '已显示 ' + visible + ' / ' + cards.length + ' 部';
      }

      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    function loadQueryFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q');

      if (query && searchInput) {
        searchInput.value = query;
      }
    }

    filterForm.addEventListener('submit', function (event) {
      event.preventDefault();
      applyFilters();
    });

    [searchInput, categorySelect, regionSelect, yearSelect].forEach(function (control) {
      if (!control) {
        return;
      }

      control.addEventListener('input', applyFilters);
      control.addEventListener('change', applyFilters);
    });

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        filterForm.reset();
        applyFilters();
      });
    }

    loadQueryFromUrl();
    applyFilters();
  }
})();
