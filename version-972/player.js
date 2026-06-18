
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function mountPlayer(shell) {
    const video = shell.querySelector("video");
    const overlay = shell.querySelector("[data-play-overlay]");
    const poster = shell.getAttribute("data-poster") || "";
    const src = shell.getAttribute("data-source") || "";
    let hls = null;
    let started = false;

    function openSource() {
      if (!src || started) return;
      started = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.attachMedia(video);
        hls.loadSource(src);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else {
        shell.classList.add("player-error");
        shell.insertAdjacentHTML("beforeend", '<div class="player-hint">当前浏览器无法播放 M3U8</div>');
        return;
      }
      overlay && overlay.classList.add("hide");
      video.play().catch(function () {});
    }

    function handleClick() {
      openSource();
    }

    shell.addEventListener("click", handleClick);
    overlay && overlay.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openSource();
    });
    video.addEventListener("click", handleClick);
    video.addEventListener("loadedmetadata", function () {
      shell.classList.add("is-ready");
    });
    if (poster) {
      shell.style.setProperty("--poster-image", 'url("' + poster.replace(/"/g, '\\"') + '")');
    }
  }

  ready(function () {
    document.querySelectorAll("[data-player-shell]").forEach(mountPlayer);
  });
})();
