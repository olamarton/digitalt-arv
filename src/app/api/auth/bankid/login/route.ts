/**
 * GET /api/auth/bankid/login
 * Startar BankID OIDC-flödet — genererar state och redirectar till Idura
 */
import { NextResponse } from 'next/server'
import { buildAuthorizeUrl, ACR_BANKID_SAME_DEVICE } from '@/lib/bankid/idura'
import { randomBytes } from 'crypto'

export async function GET() {
  // Generera CSRF-skyddande state
  const state = randomBytes(32).toString('hex')

  // Bygg Idura authorize-URL
  // Same-device: startar BankID-appen direkt på samma enhet (desktop-fil eller mobilapp)
  // QR-flödet (ACR_BANKID_QR) används i produktion när användaren har BankID på annan enhet
  const authorizeUrl = buildAuthorizeUrl(state, ACR_BANKID_SAME_DEVICE)

  // Lagra state i kortlivad cookie för CSRF-verifiering i callback
  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set('bankid_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minuter
    path: '/',
  })

  return response
}
