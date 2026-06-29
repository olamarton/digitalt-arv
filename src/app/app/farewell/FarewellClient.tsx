'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveFarewellMessage, deleteFarewellMessage } from './actions'

const MAX_CHARS = 2000

interface FarewellData {
  exists: boolean
  savedAt?: string
}

export default function FarewellClient({ initialData }: { initialData: FarewellData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [recipient, setRecipient] = useState('')
  const [saved, setSaved] = useState(initialData.exists)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!message.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await saveFarewellMessage({ message, recipient: recipient || undefined })
        setSaved(true)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fel vid sparning')
      }
    })
  }

  async function handleDelete() {
    startTransition(async () => {
      try {
        await deleteFarewellMessage()
        setSaved(false)
        setMessage('')
        setRecipient('')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fel vid borttagning')
      }
    })
  }

  const remaining = MAX_CHARS - message.length

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.375rem' }}>
          Sista hälsning
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Skriv ett personligt meddelande till dina nära. Krypteras och levereras automatiskt.
        </p>
      </div>

      {saved ? (
        <div>
          <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔒</span>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.9375rem' }}>Meddelandet är krypterat och sparat</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Levereras automatiskt när SPAR bekräftar bortgång.
                {initialData.savedAt && ` Sparat ${new Date(initialData.savedAt).toLocaleDateString('sv-SE')}.`}
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Meddelandet är end-to-end krypterat — vi kan inte visa det i klartext.
              Om du vill ändra det, ta bort det och skriv ett nytt.
            </p>
          </div>

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setSaved(false)} disabled={isPending}>
              ✏️ Skriv nytt meddelande
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--error)', cursor: 'pointer', fontSize: '0.875rem', opacity: isPending ? 0.7 : 1 }}
            >
              {isPending ? 'Tar bort…' : '🗑 Ta bort'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="recipient" className="form-label">Till (valfritt)</label>
            <input
              id="recipient"
              type="text"
              className="form-input"
              placeholder="t.ex. Min familj, eller lämna tomt"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="farewell-msg" className="form-label">Ditt meddelande</label>
            <textarea
              id="farewell-msg"
              className="form-input"
              rows={10}
              placeholder={'Kära [namn],\n\nOm du läser detta vill jag att du ska veta…'}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
              style={{ width: '100%', resize: 'vertical', minHeight: 220, fontFamily: 'inherit', lineHeight: 1.7 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: remaining < 200 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {remaining} tecken kvar
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔒 Krypteras vid sparning</p>
          </div>

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!message.trim() || isPending}
            style={{ opacity: !message.trim() || isPending ? 0.5 : 1, cursor: !message.trim() ? 'not-allowed' : 'pointer' }}
          >
            {isPending ? '🔐 Krypterar…' : '💾 Spara krypterat'}
          </button>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.5 }}>
            Meddelandet krypteras end-to-end. Det kan bara läsas av dina angivna kontakter — inte av oss.
          </p>
        </div>
      )}
    </div>
  )
}
