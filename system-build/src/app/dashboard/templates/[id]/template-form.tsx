'use client'

// Service Template Form Component for Create/Edit
import { useActionState, useState } from 'react'
import { createTemplate, updateTemplate } from '@/lib/actions/templates'

import type { Decimal } from '@prisma/client/runtime/library'

type DecimalLike = Decimal | string | number

interface ChecklistItem {
  title: string
  description?: string
}

interface TemplateFormProps {
  template?: {
    id: string
    name: string
    slug: string
    description: string | null
    price: DecimalLike
    currency: string
    estimatedDays: number | null
    isActive: boolean
    scope: unknown // Prisma JsonValue - cast internally
    deliverables: unknown // Prisma JsonValue - cast internally
    checklistItems: unknown // Prisma JsonValue - cast internally
  }
}

export function TemplateForm({ template }: TemplateFormProps) {
  const action = template ? updateTemplate.bind(null, template.id) : createTemplate
  const [state, formAction, isPending] = useActionState(action, null)

  const [scope, setScope] = useState<string[]>((template?.scope as string[] | null) || [])
  const [deliverables, setDeliverables] = useState<string[]>((template?.deliverables as string[] | null) || [])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>((template?.checklistItems as ChecklistItem[] | null) || [])

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden JSON fields */}
      <input type="hidden" name="scope" value={JSON.stringify(scope)} />
      <input type="hidden" name="deliverables" value={JSON.stringify(deliverables)} />
      <input type="hidden" name="checklistItems" value={JSON.stringify(checklistItems)} />

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Template Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={template?.name || ''}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Slug *
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          required
          defaultValue={template?.slug || ''}
          placeholder="e.g., brand-identity"
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Used for URLs and references
        </p>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-[var(--text)] mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={template?.description || ''}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-[var(--text)] mb-1"
          >
            Price *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            required
            min="0"
            step="0.01"
            defaultValue={template?.price ? Number(template.price) : ''}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label
            htmlFor="estimatedDays"
            className="block text-sm font-medium text-[var(--text)] mb-1"
          >
            Est. Days
          </label>
          <input
            type="number"
            id="estimatedDays"
            name="estimatedDays"
            min="1"
            defaultValue={template?.estimatedDays || ''}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Scope Items */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">
          Scope Items
        </label>
        <div className="space-y-2">
          {scope.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...scope]
                  updated[index] = e.target.value
                  setScope(updated)
                }}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] text-sm"
              />
              <button
                type="button"
                onClick={() => setScope(scope.filter((_, i) => i !== index))}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setScope([...scope, ''])}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            + Add Scope Item
          </button>
        </div>
      </div>

      {/* Deliverables */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">
          Deliverables
        </label>
        <div className="space-y-2">
          {deliverables.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...deliverables]
                  updated[index] = e.target.value
                  setDeliverables(updated)
                }}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] text-sm"
              />
              <button
                type="button"
                onClick={() => setDeliverables(deliverables.filter((_, i) => i !== index))}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDeliverables([...deliverables, ''])}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            + Add Deliverable
          </button>
        </div>
      </div>

      {/* Default Checklist */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">
          Default Checklist (auto-created when assigned to project)
        </label>
        <div className="space-y-2">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item.title}
                placeholder="Task title"
                onChange={(e) => {
                  const updated = [...checklistItems]
                  updated[index] = { ...updated[index], title: e.target.value }
                  setChecklistItems(updated)
                }}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] text-sm"
              />
              <button
                type="button"
                onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== index))}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setChecklistItems([...checklistItems, { title: '' }])}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            + Add Checklist Item
          </button>
        </div>
      </div>

      {/* Active Toggle */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={template?.isActive ?? true}
          className="rounded border-[var(--border)]"
        />
        <span className="text-sm text-[var(--text)]">
          Active (available for new projects)
        </span>
      </label>

      {state?.error && (
        <div className="p-3 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg">
          <p className="text-sm text-[var(--error-text)]">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="p-3 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-lg">
          <p className="text-sm text-[var(--success-text)]">
            {template ? 'Template updated successfully' : 'Template created successfully'}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
      </button>
    </form>
  )
}
