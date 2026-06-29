import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import SocialClient from './SocialClient'

export default async function SocialPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/bankid')

  const supabase = createAdminClient()
  const { data: entries } = await supabase
    .from('social_platforms')
    .select('id, platform_type, platform_name, username, action')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })

  const normalized = (entries ?? []).map((e) => ({
    id: e.id,
    platform_type: e.platform_type ?? '',
    platform_name: e.platform_name ?? '',
    username: e.username,
    action: e.action ?? 'nothing',
  }))

  return <SocialClient initialEntries={normalized} />
}
