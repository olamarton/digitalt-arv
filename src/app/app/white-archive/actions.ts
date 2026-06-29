'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function saveWishes(data: {
  funeral_type: string
  ceremony_location: string
  music_wishes: string
  flower_wishes: string
  donation_org: string
  obituary_text: string
  grave_or_urn: string
  other_wishes: string
}) {
  const user = await requireUser()
  const supabase = createAdminClient()

  // Upsert — ett Vita Arkivet per användare
  const { error } = await supabase
    .from('white_archive')
    .upsert(
      {
        user_id: user.userId,
        funeral_type:      data.funeral_type,
        ceremony_location: data.ceremony_location || null,
        music_wishes:      data.music_wishes || null,
        flower_wishes:     data.flower_wishes || null,
        donation_org:      data.donation_org || null,
        obituary_text:     data.obituary_text || null,
        grave_or_urn:      data.grave_or_urn,
        other_wishes:      data.other_wishes || null,
        updated_at:        new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) throw new Error('Kunde inte spara önskemål: ' + error.message)
  revalidatePath('/app/white-archive')
  revalidatePath('/app/dashboard')
}
