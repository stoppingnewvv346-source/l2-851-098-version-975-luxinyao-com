(function() {
  var players = document.querySelectorAll("[data-player]");

  players.forEach(function(wrapper) {
    var video = wrapper.querySelector("video");
    var button = wrapper.querySelector("[data-play-button]");
    var source = wrapper.getAttribute("data-video-src");
    var started = false;
    var hls = null;

    function bindSource() {
      if (!video || !source || started) {
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }

      started = true;
    }

    function playVideo() {
      if (!video) {
        return;
      }

      bindSource();

      if (button) {
        button.classList.add("is-hidden");
      }

      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function() {
          if (button) {
            button.classList.remove("is-hidden");
          }
        });
      }
    }

    if (button) {
      button.addEventListener("click", playVideo);
    }

    if (video) {
      video.addEventListener("click", function() {
        if (video.paused) {
          playVideo();
        }
      });

      video.addEventListener("play", function() {
        if (button) {
          button.classList.add("is-hidden");
        }
      });

      video.addEventListener("pause", function() {
        if (button && video.currentTime === 0) {
          button.classList.remove("is-hidden");
        }
      });
    }

    window.addEventListener("beforeunload", function() {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  });
})();
