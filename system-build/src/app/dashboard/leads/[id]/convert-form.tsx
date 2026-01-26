'use client'

// Convert Lead to Client Form
import { useActionState } from 'react'
import { convertToClient } from '@/lib/actions/leads'

interface ConvertToClientFormProps {
  lead: {
    id: string
    email: string
    name: string | null
    companyName: string | null
    phone: string | null
    website: string | null
  }
  templates: {
    id: string
    name: string
    slug: string
  }[]
}

export function ConvertToClientForm({ lead, templates }: ConvertToClientFormProps) {
  const action = convertToClient.bind(null, lead.id)
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Create a client account for{' '}
        <strong>{lead.name || lead.email}</strong>. They will receive portal
        access via magic link at their email address.
      </p>

      <div>
        <label
          htmlFor="contactName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Contact Name *
        </label>
        <input
          type="text"
          id="contactName"
          name="contactName"
          required
          defaultValue={lead.name || ''}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="companyName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Company Name
        </label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          defaultValue={lead.companyName || ''}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-sm"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            name="createProject"
            value="true"
            defaultChecked
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Create an initial project
        </label>
      </div>

      <div>
        <label
          htmlFor="projectName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Project Name
        </label>
        <input
          type="text"
          id="projectName"
          name="projectName"
          defaultValue={lead.companyName ? `${lead.companyName} Website` : 'New Project'}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="templateId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Service Template
        </label>
        <select
          id="templateId"
          name="templateId"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-sm"
        >
          <option value="">Custom Project</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Converting...' : 'Convert to Client'}
      </button>
    </form>
  )
}
