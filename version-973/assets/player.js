import { H as Hls } from './hls.js';

const playerNodes = document.querySelectorAll('[data-player]');

playerNodes.forEach(function (shell) {
  const video = shell.querySelector('video');
  const button = shell.querySelector('[data-play-button]');
  const status = shell.querySelector('[data-player-status]');
  const stream = shell.getAttribute('data-stream');
  let hls = null;
  let ready = false;
  let loading = false;

  function setStatus(text) {
    if (status) {
      status.textContent = text || '';
    }
  }

  function hideButton() {
    if (button) {
      button.classList.add('is-hidden');
    }
  }

  function showButton() {
    if (button) {
      button.classList.remove('is-hidden');
    }
  }

  function attachStream() {
    if (!video || !stream || ready || loading) {
      return Promise.resolve();
    }

    loading = true;
    setStatus('正在载入');

    return new Promise(function (resolve, reject) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        video.addEventListener('loadedmetadata', function handleLoaded() {
          video.removeEventListener('loadedmetadata', handleLoaded);
          ready = true;
          loading = false;
          setStatus('');
          resolve();
        });
        video.addEventListener('error', function handleNativeError() {
          video.removeEventListener('error', handleNativeError);
          loading = false;
          setStatus('播放暂时不可用');
          reject(new Error('native video error'));
        }, { once: true });
        video.load();
        return;
      }

      if (Hls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          ready = true;
          loading = false;
          setStatus('');
          resolve();
        });
        hls.on(Hls.Events.ERROR, function (_event, data) {
          if (!data || !data.fatal) {
            return;
          }

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
            setStatus('正在重试');
            return;
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
            setStatus('正在恢复');
            return;
          }

          loading = false;
          setStatus('播放暂时不可用');
          reject(new Error('hls fatal error'));
        });
        return;
      }

      loading = false;
      setStatus('当前浏览器不支持播放');
      reject(new Error('unsupported browser'));
    });
  }

  async function playMovie() {
    if (!video) {
      return;
    }

    try {
      await attachStream();
      await video.play();
      hideButton();
    } catch (_error) {
      showButton();
    }
  }

  if (button) {
    button.addEventListener('click', playMovie);
  }

  if (video) {
    video.addEventListener('click', function () {
      if (!ready || video.paused) {
        playMovie();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', hideButton);
    video.addEventListener('pause', showButton);
    video.addEventListener('ended', showButton);
  }

  window.addEventListener('pagehide', function () {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
});
