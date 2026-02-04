'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
      setLastRefresh(new Date())
    })
  }

  return (
    <div className="flex items-center gap-3">
      {lastRefresh && (
        <span className="text-xs text-[var(--text-subtle)]">
          Updated {formatTimeAgo(lastRefresh)}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="px-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent-subtle)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        <svg
          className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isPending ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}
