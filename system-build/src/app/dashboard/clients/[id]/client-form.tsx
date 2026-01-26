'use client'

// Client Form Component for Create/Edit
import { useActionState } from 'react'
import { createClient, updateClient } from '@/lib/actions/clients'

interface ClientFormProps {
  client?: {
    id: string
    companyName: string | null
    contactName: string
    contactEmail: string
    phone: string | null
    website: string | null
    notes: string | null
  }
}

export function ClientForm({ client }: ClientFormProps) {
  const action = client ? updateClient.bind(null, client.id) : createClient
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            defaultValue={client?.contactName || ''}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
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
            defaultValue={client?.companyName || ''}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contactEmail"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="contactEmail"
          name="contactEmail"
          required
          defaultValue={client?.contactEmail || ''}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
        />
        {!client && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This will be used for portal login (magic link)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={client?.phone || ''}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
          />
        </div>
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            placeholder="https://"
            defaultValue={client?.website || ''}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={client?.notes || ''}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 resize-none"
        />
      </div>

      {state?.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
            {client ? 'Client updated successfully' : 'Client created successfully'}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
      </button>
    </form>
  )
}
