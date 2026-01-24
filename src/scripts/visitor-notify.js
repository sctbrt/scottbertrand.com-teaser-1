// Visitor Notification Script
// Sends a notification when someone visits the site (production only)

(function() {
  // Production domains that should trigger notifications
  const productionDomains = [
    'scottbertrand.com',
    'www.scottbertrand.com',
    'notes.scottbertrand.com',
    'goods.scottbertrand.com'
  ];

  // Only run in production
  if (!productionDomains.includes(location.hostname)) return;

  // Don't notify on every page load - use sessionStorage to limit
  const notified = sessionStorage.getItem('visitor-notified');
  if (notified) return;

  // Mark as notified for this session
  sessionStorage.setItem('visitor-notified', '1');

  // Send notification to main site's API (fire and forget, non-blocking)
  fetch('https://www.scottbertrand.com/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: location.pathname,
      referrer: document.referrer || null,
      site: location.hostname
    })
  }).catch(() => {
    // Silently fail - don't impact user experience
  });
})();
