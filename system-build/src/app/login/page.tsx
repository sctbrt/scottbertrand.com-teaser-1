// Login Page - Magic Link Authentication
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  // Check if user is already authenticated
  const session = await auth()
  const params = await searchParams

  if (session?.user) {
    // Redirect based on role
    if (session.user.role === 'INTERNAL_ADMIN') {
      redirect(params.callbackUrl || '/')
    } else {
      redirect(params.callbackUrl || '/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] dark:bg-[#1c1c1e] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#2c2c2e] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              Sign in to continue
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email to receive a secure sign-in link
            </p>
          </div>

          {params.error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {params.error === 'Verification' && 'The sign-in link has expired or is invalid.'}
                {params.error === 'AccessDenied' && 'Access denied. You may not have permission to sign in.'}
                {!['Verification', 'AccessDenied'].includes(params.error) && 'An error occurred. Please try again.'}
              </p>
            </div>
          )}

          <LoginForm callbackUrl={params.callbackUrl} />
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Scott Bertrand — Brand & Web Systems
        </p>
      </div>
    </div>
  )
}
