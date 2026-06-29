/**
 * Session-hantering med signerade JWT-cookies (jose)
 * Ersätter Supabase Auth — vi använder BankID via Idura direkt
 */
import { SignJWT, jwtVerify } from 'jose'

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)
export const SESSION_COOKIE = 'da_session'
const SESSION_DURATION = '30d'

export interface SessionData {
  userId: string       // Supabase users.id (UUID)
  bankidSub: string   // Idura sub-claim
  fullName: string | null
  personnummer: string | null  // Krypterat i DB, klartext i session (httpOnly cookie)
}

/**
 * Skapa signerad session-token
 */
export async function createSessionToken(data: SessionData): Promise<string> {
  return new SignJWT(data as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(SESSION_SECRET)
}

/**
 * Verifiera och avkoda session-token
 */
export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    return payload as unknown as SessionData
  } catch {
    return null
  }
}
