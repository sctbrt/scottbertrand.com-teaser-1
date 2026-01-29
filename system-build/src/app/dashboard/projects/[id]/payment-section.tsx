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
    <div className="bg-white dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Payment
      </h2>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            isPaid
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : isRefunded
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}
        >
          {project.paymentStatus}
        </span>
        {project.paymentProvider && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            via {project.paymentProvider}
          </span>
        )}
      </div>

      {/* Paid At */}
      {isPaid && project.paidAt && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Paid on {formatDate(project.paidAt)}
        </p>
      )}

      {/* Payment Link Section (only show if not paid) */}
      {!isPaid && (
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Stripe Payment Link
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={paymentLinkUrl}
              onChange={(e) => setPaymentLinkUrl(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            />
            <button
              onClick={handleSavePaymentLink}
              disabled={isPending}
              className="px-3 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {isPending ? '...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create a Payment Link in Stripe Dashboard with metadata:{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
              project_public_id: {project.publicId}
            </code>
          </p>
        </div>
      )}

      {/* Copy Link Button (if link exists) */}
      {project.stripePaymentLinkUrl && (
        <button
          onClick={handleCopy}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors mb-3"
        >
          {copied ? '✓ Copied!' : 'Copy Payment Link'}
        </button>
      )}

      {/* Messages */}
      {message && (
        <div
          className={`p-2 rounded-lg text-sm mb-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Mark as Paid Override (only show if not paid) */}
      {!isPaid && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          {!showMarkPaidConfirm ? (
            <button
              onClick={() => setShowMarkPaidConfirm(true)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Mark as Paid (Manual Override)
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ This will bypass Stripe verification. Use only for offline payments or wire
                transfers.
              </p>
              <input
                type="text"
                value={markPaidReason}
                onChange={(e) => setMarkPaidReason(e.target.value)}
                placeholder="Reason (e.g., Wire transfer received)"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMarkPaidConfirm(false)
                    setMarkPaidReason('')
                    setMessage(null)
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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
