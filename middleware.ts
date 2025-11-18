/**
 * Multi-Tenancy Middleware
 * Detects club from domain, subdomain, or path
 * Sets club context in headers for consumption by app
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Main domain (configure based on environment)
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'golf-tournament.com'
const isProd = process.env.NODE_ENV === 'production'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  let clubSlug: string | null = null
  let clubId: string | null = null

  // Skip middleware for certain paths
  if (
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next()
  }

  // Method 1: Check for custom domain
  if (hostname !== MAIN_DOMAIN && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    try {
      const club = await prisma.club.findFirst({
        where: { customDomain: hostname },
        select: { id: true, slug: true, isSuspended: true, isActive: true },
      })

      if (club) {
        if (club.isSuspended) {
          return new NextResponse('Club suspended', { status: 403 })
        }

        if (!club.isActive) {
          return new NextResponse('Club not active', { status: 403 })
        }

        clubId = club.id
        clubSlug = club.slug
      }
    } catch (error) {
      console.error('Error checking custom domain:', error)
    }
  }

  // Method 2: Check for subdomain (e.g., golfplatz-siek.golf-tournament.com)
  if (!clubSlug && hostname.includes(MAIN_DOMAIN)) {
    const subdomain = hostname.replace(`.${MAIN_DOMAIN}`, '').split(':')[0]

    if (subdomain && subdomain !== 'www' && subdomain !== MAIN_DOMAIN.split('.')[0]) {
      try {
        const club = await prisma.club.findUnique({
          where: { slug: subdomain },
          select: { id: true, slug: true, isSuspended: true, isActive: true },
        })

        if (club) {
          if (club.isSuspended) {
            return new NextResponse('Club suspended', { status: 403 })
          }

          if (!club.isActive) {
            return new NextResponse('Club not active', { status: 403 })
          }

          clubId = club.id
          clubSlug = club.slug
        }
      } catch (error) {
        console.error('Error checking subdomain:', error)
      }
    }
  }

  // Method 3: Check for path-based routing (/clubs/[slug])
  if (!clubSlug) {
    const clubsMatch = pathname.match(/^\/clubs\/([a-z0-9-]+)/)
    if (clubsMatch) {
      const slug = clubsMatch[1]

      try {
        const club = await prisma.club.findUnique({
          where: { slug },
          select: { id: true, slug: true, isSuspended: true, isActive: true },
        })

        if (club) {
          if (club.isSuspended) {
            return NextResponse.redirect(new URL('/club-suspended', request.url))
          }

          if (!club.isActive) {
            return NextResponse.redirect(new URL('/club-not-found', request.url))
          }

          clubId = club.id
          clubSlug = club.slug
        } else {
          // Club not found
          return NextResponse.redirect(new URL('/club-not-found', request.url))
        }
      } catch (error) {
        console.error('Error checking club slug:', error)
      }
    }
  }

  // Create response and add club context headers
  const response = NextResponse.next()

  if (clubId && clubSlug) {
    // Add club context to headers so it's available in the app
    response.headers.set('x-club-id', clubId)
    response.headers.set('x-club-slug', clubSlug)

    // Also set as cookie for client-side access
    response.cookies.set('club-id', clubId, {
      path: '/',
      sameSite: 'lax',
    })
    response.cookies.set('club-slug', clubSlug, {
      path: '/',
      sameSite: 'lax',
    })
  }

  // Protected routes - require authentication
  const protectedPaths = ['/admin', '/profile', '/scoring']
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtected) {
    // Check for auth session (simplified - you may want to use next-auth properly)
    const session = request.cookies.get('next-auth.session-token') ||
                    request.cookies.get('__Secure-next-auth.session-token')

    if (!session) {
      // Redirect to login
      const loginUrl = new URL('/api/auth/signin', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Super admin routes
  if (pathname.startsWith('/super-admin')) {
    // Additional checks for super admin access
    // This would integrate with your auth system
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
