document.addEventListener('DOMContentLoaded', () => {

  // -----------------------------
  // 1. Reliable iOS Detection
  // -----------------------------
  function isIOS() {
    const ua = navigator.userAgent;
    const iOS = /iPhone|iPad|iPod/.test(ua);
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOS || iPadOS;
  }

  // -----------------------------
  // 2. Create Overlay Container
  // -----------------------------
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

  // -----------------------------
  // 3. Create Start Experience Button
  // -----------------------------
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

  // -----------------------------
  // 4. Audio Element Setup
  // -----------------------------
  const audioEl = document.getElementById('ambientWoods');
  audioEl.loop = true;

  // -----------------------------
  // 5. Unified Start Handler
  // -----------------------------
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

  // -----------------------------
  // 6. Event Listeners
  // -----------------------------
  // iOS requires touchstart
  startBtn.addEventListener('touchstart', handleStartExperience, { passive: true });

  // Desktop fallback
  startBtn.addEventListener('click', handleStartExperience);
});
