      document.addEventListener('DOMContentLoaded', () => {
        function isIOS() {
          const ua = navigator.userAgent;
          const iOS = /iPhone|iPad|iPod/.test(ua);
          const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
          return iOS || iPadOS;
        }

        const startButton = document.getElementById('startAudioButton');
        if (!startButton) return;

        const audio = new Audio();
        audio.src = "audio/new_woods_mixdown.mp3";
        audio.crossOrigin = "anonymous";
        audio.loop = true;
        audio.load();

        audio.play().catch(() => {
          if (isIOS()) startButton.setAttribute('visible', true);
        });

        startButton.addEventListener('click', () => {
          audio.play().then(() => startButton.setAttribute('visible', false));
        });
      });
