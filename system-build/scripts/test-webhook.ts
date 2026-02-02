/**
 * Local Webhook Test Script
 *
 * Tests the Stripe webhook handler logic without requiring Stripe CLI.
 * Run with: npx tsx scripts/test-webhook.ts
 *
 * Note: This tests the handler functions directly, bypassing signature verification.
 * For production testing, use Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Test data
const TEST_PROJECT_PUBLIC_ID = 'test-project-' + Date.now()
const TEST_EVENT_ID = 'evt_test_' + Date.now()
const TEST_EMAIL = 'webhook-test-' + Date.now() + '@example.com'

async function setup() {
  console.log('\n📦 Setting up test data...\n')

  // Create a test user first (required for client)
  const user = await prisma.users.create({
    data: {
      email: TEST_EMAIL,
      name: 'Webhook Test User',
      role: 'CLIENT',
    },
  })
  console.log(`✅ Created test user: ${user.id}`)

  // Create a test client (required for project)
  const client = await prisma.clients.create({
    data: {
      userId: user.id,
      contactName: 'Test Client',
      contactEmail: TEST_EMAIL,
      companyName: 'Test Company',
    },
  })
  console.log(`✅ Created test client: ${client.id}`)

  // Create a test project
  const project = await prisma.projects.create({
    data: {
      publicId: TEST_PROJECT_PUBLIC_ID,
      name: 'Test Focus Studio Project',
      clientId: client.id,
      paymentStatus: 'UNPAID',
      status: 'DRAFT',
    },
  })

  console.log(`✅ Created test project: ${project.id} (publicId: ${TEST_PROJECT_PUBLIC_ID})`)
  return { user, client, project }
}

async function testCheckoutCompleted(projectPublicId: string) {
  console.log('\n🧪 Testing checkout.session.completed handler...\n')

  // Import the processing function
  const { processStripeCheckoutCompleted } = await import('../src/lib/payment-status')

  const result = await processStripeCheckoutCompleted({
    eventId: TEST_EVENT_ID,
    eventType: 'checkout.session.completed',
    projectPublicId,
    checkoutSessionId: 'cs_test_' + Date.now(),
    paymentIntentId: 'pi_test_' + Date.now(),
    amountTotal: 75000, // $750.00
    customerEmail: 'customer@example.com',
    metadata: {
      project_public_id: projectPublicId,
      environment: 'development',
    },
  })

  if (result.success) {
    console.log(`✅ Payment processed successfully!`)
    console.log(`   Project ID: ${result.projectId}`)
    console.log(`   Skipped (already paid): ${result.skipped || false}`)

    // Verify the project was updated
    const project = await prisma.projects.findFirst({
      where: { publicId: projectPublicId },
    })
    console.log(`   Payment Status: ${project?.paymentStatus}`)
    console.log(`   Payment Provider: ${project?.paymentProvider}`)
    console.log(`   Paid At: ${project?.paidAt}`)
  } else {
    console.log(`❌ Payment processing failed: ${result.error}`)
  }

  return result
}

async function testIdempotency(projectPublicId: string) {
  console.log('\n🧪 Testing idempotency (duplicate event)...\n')

  const { processStripeCheckoutCompleted } = await import('../src/lib/payment-status')

  // Try to process the same event again
  const result = await processStripeCheckoutCompleted({
    eventId: TEST_EVENT_ID, // Same event ID
    eventType: 'checkout.session.completed',
    projectPublicId,
    checkoutSessionId: 'cs_test_duplicate',
    amountTotal: 75000,
  })

  if (result.success && result.skipped) {
    console.log(`✅ Idempotency check passed - duplicate event was skipped`)
  } else {
    console.log(`❌ Idempotency check failed`)
  }

  return result
}

async function testRefund(projectId: string) {
  console.log('\n🧪 Testing charge.refunded handler...\n')

  const { processStripeRefund } = await import('../src/lib/payment-status')

  const refundEventId = 'evt_refund_' + Date.now()

  const result = await processStripeRefund({
    eventId: refundEventId,
    eventType: 'charge.refunded',
    chargeId: 'ch_test_' + Date.now(),
    paymentIntentId: 'pi_test_' + Date.now(),
    refundAmount: 75000, // Full refund
    currency: 'CAD',
    projectId,
  })

  if (result.success) {
    console.log(`✅ Refund processed successfully!`)

    // Verify the project was updated
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    })
    console.log(`   Payment Status: ${project?.paymentStatus}`)
  } else {
    console.log(`❌ Refund processing failed: ${result.error}`)
  }

  return result
}

async function testPaymentEvent() {
  console.log('\n🧪 Testing payment_events logging...\n')

  const events = await prisma.payment_events.findMany({
    where: {
      eventId: {
        startsWith: 'evt_test_',
      },
    },
    orderBy: {
      processedAt: 'desc',
    },
    take: 5,
  })

  console.log(`Found ${events.length} test payment events:`)
  events.forEach((event, i) => {
    console.log(`   ${i + 1}. ${event.eventType} - ${event.status} (${event.eventId})`)
  })
}

async function cleanup(userId: string, clientId: string, projectId: string) {
  console.log('\n🧹 Cleaning up test data...\n')

  // Delete test payment events
  const deletedEvents = await prisma.payment_events.deleteMany({
    where: {
      OR: [
        { eventId: { startsWith: 'evt_test_' } },
        { eventId: { startsWith: 'evt_refund_' } },
      ],
    },
  })
  console.log(`   Deleted ${deletedEvents.count} payment events`)

  // Delete test project
  await prisma.projects.delete({
    where: { id: projectId },
  })
  console.log(`   Deleted test project`)

  // Delete test client
  await prisma.clients.delete({
    where: { id: clientId },
  })
  console.log(`   Deleted test client`)

  // Delete test user
  await prisma.users.delete({
    where: { id: userId },
  })
  console.log(`   Deleted test user`)
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Stripe Webhook Handler Test Suite')
  console.log('═══════════════════════════════════════════════════')

  try {
    // Setup
    const { user, client, project } = await setup()

    // Test checkout completed
    await testCheckoutCompleted(project.publicId)

    // Test idempotency
    await testIdempotency(project.publicId)

    // Test refund
    await testRefund(project.id)

    // Check payment events
    await testPaymentEvent()

    // Cleanup
    await cleanup(user.id, client.id, project.id)

    console.log('\n═══════════════════════════════════════════════════')
    console.log('  ✅ All tests completed!')
    console.log('═══════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
