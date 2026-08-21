window.addEventListener('load', () => {
  const scene = document.querySelector('a-scene');

  scene.addEventListener('assets-loaded', () => {

    function isIOS() {
      const ua = navigator.userAgent;
      const iOS = /iPhone|iPad|iPod/.test(ua);
      const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
      return iOS || iPadOS;
    }

    const audioEl = document.getElementById('ambientWoods');
    if (!audioEl) {
      console.warn('ambientWoods audio element not found even after assets-loaded.');
      return;
    }

    audioEl.loop = true;

    const startBtn = document.createElement('button');
    startBtn.id = 'startExperience';
    startBtn.textContent = isIOS() ? 'Tap to Start Audio' : 'Start Experience';
    startBtn.style.position = 'absolute';
    startBtn.style.top = '40%';
    startBtn.style.left = '50%';
    startBtn.style.transform = 'translate(-50%, -50%)';
    startBtn.style.padding = '20px 40px';
    startBtn.style.fontSize = '20px';
    startBtn.style.zIndex = '9999';
    document.body.appendChild(startBtn);

    async function handleStartExperience() {
      try {
        await THREE.AudioContext.getContext().resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }

      try {
        await audioEl.play();
      } catch (err) {
        console.warn('Audio play failed:', err);
      }

      startBtn.style.display = 'none';
    }

    startBtn.addEventListener('touchstart', handleStartExperience, { passive: true });
    startBtn.addEventListener('click', handleStartExperience);
  });
});
