// Dashboard Layout - Internal Operations (dashboard.scottbertrand.com)
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
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

  return (
    <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#1c1c1e]">
      <DashboardHeader user={session.user} />

      <div className="flex">
        <DashboardNav />

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
