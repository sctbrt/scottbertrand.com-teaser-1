'use client'

// Deliverable Viewer - View/download with watermark gating
import { useState } from 'react'
import type { DeliverableState } from '@prisma/client'

interface DeliverableViewerProps {
  deliverable: {
    id: string
    title: string
    version: number
    state: DeliverableState
    filePreviewUrl: string | null
    fileDownloadUrl: string | null
    mimeType: string | null
    createdAt: Date
  }
  projectPublicId: string
  isPaid: boolean
  isReleased: boolean
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function DeliverableViewer({
  deliverable,
  projectPublicId,
  isPaid,
  isReleased,
}: DeliverableViewerProps) {
  const [isViewing, setIsViewing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Determine download availability
  // - Not paid: no download
  // - Paid but not released: download watermarked
  // - Paid and released: download clean
  const canDownload = isPaid
  const downloadIsClean = isPaid && isReleased

  const handleView = () => {
    if (deliverable.filePreviewUrl) {
      // Open preview in new tab (always watermarked for draft/review)
      window.open(deliverable.filePreviewUrl, '_blank')
    }
  }

  const handleDownload = async () => {
    if (!canDownload) return

    setIsDownloading(true)
    try {
      // Use the download API endpoint which handles gating
      const response = await fetch(`/api/deliverables/${deliverable.id}/download`, {
        method: 'GET',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.message || 'Download failed')
        return
      }

      // Get the blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${deliverable.title}-v${deliverable.version}${getExtension(deliverable.mimeType)}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Deliverable info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-[var(--text)]">
            {deliverable.title}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Version {deliverable.version} &middot; {formatDate(deliverable.createdAt)}
          </p>
        </div>

        {/* State badge */}
        <span className={`
          text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded
          ${deliverable.state === 'FINAL'
            ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
            : deliverable.state === 'REVIEW'
            ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
            : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
          }
        `}>
          {deliverable.state === 'FINAL' ? 'Final' : deliverable.state === 'REVIEW' ? 'Review' : 'Draft'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* View button - always available if preview URL exists */}
        {deliverable.filePreviewUrl && (
          <button
            onClick={handleView}
            className="btn btn--secondary btn--sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
        )}

        {/* Download button */}
        {canDownload ? (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn--primary btn--sm"
          >
            {isDownloading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download{!downloadIsClean && ' (Draft)'}
              </>
            )}
          </button>
        ) : (
          <span className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Downloads unlock after payment.
          </span>
        )}
      </div>

      {/* Watermark notice */}
      {canDownload && !downloadIsClean && (
        <p className="text-xs text-[var(--text-muted)]">
          This download includes a watermark. The clean version will be available after approval.
        </p>
      )}
    </div>
  )
}

function getExtension(mimeType: string | null): string {
  if (!mimeType) return ''
  const map: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  }
  return map[mimeType] || ''
}
