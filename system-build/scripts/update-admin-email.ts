import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.update({
    where: { email: 'scott@scottbertrand.com' },
    data: { email: 'bertrandbrands@outlook.com' }
  })
  console.log('✓ Updated admin email to:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
