'use client'

// Dashboard Shell - manages mobile nav state between header and sidebar
import { useState } from 'react'
import { DashboardHeader } from './dashboard-header'
import { DashboardNav } from './dashboard-nav'
import type { Role } from '@prisma/client'

interface DashboardShellProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: Role
  }
  counts?: {
    leads?: number
    invoices?: number
    intakes?: number
  }
  children: React.ReactNode
}

export function DashboardShell({ user, counts, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <DashboardHeader
        user={user}
        onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
      />

      <div className="flex">
        <DashboardNav
          counts={counts}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
