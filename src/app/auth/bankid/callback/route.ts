/**
 * GET /auth/bankid/callback
 * Hanterar OIDC-callback från Idura:
 * 1. Validerar state (CSRF)
 * 2. Byter code mot token
 * 3. Avkodar id_token → personnummer, namn
 * 4. Upsert user i Supabase
 * 5. Skapar session-cookie
 * 6. Redirectar till dashboard
 */
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, decodeIdToken, extractPersonnummer } from '@/lib/bankid/idura'
import { createSessionToken, SESSION_COOKIE } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Idura rapporterade fel
  if (error) {
    console.error('BankID auth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth/bankid?error=${encodeURIComponent(errorDescription ?? error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/auth/bankid?error=Ogiltig+callback', request.url))
  }

  // CSRF-validering: kontrollera state mot cookie
  const storedState = request.cookies.get('bankid_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/auth/bankid?error=Säkerhetsfel', request.url))
  }

  try {
    // Byt authorization code mot tokens
    const tokens = await exchangeCodeForToken(code)

    // Avkoda id_token
    const claims = decodeIdToken(tokens.id_token)
    const personnummer = extractPersonnummer(claims.sub)
    const fullName = claims.name ?? null

    // Kryptera personnummer för lagring
    const personnummerEncrypted = personnummer ? await encrypt(personnummer) : null

    // Upsert användare i Supabase (service role kringgår RLS)
    const supabase = createAdminClient()
    const { data: user, error: dbError } = await supabase
      .from('users')
      .upsert(
        {
          bankid_sub: claims.sub,
          personnummer: personnummerEncrypted,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'bankid_sub',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single()

    if (dbError || !user) {
      console.error('Supabase upsert error:', dbError)
      throw new Error('Kunde inte skapa användarkonto')
    }

    // Logga inloggning i audit_log
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip')
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'bankid_login',
      resource_type: 'session',
      ip_address: ip,
    })

    // Skapa session-token
    const sessionToken = await createSessionToken({
      userId: user.id,
      bankidSub: claims.sub,
      fullName,
      personnummer,
    })

    // Sätt session-cookie och redirecta till dashboard
    const response = NextResponse.redirect(new URL('/app/dashboard', request.url))

    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dagar
      path: '/',
    })

    // Rensa state-cookie
    response.cookies.delete('bankid_state')

    return response
  } catch (err) {
    console.error('BankID callback error:', err)
    return NextResponse.redirect(
      new URL('/auth/bankid?error=Inloggningen+misslyckades', request.url)
    )
  }
}
