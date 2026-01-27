// Dashboard - Clients Management Page
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClientsTable } from './clients-table'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; archived?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const showArchived = params.archived === 'true'
  const perPage = 20

  // Build search filter
  const searchFilter = search
    ? {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' as const } },
          { contactName: { contains: search, mode: 'insensitive' as const } },
          { contactEmail: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  // Combine with archive filter
  const whereFilter = {
    ...searchFilter,
    isArchived: showArchived,
  }

  // Fetch clients with pagination
  const [clients, totalCount, archivedCount] = await Promise.all([
    prisma.clients.findMany({
      where: whereFilter,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        companyName: true,
        contactName: true,
        contactEmail: true,
        phone: true,
        isArchived: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            invoices: true,
          },
        },
        projects: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
          select: { status: true, name: true },
        },
      },
    }),
    prisma.clients.count({ where: whereFilter }),
    prisma.clients.count({ where: { isArchived: true } }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  // Build URL helper
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    if (overrides.page !== undefined) params.set('page', overrides.page)
    else if (page > 1) params.set('page', String(page))
    if (overrides.search !== undefined && overrides.search) params.set('search', overrides.search)
    else if (search && overrides.search === undefined) params.set('search', search)
    if (overrides.archived !== undefined) params.set('archived', overrides.archived)
    else if (showArchived && overrides.archived === undefined) params.set('archived', 'true')
    const qs = params.toString()
    return `/dashboard/clients${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Clients
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage client accounts and relationships
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Add Client
        </Link>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildUrl({ archived: undefined, page: '1' })}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            !showArchived
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Active
        </Link>
        <Link
          href={buildUrl({ archived: 'true', page: '1' })}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            showArchived
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Archived {archivedCount > 0 && `(${archivedCount})`}
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <form method="GET" className="flex gap-4">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name, company, or email..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
          />
          {showArchived && <input type="hidden" name="archived" value="true" />}
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Search
          </button>
          {search && (
            <Link
              href={buildUrl({ search: undefined, page: '1' })}
              className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Clients Table */}
      <ClientsTable clients={clients} showArchived={showArchived} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of {totalCount} clients
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
