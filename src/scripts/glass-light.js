/* ============================================================
   Glass Ambient Light Driver — scottbertrand.com
   v1.5.1
   ------------------------------------------------------------
   Desktop-only ambient light proxy.
   Cursor influences light INDIRECTLY.
   Barely perceptible. Heavily damped.
   ============================================================ */

(function () {
  // Respect reduced motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) return;

  // Only enable on fine pointer devices (desktop)
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  if (!isFinePointer) return;

  const root = document.documentElement;

  // Target light values (very low range)
  let targetLX = 0.15;
  let targetLY = -0.15;

  // Current smoothed values
  let currentLX = targetLX;
  let currentLY = targetLY;

  // Damping factor (lower = slower, calmer)
  const DAMPING = 0.06;

  // Maximum influence (kept intentionally small)
  const MAX_SHIFT = 0.25;

  // Throttle via rAF
  let ticking = false;

  function onMouseMove(e) {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const { innerWidth, innerHeight } = window;

      // Normalize cursor position to -1 → 1
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;

      // Clamp and scale influence
      targetLX = Math.max(
        -MAX_SHIFT,
        Math.min(MAX_SHIFT, nx * MAX_SHIFT)
      );
      targetLY = Math.max(
        -MAX_SHIFT,
        Math.min(MAX_SHIFT, ny * MAX_SHIFT)
      );

      ticking = false;
    });
  }

  function updateLight() {
    // Heavy smoothing toward target
    currentLX += (targetLX - currentLX) * DAMPING;
    currentLY += (targetLY - currentLY) * DAMPING;

    // Write to CSS variables
    root.style.setProperty("--glass-lx", currentLX.toFixed(4));
    root.style.setProperty("--glass-ly", currentLY.toFixed(4));

    requestAnimationFrame(updateLight);
  }

  // Start
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  updateLight();
})();