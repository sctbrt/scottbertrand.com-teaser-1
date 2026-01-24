// Client Portal - Projects List
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function PortalPage() {
  const session = await auth()
  if (!session?.user) return null

  // Get client's projects
  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      projects: {
        orderBy: { updatedAt: 'desc' },
        include: {
          milestones: {
            orderBy: { sortOrder: 'asc' },
            take: 3,
          },
          serviceTemplate: {
            select: { name: true },
          },
        },
      },
    },
  })

  const projects = client?.projects || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Your Projects
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View project status, deliverables, and milestones
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No projects yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your projects will appear here once work begins.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/portal/projects/${project.id}`}
              className="block bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {project.name}
                  </h2>
                  {project.serviceTemplate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {project.serviceTemplate.name}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {formatStatus(project.status)}
                </span>
              </div>

              {/* Progress / Milestones Preview */}
              {project.milestones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    Upcoming Milestones
                  </p>
                  <div className="space-y-2">
                    {project.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getMilestoneColor(milestone.status)}`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {milestone.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>View details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function getStatusColor(status: string) {
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

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

function getMilestoneColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-gray-300 dark:bg-gray-600',
    IN_PROGRESS: 'bg-blue-500',
    AWAITING_APPROVAL: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    COMPLETED: 'bg-green-500',
  }
  return colors[status] || colors.PENDING
}
