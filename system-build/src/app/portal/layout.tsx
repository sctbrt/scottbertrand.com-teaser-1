// Client Portal Layout (clients.bertrandbrands.com)
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PortalHeader } from './components/portal-header'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Require CLIENT role (or allow INTERNAL_ADMIN for testing)
  if (session.user.role !== 'CLIENT' && session.user.role !== 'INTERNAL_ADMIN') {
    redirect('/unauthorized')
  }

  // Get client record for the user
  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      contactName: true,
      companyName: true,
    },
  })

  // If no client record exists, show error
  if (!client && session.user.role === 'CLIENT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] dark:bg-[#1c1c1e] px-4">
        <div className="text-center">
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            Account Not Found
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your client account has not been set up yet. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#1c1c1e]">
      <PortalHeader
        user={session.user}
        clientName={client?.companyName || client?.contactName || session.user.name || 'Client'}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
