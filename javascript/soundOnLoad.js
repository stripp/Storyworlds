document.addEventListener('DOMContentLoaded', () => {
  // Create the Start Experience button
  const startBtn = document.createElement('button');
  startBtn.id = 'startExperience';
  startBtn.textContent = 'Start Experience';
  startBtn.style.position = 'absolute';
  startBtn.style.top = '40%';
  startBtn.style.left = '50%';
  startBtn.style.transform = 'translate(-50%, -50%)';
  startBtn.style.padding = '20px 40px';
  startBtn.style.fontSize = '20px';
  startBtn.style.zIndex = '9999';
  document.body.appendChild(startBtn);

  // Get your audio element
  const audioEl = document.getElementById('ambientWoods');

  startBtn.addEventListener('click', async () => {
    console.log("Gesture detected — resuming audio");

    // Resume THREE.js AudioContext (required on iOS + Chrome)
    try {
      await THREE.AudioContext.getContext().resume();
    } catch (e) {
      console.warn("AudioContext resume failed:", e);
    }

    // Play your audio element
    try {
      await audioEl.play();
      console.log("Audio started successfully");
    } catch (err) {
      console.warn("Audio play failed:", err);
    }

    // Hide the button
    startBtn.style.display = 'none';
  });
});
