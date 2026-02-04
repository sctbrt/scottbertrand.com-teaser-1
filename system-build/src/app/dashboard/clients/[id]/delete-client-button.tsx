'use client'

import { useState, useTransition } from 'react'
import { deleteClient } from '@/lib/actions/clients'

interface DeleteClientButtonProps {
  clientId: string
  clientName: string
  hasProjects: boolean
  hasInvoices: boolean
}

export function DeleteClientButton({
  clientId,
  clientName,
  hasProjects,
  hasInvoices,
}: DeleteClientButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const hasData = hasProjects || hasInvoices

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteClient(clientId)
      if (result?.error) {
        setError(result.error)
        setShowModal(false)
      }
      // On success, the server action redirects to /dashboard/clients
    })
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={hasData}
        className="w-full px-4 py-2 text-sm text-[var(--error-text)] border border-[var(--error-border)] rounded-lg hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={hasData ? 'Cannot delete client with existing projects or invoices' : ''}
      >
        Delete Client
      </button>

      {hasData && (
        <p className="text-xs text-[var(--text-subtle)] mt-2">
          Cannot delete — client has {hasProjects ? 'projects' : ''}{hasProjects && hasInvoices ? ' and ' : ''}{hasInvoices ? 'invoices' : ''}
        </p>
      )}

      {error && (
        <p className="text-xs text-[var(--error-text)] mt-2">{error}</p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
              Delete Client
            </h3>
            <p className="text-[var(--text-muted)] mb-2">
              You are about to permanently delete <span className="font-semibold">{clientName}</span>.
            </p>
            <p className="text-[var(--error-text)] text-sm mb-6">
              This action cannot be undone. The client account and associated user will be removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--accent-subtle)] rounded-lg transition-colors"
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
