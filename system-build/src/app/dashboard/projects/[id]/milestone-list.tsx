'use client'

// Milestone List Component with inline editing
import { useActionState, useState } from 'react'
import { createMilestone, updateMilestone, deleteMilestone, updateMilestoneStatus } from '@/lib/actions/milestones'

interface Milestone {
  id: string
  name: string
  description: string | null
  status: string
  dueDate: Date | null
  completedAt: Date | null
  requiresApproval: boolean
  approvedAt: Date | null
  approvalNotes: string | null
  sortOrder: number
}

interface MilestoneListProps {
  projectId: string
  milestones: Milestone[]
}

export function MilestoneList({ projectId, milestones }: MilestoneListProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      {/* Milestone Items */}
      <div className="divide-y divide-[var(--border)]">
        {milestones.length === 0 && !showForm ? (
          <p className="px-6 py-8 text-sm text-[var(--text-muted)] text-center">
            No milestones yet. Add your first milestone below.
          </p>
        ) : (
          milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              projectId={projectId}
              index={index}
            />
          ))
        )}
      </div>

      {/* Add Milestone Form */}
      {showForm ? (
        <div className="p-4 border-t border-[var(--border)]">
          <AddMilestoneForm
            projectId={projectId}
            onCancel={() => setShowForm(false)}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      ) : (
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            + Add Milestone
          </button>
        </div>
      )}
    </div>
  )
}

function MilestoneItem({
  milestone,
  projectId,
  index,
}: {
  milestone: Milestone
  projectId: string
  index: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [, updateStatusAction, isUpdating] = useActionState(
    updateMilestoneStatus.bind(null, milestone.id),
    null
  )

  const handleStatusChange = (newStatus: string) => {
    const formData = new FormData()
    formData.append('status', newStatus)
    updateStatusAction(formData)
  }

  if (isEditing) {
    return (
      <div className="p-4">
        <EditMilestoneForm
          milestone={milestone}
          projectId={projectId}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="px-6 py-4 flex items-start gap-4 group">
      {/* Status Icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusBgColor(milestone.status)}`}>
        {getStatusIcon(milestone.status)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-subtle)]">{index + 1}.</span>
          <h3 className="font-medium text-[var(--text)]">
            {milestone.name}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(milestone.status)}`}>
            {milestone.status.replace('_', ' ')}
          </span>
        </div>
        {milestone.description && (
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {milestone.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-subtle)]">
          {milestone.dueDate && (
            <span>Due: {formatDate(milestone.dueDate)}</span>
          )}
          {milestone.requiresApproval && (
            <span className="text-sky-400">Requires approval</span>
          )}
          {milestone.completedAt && (
            <span className="text-emerald-400">
              Completed: {formatDate(milestone.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Status Actions */}
        {milestone.status !== 'COMPLETED' && (
          <select
            value={milestone.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="text-xs px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface)] text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="AWAITING_APPROVAL">Awaiting Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
          </select>
        )}

        {/* Edit Button */}
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-subtle)] hover:text-[var(--text)] transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function AddMilestoneForm({
  projectId,
  onCancel,
  onSuccess,
}: {
  projectId: string
  onCancel: () => void
  onSuccess: () => void
}) {
  const action = createMilestone.bind(null, projectId)
  const [state, formAction, isPending] = useActionState(action, null)

  if (state?.success) {
    onSuccess()
  }

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="text"
        name="name"
        required
        placeholder="Milestone name"
        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm resize-none"
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            name="requiresApproval"
            value="true"
            className="rounded border-[var(--border)]"
          />
          Requires client approval
        </label>
        <input
          type="date"
          name="dueDate"
          className="px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface)] text-[var(--text)] text-sm"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-[var(--error-text)]">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] rounded text-sm font-medium hover:opacity-85 disabled:opacity-50"
        >
          {isPending ? 'Adding...' : 'Add Milestone'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text)] text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function EditMilestoneForm({
  milestone,
  projectId: _projectId,
  onCancel,
  onSuccess,
}: {
  milestone: Milestone
  projectId: string
  onCancel: () => void
  onSuccess: () => void
}) {
  const action = updateMilestone.bind(null, milestone.id)
  const deleteAction = deleteMilestone.bind(null, milestone.id)
  const [state, formAction, isPending] = useActionState(action, null)
  const [, deleteFormAction, isDeleting] = useActionState(deleteAction, null)

  if (state?.success) {
    onSuccess()
  }

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="text"
        name="name"
        required
        defaultValue={milestone.name}
        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
      />
      <textarea
        name="description"
        rows={2}
        defaultValue={milestone.description || ''}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm resize-none"
      />
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            name="requiresApproval"
            value="true"
            defaultChecked={milestone.requiresApproval}
            className="rounded border-[var(--border)]"
          />
          Requires approval
        </label>
        <input
          type="date"
          name="dueDate"
          defaultValue={milestone.dueDate ? formatDateInput(milestone.dueDate) : ''}
          className="px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface)] text-[var(--text)] text-sm"
        />
        <select
          name="status"
          defaultValue={milestone.status}
          className="px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface)] text-[var(--text)] text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="AWAITING_APPROVAL">Awaiting Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {state?.error && (
        <p className="text-sm text-[var(--error-text)]">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] rounded text-sm font-medium hover:opacity-85 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text)] text-sm"
        >
          Cancel
        </button>
        <form action={deleteFormAction} className="ml-auto">
          <button
            type="submit"
            disabled={isDeleting}
            className="px-3 py-1.5 text-[var(--error-text)] hover:text-red-500 text-sm disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </form>
      </div>
    </form>
  )
}

function getStatusBgColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-[var(--surface-2)]',
    IN_PROGRESS: 'bg-sky-500/20',
    AWAITING_APPROVAL: 'bg-amber-500/20',
    APPROVED: 'bg-emerald-500/20',
    COMPLETED: 'bg-emerald-500/20',
  }
  return colors[status] || colors.PENDING
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-zinc-500/20 text-zinc-400',
    IN_PROGRESS: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    AWAITING_APPROVAL: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    APPROVED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  }
  return colors[status] || colors.PENDING
}

function getStatusIcon(status: string) {
  if (status === 'COMPLETED' || status === 'APPROVED') {
    return (
      <svg className="w-4 h-4 text-[var(--success-text)]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    )
  }
  if (status === 'IN_PROGRESS') {
    return <span className="w-2 h-2 bg-blue-500 rounded-full" />
  }
  if (status === 'AWAITING_APPROVAL') {
    return <span className="w-2 h-2 bg-yellow-500 rounded-full" />
  }
  return <span className="w-2 h-2 bg-[var(--text-subtle)] rounded-full" />
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}
