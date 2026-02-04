'use client'

// Generate Login Link Button - For clients who can't receive magic link emails
import { useState } from 'react'

interface GenerateLoginLinkProps {
  email: string
}

export function GenerateLoginLink({ email }: GenerateLoginLinkProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    url?: string
    expiresInMinutes?: number
    error?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setIsLoading(true)
    setResult(null)
    setCopied(false)

    try {
      const response = await fetch('/api/admin/generate-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ error: data.error || 'Failed to generate link' })
      } else {
        setResult({
          url: data.url,
          expiresInMinutes: data.expiresInMinutes,
        })
      }
    } catch {
      setResult({ error: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopy() {
    if (result?.url) {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <p className="text-xs text-[var(--text-muted)] mb-3">
        If the client can&apos;t receive magic link emails, generate a one-time login link to send them directly.
      </p>

      {!result?.url && (
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm font-medium text-[var(--text)] bg-[var(--surface-2)] rounded-lg hover:bg-[var(--accent-subtle)] disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Login Link'}
        </button>
      )}

      {result?.error && (
        <div className="mt-3 p-3 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg">
          <p className="text-sm text-[var(--error-text)]">{result.error}</p>
        </div>
      )}

      {result?.url && (
        <div className="mt-3 space-y-3">
          <div className="p-3 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-lg">
            <p className="text-xs text-[var(--success-text)] mb-2">
              Link generated! Expires in {result.expiresInMinutes} minutes.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={result.url}
                className="flex-1 px-2 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded font-mono truncate"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setResult(null)
              setCopied(false)
            }}
            className="w-full px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Generate New Link
          </button>
        </div>
      )}
    </div>
  )
}
