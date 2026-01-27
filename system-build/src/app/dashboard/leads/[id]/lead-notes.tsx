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
    <div className="bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Internal Notes
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
          >
            {notes ? 'Edit' : 'Add Notes'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes about this lead..."
            className="w-full h-32 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {notes}
        </p>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No notes yet. Click &quot;Add Notes&quot; to add internal notes.
        </p>
      )}
    </div>
  )
}
