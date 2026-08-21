window.addEventListener('load', () => {

  function isIOS() {
    const ua = navigator.userAgent;
    const iOS = /iPhone|iPad|iPod/.test(ua);
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOS || iPadOS;
  }

  const overlay = document.createElement('div');
  overlay.id = 'experienceOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '9999';
  document.body.appendChild(overlay);

  const startBtn = document.createElement('button');
  startBtn.id = 'startExperience';
  startBtn.textContent = isIOS() ? 'Tap to Start Audio' : 'Start Experience';
  startBtn.style.pointerEvents = 'auto';
  startBtn.style.padding = '20px 40px';
  startBtn.style.fontSize = '20px';
  startBtn.style.borderRadius = '8px';
  startBtn.style.background = 'rgba(0,0,0,0.7)';
  startBtn.style.color = 'white';
  startBtn.style.border = 'none';
  startBtn.style.webkitUserSelect = 'none';
  startBtn.style.userSelect = 'none';
  overlay.appendChild(startBtn);

  const audioEl = document.getElementById('ambientWoods');
  audioEl.loop = true;

  async function handleStartExperience() {
    console.log("Gesture detected — resuming audio");

    try {
      await THREE.AudioContext.getContext().resume();
    } catch (e) {
      console.warn("AudioContext resume failed:", e);
    }

    try {
      await audioEl.play();
      console.log("Audio started successfully");
    } catch (err) {
      console.warn("Audio play failed:", err);
    }

    overlay.style.display = 'none';
  }

  startBtn.addEventListener('touchstart', handleStartExperience, { passive: true });
  startBtn.addEventListener('click', handleStartExperience);
});
