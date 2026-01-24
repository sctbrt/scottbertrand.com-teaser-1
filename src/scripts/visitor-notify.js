// Visitor Notification Script
// Sends a notification when someone visits the site (production only)

(function() {
  // Only run in production
  if (location.hostname !== 'scottbertrand.com') return;

  // Don't notify on every page load - use sessionStorage to limit
  const notified = sessionStorage.getItem('visitor-notified');
  if (notified) return;

  // Mark as notified for this session
  sessionStorage.setItem('visitor-notified', '1');

  // Send notification (fire and forget, non-blocking)
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: location.pathname,
      referrer: document.referrer || null
    })
  }).catch(() => {
    // Silently fail - don't impact user experience
  });
})();
