// Intake Webhook - Formspree Submissions
// Endpoint: POST /api/intake/formspree

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Rate limit config
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // Max 10 requests per minute per IP

// Spam detection patterns
const SPAM_PATTERNS = [
  /\b(viagra|cialis|casino|poker|lottery|winner)\b/i,
  /\b(click here|act now|limited time|free money)\b/i,
  /<script|javascript:|data:/i,
  /\[url=|<a href=/i,
]

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
               headersList.get('x-real-ip') ||
               'unknown'

    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Verify Formspree webhook (check for required fields)
    // Formspree sends data in a specific format
    const formData = body._formspree_submission || body

    // Extract common fields (adjust based on your form structure)
    const email = formData.email || formData.Email || formData._replyto || ''
    const name = formData.name || formData.Name || formData['full-name'] || ''
    const companyName = formData.company || formData.Company || formData['company-name'] || ''
    const website = formData.website || formData.Website || formData.url || ''
    const phone = formData.phone || formData.Phone || formData.tel || ''
    const service = formData.service || formData.Service || formData['service-type'] || ''
    const message = formData.message || formData.Message || formData.details || ''

    // Validate required email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required.' },
        { status: 400 }
      )
    }

    // Check for spam
    const isSpam = checkForSpam(formData)

    // Create lead record
    const lead = await prisma.lead.create({
      data: {
        email,
        name: name || null,
        companyName: companyName || null,
        website: website || null,
        phone: phone || null,
        service: service || null,
        message: message || null,
        source: 'formspree',
        status: 'NEW',
        isSpam,
        formData: formData, // Store raw form data
      },
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'LEAD_CREATED',
        entityType: 'Lead',
        entityId: lead.id,
        details: {
          source: 'formspree',
          email: lead.email,
          isSpam,
          ip,
        },
        ipAddress: ip,
      },
    })

    // Send notification (if configured)
    if (!isSpam && process.env.PUSHOVER_USER_KEY && process.env.PUSHOVER_API_TOKEN) {
      await sendNotification({
        lead,
        ip,
      })
    }

    return NextResponse.json({
      success: true,
      id: lead.id,
      isSpam,
    })
  } catch (error) {
    console.error('Intake webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Rate limiting helper
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Spam detection
function checkForSpam(data: Record<string, unknown>): boolean {
  const textContent = Object.values(data)
    .filter((v): v is string => typeof v === 'string')
    .join(' ')

  return SPAM_PATTERNS.some((pattern) => pattern.test(textContent))
}

// Send notification via Pushover
async function sendNotification({
  lead,
  ip,
}: {
  lead: { id: string; email: string; name: string | null; service: string | null }
  ip: string
}) {
  try {
    // Get location from IP
    let location = ''
    if (ip && ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionCode,country`)
        if (geoRes.ok) {
          const geo = await geoRes.json()
          if (geo.city) {
            location = `${geo.city}${geo.regionCode ? `, ${geo.regionCode}` : ''}${geo.country ? `, ${geo.country}` : ''}`
          }
        }
      } catch {
        // Silent fail
      }
    }

    let message = `New lead: ${lead.name || lead.email}`
    if (lead.service) message += `\nService: ${lead.service}`
    if (location) message += `\n📌 ${location}`

    await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: process.env.PUSHOVER_API_TOKEN,
        user: process.env.PUSHOVER_USER_KEY,
        message,
        title: 'New Lead Submitted',
        url: `https://dashboard.scottbertrand.com/leads/${lead.id}`,
        url_title: 'View Lead',
        priority: 0,
      }),
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}
