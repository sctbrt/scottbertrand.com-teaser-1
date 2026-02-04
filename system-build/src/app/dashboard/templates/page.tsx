// Dashboard - Service Templates Management Page
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function TemplatesPage() {
  const templates = await prisma.service_templates.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { projects: true, leads: true },
      },
    },
  })

  const activeTemplates = templates.filter((t) => t.isActive)
  const inactiveTemplates = templates.filter((t) => !t.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            Service Templates
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Define reusable service packages with pricing and deliverables
          </p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="px-4 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-85 transition-colors"
        >
          New Template
        </Link>
      </div>

      {/* Active Templates */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Active Templates ({activeTemplates.length})
        </h2>
        {activeTemplates.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-8 text-center">
            <p className="text-[var(--text-muted)]">
              No active templates. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>

      {/* Inactive Templates */}
      {inactiveTemplates.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Inactive Templates ({inactiveTemplates.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {inactiveTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import type { Decimal } from '@prisma/client/runtime/library'

type DecimalLike = Decimal | string | number

function TemplateCard({
  template,
}: {
  template: {
    id: string
    name: string
    slug: string
    description: string | null
    price: DecimalLike
    currency: string
    estimatedDays: number | null
    isActive: boolean
    scope: unknown // Prisma JsonValue
    deliverables: unknown // Prisma JsonValue
    _count: {
      projects: number
      leads: number
    }
  }
}) {
  const scope = (template.scope as string[] | null) || []
  const deliverables = (template.deliverables as string[] | null) || []

  return (
    <Link
      href={`/dashboard/templates/${template.id}`}
      className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-5 hover:border-[var(--accent-muted)] transition-colors block"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[var(--text)]">
            {template.name}
          </h3>
          <p className="text-xs text-[var(--text-subtle)] mt-0.5">
            /{template.slug}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${template.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-500/20 text-zinc-400'}`}>
          {template.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {template.description && (
        <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-2xl font-semibold text-[var(--text)]">
          {formatCurrency(Number(template.price))}
        </span>
        <span className="text-sm text-[var(--text-muted)]">
          {template.currency}
        </span>
        {template.estimatedDays && (
          <span className="text-sm text-[var(--text-subtle)] ml-2">
            · {template.estimatedDays} days
          </span>
        )}
      </div>

      {/* Scope Preview */}
      {scope.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-[var(--text-subtle)] mb-1">Scope</p>
          <div className="flex flex-wrap gap-1">
            {scope.slice(0, 3).map((item, i) => (
              <span key={i} className="text-xs bg-[var(--surface-2)] text-[var(--text-muted)] px-2 py-0.5 rounded">
                {item}
              </span>
            ))}
            {scope.length > 3 && (
              <span className="text-xs text-[var(--text-subtle)]">
                +{scope.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span>{template._count.projects} projects</span>
        <span>{template._count.leads} leads</span>
        {deliverables.length > 0 && (
          <span>{deliverables.length} deliverables</span>
        )}
      </div>
    </Link>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
