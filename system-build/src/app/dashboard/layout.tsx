// Dashboard Layout - V3 Glass Aesthetic
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardNav } from './components/dashboard-nav'
import { DashboardHeader } from './components/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Require INTERNAL_ADMIN role
  if (session.user.role !== 'INTERNAL_ADMIN') {
    redirect('/unauthorized')
  }

  // Fetch counts for nav badges
  const [newLeadsCount, unpaidInvoicesCount] = await Promise.all([
    prisma.leads.count({ where: { status: 'NEW' } }),
    prisma.invoices.count({ where: { status: { in: ['SENT', 'VIEWED', 'OVERDUE'] } } }),
  ])

  const navCounts = {
    leads: newLeadsCount,
    invoices: unpaidInvoicesCount,
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader user={session.user} />

      <div className="flex">
        <DashboardNav counts={navCounts} />

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
