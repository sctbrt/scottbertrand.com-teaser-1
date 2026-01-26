'use client'

// Client Portal Header
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const navItems = [
  { name: 'Projects', href: '/portal' },
  { name: 'Invoices', href: '/portal/invoices' },
]

export function PortalHeader({ user, clientName }: PortalHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="bg-white dark:bg-[#2c2c2e] border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-6">
            <Link href="/portal" className="flex items-center gap-3">
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Bertrand Brands
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Client Portal
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.href === '/portal'
                  ? pathname === '/portal'
                  : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
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
