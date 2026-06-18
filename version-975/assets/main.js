(function () {
    function by(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function initHero() {
        var slider = document.querySelector('[data-hero-slider]');
        if (!slider) {
            return;
        }
        var slides = by('[data-hero-slide]', slider);
        var dots = by('[data-hero-dot]', slider);
        var prev = slider.querySelector('[data-hero-prev]');
        var next = slider.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function schedule() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                schedule();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                schedule();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(parseInt(dot.getAttribute('data-hero-dot'), 10));
                schedule();
            });
        });
        show(0);
        schedule();
    }

    function initSearchPage() {
        var page = document.querySelector('[data-search-page]');
        if (!page) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var input = page.querySelector('[data-search-input]');
        var region = page.querySelector('[data-region-filter]');
        var year = page.querySelector('[data-year-filter]');
        var type = page.querySelector('[data-type-filter]');
        var genre = page.querySelector('[data-genre-filter]');
        var count = page.querySelector('[data-search-count]');
        var cards = by('[data-search-card]');
        var initial = params.get('q');

        if (initial && input) {
            input.value = initial;
        }

        function textOf(card) {
            return [
                card.getAttribute('data-title'),
                card.getAttribute('data-region'),
                card.getAttribute('data-year'),
                card.getAttribute('data-type'),
                card.getAttribute('data-genre'),
                card.getAttribute('data-tags')
            ].join(' ').toLowerCase();
        }

        function selected(el) {
            return el ? el.value : 'all';
        }

        function matchValue(value, wanted) {
            return wanted === 'all' || String(value || '').indexOf(wanted) !== -1;
        }

        function update() {
            var query = input ? input.value.trim().toLowerCase() : '';
            var wantedRegion = selected(region);
            var wantedYear = selected(year);
            var wantedType = selected(type);
            var wantedGenre = selected(genre);
            var visible = 0;

            cards.forEach(function (card) {
                var ok = true;
                if (query) {
                    ok = textOf(card).indexOf(query) !== -1;
                }
                ok = ok && matchValue(card.getAttribute('data-region'), wantedRegion);
                ok = ok && matchValue(card.getAttribute('data-year'), wantedYear);
                ok = ok && matchValue(card.getAttribute('data-type'), wantedType);
                ok = ok && matchValue(card.getAttribute('data-genre'), wantedGenre);
                card.classList.toggle('is-hidden', !ok);
                if (ok) {
                    visible += 1;
                }
            });

            if (count) {
                count.textContent = '找到 ' + visible + ' 个结果';
            }
        }

        [input, region, year, type, genre].forEach(function (el) {
            if (el) {
                el.addEventListener('input', update);
                el.addEventListener('change', update);
            }
        });
        update();
    }

    window.initMoviePlayer = function (id, source) {
        var shell = document.getElementById(id);
        if (!shell) {
            return;
        }
        var video = shell.querySelector('video');
        var button = shell.querySelector('[data-play-button]');
        var loaded = false;
        var hls = null;

        function bindSource() {
            if (loaded || !video) {
                return;
            }
            loaded = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else {
                video.src = source;
            }
            shell._hls = hls;
        }

        function play() {
            bindSource();
            shell.classList.add('is-playing');
            video.setAttribute('controls', 'controls');
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {
                    shell.classList.remove('is-playing');
                });
            }
        }

        if (button) {
            button.addEventListener('click', play);
        }
        if (video) {
            video.addEventListener('click', function () {
                if (!loaded || video.paused) {
                    play();
                }
            });
            video.addEventListener('play', function () {
                shell.classList.add('is-playing');
            });
            video.addEventListener('pause', function () {
                if (video.currentTime === 0 || video.ended) {
                    shell.classList.remove('is-playing');
                }
            });
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initHero();
        initSearchPage();
    });
})();
