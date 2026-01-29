'use client'

// Feedback Form - Structured feedback with approve/revision workflow
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FeedbackFormProps {
  projectId: string
  projectPublicId: string
  deliverableId: string
  deliverableVersion: number
  userName: string
  userEmail: string
  canApprove: boolean
  isPaid: boolean
}

type FeedbackType = 'APPROVE' | 'APPROVE_MINOR' | 'NEEDS_REVISION'

export function FeedbackForm({
  projectId,
  projectPublicId,
  deliverableId,
  deliverableVersion,
  userName,
  userEmail,
  canApprove,
  isPaid,
}: FeedbackFormProps) {
  const router = useRouter()
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackType) return

    // Validate notes required for revision
    if (feedbackType === 'NEEDS_REVISION' && !notes.trim()) {
      setError('Please describe what needs to be changed.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverableId,
          type: feedbackType,
          notes: notes.trim() || null,
          submittedByName: userName,
          submittedByEmail: userEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to submit feedback')
      }

      // If approving, also trigger the release flow
      if (feedbackType === 'APPROVE' || feedbackType === 'APPROVE_MINOR') {
        const releaseResponse = await fetch(`/api/projects/${projectId}/release`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliverableId,
            signedByName: userName,
            signedByEmail: userEmail,
          }),
        })

        if (!releaseResponse.ok) {
          const data = await releaseResponse.json()
          throw new Error(data.message || 'Failed to release project')
        }
      }

      // Refresh the page to show updated state
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper text for the form
  const helperText = "Approve if this is ready to release. Choose 'Needs revision' and tell me what to change and why."

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        {helperText}
      </p>

      {/* Feedback type selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors">
          <input
            type="radio"
            name="feedbackType"
            value="APPROVE"
            checked={feedbackType === 'APPROVE'}
            onChange={() => setFeedbackType('APPROVE')}
            disabled={!canApprove}
            className="w-4 h-4 text-[var(--accent)]"
          />
          <div className={!canApprove ? 'opacity-50' : ''}>
            <span className="text-sm font-medium text-[var(--text)]">
              Approve
            </span>
            <p className="text-xs text-[var(--text-muted)]">
              Ready to release. No changes needed.
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors">
          <input
            type="radio"
            name="feedbackType"
            value="APPROVE_MINOR"
            checked={feedbackType === 'APPROVE_MINOR'}
            onChange={() => setFeedbackType('APPROVE_MINOR')}
            disabled={!canApprove}
            className="w-4 h-4 text-[var(--accent)]"
          />
          <div className={!canApprove ? 'opacity-50' : ''}>
            <span className="text-sm font-medium text-[var(--text)]">
              Approve with minor notes
            </span>
            <p className="text-xs text-[var(--text-muted)]">
              Ready to release, with small feedback for future reference.
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors">
          <input
            type="radio"
            name="feedbackType"
            value="NEEDS_REVISION"
            checked={feedbackType === 'NEEDS_REVISION'}
            onChange={() => setFeedbackType('NEEDS_REVISION')}
            className="w-4 h-4 text-[var(--accent)]"
          />
          <div>
            <span className="text-sm font-medium text-[var(--text)]">
              Needs revision
            </span>
            <p className="text-xs text-[var(--text-muted)]">
              Changes are required before approval.
            </p>
          </div>
        </label>
      </div>

      {/* Notes textarea */}
      {feedbackType && (
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-[var(--text)] mb-1">
            Notes
            {feedbackType === 'NEEDS_REVISION' && (
              <span className="text-[var(--error-text)]"> *</span>
            )}
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              feedbackType === 'NEEDS_REVISION'
                ? 'Describe what needs to be changed and why...'
                : 'Optional notes or feedback...'
            }
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm resize-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
            required={feedbackType === 'NEEDS_REVISION'}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-[var(--error-text)]">
          {error}
        </p>
      )}

      {/* Payment gate message */}
      {!isPaid && (feedbackType === 'APPROVE' || feedbackType === 'APPROVE_MINOR') && (
        <p className="text-sm text-[var(--accent)]">
          Approval and release will be available after payment is received.
        </p>
      )}

      {/* Submit button */}
      {feedbackType && (
        <button
          type="submit"
          disabled={isSubmitting || (!isPaid && feedbackType !== 'NEEDS_REVISION')}
          className={`
            btn w-full
            ${feedbackType === 'NEEDS_REVISION' ? 'btn--secondary' : 'btn--primary'}
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isSubmitting ? (
            'Submitting...'
          ) : feedbackType === 'NEEDS_REVISION' ? (
            'Request Revision'
          ) : (
            'Approve & Release'
          )}
        </button>
      )}

      {/* Version indicator */}
      <p className="text-xs text-[var(--text-muted)] text-center">
        Feedback for version {deliverableVersion}
      </p>
    </form>
  )
}
