// Dashboard Overview Page
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  // Fetch counts for overview
  const [leadCount, clientCount, projectCount, invoiceCount] = await Promise.all([
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.client.count(),
    prisma.project.count({ where: { status: { in: ['IN_PROGRESS', 'PENDING_APPROVAL'] } } }),
    prisma.invoice.count({ where: { status: { in: ['SENT', 'OVERDUE'] } } }),
  ])

  // Fetch recent leads
  const recentLeads = await prisma.lead.findMany({
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
  const activeProjects = await prisma.project.findMany({
    where: { status: { in: ['IN_PROGRESS', 'PENDING_APPROVAL'] } },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      client: {
        select: { contactName: true, companyName: true },
      },
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of leads, clients, projects, and invoices
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="New Leads"
          value={leadCount}
          href="/dashboard/leads"
          color="blue"
        />
        <StatCard
          title="Clients"
          value={clientCount}
          href="/dashboard/clients"
          color="green"
        />
        <StatCard
          title="Active Projects"
          value={projectCount}
          href="/dashboard/projects"
          color="purple"
        />
        <StatCard
          title="Unpaid Invoices"
          value={invoiceCount}
          href="/dashboard/invoices"
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-medium text-gray-900 dark:text-gray-100">
              Recent Leads
            </h2>
            <Link
              href="/dashboard/leads"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentLeads.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">
                No leads yet
              </p>
            ) : (
              recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="px-6 py-4 block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {lead.name || lead.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {lead.service || 'No service specified'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-medium text-gray-900 dark:text-gray-100">
              Active Projects
            </h2>
            <Link
              href="/dashboard/projects"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {activeProjects.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">
                No active projects
              </p>
            ) : (
              activeProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="px-6 py-4 block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {project.client.companyName || project.client.contactName}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getProjectStatusColor(project.status)}`}>
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

// Stat Card Component
function StatCard({
  title,
  value,
  href,
  color,
}: {
  title: string
  value: number
  href: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }

  return (
    <Link
      href={href}
      className="bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{title}</p>
      <p className={`text-3xl font-semibold ${colorClasses[color].split(' ').slice(2).join(' ')}`}>
        {value}
      </p>
    </Link>
  )
}

// Status color helpers
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    CONTACTED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    QUALIFIED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CONVERTED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    DISQUALIFIED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    ARCHIVED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }
  return colors[status] || colors.NEW
}

function getProjectStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ON_HOLD: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return colors[status] || colors.DRAFT
}
