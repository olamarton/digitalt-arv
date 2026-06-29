import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import WhiteArchiveClient from './WhiteArchiveClient'

export const metadata = { title: 'Vita Arkivet' }

export default async function WhiteArchivePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/bankid')

  const supabase = createAdminClient()
  const { data: wishes } = await supabase
    .from('white_archive')
    .select('*')
    .eq('user_id', user.userId)
    .maybeSingle()

  const mapped = wishes
    ? {
        funeral_type:       wishes.funeral_type       ?? 'no_pref',
        ceremony_location:  wishes.ceremony_location  ?? '',
        music_wishes:       wishes.music_wishes       ?? '',
        flower_wishes:      wishes.flower_wishes      ?? '',
        donation_org:       wishes.donation_org       ?? '',
        obituary_text:      wishes.obituary_text      ?? '',
        grave_or_urn:       wishes.grave_or_urn       ?? 'no_pref',
        other_wishes:       wishes.other_wishes       ?? '',
      }
    : null

  return <WhiteArchiveClient initialWishes={mapped} />
}
