/**
 * Next.js Middleware — skyddar /app/* mot oinloggade användare
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session'

// Rutter som kräver inloggning
const PROTECTED_PATHS = ['/app']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/auth/bankid', request.url))
  }

  const session = await verifySessionToken(token)

  if (!session) {
    // Token ogiltig eller utgången — rensa cookie och skicka till login
    const response = NextResponse.redirect(new URL('/auth/bankid', request.url))
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  // Lägg session-info i request headers så server components kan läsa den
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', session.userId)
  requestHeaders.set('x-bankid-sub', session.bankidSub)
  if (session.fullName) requestHeaders.set('x-user-name', session.fullName)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/app/:path*'],
}
