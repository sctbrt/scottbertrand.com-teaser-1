// Vercel Serverless Function for newsletter subscriptions
// Uses Resend for email delivery with in-memory rate limiting

import { Resend } from 'resend';

// In-memory rate limiting (resets on cold start; acceptable for low-traffic endpoint)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_EMAIL = 3;
const MAX_REQUESTS_PER_IP = 10;

function checkRateLimit(identifier) {
  const now = Date.now();
  const entries = rateLimitMap.get(identifier) || [];
  const recent = entries.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(identifier, recent);
  return recent;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Honeypot spam protection (hidden field in form)
    if (req.body.website) {
      // Bots fill honeypot fields, real users don't see them
      return res.status(200).json({ success: true }); // Pretend success
    }

    // Rate limiting by email
    const emailEntries = checkRateLimit(`email:${email.toLowerCase()}`);
    if (emailEntries.length >= MAX_REQUESTS_PER_EMAIL) {
      // Return success to avoid enumeration
      return res.status(200).json({ success: true, message: 'Thank you for subscribing!' });
    }

    // Rate limiting by IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               'unknown';
    const ipEntries = checkRateLimit(`ip:${ip}`);
    if (ipEntries.length >= MAX_REQUESTS_PER_IP) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Record the request for rate limiting
    emailEntries.push(Date.now());
    rateLimitMap.set(`email:${email.toLowerCase()}`, emailEntries);
    ipEntries.push(Date.now());
    rateLimitMap.set(`ip:${ip}`, ipEntries);

    // Send confirmation/notification via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Scott Bertrand <hello@scottbertrand.com>';

    // Send notification to yourself about the new subscriber
    await resend.emails.send({
      from: fromEmail,
      to: process.env.SUBSCRIBE_NOTIFY_EMAIL || 'hello@scottbertrand.com',
      subject: `New subscriber: ${email}`,
      text: `New newsletter subscriber: ${email}\n\nTime: ${new Date().toISOString()}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you for subscribing!'
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}
