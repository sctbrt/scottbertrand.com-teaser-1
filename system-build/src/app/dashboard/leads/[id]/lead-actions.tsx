'use client'

// Lead Actions Component - Status changes, mark spam, delete
import { useActionState } from 'react'
import { updateLeadStatus, markAsSpam, deleteLead } from '@/lib/actions/leads'

interface LeadActionsProps {
  lead: {
    id: string
    status: string
    isSpam: boolean
  }
}

export function LeadActions({ lead }: LeadActionsProps) {
  const [statusState, statusAction, isUpdating] = useActionState(
    updateLeadStatus.bind(null, lead.id),
    null
  )
  const [spamState, spamAction, isMarkingSpam] = useActionState(
    markAsSpam.bind(null, lead.id),
    null
  )
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteLead.bind(null, lead.id),
    null
  )

  const handleStatusChange = (newStatus: string) => {
    const formData = new FormData()
    formData.append('status', newStatus)
    statusAction(formData)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status Dropdown */}
      <select
        value={lead.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
      >
        <option value="NEW">New</option>
        <option value="CONTACTED">Contacted</option>
        <option value="QUALIFIED">Qualified</option>
        <option value="CONVERTED">Converted</option>
        <option value="DISQUALIFIED">Disqualified</option>
        <option value="ARCHIVED">Archived</option>
      </select>

      {/* Mark as Spam */}
      {!lead.isSpam && (
        <form action={spamAction}>
          <button
            type="submit"
            disabled={isMarkingSpam}
            className="px-3 py-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm disabled:opacity-50"
          >
            {isMarkingSpam ? 'Marking...' : 'Mark Spam'}
          </button>
        </form>
      )}

      {/* Delete */}
      <form action={deleteAction}>
        <button
          type="submit"
          disabled={isDeleting}
          className="px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm disabled:opacity-50"
          onClick={(e) => {
            if (!confirm('Are you sure you want to delete this lead?')) {
              e.preventDefault()
            }
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </form>

      {/* Error Messages */}
      {(statusState?.error || spamState?.error || deleteState?.error) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {statusState?.error || spamState?.error || deleteState?.error}
        </p>
      )}
    </div>
  )
}
