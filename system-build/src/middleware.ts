// SCOTTBERTRAND.COM — Host-Based Routing Middleware
// Routes requests based on subdomain to appropriate sections

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Domain configuration
const DOMAINS: Record<string, string[]> = {
  // Production domains
  PUBLIC: ['scottbertrand.com', 'www.scottbertrand.com'],
  NOTES: ['notes.scottbertrand.com'],
  GOODS: ['goods.scottbertrand.com'],
  DASHBOARD: ['dashboard.scottbertrand.com'],
  PORTAL: ['clients.scottbertrand.com'],

  // Development patterns
  DEV_PUBLIC: ['localhost', '127.0.0.1'],
  DEV_DASHBOARD: ['dashboard.localhost'],
  DEV_PORTAL: ['clients.localhost'],
}

// Protected paths that require authentication
const PROTECTED_PATHS = {
  dashboard: ['/'],
  portal: ['/'],
}

// Public paths that don't require auth (login pages, etc.)
const AUTH_PATHS = ['/login', '/auth', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Remove port from hostname for matching
  const host = hostname.split(':')[0]

  // Determine which site we're on
  const siteType = getSiteType(host)

  // Skip middleware for static files and API routes (except protected ones)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  // Create response with site context header
  const response = NextResponse.next()
  response.headers.set('x-site-type', siteType)

  // Handle dashboard routing
  if (siteType === 'dashboard') {
    return handleDashboardRouting(request, pathname)
  }

  // Handle portal routing
  if (siteType === 'portal') {
    return handlePortalRouting(request, pathname)
  }

  // Handle notes subdomain
  if (siteType === 'notes') {
    return handleNotesRouting(request, pathname)
  }

  // Handle goods subdomain
  if (siteType === 'goods') {
    return handleGoodsRouting(request, pathname)
  }

  // Public site - no auth required
  return response
}

function getSiteType(host: string): 'public' | 'dashboard' | 'portal' | 'notes' | 'goods' {
  // Dashboard
  if (DOMAINS.DASHBOARD.includes(host) || host.startsWith('dashboard.')) {
    return 'dashboard'
  }

  // Portal
  if (DOMAINS.PORTAL.includes(host) || host.startsWith('clients.')) {
    return 'portal'
  }

  // Notes
  if (DOMAINS.NOTES.includes(host) || host.startsWith('notes.')) {
    return 'notes'
  }

  // Goods
  if (DOMAINS.GOODS.includes(host) || host.startsWith('goods.')) {
    return 'goods'
  }

  // Default to public
  return 'public'
}

async function handleDashboardRouting(request: NextRequest, pathname: string) {
  // Allow auth routes without authentication
  if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = `/dashboard${pathname}`
    return NextResponse.rewrite(url)
  }

  // Check for session token (Auth.js cookie)
  const sessionToken = request.cookies.get('authjs.session-token')?.value ||
                       request.cookies.get('__Secure-authjs.session-token')?.value

  if (!sessionToken) {
    // Redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Rewrite to dashboard route group
  const url = request.nextUrl.clone()
  url.pathname = `/dashboard${pathname}`
  return NextResponse.rewrite(url)
}

async function handlePortalRouting(request: NextRequest, pathname: string) {
  // Allow auth routes without authentication
  if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = `/portal${pathname}`
    return NextResponse.rewrite(url)
  }

  // Check for session token (Auth.js cookie)
  const sessionToken = request.cookies.get('authjs.session-token')?.value ||
                       request.cookies.get('__Secure-authjs.session-token')?.value

  if (!sessionToken) {
    // Redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Rewrite to portal route group
  const url = request.nextUrl.clone()
  url.pathname = `/portal${pathname}`
  return NextResponse.rewrite(url)
}

async function handleNotesRouting(request: NextRequest, pathname: string) {
  // Rewrite to notes route group (public, no auth)
  const url = request.nextUrl.clone()
  url.pathname = `/notes${pathname}`
  return NextResponse.rewrite(url)
}

async function handleGoodsRouting(request: NextRequest, pathname: string) {
  // Rewrite to goods route group (public, no auth)
  const url = request.nextUrl.clone()
  url.pathname = `/goods${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
