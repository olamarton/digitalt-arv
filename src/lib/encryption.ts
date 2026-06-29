/**
 * AES-256-GCM kryptering via Web Crypto API
 * Personnummer och lösenord lämnar ALDRIG klienten i klartext.
 */

const ALGORITHM = 'AES-GCM'

/**
 * Generera eller hämta krypteringsnyckel från miljövariabel.
 * I produktion: ENCRYPTION_KEY = 64 hex-tecken (256 bitar).
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyHex = process.env.ENCRYPTION_KEY

  if (!keyHex || keyHex.length < 64) {
    throw new Error('ENCRYPTION_KEY saknas eller är för kort (kräver 64 hex-tecken)')
  }

  const keyBytes = Buffer.from(keyHex.slice(0, 64), 'hex')

  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Kryptera en textsträng → base64-kodad payload (iv + ciphertext)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV för GCM
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  )

  // Kombinera IV + ciphertext → base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return Buffer.from(combined).toString('base64')
}

/**
 * Dekryptera base64-payload → klartext
 */
export async function decrypt(payload: string): Promise<string> {
  const key = await getEncryptionKey()
  const combined = Buffer.from(payload, 'base64')

  const iv = combined.subarray(0, 12)
  const ciphertext = combined.subarray(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * SHA-256 hash — för personnummer i spar_checks (aldrig klartext i monitoring)
 */
export async function hashPersonnummer(personnummer: string): Promise<string> {
  const encoded = new TextEncoder().encode(personnummer.replace(/\D/g, ''))
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Buffer.from(hashBuffer).toString('hex')
}
