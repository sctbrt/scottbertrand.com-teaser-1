// Dashboard Overview Page - V3 Glass Aesthetic
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { RefreshButton } from './leads/refresh-button'

function getGreeting() {
  const hour = new Date().toLocaleString('en-US', {
    timeZone: 'America/Toronto',
    hour: 'numeric',
    hour12: false,
  })
  const h = parseInt(hour)
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Working late'
}

function getSubGreeting() {
  const day = new Date().toLocaleString('en-US', {
    timeZone: 'America/Toronto',
    weekday: 'long',
  })
  const hour = parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Toronto',
      hour: 'numeric',
      hour12: false,
    })
  )

  if (day === 'Friday' && hour >= 16) return "Almost weekend. Let's finish strong."
  if (day === 'Monday' && hour < 12) return 'Fresh week, fresh opportunities.'
  if (day === 'Saturday' || day === 'Sunday') return 'Catching up on a weekend?'
  if (hour >= 21 || hour < 5) return 'Burning the midnight oil.'
  return "Here's what's happening."
}

export default async function DashboardPage() {
  // Fetch counts for overview
  const [leadCount, clientCount, projectCount, invoiceCount] = await Promise.all([
    prisma.leads.count({ where: { status: 'NEW' } }),
    prisma.clients.count(),
    prisma.projects.count({ where: { status: { in: ['IN_PROGRESS', 'PENDING_APPROVAL'] } } }),
    prisma.invoices.count({ where: { status: { in: ['SENT', 'OVERDUE'] } } }),
  ])

  // Fetch recent leads
  const recentLeads = await prisma.leads.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      service: true,
      status: true,
      createdAt: true,
    },
  })

  // Fetch active projects
  const activeProjects = await prisma.projects.findMany({
    where: { status: { in: ['IN_PROGRESS', 'PENDING_APPROVAL'] } },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      clients: {
        select: { contactName: true, companyName: true },
      },
    },
  })

  const greeting = getGreeting()
  const subGreeting = getSubGreeting()

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 border border-amber-500/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400 tracking-wider uppercase mb-2">
            {greeting}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">Scott</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {subGreeting}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-[var(--text)] tracking-tight">
            Overview
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Leads, clients, projects, and invoices
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="New Leads"
          value={leadCount}
          href="/dashboard/leads"
        />
        <StatCard
          title="Clients"
          value={clientCount}
          href="/dashboard/clients"
        />
        <StatCard
          title="Active Projects"
          value={projectCount}
          href="/dashboard/projects"
        />
        <StatCard
          title="Unpaid Invoices"
          value={invoiceCount}
          href="/dashboard/invoices"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="glass glass--card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-[var(--text)]">
              Recent Leads
            </h2>
            <Link
              href="/dashboard/leads"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentLeads.length === 0 ? (
              <p className="py-8 text-sm text-[var(--text-muted)] text-center">
                No leads yet
              </p>
            ) : (
              recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="py-3 block hover:bg-[var(--accent-subtle)] -mx-4 px-4 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">
                        {lead.name || lead.email}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {lead.service || 'No service specified'}
                      </p>
                    </div>
                    <span className={`status-badge ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="glass glass--card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-[var(--text)]">
              Active Projects
            </h2>
            <Link
              href="/dashboard/projects"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {activeProjects.length === 0 ? (
              <p className="py-8 text-sm text-[var(--text-muted)] text-center">
                No active projects
              </p>
            ) : (
              activeProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="py-3 block hover:bg-[var(--accent-subtle)] -mx-4 px-4 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">
                        {project.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {project.clients.companyName || project.clients.contactName}
                      </p>
                    </div>
                    <span className={`status-badge ${getProjectStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component - V3 Glass
function StatCard({
  title,
  value,
  href,
}: {
  title: string
  value: number
  href: string
}) {
  return (
    <Link
      href={href}
      className="glass glass--stat hover:border-[var(--accent)] transition-colors"
    >
      <p className="text-sm text-[var(--text-muted)] mb-2">{title}</p>
      <p className="text-3xl font-medium text-[var(--accent)]">
        {value}
      </p>
    </Link>
  )
}

// Status color helpers - using accent-based system
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NEW: 'bg-[var(--accent-muted)] text-[var(--accent)]',
    CONTACTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    QUALIFIED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    CONVERTED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    DISQUALIFIED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    ARCHIVED: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
  }
  return colors[status] || colors.NEW
}

function getProjectStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    IN_PROGRESS: 'bg-[var(--accent-muted)] text-[var(--accent)]',
    ON_HOLD: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  }
  return colors[status] || colors.DRAFT
}
