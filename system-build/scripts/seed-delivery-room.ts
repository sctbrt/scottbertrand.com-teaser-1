// Seed script for Delivery Room testing
// Run with: npx tsx scripts/seed-delivery-room.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Delivery Room test data...\n')

  // 1. Create or get test admin user
  const adminEmail = 'scott@bertrandbrands.com'
  let admin = await prisma.users.findUnique({
    where: { email: adminEmail },
  })

  if (!admin) {
    admin = await prisma.users.create({
      data: {
        email: adminEmail,
        name: 'Scott Bertrand',
        role: 'INTERNAL_ADMIN',
        emailVerified: new Date(),
      },
    })
    console.log('✓ Created admin user:', admin.email)
  } else {
    console.log('✓ Admin user exists:', admin.email)
  }

  // 2. Create test client user
  const clientEmail = 'testclient@example.com'
  let clientUser = await prisma.users.findUnique({
    where: { email: clientEmail },
  })

  if (!clientUser) {
    clientUser = await prisma.users.create({
      data: {
        email: clientEmail,
        name: 'Test Client',
        role: 'CLIENT',
        emailVerified: new Date(),
      },
    })
    console.log('✓ Created client user:', clientUser.email)
  } else {
    console.log('✓ Client user exists:', clientUser.email)
  }

  // 3. Create client record linked to user
  let client = await prisma.clients.findUnique({
    where: { userId: clientUser.id },
  })

  if (!client) {
    client = await prisma.clients.create({
      data: {
        userId: clientUser.id,
        companyName: 'Acme Corp',
        contactName: 'Test Client',
        contactEmail: clientEmail,
      },
    })
    console.log('✓ Created client record:', client.companyName)
  } else {
    console.log('✓ Client record exists:', client.companyName)
  }

  // 4. Create service template
  let service = await prisma.service_templates.findUnique({
    where: { slug: 'brand-identity' },
  })

  if (!service) {
    service = await prisma.service_templates.create({
      data: {
        name: 'Brand Identity Package',
        slug: 'brand-identity',
        description: 'Complete brand identity including logo, colors, and guidelines',
        price: 2500,
        currency: 'CAD',
        estimatedDays: 14,
        scope: ['Logo design', 'Color palette', 'Typography', 'Brand guidelines PDF'],
        deliverables: ['Primary logo', 'Logo variations', 'Brand guidelines document'],
      },
    })
    console.log('✓ Created service template:', service.name)
  } else {
    console.log('✓ Service template exists:', service.name)
  }

  // 5. Create test projects in different states

  // Project 1: Unpaid (downloads locked)
  const project1 = await prisma.projects.upsert({
    where: { publicId: 'test-unpaid-001' },
    update: {},
    create: {
      publicId: 'test-unpaid-001',
      name: 'Acme Corp Brand Refresh',
      description: 'Complete brand identity refresh for Acme Corp',
      status: 'IN_PROGRESS',
      portalStage: 'IN_REVIEW',
      paymentStatus: 'UNPAID',
      clientId: client.id,
      serviceTemplateId: service.id,
      scopeIncluded: ['Primary logo', 'Logo variations', 'Color palette', 'Typography system'],
      scopeExcluded: 'Marketing collateral, website design, social media templates',
      revisionPolicy: '2 rounds of revisions included',
      nextMilestoneLabel: 'Final logo delivery',
      nextMilestoneDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      lastUpdateAt: new Date(),
    },
  })
  console.log('✓ Project 1 (unpaid):', project1.publicId)

  // Project 2: Paid, in review (can approve)
  const project2 = await prisma.projects.upsert({
    where: { publicId: 'test-paid-review-002' },
    update: {},
    create: {
      publicId: 'test-paid-review-002',
      name: 'Acme Corp Website Mockups',
      description: 'Website design mockups for approval',
      status: 'IN_PROGRESS',
      portalStage: 'IN_REVIEW',
      paymentStatus: 'PAID',
      clientId: client.id,
      serviceTemplateId: service.id,
      scopeIncluded: ['Homepage design', 'About page', 'Contact page', 'Mobile responsive views'],
      scopeExcluded: 'Development, CMS integration',
      revisionPolicy: '3 rounds of revisions included',
      nextMilestoneLabel: 'Client approval',
      nextMilestoneDueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      lastUpdateAt: new Date(),
    },
  })
  console.log('✓ Project 2 (paid, in review):', project2.publicId)

  // Project 3: Released (clean downloads available)
  const project3 = await prisma.projects.upsert({
    where: { publicId: 'test-released-003' },
    update: {},
    create: {
      publicId: 'test-released-003',
      name: 'Acme Corp Business Cards',
      description: 'Business card design - completed and released',
      status: 'COMPLETED',
      portalStage: 'RELEASED',
      paymentStatus: 'PAID',
      clientId: client.id,
      scopeIncluded: ['Front design', 'Back design', 'Print-ready files'],
      scopeExcluded: 'Printing services',
      lastUpdateAt: new Date(),
    },
  })
  console.log('✓ Project 3 (released):', project3.publicId)

  // 6. Create deliverables for each project
  // Note: In production, these would have real file URLs from Vercel Blob
  // For testing, we'll use placeholder URLs

  // Deliverable for unpaid project
  await prisma.deliverables.upsert({
    where: {
      projectId_version: {
        projectId: project1.id,
        version: 1,
      },
    },
    update: {},
    create: {
      projectId: project1.id,
      title: 'Acme Logo Concepts',
      version: 1,
      state: 'REVIEW',
      mimeType: 'application/pdf',
      fileSize: 2500000,
      // These would be real Vercel Blob URLs in production
      filePreviewUrl: 'https://placehold.co/800x600/333/fff?text=DRAFT+PREVIEW',
      fileDownloadUrl: 'https://placehold.co/800x600/333/fff?text=CLEAN+FILE',
    },
  })
  console.log('  ✓ Deliverable for project 1')

  // Deliverable for paid project in review
  await prisma.deliverables.upsert({
    where: {
      projectId_version: {
        projectId: project2.id,
        version: 1,
      },
    },
    update: {},
    create: {
      projectId: project2.id,
      title: 'Website Mockups v1',
      version: 1,
      state: 'REVIEW',
      mimeType: 'application/pdf',
      fileSize: 5000000,
      filePreviewUrl: 'https://placehold.co/800x600/1a1a2e/eee?text=WEBSITE+MOCKUPS+DRAFT',
      fileDownloadUrl: 'https://placehold.co/800x600/1a1a2e/eee?text=WEBSITE+MOCKUPS+FINAL',
    },
  })
  console.log('  ✓ Deliverable for project 2')

  // Deliverable for released project (final state)
  const deliverable3 = await prisma.deliverables.upsert({
    where: {
      projectId_version: {
        projectId: project3.id,
        version: 1,
      },
    },
    update: {},
    create: {
      projectId: project3.id,
      title: 'Business Card Final Design',
      version: 1,
      state: 'FINAL',
      mimeType: 'application/pdf',
      fileSize: 1500000,
      filePreviewUrl: 'https://placehold.co/800x600/2d3436/dfe6e9?text=BUSINESS+CARDS',
      fileDownloadUrl: 'https://placehold.co/800x600/2d3436/dfe6e9?text=BUSINESS+CARDS+FINAL',
    },
  })
  console.log('  ✓ Deliverable for project 3')

  // Add sign-off for released project
  await prisma.signoffs.upsert({
    where: {
      id: 'signoff-test-003',
    },
    update: {},
    create: {
      id: 'signoff-test-003',
      projectId: project3.id,
      deliverableId: deliverable3.id,
      signedByName: 'Test Client',
      signedByEmail: clientEmail,
      action: 'APPROVED_AND_RELEASED',
      signedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    },
  })
  console.log('  ✓ Sign-off for project 3')

  // 7. Create a paid invoice for project 2 (alternative payment check)
  await prisma.invoices.upsert({
    where: { invoiceNumber: 'INV-TEST-001' },
    update: {},
    create: {
      invoiceNumber: 'INV-TEST-001',
      clientId: client.id,
      projectId: project2.id,
      status: 'PAID',
      subtotal: 2500,
      tax: 325,
      total: 2825,
      currency: 'CAD',
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Paid 7 days ago
      lineItems: [
        { description: 'Website Design - Homepage', quantity: 1, unitPrice: 1500 },
        { description: 'Website Design - Inner Pages', quantity: 2, unitPrice: 500 },
      ],
    },
  })
  console.log('✓ Created paid invoice for project 2')

  console.log('\n✅ Seed complete!\n')
  console.log('Test URLs:')
  console.log(`  Unpaid project:    /p/test-unpaid-001`)
  console.log(`  Paid (in review):  /p/test-paid-review-002`)
  console.log(`  Released:          /p/test-released-003`)
  console.log('\nLogin as:')
  console.log(`  Admin:  ${adminEmail}`)
  console.log(`  Client: ${clientEmail}`)
}

main()
  .catch((e) => {
    console.error('Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
