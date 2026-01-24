// Vercel Serverless Function: Visitor Notification via Pushover
// Endpoint: /api/notify

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get visitor info from request
  const { page, referrer } = req.body || {};

  // Get visitor IP (Vercel provides this in headers)
  const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             'unknown';

  // Pushover credentials (from environment variables for security)
  const PUSHOVER_USER = process.env.PUSHOVER_USER_KEY;
  const PUSHOVER_TOKEN = process.env.PUSHOVER_API_TOKEN;

  if (!PUSHOVER_USER || !PUSHOVER_TOKEN) {
    console.error('Pushover credentials not configured');
    return res.status(500).json({ error: 'Notification service not configured' });
  }

  try {
    // Get location from IP (using free ip-api.com service)
    let location = '';
    if (ip && ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionCode,country`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.city) {
            location = `${geo.city}${geo.regionCode ? `, ${geo.regionCode}` : ''}${geo.country ? `, ${geo.country}` : ''}`;
          }
        }
      } catch (geoErr) {
        // Silently fail - location is optional
      }
    }

    // Build notification message
    let message = `📍 ${page || 'Homepage'}`;
    if (referrer) message += `\nFrom: ${referrer}`;
    if (location) message += `\n📌 ${location}`;

    // Send to Pushover
    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        message: message,
        title: 'Visitor on scottbertrand.com',
        url: `https://scottbertrand.com${page || '/'}`,
        url_title: 'View Page',
        priority: -1, // Low priority (silent, no sound)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Pushover error:', errorData);
      return res.status(500).json({ error: 'Failed to send notification' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
