// Status Pill - Portal stage indicator
import type { PortalStage } from '@prisma/client'

interface StatusPillProps {
  stage: PortalStage
}

const stageConfig: Record<PortalStage, { label: string; className: string }> = {
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
  },
  IN_DELIVERY: {
    label: 'In Delivery',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  IN_REVIEW: {
    label: 'In Review',
    className: 'bg-[var(--accent-muted)] text-[var(--accent)]',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  },
  RELEASED: {
    label: 'Released',
    className: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  },
  COMPLETE: {
    label: 'Complete',
    className: 'bg-[var(--surface-2)] text-[var(--text)]',
  },
}

export function StatusPill({ stage }: StatusPillProps) {
  const config = stageConfig[stage]

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-xs font-medium uppercase tracking-wide
        ${config.className}
      `}
    >
      {config.label}
    </span>
  )
}
