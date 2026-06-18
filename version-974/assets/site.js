(function() {
  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  function updateHeader() {
    if (!header) {
      return;
    }
    if (window.scrollY > 16) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function() {
      mobileNav.classList.toggle("is-open");
    });
  }

  document.querySelectorAll("[data-hero]").forEach(function(hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var thumbs = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-thumb]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function activate(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, idx) {
        slide.classList.toggle("is-active", idx === current);
      });
      dots.forEach(function(dot, idx) {
        dot.classList.toggle("is-active", idx === current);
      });
      thumbs.forEach(function(thumb, idx) {
        thumb.classList.toggle("is-active", idx === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function() {
        activate(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        activate(Number(dot.getAttribute("data-hero-dot")));
        start();
      });
    });

    thumbs.forEach(function(thumb) {
      thumb.addEventListener("click", function() {
        activate(Number(thumb.getAttribute("data-hero-thumb")));
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function() {
        activate(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function() {
        activate(current + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    activate(0);
    start();
  });

  document.querySelectorAll(".search-panel").forEach(function(panel) {
    var input = panel.querySelector("[data-search-input]");
    var buttons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter]"));
    var scope = panel.parentElement || document;
    var cards = Array.prototype.slice.call(scope.querySelectorAll(".search-card"));
    var empty = scope.querySelector("[data-empty]");
    var activeFilter = "all";

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function apply() {
      var query = normalize(input ? input.value : "");
      var visible = 0;

      cards.forEach(function(card) {
        var text = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-tags"),
          card.textContent
        ].join(" "));
        var category = card.getAttribute("data-category") || "";
        var matchText = !query || text.indexOf(query) !== -1;
        var matchFilter = activeFilter === "all" || category === activeFilter;
        var show = matchText && matchFilter;

        card.classList.toggle("is-hidden", !show);
        if (show) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }

    buttons.forEach(function(button) {
      button.addEventListener("click", function() {
        activeFilter = button.getAttribute("data-filter") || "all";
        buttons.forEach(function(item) {
          item.classList.toggle("is-active", item === button);
        });
        apply();
      });
    });

    apply();
  });
})();
