'use client'

// Client Portal Header
import { signOut } from 'next-auth/react'
import type { Role } from '@prisma/client'

interface PortalHeaderProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: Role
  }
  clientName: string
}

export function PortalHeader({ user, clientName }: PortalHeaderProps) {
  return (
    <header className="bg-white dark:bg-[#2c2c2e] border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Scott Bertrand
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Client Portal
            </span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {clientName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
