'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/encryption'

export async function saveFarewellMessage(formData: {
  message: string
  recipient?: string
}) {
  const user = await requireUser()
  const supabase = createAdminClient()

  // Kryptera meddelandet — zero-knowledge (vi kan inte läsa det)
  const messageEncrypted = await encrypt(formData.message)

  // Recipient krypteras också om det finns
  const recipientEncrypted = formData.recipient
    ? await encrypt(formData.recipient)
    : null

  // Upsert — en sista hälsning per användare (ersätt om den finns)
  const { error } = await supabase
    .from('farewell_messages')
    .upsert(
      {
        user_id: user.userId,
        message_encrypted: messageEncrypted,
        // Lagra recipient i image_url-kolumnen tillfälligt (MVP-kompromiss)
        // Fas 2: lägg till recipient_encrypted-kolumn
        image_url: recipientEncrypted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) throw new Error('Kunde inte spara meddelande: ' + error.message)
  revalidatePath('/app/farewell')
  revalidatePath('/app/dashboard')
}

export async function deleteFarewellMessage() {
  const user = await requireUser()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('farewell_messages')
    .delete()
    .eq('user_id', user.userId)

  if (error) throw new Error('Kunde inte ta bort meddelande: ' + error.message)
  revalidatePath('/app/farewell')
  revalidatePath('/app/dashboard')
}
