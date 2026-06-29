/**
 * Idura/Criipto BankID OIDC-helpers
 * Dokumentation: https://docs.criipto.com
 */

const DOMAIN = process.env.BANKID_DOMAIN!
const CLIENT_ID = process.env.BANKID_CLIENT_ID!
const CLIENT_SECRET = process.env.BANKID_CLIENT_SECRET!
const REDIRECT_URI = process.env.BANKID_REDIRECT_URI!

export const IDURA_BASE_URL = `https://${DOMAIN}`

// ACR-värden för Svensk BankID
export const ACR_BANKID_SAME_DEVICE = 'urn:grn:authn:se:bankid:same-device'
export const ACR_BANKID_QR = 'urn:grn:authn:se:bankid:another-device:qr'

/**
 * Bygg authorize-URL för att starta BankID-login
 */
export function buildAuthorizeUrl(state: string, acrValues = ACR_BANKID_QR): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid',
    acr_values: acrValues,
    state,
  })
  return `${IDURA_BASE_URL}/oauth2/authorize?${params.toString()}`
}

/**
 * Byt authorization code mot id_token + access_token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  id_token: string
  access_token: string
  token_type: string
  expires_in: number
}> {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  const response = await fetch(`${IDURA_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

export interface IduraClaims {
  sub: string          // t.ex. "urn:grn:authn:se:bankid:pno:198001011234"
  name?: string        // Fullständigt namn
  given_name?: string
  family_name?: string
  birthdate?: string   // YYYY-MM-DD
  iss: string
  aud: string
  exp: number
  iat: number
  [key: string]: unknown
}

/**
 * Avkoda JWT-payload (utan signaturverifiering — server-side token exchange garanterar äkthet)
 * För extra säkerhet i produktion: verifiera med Iduras JWKS-endpoint
 */
export function decodeIdToken(idToken: string): IduraClaims {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Ogiltig JWT-struktur')
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
  return JSON.parse(payload) as IduraClaims
}

/**
 * Extrahera personnummer från Iduras sub-claim
 * Format: "urn:grn:authn:se:bankid:pno:XXXXXXXXXX"
 */
export function extractPersonnummer(sub: string): string | null {
  const match = sub.match(/pno:(\d{10,12})$/)
  return match ? match[1] : null
}
