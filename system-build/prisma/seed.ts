// Seed script for initial admin user and service templates
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// Service templates - 9-service structure matching bertrandbrands.com
// Organized into 4 tiers: Start Here, Clarity Sessions, Deep Diagnostics, Builds
const serviceTemplates = [
  // === Section 1: Start Here (Introductory) ===
  {
    name: 'Founders Direction Check',
    slug: 'founders-direction-check',
    description: 'A fast orientation session for early-stage founders. Get clarity on what to focus on next—and what not to spend money on yet.',
    price: 95,
    estimatedDays: 1,
    sortOrder: 1,
    deliverables: ['20-minute live session', 'Priority focus areas', 'What to avoid spending on'],
    scope: { tier: 'start-here', duration: 20, unit: 'minutes', format: 'live' },
  },
  {
    name: 'Brand & Website Starter Map',
    slug: 'brand-website-starter-map',
    description: 'A lightweight roadmap with brand direction, homepage structure, and prioritized next steps. For founders not ready for a full audit.',
    price: 145,
    estimatedDays: 4,
    sortOrder: 2,
    deliverables: ['Starter Map PDF', 'Brand direction notes', 'Homepage structure outline', 'Prioritized next steps'],
    scope: { tier: 'start-here', format: 'pdf' },
  },
  // === Section 2: Clarity Sessions (Live Reviews) ===
  {
    name: 'Website Snapshot Review',
    slug: 'website-snapshot-review',
    description: 'Full site review with prioritized recommendations. Understand what\'s working and what needs attention.',
    price: 195,
    estimatedDays: 1,
    sortOrder: 3,
    deliverables: ['30-minute live review', 'Prioritized recommendations', 'Action items list'],
    scope: { tier: 'clarity-sessions', duration: 30, unit: 'minutes', format: 'live' },
  },
  {
    name: 'Brand Clarity Session',
    slug: 'brand-clarity-session',
    description: 'Brand positioning and identity assessment. A clear view of where you stand and where to go.',
    price: 245,
    estimatedDays: 1,
    sortOrder: 4,
    deliverables: ['45-minute live session', 'Brand positioning insights', 'Direction recommendations'],
    scope: { tier: 'clarity-sessions', duration: 45, unit: 'minutes', format: 'live' },
  },
  // === Section 3: Deep Diagnostics (PDF Deliverables) ===
  {
    name: 'Comprehensive Website Audit',
    slug: 'comprehensive-website-audit',
    description: 'In-depth analysis with documented findings and actionable recommendations.',
    price: 450,
    estimatedDays: 7,
    sortOrder: 5,
    deliverables: ['Comprehensive Audit PDF (12-15 pages)', 'Documented findings', 'Actionable recommendations', 'Priority matrix'],
    scope: { tier: 'deep-diagnostics', format: 'pdf' },
  },
  {
    name: 'Strategic Brand Audit',
    slug: 'strategic-brand-audit',
    description: 'Comprehensive brand assessment with strategic direction and positioning insights.',
    price: 550,
    estimatedDays: 7,
    sortOrder: 6,
    deliverables: ['Strategic Brand Audit PDF', 'Positioning analysis', 'Competitive context', 'Strategic direction'],
    scope: { tier: 'deep-diagnostics', format: 'pdf' },
  },
  // === Section 4: Builds (Full Projects) ===
  {
    name: 'Brand Reset',
    slug: 'brand-reset',
    description: 'Complete brand system and guidelines. Visual identity that works across every touchpoint.',
    price: 3000,
    estimatedDays: 21,
    sortOrder: 7,
    deliverables: ['Brand Reset Document (PDF)', 'Logo files (SVG, PNG, EPS)', 'Brand guidelines', 'Complete asset package'],
    scope: { tier: 'builds' },
  },
  {
    name: 'Website Foundation',
    slug: 'website-foundation',
    description: 'Conversion-focused website build. Fast, accessible, built to perform.',
    price: 4250,
    estimatedDays: 28,
    sortOrder: 8,
    deliverables: ['Website Foundation Blueprint (PDF)', 'Live website', 'Source code', '30-day support'],
    scope: { tier: 'builds', pages: 7 },
  },
  {
    name: 'Full Brand + Website Reset',
    slug: 'full-brand-website-reset',
    description: 'Complete brand and web system. The full transformation, end to end.',
    price: 6900,
    estimatedDays: 42,
    sortOrder: 9,
    deliverables: ['Brand Reset Document', 'Website Foundation Blueprint', 'Live website', 'Complete asset package', '30-day support'],
    scope: { tier: 'builds' },
  },
]

async function main() {
  // Create admin users
  const adminEmails = [
    'hello@bertrandbrands.com',
    'bertrandbrands@outlook.com',
    'sctbrt01@gmail.com',
  ]

  for (const adminEmail of adminEmails) {
    const existingUser = await prisma.users.findUnique({
      where: { email: adminEmail },
    })

    if (existingUser) {
      // Update to admin if not already
      if (existingUser.role !== 'INTERNAL_ADMIN') {
        await prisma.users.update({
          where: { email: adminEmail },
          data: {
            role: 'INTERNAL_ADMIN',
            name: 'Scott Bertrand',
          },
        })
        console.log(`Updated ${adminEmail} to INTERNAL_ADMIN role`)
      } else {
        console.log(`Admin user ${adminEmail} already exists`)
      }
    } else {
      await prisma.users.create({
        data: {
          email: adminEmail,
          name: 'Scott Bertrand',
          role: 'INTERNAL_ADMIN',
          emailVerified: new Date(),
        },
      })
      console.log(`Created admin user: ${adminEmail}`)
    }
  }

  // Upsert service templates
  console.log('Seeding service templates...')

  for (const template of serviceTemplates) {
    await prisma.service_templates.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        price: template.price,
        estimatedDays: template.estimatedDays,
        sortOrder: template.sortOrder,
        deliverables: template.deliverables,
        scope: template.scope ?? Prisma.JsonNull,
        isActive: true,
      },
      create: {
        name: template.name,
        slug: template.slug,
        description: template.description,
        price: template.price,
        estimatedDays: template.estimatedDays,
        sortOrder: template.sortOrder,
        deliverables: template.deliverables,
        scope: template.scope ?? Prisma.JsonNull,
        isActive: true,
      },
    })
    console.log(`  ✓ ${template.name}`)
  }

  // Deactivate old service templates that no longer exist
  const activeServiceSlugs = serviceTemplates.map(t => t.slug)
  await prisma.service_templates.updateMany({
    where: {
      slug: { notIn: activeServiceSlugs },
      isActive: true,
    },
    data: { isActive: false },
  })

  console.log('Service templates seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
