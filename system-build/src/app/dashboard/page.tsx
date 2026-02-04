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
          <p className="text-sm font-medium text-amber-500 tracking-wider uppercase mb-2">
            {greeting}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text)] tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">Scott</span>
          </h1>
          <p className="text-[var(--text-muted)] mt-2 text-lg">
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
          icon={<LeadsIcon />}
        />
        <StatCard
          title="Clients"
          value={clientCount}
          href="/dashboard/clients"
          icon={<ClientsIcon />}
        />
        <StatCard
          title="Active Projects"
          value={projectCount}
          href="/dashboard/projects"
          icon={<ProjectsIcon />}
        />
        <StatCard
          title="Unpaid Invoices"
          value={invoiceCount}
          href="/dashboard/invoices"
          icon={<InvoicesIcon />}
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
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors group"
            >
              View all <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
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
                  className="py-3 block hover:bg-[var(--accent-subtle)] -mx-4 px-4 transition-all first:rounded-t-lg last:rounded-b-lg border-l-2 border-transparent hover:border-[var(--accent)]"
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
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors group"
            >
              View all <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
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
                  className="py-3 block hover:bg-[var(--accent-subtle)] -mx-4 px-4 transition-all first:rounded-t-lg last:rounded-b-lg border-l-2 border-transparent hover:border-[var(--accent)]"
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
  icon,
}: {
  title: string
  value: number
  href: string
  icon: React.ReactNode
}) {
  const isZero = value === 0
  return (
    <Link
      href={href}
      className="glass glass--stat hover:border-[var(--accent)] transition-all hover:scale-[1.02] group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-2">{title}</p>
          <p className={`text-3xl font-medium ${isZero ? 'text-[var(--text-subtle)]' : 'text-[var(--accent)]'}`}>
            {value}
          </p>
        </div>
        <div className="text-[var(--text-subtle)] group-hover:text-[var(--accent)] transition-colors">
          {icon}
        </div>
      </div>
    </Link>
  )
}

// Stat Card Icons
function LeadsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function ClientsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function ProjectsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function InvoicesIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

// Status color helpers - using accent-based system
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NEW: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    CONTACTED: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    QUALIFIED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    CONVERTED: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    DISQUALIFIED: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    ARCHIVED: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
  }
  return colors[status] || colors.NEW
}

function getProjectStatusColor(status: string) {
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
