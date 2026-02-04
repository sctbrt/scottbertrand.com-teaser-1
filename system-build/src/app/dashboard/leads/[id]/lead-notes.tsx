'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeadNotes } from '@/lib/actions/leads'

interface LeadNotesProps {
  leadId: string
  initialNotes: string | null
}

export function LeadNotes({ leadId, initialNotes }: LeadNotesProps) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    const result = await updateLeadNotes(leadId, notes)
    if (result?.error) {
      setError(result.error)
    } else {
      setIsEditing(false)
      router.refresh()
    }
    setIsSaving(false)
  }

  const handleCancel = () => {
    setNotes(initialNotes || '')
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Internal Notes
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-amber-500 hover:text-amber-400"
          >
            {notes ? 'Edit' : 'Add Notes'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-[var(--error-text)] mb-3">{error}</p>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes about this lead..."
            className="w-full h-32 p-3 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--accent-subtle)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : notes ? (
        <p className="text-sm text-[var(--text)] whitespace-pre-wrap">
          {notes}
        </p>
      ) : (
        <p className="text-sm text-[var(--text-subtle)] italic">
          No notes yet. Click &quot;Add Notes&quot; to add internal notes.
        </p>
      )}
    </div>
  )
}
