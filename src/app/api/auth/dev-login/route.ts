/**
 * GET /api/auth/dev-login
 * DEV-ONLY: Simulerar BankID-login utan riktig autentisering.
 * Finns INTE i produktion — blockeras av miljökontroll.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, hashPersonnummer } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Ej tillgänglig i produktion' }, { status: 403 })
  }

  const TEST_PERSONNUMMER = '198001011234'
  const TEST_NAME = 'Test Testsson'
  const TEST_SUB = `urn:grn:authn:se:bankid:pno:${TEST_PERSONNUMMER}`

  try {
    const supabase = createAdminClient()

    const personnummerEncrypted = await encrypt(TEST_PERSONNUMMER)
    const personnummerHash = await hashPersonnummer(TEST_PERSONNUMMER)

    // Upsert testanvändare
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          bankid_sub: TEST_SUB,
          personnummer: personnummerEncrypted,
          full_name: TEST_NAME,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'bankid_sub', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (error || !user) throw new Error('Kunde inte skapa testanvändare')

    // Säkerställ att spar_checks finns för testanvändaren
    await supabase.from('spar_checks').upsert(
      {
        user_id: user.id,
        personnummer_hash: personnummerHash,
        status: 'alive',
      },
      { onConflict: 'user_id' }
    )

    const sessionToken = await createSessionToken({
      userId: user.id,
      bankidSub: TEST_SUB,
      fullName: TEST_NAME,
      personnummer: TEST_PERSONNUMMER,
    })

    const response = NextResponse.redirect(new URL('/app/dashboard', request.url))
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Dev-login error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
