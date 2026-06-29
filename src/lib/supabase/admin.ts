/**
 * Supabase service role-klient — kringgår RLS
 * Används ENDAST server-side för känsliga operationer:
 * - Skapa/uppdatera användare efter BankID-autentisering
 * - SPAR-cron-jobb
 * - Audit-loggning
 *
 * Exporteras ALDRIG till klientsidan.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey || serviceRoleKey.length < 20) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY saknas. Hämta från: dashboard.supabase.com → Project Settings → API'
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
