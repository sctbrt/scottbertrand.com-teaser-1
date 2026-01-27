// TEMPORARY: Public endpoint to generate admin login link
// DELETE THIS FILE AFTER USE

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Admin emails that can use this endpoint
const ADMIN_EMAILS = [
  'hello@bertrandbrands.com',
  'bertrandbrands@outlook.com',
  'sctbrt01@gmail.com',
]

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')

  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    return NextResponse.json(
      { error: 'Invalid email' },
      { status: 400 }
    )
  }

  const normalizedEmail = email.toLowerCase()

  // Verify user exists
  const user = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, role: true },
  })

  if (!user || user.role !== 'INTERNAL_ADMIN') {
    return NextResponse.json(
      { error: 'User not found or not admin' },
      { status: 404 }
    )
  }

  // Generate a secure token
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Store the verification token
  await prisma.verification_tokens.create({
    data: {
      identifier: normalizedEmail,
      token: token,
      expires: expires,
    },
  })

  // Build the callback URL
  const host = request.headers.get('host') || 'dashboard.bertrandbrands.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const loginUrl = new URL('/api/auth/callback/resend', baseUrl)
  loginUrl.searchParams.set('token', token)
  loginUrl.searchParams.set('email', normalizedEmail)
  loginUrl.searchParams.set('callbackUrl', '/dashboard')

  return NextResponse.json({
    message: 'Login link generated. Use this link within 15 minutes.',
    url: loginUrl.toString(),
    expires: expires.toISOString(),
  })
}
