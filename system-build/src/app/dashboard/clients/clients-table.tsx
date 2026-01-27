'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { archiveMultipleClients, deleteMultipleClients } from '@/lib/actions/clients'

interface Client {
  id: string
  companyName: string | null
  contactName: string
  contactEmail: string
  phone: string | null
  isArchived: boolean
  createdAt: Date
  _count: {
    projects: number
    invoices: number
  }
  projects: {
    status: string
    name: string
  }[]
}

interface ClientsTableProps {
  clients: Client[]
  showArchived: boolean
}

export function ClientsTable({ clients, showArchived }: ClientsTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Clients with projects/invoices can't be deleted
  const deletableClients = clients.filter(
    (c) => c._count.projects === 0 && c._count.invoices === 0
  )
  const allDeletableSelected =
    deletableClients.length > 0 &&
    deletableClients.every((c) => selectedIds.has(c.id))

  const toggleSelectAll = () => {
    if (allDeletableSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(deletableClients.map((c) => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleArchive = async () => {
    setError(null)
    startTransition(async () => {
      const result = await archiveMultipleClients(Array.from(selectedIds))
      if (result?.error) {
        setError(result.error)
        setShowArchiveModal(false)
      } else {
        setSelectedIds(new Set())
        setShowArchiveModal(false)
        router.refresh()
      }
    })
  }

  const handleDelete = async () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteMultipleClients(Array.from(selectedIds))
      if (result?.error) {
        setError(result.error)
        setShowDeleteModal(false)
      } else {
        setSelectedIds(new Set())
        setShowDeleteModal(false)
        router.refresh()
      }
    })
  }

  const selectedHasData = Array.from(selectedIds).some((id) => {
    const client = clients.find((c) => c.id === id)
    return client && (client._count.projects > 0 || client._count.invoices > 0)
  })

  return (
    <>
      {/* Selection Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-800 dark:text-amber-200">
            {selectedIds.size} client{selectedIds.size === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            {!showArchived && (
              <button
                onClick={() => setShowArchiveModal(true)}
                className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Archive Selected
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={selectedHasData}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={selectedHasData ? 'Cannot delete clients with projects or invoices' : ''}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allDeletableSelected && deletableClients.length > 0}
                  onChange={toggleSelectAll}
                  disabled={deletableClients.length === 0}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                  title="Select all on this page"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Projects
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Latest Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {showArchived ? 'No archived clients' : 'No clients found'}
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const hasData = client._count.projects > 0 || client._count.invoices > 0
                return (
                  <tr
                    key={client.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      selectedIds.has(client.id) ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                    } ${client.isArchived ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(client.id)}
                        onChange={() => toggleSelect(client.id)}
                        disabled={hasData && !showArchived}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                        title={hasData ? 'Client has projects or invoices' : ''}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/clients/${client.id}`} className="block">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {client.companyName || client.contactName}
                          {client.isArchived && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              Archived
                            </span>
                          )}
                        </p>
                        {client.companyName && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {client.contactName}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {client.contactEmail}
                      </p>
                      {client.phone && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {client.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {client._count.projects}
                    </td>
                    <td className="px-6 py-4">
                      {client.projects[0] ? (
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                            {client.projects[0].name}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(client.projects[0].status)}`}
                          >
                            {client.projects[0].status.replace('_', ' ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(client.createdAt)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Archive Clients
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You are about to archive <span className="font-semibold">{selectedIds.size}</span>{' '}
              client{selectedIds.size === 1 ? '' : 's'}. Archived clients will be hidden from the
              main list but can be restored later.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Clients
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              You are about to permanently delete{' '}
              <span className="font-semibold">{selectedIds.size}</span> client
              {selectedIds.size === 1 ? '' : 's'}.
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mb-6">
              This action cannot be undone. The client account and associated user will be removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
