// Dashboard Layout - V3 Glass Aesthetic
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardShell } from './components/dashboard-shell'

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
    <>
      {/* Force dark theme immediately — prevents flash of light theme before React hydrates */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-theme','dark');`,
        }}
      />
      <DashboardShell user={session.user} counts={navCounts}>
        {children}
      </DashboardShell>
    </>
  )
}
