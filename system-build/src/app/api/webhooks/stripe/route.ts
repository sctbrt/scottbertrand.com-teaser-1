/**
 * Stripe Webhook Endpoint
 *
 * Handles Stripe webhook events for payment processing.
 * See docs/payments-v1.md for event handling rules.
 *
 * Events handled:
 * - checkout.session.completed: Mark project as paid
 * - checkout.session.expired: Log only (no state change)
 * - payment_intent.payment_failed: Log only (no state change)
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyStripeWebhook, STRIPE_METADATA_KEYS } from '@/lib/stripe'
import { processStripeCheckoutCompleted, isEventProcessed } from '@/lib/payment-status'
import { prisma } from '@/lib/prisma'

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs'

// Rate limit: 100 requests per minute (Stripe may send bursts)
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100

// Simple in-memory rate limiting (per-IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!checkRateLimit(ip)) {
    console.error('[Stripe Webhook] Rate limit exceeded:', ip)
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // Get webhook secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Get signature header
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Get raw body for signature verification
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch (error) {
    console.error('[Stripe Webhook] Failed to read body:', error)
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Verify webhook signature
  let event: Stripe.Event
  try {
    event = verifyStripeWebhook(rawBody, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Stripe Webhook] Signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Log received event
  console.log(`[Stripe Webhook] Received: ${event.type} (${event.id})`)

  // Idempotency check (fast path)
  if (await isEventProcessed(event.id)) {
    console.log(`[Stripe Webhook] Already processed: ${event.id}`)
    return NextResponse.json({ received: true, status: 'already_processed' })
  }

  // Handle events
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutSessionCompleted(event)

      case 'checkout.session.expired':
        return await handleCheckoutSessionExpired(event)

      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event)

      default:
        // Log unhandled events but return 200 (Stripe expects 200 for all events)
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
        return NextResponse.json({ received: true, status: 'unhandled' })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Stripe Webhook] Handler error for ${event.type}:`, message)
    // Return 500 to trigger Stripe retry
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * Handle checkout.session.completed
 * This is the canonical "paid" trigger for Payment Links.
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session

  // Extract project ID from metadata
  const projectPublicId = session.metadata?.[STRIPE_METADATA_KEYS.PROJECT_PUBLIC_ID]
  const environment = session.metadata?.[STRIPE_METADATA_KEYS.ENVIRONMENT]

  // Validate environment (don't process dev events in prod, etc.)
  const currentEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development'
  if (environment && environment !== currentEnv) {
    console.log(
      `[Stripe Webhook] Skipping event for different environment: ${environment} (current: ${currentEnv})`
    )
    return NextResponse.json({ received: true, status: 'wrong_environment' })
  }

  if (!projectPublicId) {
    console.error('[Stripe Webhook] Missing project_public_id in metadata')
    // Log unmatched payment for manual reconciliation
    await prisma.payment_events.create({
      data: {
        provider: 'STRIPE',
        eventId: event.id,
        eventType: event.type,
        status: 'UNMATCHED',
        errorMsg: 'Missing project_public_id in session metadata',
        metadata: {
          sessionId: session.id,
          customerEmail: session.customer_email,
          amountTotal: session.amount_total,
        },
      },
    })
    return NextResponse.json({ received: true, status: 'unmatched' })
  }

  // Process the payment
  const result = await processStripeCheckoutCompleted({
    eventId: event.id,
    eventType: event.type,
    projectPublicId,
    checkoutSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
    amountTotal: session.amount_total ?? undefined,
    customerEmail: session.customer_email ?? undefined,
    metadata: session.metadata ?? undefined,
  })

  if (!result.success) {
    console.error(`[Stripe Webhook] Failed to process payment: ${result.error}`)
    if (result.unmatched) {
      // Unmatched but logged - return 200 to prevent retries
      return NextResponse.json({ received: true, status: 'unmatched' })
    }
    // Other errors - return 500 to trigger retry
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  if (result.skipped) {
    console.log(`[Stripe Webhook] Payment already recorded for project: ${result.projectId}`)
  } else {
    console.log(`[Stripe Webhook] Payment successful for project: ${result.projectId}`)
  }

  return NextResponse.json({ received: true, status: 'success', projectId: result.projectId })
}

/**
 * Handle checkout.session.expired
 * Log only - no state change needed.
 */
async function handleCheckoutSessionExpired(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const projectPublicId = session.metadata?.[STRIPE_METADATA_KEYS.PROJECT_PUBLIC_ID]

  console.log(`[Stripe Webhook] Checkout expired: ${session.id} (project: ${projectPublicId || 'unknown'})`)

  // Log for visibility but don't change any state
  await prisma.payment_events.create({
    data: {
      provider: 'STRIPE',
      eventId: event.id,
      eventType: event.type,
      status: 'SUCCESS', // Successfully logged, not an error
      metadata: {
        sessionId: session.id,
        projectPublicId,
        reason: 'Session expired before completion',
      },
    },
  })

  return NextResponse.json({ received: true, status: 'logged' })
}

/**
 * Handle payment_intent.payment_failed
 * Log only - client will see error on Stripe's hosted page.
 */
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const lastError = paymentIntent.last_payment_error

  console.log(
    `[Stripe Webhook] Payment failed: ${paymentIntent.id} - ${lastError?.message || 'Unknown error'}`
  )

  // Log for visibility
  await prisma.payment_events.create({
    data: {
      provider: 'STRIPE',
      eventId: event.id,
      eventType: event.type,
      status: 'FAILED',
      errorMsg: lastError?.message || 'Payment failed',
      metadata: {
        paymentIntentId: paymentIntent.id,
        errorCode: lastError?.code,
        errorType: lastError?.type,
      },
    },
  })

  return NextResponse.json({ received: true, status: 'logged' })
}
