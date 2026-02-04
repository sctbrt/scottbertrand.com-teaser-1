// Dashboard - Projects Management Page
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClientFilterSelect } from './client-filter-select'
import type { ProjectStatus } from '@prisma/client'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; clientId?: string; page?: string }>
}) {
  const params = await searchParams
  const status = params.status || undefined
  const clientId = params.clientId || undefined
  const page = parseInt(params.page || '1')
  const perPage = 20

  // Build filter
  const where: { status?: ProjectStatus; clientId?: string } = {}
  if (status) where.status = status as ProjectStatus
  if (clientId) where.clientId = clientId

  // Fetch projects with pagination
  const [projects, totalCount, clients] = await Promise.all([
    prisma.projects.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        clients: {
          select: { companyName: true, contactName: true },
        },
        service_templates: {
          select: { name: true },
        },
        _count: {
          select: { tasks: true, milestones: true, invoices: true },
        },
      },
    }),
    prisma.projects.count({ where }),
    // Get all clients for filter dropdown
    prisma.clients.findMany({
      select: { id: true, companyName: true, contactName: true },
      orderBy: { companyName: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  // Status counts (filtered by client if selected)
  const statusCounts = await prisma.projects.groupBy({
    by: ['status'],
    ...(clientId ? { where: { clientId } } : {}),
    _count: { id: true },
  })

  const statusCountMap = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id
    return acc
  }, {} as Record<string, number>)

  const statuses = ['DRAFT', 'PENDING_APPROVAL', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            Projects
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage client projects and deliverables
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-85 transition-colors"
        >
          New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap flex-1">
          <FilterChip
            label={`All (${totalCount})`}
            href={buildFilterUrl(undefined, clientId)}
            active={!status}
          />
          {statuses.map((s) => (
            <FilterChip
              key={s}
              label={`${s.replace('_', ' ')} (${statusCountMap[s] || 0})`}
              href={buildFilterUrl(s, clientId)}
              active={status === s}
            />
          ))}
        </div>

        {/* Client Filter */}
        <div>
          <ClientFilterSelect
            clients={clients}
            currentClientId={clientId}
            currentStatus={status}
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full bg-[var(--surface)] rounded-lg border border-[var(--border)] p-12 text-center">
            <p className="text-[var(--text-muted)]">
              No projects found
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-5 hover:border-[var(--accent-muted)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--text)] truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] truncate">
                    {project.clients.companyName || project.clients.contactName}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              {project.service_templates && (
                <p className="text-xs text-[var(--text-subtle)] mb-3">
                  {project.service_templates.name}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span>{project._count.tasks} tasks</span>
                <span>{project._count.milestones} milestones</span>
                <span>{project._count.invoices} invoices</span>
              </div>

              {project.targetEndDate && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-subtle)]">
                    Target: {formatDate(project.targetEndDate)}
                  </p>
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of {totalCount} projects
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/projects?page=${page - 1}${status ? `&status=${status}` : ''}${clientId ? `&clientId=${clientId}` : ''}`}
                className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--accent-subtle)]"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/projects?page=${page + 1}${status ? `&status=${status}` : ''}${clientId ? `&clientId=${clientId}` : ''}`}
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

function buildFilterUrl(status?: string, clientId?: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (clientId) params.set('clientId', clientId)
  const query = params.toString()
  return `/dashboard/projects${query ? `?${query}` : ''}`
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
      className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
        active
          ? 'bg-[var(--text)] text-[var(--bg)]'
          : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--accent-subtle)]'
      }`}
    >
      {label}
    </Link>
  )
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
    PENDING_APPROVAL: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    IN_PROGRESS: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    ON_HOLD: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    COMPLETED: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    CANCELLED: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  }
  return colors[status] || colors.DRAFT
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
