/**
 * Server-side auth helper
 * Läs session från httpOnly-cookie i Server Components och Server Actions
 */
import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE, type SessionData } from './session'

export async function getCurrentUser(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Kasta fel om ej inloggad — använd i Server Actions */
export async function requireUser(): Promise<SessionData> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Ej inloggad')
  return user
}
