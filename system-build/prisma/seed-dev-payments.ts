/**
 * Development Seed Script - Payment Testing Data
 *
 * Creates test clients, projects, and invoices for testing the payment flow.
 * Run with: npx tsx prisma/seed-dev-payments.ts
 *
 * This creates:
 * - 1 test client with user account
 * - 3 projects with different payment states (unpaid, paid, with payment link)
 * - Corresponding invoices
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding payment test data...\n')

  // Check if we're in development
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ This seed script should not run in production!')
    process.exit(1)
  }

  // Get a service template for linking
  const serviceTemplate = await prisma.service_templates.findFirst({
    where: { isActive: true },
  })

  if (!serviceTemplate) {
    console.error('❌ No service templates found. Run the main seed first.')
    process.exit(1)
  }

  // Create or update test client user
  const testEmail = 'test-client@example.com'
  let testUser = await prisma.users.findUnique({
    where: { email: testEmail },
  })

  if (!testUser) {
    testUser = await prisma.users.create({
      data: {
        email: testEmail,
        name: 'Test Client',
        role: 'CLIENT',
        emailVerified: new Date(),
      },
    })
    console.log('✓ Created test user:', testEmail)
  } else {
    console.log('✓ Test user exists:', testEmail)
  }

  // Create or update test client
  let testClient = await prisma.clients.findUnique({
    where: { userId: testUser.id },
  })

  if (!testClient) {
    testClient = await prisma.clients.create({
      data: {
        userId: testUser.id,
        companyName: 'Test Company Inc.',
        contactName: 'Test Client',
        contactEmail: testEmail,
        phone: '+1 555-123-4567',
        website: 'https://example.com',
        notes: 'Test client for payment flow testing',
      },
    })
    console.log('✓ Created test client:', testClient.companyName)
  } else {
    console.log('✓ Test client exists:', testClient.companyName)
  }

  // Create test projects with different payment states
  const testProjects = [
    {
      name: 'Payment Test - Unpaid (No Link)',
      description: 'Project without payment link attached. Shows "Contact us" message.',
      paymentStatus: 'UNPAID' as const,
      paymentRequired: true,
      portalStage: 'IN_REVIEW' as const,
      stripePaymentLinkUrl: null,
    },
    {
      name: 'Payment Test - Unpaid (With Link)',
      description: 'Project with payment link. Shows Pay Now button.',
      paymentStatus: 'UNPAID' as const,
      paymentRequired: true,
      portalStage: 'IN_REVIEW' as const,
      // Use Stripe test Payment Link format (this is a placeholder - replace with real test link)
      stripePaymentLinkUrl: 'https://buy.stripe.com/test_XXXXXXXX',
      stripePaymentLinkId: 'plink_test_XXXXXXXX',
    },
    {
      name: 'Payment Test - Paid',
      description: 'Project marked as paid via Stripe.',
      paymentStatus: 'PAID' as const,
      paymentProvider: 'STRIPE' as const,
      paymentRequired: true,
      portalStage: 'RELEASED' as const,
      paidAt: new Date(),
      lastPaymentEventId: 'evt_test_seed_001',
      stripeCheckoutSessionId: 'cs_test_XXXXXXXX',
    },
  ]

  console.log('\n📦 Creating test projects...\n')

  for (const projectData of testProjects) {
    const { name, ...data } = projectData

    // Check if project exists
    const existing = await prisma.projects.findFirst({
      where: {
        name,
        clientId: testClient.id,
      },
    })

    if (existing) {
      console.log(`  ↳ Project exists: ${name}`)
      continue
    }

    const project = await prisma.projects.create({
      data: {
        name,
        clientId: testClient.id,
        serviceTemplateId: serviceTemplate.id,
        status: 'IN_PROGRESS',
        scopeIncluded: ['Website review', 'Recommendations report', 'Priority matrix'],
        scopeExcluded: 'Implementation not included',
        revisionPolicy: '1 round of clarifications',
        nextMilestoneLabel: 'Final delivery',
        nextMilestoneDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        startDate: new Date(),
        targetEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        ...data,
      },
    })

    console.log(`  ✓ Created: ${project.name}`)
    console.log(`    Public ID: ${project.publicId}`)
    console.log(`    Payment Status: ${project.paymentStatus}`)

    // Create corresponding invoice
    const invoiceNumber = `INV-TEST-${Date.now().toString().slice(-6)}`
    const invoice = await prisma.invoices.create({
      data: {
        invoiceNumber,
        clientId: testClient.id,
        projectId: project.id,
        status: project.paymentStatus === 'PAID' ? 'PAID' : 'SENT',
        subtotal: serviceTemplate.price,
        tax: 0,
        total: serviceTemplate.price,
        currency: 'CAD',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        paidAt: project.paymentStatus === 'PAID' ? project.paidAt : null,
        lineItems: [
          {
            description: serviceTemplate.name,
            details: serviceTemplate.description,
            quantity: 1,
            rate: Number(serviceTemplate.price),
          },
        ],
        notes: 'Test invoice for payment flow testing.',
      },
    })

    console.log(`    Invoice: ${invoice.invoiceNumber} (${invoice.status})`)

    // Create a test deliverable
    await prisma.deliverables.create({
      data: {
        projectId: project.id,
        title: `${serviceTemplate.name} - Draft`,
        version: 1,
        state: project.paymentStatus === 'PAID' ? 'FINAL' : 'REVIEW',
        filePreviewUrl: 'https://example.com/preview-watermarked.pdf',
        fileDownloadUrl: 'https://example.com/download-clean.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024 * 100, // 100KB
      },
    })

    console.log(`    Deliverable created`)
  }

  // Create a sample payment event for the paid project
  const paidProject = await prisma.projects.findFirst({
    where: {
      name: 'Payment Test - Paid',
      clientId: testClient.id,
    },
  })

  if (paidProject) {
    const existingEvent = await prisma.payment_events.findUnique({
      where: { eventId: 'evt_test_seed_001' },
    })

    if (!existingEvent) {
      await prisma.payment_events.create({
        data: {
          provider: 'STRIPE',
          eventId: 'evt_test_seed_001',
          eventType: 'checkout.session.completed',
          projectId: paidProject.id,
          status: 'SUCCESS',
          metadata: {
            source: 'seed_script',
            sessionId: 'cs_test_XXXXXXXX',
            amountTotal: Number(serviceTemplate.price) * 100,
            customerEmail: testEmail,
          },
        },
      })
      console.log('\n  ✓ Created sample payment event')
    }
  }

  console.log('\n✅ Payment test data seeded successfully!\n')
  console.log('To test the portal, sign in as:', testEmail)
  console.log('\nProjects created:')
  console.log('  1. Unpaid (no link) - Shows contact message')
  console.log('  2. Unpaid (with link) - Shows Pay Now button')
  console.log('  3. Paid - Shows paid confirmation')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
