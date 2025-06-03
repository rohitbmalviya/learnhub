// ============================================================
// LearnHub — Next.js 16 Proxy (replaces middleware.ts)
//
// Route protection:
//  /learn/*        → any authenticated user (STUDENT or INSTRUCTOR)
//  /dashboard      → any authenticated user
//  /instructor     → INSTRUCTOR role only → students redirected to /dashboard
//  /instructor/*   → INSTRUCTOR role only → students redirected to /dashboard
//  /login          → redirect to role-appropriate dashboard if already logged in
//  /register       → redirect to role-appropriate dashboard if already logged in
//
// Unauthenticated users hitting protected routes →
//   /login?next=<pathname>
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'lh_session'

function getEncodedSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? ''
  return new TextEncoder().encode(secret)
}

interface SessionClaims {
  userId: string
  role: 'STUDENT' | 'INSTRUCTOR'
  expiresAt: number
}

async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret(), {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionClaims
  } catch {
    return null
  }
}

// Route prefix lists
const AUTH_REQUIRED_ROUTES = ['/learn', '/dashboard']
const INSTRUCTOR_ONLY_ROUTES = ['/instructor']
const PUBLIC_AUTH_ROUTES = ['/login', '/register']

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  const cookieToken = request.cookies.get(COOKIE_NAME)?.value
  const session = cookieToken ? await verifySession(cookieToken) : null
  const isAuthed = session !== null

  // Authenticated users visiting /login or /register → redirect to role dashboard
  if (isAuthed && matchesPrefix(pathname, PUBLIC_AUTH_ROUTES)) {
    const destination =
      session.role === 'INSTRUCTOR' ? '/instructor' : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // /instructor, /instructor/* → must be INSTRUCTOR role
  if (matchesPrefix(pathname, INSTRUCTOR_ONLY_ROUTES)) {
    if (!isAuthed) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.role !== 'INSTRUCTOR') {
      // STUDENT trying to access instructor routes → redirect to their dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // /learn/*, /dashboard → any authenticated user
  if (matchesPrefix(pathname, AUTH_REQUIRED_ROUTES)) {
    if (!isAuthed) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public assets (*.png, *.svg, *.jpg, *.ico, *.webp)
     * - /api routes   (handled by route handlers)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$|api/).*)',
  ],
}
