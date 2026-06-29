/**
 * Roaring.io SPAR-integration
 * Dokumentation: https://developer.roaring.io
 *
 * Autentisering: OAuth2 client_credentials
 * Endpoint: https://api.roaring.io/se/person/1.0/{personnummer}
 *
 * SPAR (Statens personadressregister) innehåller folkbokföringsdata
 * inklusive om en person har avregistrerats (avlidit).
 *
 * MOCK-LÄGE: Aktiveras automatiskt i development när ROARING_API_KEY saknas.
 * Sätt ROARING_MOCK=true för att tvinga mock även med API-nyckel.
 * Sätt ROARING_MOCK_DECEASED=true för att simulera en bortgång.
 */

const ROARING_API_BASE = 'https://api.roaring.io'
const ROARING_TOKEN_URL = `${ROARING_API_BASE}/token`
const ROARING_PERSON_URL = `${ROARING_API_BASE}/se/person/1.0`

// Token-cache — återanvänd inom giltighetsperioden
let cachedToken: { token: string; expiresAt: number } | null = null

export interface SPARResult {
  personnummer: string
  alive: boolean
  deceased: boolean
  deceasedDate: string | null
  name: string | null
  rawResponse: unknown
  mock?: boolean
}

// ---------------------------------------------------------------------------
// MOCK-läge — används i development utan API-nyckel
// ---------------------------------------------------------------------------

function isMockMode(): boolean {
  if (process.env.ROARING_MOCK === 'true') return true
  if (process.env.NODE_ENV === 'development' && !process.env.ROARING_API_KEY?.trim()) return true
  return false
}

function mockLookup(personnummer: string): SPARResult {
  const pnr = personnummer.replace(/\D/g, '')

  // Simulera bortgång om ROARING_MOCK_DECEASED=true
  const simulateDeceased = process.env.ROARING_MOCK_DECEASED === 'true'

  console.log(`[SPAR mock] Lookup för ${pnr} — ${simulateDeceased ? '💀 simulerar bortgång' : '✅ simulerar levande'}`)

  if (simulateDeceased) {
    return {
      personnummer: pnr,
      alive: false,
      deceased: true,
      deceasedDate: new Date().toISOString().split('T')[0],
      name: 'Sven Svensson',
      rawResponse: { mock: true, scenario: 'deceased' },
      mock: true,
    }
  }

  return {
    personnummer: pnr,
    alive: true,
    deceased: false,
    deceasedDate: null,
    name: 'Sven Svensson',
    rawResponse: { mock: true, scenario: 'alive' },
    mock: true,
  }
}

// ---------------------------------------------------------------------------
// OAuth2-token
// ---------------------------------------------------------------------------

async function getRoaringToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token
  }

  const clientId = process.env.ROARING_CLIENT_ID
  const clientSecret = process.env.ROARING_CLIENT_SECRET
  const apiKey = process.env.ROARING_API_KEY

  if (!clientId && !apiKey) {
    throw new Error('Roaring.io credentials saknas (ROARING_API_KEY eller ROARING_CLIENT_ID/SECRET)')
  }

  // Enkel Bearer-token — ingen token-exchange behövs
  if (apiKey && !clientId) {
    return apiKey
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(ROARING_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Roaring.io token-fel: ${err}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number }

  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }

  return cachedToken.token
}

// ---------------------------------------------------------------------------
// Huvud-API
// ---------------------------------------------------------------------------

/**
 * Slå upp en person i SPAR via Roaring.io
 * Personnummer: 10 siffror (YYMMDDXXXX) eller 12 siffror (YYYYMMDDXXXX)
 *
 * I development utan API-nyckel: returnerar mock-data automatiskt.
 * Sätt ROARING_MOCK_DECEASED=true i .env.local för att testa bortgångsflödet.
 *
 * OBS: Verifiera exakt response-struktur mot Roaring.io-dokumentationen
 * när API-nyckeln är på plats.
 */
export async function lookupPersonSPAR(personnummer: string): Promise<SPARResult> {
  if (isMockMode()) {
    return mockLookup(personnummer)
  }

  const token = await getRoaringToken()
  const pnr = personnummer.replace(/\D/g, '')

  const response = await fetch(`${ROARING_PERSON_URL}/${pnr}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (response.status === 404) {
    return {
      personnummer: pnr,
      alive: false,
      deceased: true,
      deceasedDate: null,
      name: null,
      rawResponse: null,
    }
  }

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Roaring.io SPAR-lookup misslyckades (${response.status}): ${err}`)
  }

  const data = await response.json()

  // TODO: Verifiera exakta fältnamn mot Roaring.io-dokumentationen
  const person = Array.isArray(data.records) ? data.records[0] : data

  const deceased = Boolean(
    person?.deregistered ||
    person?.deceasedDate ||
    person?.deregistrationReason === 'deceased'
  )

  const deceasedDate = person?.deceasedDate ?? person?.deregisteredDate ?? null
  const name = (person?.name ?? person?.fullName ??
    [person?.givenName, person?.surname].filter(Boolean).join(' ')) || null

  return {
    personnummer: pnr,
    alive: !deceased,
    deceased,
    deceasedDate,
    name,
    rawResponse: data,
  }
}
