'use client'

/**
 * Payment Section Component for Project Detail Page
 *
 * Shows payment status, Payment Link management, and manual override controls.
 */

import { useState, useTransition } from 'react'
import { updatePaymentLink, markProjectPaid } from '@/lib/actions/payments'

interface PaymentSectionProps {
  project: {
    id: string
    publicId: string
    paymentStatus: string
    paymentProvider: string | null
    paymentRequired: boolean
    paidAt: Date | null
    stripePaymentLinkId: string | null
    stripePaymentLinkUrl: string | null
  }
}

export function PaymentSection({ project }: PaymentSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false)
  const [markPaidReason, setMarkPaidReason] = useState('')
  const [paymentLinkUrl, setPaymentLinkUrl] = useState(project.stripePaymentLinkUrl || '')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const isPaid = project.paymentStatus === 'PAID'
  const isRefunded = project.paymentStatus === 'REFUNDED'

  // Handle Payment Link save
  const handleSavePaymentLink = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await updatePaymentLink(project.id, paymentLinkUrl)
      if (result.success) {
        setMessage({ type: 'success', text: 'Payment link saved' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' })
      }
    })
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!project.stripePaymentLinkUrl) return
    await navigator.clipboard.writeText(project.stripePaymentLinkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle manual mark as paid
  const handleMarkPaid = () => {
    if (!markPaidReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for manual payment' })
      return
    }
    setMessage(null)
    startTransition(async () => {
      const result = await markProjectPaid(project.id, markPaidReason)
      if (result.success) {
        setMessage({ type: 'success', text: 'Project marked as paid' })
        setShowMarkPaidConfirm(false)
        setMarkPaidReason('')
        // Refresh page to show updated status
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to mark as paid' })
      }
    })
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
      <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
        Payment
      </h2>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            isPaid
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : isRefunded
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}
        >
          {project.paymentStatus}
        </span>
        {project.paymentProvider && (
          <span className="text-xs text-[var(--text-muted)]">
            via {project.paymentProvider}
          </span>
        )}
      </div>

      {/* Paid At */}
      {isPaid && project.paidAt && (
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Paid on {formatDate(project.paidAt)}
        </p>
      )}

      {/* Payment Link Section (only show if not paid) */}
      {!isPaid && (
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-[var(--text)]">
            Stripe Payment Link
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={paymentLinkUrl}
              onChange={(e) => setPaymentLinkUrl(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              onClick={handleSavePaymentLink}
              disabled={isPending}
              className="px-3 py-2 text-sm bg-[var(--text)] text-[var(--bg)] rounded-lg hover:opacity-85 disabled:opacity-50 transition-colors"
            >
              {isPending ? '...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Create a Payment Link in Stripe Dashboard with metadata:{' '}
            <code className="bg-[var(--surface-2)] px-1 rounded">
              project_public_id: {project.publicId}
            </code>
          </p>
        </div>
      )}

      {/* Copy Link Button (if link exists) */}
      {project.stripePaymentLinkUrl && (
        <button
          onClick={handleCopy}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--text)] hover:bg-[var(--accent-subtle)]/50 transition-colors mb-3"
        >
          {copied ? '✓ Copied!' : 'Copy Payment Link'}
        </button>
      )}

      {/* Messages */}
      {message && (
        <div
          className={`p-2 rounded-lg text-sm mb-3 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-rose-500/10 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Mark as Paid Override (only show if not paid) */}
      {!isPaid && (
        <div className="pt-3 border-t border-[var(--border)]">
          {!showMarkPaidConfirm ? (
            <button
              onClick={() => setShowMarkPaidConfirm(true)}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Mark as Paid (Manual Override)
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-amber-500">
                ⚠️ This will bypass Stripe verification. Use only for offline payments or wire
                transfers.
              </p>
              <input
                type="text"
                value={markPaidReason}
                onChange={(e) => setMarkPaidReason(e.target.value)}
                placeholder="Reason (e.g., Wire transfer received)"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMarkPaidConfirm(false)
                    setMarkPaidReason('')
                    setMessage(null)
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--text)] hover:bg-[var(--accent-subtle)]/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={isPending || !markPaidReason.trim()}
                  className="flex-1 px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
