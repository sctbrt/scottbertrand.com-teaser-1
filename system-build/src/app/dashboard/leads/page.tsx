// Dashboard - Leads Management Page
import { getLeads, countLeads, groupLeadsByStatus } from '@/lib/data/leads'
import Link from 'next/link'
import type { LeadStatus } from '@prisma/client'
import { RefreshButton } from './refresh-button'
import { LeadsTable } from './leads-table'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const status = params.status || undefined
  const page = parseInt(params.page || '1')
  const perPage = 20

  // Fetch leads with filtering, pagination, and automatic decryption
  // getLeads includes service_templates automatically
  // "All" view excludes archived leads; archived only shows in ARCHIVED filter
  const whereClause = status
    ? { status: status as LeadStatus }
    : { status: { not: 'ARCHIVED' as LeadStatus } }

  // Count for "All" filter always excludes archived (regardless of current view)
  const allWhereClause = { status: { not: 'ARCHIVED' as LeadStatus } }

  const [leads, totalCount, allCount] = await Promise.all([
    getLeads({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    countLeads(whereClause),
    countLeads(allWhereClause),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  // Status counts for filters
  const statusCounts = await groupLeadsByStatus()

  const statusCountMap = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            Leads
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage intake submissions and lead conversion
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <FilterChip
          label={`All (${allCount})`}
          href="/dashboard/leads"
          active={!status}
        />
        {['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DISQUALIFIED'].map((s) => (
          <FilterChip
            key={s}
            label={`${s} (${statusCountMap[s] || 0})`}
            href={`/dashboard/leads?status=${s}`}
            active={status === s}
          />
        ))}
        <span className="text-[var(--text-subtle)] mx-1">|</span>
        <FilterChip
          label={`Archived (${statusCountMap['ARCHIVED'] || 0})`}
          href="/dashboard/leads?status=ARCHIVED"
          active={status === 'ARCHIVED'}
        />
      </div>

      {/* Leads Table with Selection */}
      <LeadsTable leads={leads} currentStatus={status} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of {totalCount} leads
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/leads?page=${page - 1}${status ? `&status=${status}` : ''}`}
                className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--accent-subtle)]"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/leads?page=${page + 1}${status ? `&status=${status}` : ''}`}
                className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--accent-subtle)]"
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

function FilterChip({
  label,
  href,
  active,
}: {
  label: string
  href: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
        active
          ? 'bg-[var(--text)] text-[var(--bg)]'
          : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--accent-subtle)]'
      }`}
    >
      {label}
    </Link>
  )
}
