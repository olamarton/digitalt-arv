import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import PasswordsClient from './PasswordsClient'

export default async function PasswordsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/bankid')

  const supabase = createAdminClient()
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, service_name, service_type, username, category, action')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })

  const normalized = (accounts ?? []).map((a) => ({
    id: a.id,
    service_name: a.service_name ?? '',
    service_type: a.service_type ?? 'custom',
    username: a.username,
    category: a.category ?? 'other',
    action: a.action ?? 'nothing',
  }))

  return <PasswordsClient initialAccounts={normalized} />
}
