'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function addSocialPlatform(formData: {
  platform_type: string
  platform_name: string
  username: string
  action: string
}) {
  const user = await requireUser()
  const supabase = createAdminClient()

  const { error } = await supabase.from('social_platforms').insert({
    user_id: user.userId,
    platform_type: formData.platform_type,
    platform_name: formData.platform_name,
    username: formData.username || null,
    action: formData.action,
  })

  if (error) throw new Error('Kunde inte spara konto: ' + error.message)
  revalidatePath('/app/social')
  revalidatePath('/app/dashboard')
}

export async function deleteSocialPlatform(id: string) {
  const user = await requireUser()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('social_platforms')
    .delete()
    .eq('id', id)
    .eq('user_id', user.userId)

  if (error) throw new Error('Kunde inte ta bort konto: ' + error.message)
  revalidatePath('/app/social')
  revalidatePath('/app/dashboard')
}
