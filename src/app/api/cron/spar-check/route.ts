/**
 * GET /api/cron/spar-check
 *
 * Veckovis SPAR-bevakning via Vercel Cron Jobs.
 * Körs varje måndag kl. 03:00 (konfigurerat i vercel.json).
 *
 * Flöde:
 * 1. Hämta alla aktiva användare med personnummer
 * 2. Slå upp varje personnummer i SPAR via Roaring.io
 * 3. Uppdatera spar_checks-tabellen
 * 4. Om deceased: logga + starta 72h-verifiering (Fas 2)
 *
 * Freemium-logik:
 * - Premium/Lifetime: agera direkt vid bortgång
 * - Free-tier: 6 månaders fördröjning innan leverans av instruktioner
 *   (men vi bevakar och registrerar alla tiers)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt, hashPersonnummer } from '@/lib/encryption'
import { lookupPersonSPAR } from '@/lib/roaring/spar'

// Säkra cron-endpointen — Vercel skickar med CRON_SECRET i header
function isCronAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    // I development — tillåt utan autentisering
    if (process.env.NODE_ENV === 'development') return true
    console.error('CRON_SECRET saknas i miljövariabler')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const startTime = Date.now()
  const results = { checked: 0, deceased: 0, errors: 0, skipped: 0 }

  console.log('[SPAR-cron] Startar veckovis SPAR-check...')

  // Hämta alla aktiva användare med personnummer
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, personnummer, full_name, subscription_tier')
    .is('deleted_at', null)
    .not('personnummer', 'is', null)

  if (usersError || !users) {
    console.error('[SPAR-cron] Kunde inte hämta användare:', usersError)
    return NextResponse.json({ error: 'Databasfel' }, { status: 500 })
  }

  console.log(`[SPAR-cron] ${users.length} användare att kontrollera`)

  for (const user of users) {
    try {
      // Dekryptera personnummer
      const personnummer = await decrypt(user.personnummer!)

      // Kolla om vi redan kontrollerat denna användare inom 6 dagar (undvik dubbelkörning)
      const { data: recentCheck } = await supabase
        .from('spar_checks')
        .select('checked_at')
        .eq('user_id', user.id)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single()

      if (recentCheck?.checked_at) {
        const daysSinceLastCheck = (Date.now() - new Date(recentCheck.checked_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLastCheck < 6) {
          results.skipped++
          continue
        }
      }

      // Slå upp i SPAR
      const sparResult = await lookupPersonSPAR(personnummer)
      const personnummerHash = await hashPersonnummer(personnummer)

      const status = sparResult.deceased ? 'deceased' : 'alive'

      // Spara resultatet i spar_checks
      await supabase.from('spar_checks').insert({
        user_id: user.id,
        personnummer_hash: personnummerHash,
        status,
        checked_at: new Date().toISOString(),
        deceased_date: sparResult.deceasedDate ?? null,
      })

      // Logga i audit_log
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'spar_check',
        resource_type: 'spar_checks',
        resource_id: null,
      })

      results.checked++

      if (sparResult.deceased) {
        results.deceased++
        console.warn(`[SPAR-cron] ⚠️ Bortgång detekterad för user_id: ${user.id}`)

        // TODO Fas 2: Starta 72h verifieringsprocess
        // - Skicka intern notifikation till admin
        // - Sätt user status till 'pending_verification'
        // - Schemalägg leverans av meddelanden (premium: direkt, free: +6 månader)
        // await triggerDeceasedWorkflow(user, sparResult)
      }

    } catch (err) {
      results.errors++
      console.error(`[SPAR-cron] Fel för user_id ${user.id}:`, err)
      // Fortsätt med nästa användare — enskilda fel stoppar inte körningen
    }
  }

  const duration = Date.now() - startTime
  console.log(`[SPAR-cron] Klar på ${duration}ms:`, results)

  return NextResponse.json({
    ok: true,
    duration_ms: duration,
    ...results,
  })
}
