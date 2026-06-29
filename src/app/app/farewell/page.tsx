import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import FarewellClient from './FarewellClient'

export default async function FarewellPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/bankid')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('farewell_messages')
    .select('id, updated_at')
    .eq('user_id', user.userId)
    .maybeSingle()

  return (
    <FarewellClient
      initialData={{
        exists: !!data,
        savedAt: data?.updated_at ?? undefined,
      }}
    />
  )
}
