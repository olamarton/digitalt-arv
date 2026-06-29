'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/encryption'

export async function addAccount(formData: {
  service_name: string
  service_type: string
  username: string
  password: string
  category: string
  action: string
}) {
  const user = await requireUser()
  const supabase = createAdminClient()

  // Kryptera lösenord server-side med AES-256
  const passwordEncrypted = formData.password
    ? await encrypt(formData.password)
    : null

  const { error } = await supabase.from('accounts').insert({
    user_id: user.userId,
    service_type: formData.service_type,
    service_name: formData.service_name,
    username: formData.username || null,
    password_encrypted: passwordEncrypted,
    category: formData.category,
    action: formData.action,
  })

  if (error) throw new Error('Kunde inte spara konto: ' + error.message)
  revalidatePath('/app/passwords')
  revalidatePath('/app/dashboard')
}

export async function addAccounts(entries: Array<{
  service_name: string
  service_type: string
  username: string
  password: string
  category: string
  action: string
}>) {
  const user = await requireUser()
  const supabase = createAdminClient()

  const rows = await Promise.all(
    entries.map(async (e) => ({
      user_id: user.userId,
      service_type: e.service_type,
      service_name: e.service_name,
      username: e.username || null,
      password_encrypted: e.password ? await encrypt(e.password) : null,
      category: e.category,
      action: e.action,
    }))
  )

  const { error } = await supabase.from('accounts').insert(rows)
  if (error) throw new Error('Kunde inte spara konton: ' + error.message)
  revalidatePath('/app/passwords')
  revalidatePath('/app/dashboard')
  return rows.length
}

export async function deleteAccount(id: string) {
  const user = await requireUser()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.userId)

  if (error) throw new Error('Kunde inte ta bort konto: ' + error.message)
  revalidatePath('/app/passwords')
  revalidatePath('/app/dashboard')
}
