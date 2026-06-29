'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addSocialPlatform, deleteSocialPlatform } from './actions'

type Action = 'memorial' | 'delete' | 'private' | 'nothing' | 'farewell'

interface SocialEntry {
  id: string
  platform_name: string
  platform_type: string
  username: string | null
  action: string
}

const ACTION_LABELS: Record<string, string> = {
  memorial: '🕊 Minnessida',
  delete:   '🗑 Radera kontot',
  private:  '🔒 Gör privat',
  farewell: '💌 Skicka hälsning',
  nothing:  '— Gör ingenting',
}

const ACTION_COLORS: Record<string, string> = {
  memorial: 'rgba(77,182,168,0.15)',
  delete:   'rgba(239,68,68,0.12)',
  private:  'rgba(139,92,246,0.12)',
  farewell: 'rgba(196,164,90,0.12)',
  nothing:  'rgba(74,122,116,0.1)',
}

const PLATFORMS = [
  { icon: '📘', name: 'Facebook',   type: 'facebook' },
  { icon: '📸', name: 'Instagram',  type: 'instagram' },
  { icon: '🐦', name: 'X / Twitter', type: 'twitter' },
  { icon: '💼', name: 'LinkedIn',   type: 'linkedin' },
  { icon: '🎵', name: 'Spotify',    type: 'spotify' },
  { icon: '▶️', name: 'YouTube',    type: 'youtube' },
  { icon: '💬', name: 'WhatsApp',   type: 'whatsapp' },
  { icon: '📧', name: 'Gmail',      type: 'gmail' },
  { icon: '🍎', name: 'iCloud',     type: 'icloud' },
  { icon: '🎮', name: 'Steam',      type: 'steam' },
]

const PLATFORM_ICONS: Record<string, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.type, p.icon])
)

export default function SocialClient({ initialEntries }: { initialEntries: SocialEntry[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal] = useState<{ icon: string; name: string; type: string } | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [username, setUsername] = useState('')
  const [action, setAction] = useState<Action>('memorial')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openModal(p: typeof PLATFORMS[0]) {
    setModal(p); setUsername(''); setAction('memorial'); setError('')
  }

  function openCustom() {
    setShowCustom(true); setCustomName(''); setUsername(''); setAction('memorial'); setError('')
  }

  function closeModal() {
    setModal(null); setShowCustom(false); setError('')
  }

  async function handleSave() {
    const name = modal?.name ?? customName.trim()
    const type = modal?.type ?? 'custom'
    if (!name) { setError('Ange ett namn'); return }

    startTransition(async () => {
      try {
        await addSocialPlatform({
          platform_type: type,
          platform_name: name,
          username,
          action,
        })
        closeModal()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fel vid sparning')
      }
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      try {
        await deleteSocialPlatform(id)
        router.refresh()
      } catch (e) {
        console.error(e)
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.375rem' }}>
          Sociala konton
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Bestäm vad som händer med dina konton.
          {initialEntries.length > 0 && ` ${initialEntries.length} konto${initialEntries.length > 1 ? 'n' : ''} sparade.`}
        </p>
      </div>

      {/* Sparade konton */}
      {initialEntries.length > 0 && (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Sparade instruktioner
          </p>
          {initialEntries.map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--bg-secondary)', border: '1px solid rgba(77,182,168,0.1)', borderRadius: 'var(--radius-md)', opacity: deletingId === e.id ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              <span style={{ fontSize: '1.375rem' }}>{PLATFORM_ICONS[e.platform_type] ?? '🌐'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{e.platform_name}</p>
                {e.username && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>@{e.username}</p>}
              </div>
              <span style={{ padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 500, background: ACTION_COLORS[e.action] ?? ACTION_COLORS.nothing, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {ACTION_LABELS[e.action] ?? e.action}
              </span>
              <button
                onClick={() => handleDelete(e.id)}
                disabled={isPending}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '0.25rem', flexShrink: 0 }}
                aria-label={`Ta bort ${e.platform_name}`}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Plattformsval */}
      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Lägg till konto
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {PLATFORMS.map((p) => (
          <button key={p.type} onClick={() => openModal(p)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid rgba(77,182,168,0.1)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'center' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal-mid)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(77,182,168,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: '1.75rem' }}>{p.icon}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{p.name}</span>
          </button>
        ))}
        <button onClick={openCustom}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 0.75rem', background: 'rgba(77,182,168,0.05)', border: '1px dashed rgba(77,182,168,0.25)', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem' }}>➕</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Annan tjänst</span>
        </button>
      </div>

      {/* Modal */}
      {(modal || showCustom) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(77,182,168,0.15)', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>{modal?.icon ?? '🌐'}</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{modal?.name ?? 'Annan tjänst'}</h2>
            </div>

            {showCustom && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Tjänstens namn</label>
                <input className="form-input" type="text" placeholder="t.ex. TikTok, Reddit…" value={customName} onChange={(e) => setCustomName(e.target.value)} autoFocus />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Användarnamn (valfritt)</label>
              <input className="form-input" type="text" placeholder="ditt.namn" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p className="form-label" style={{ marginBottom: '0.625rem' }}>Vad ska hända med kontot?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(Object.entries(ACTION_LABELS) as [Action, string][]).map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: action === key ? ACTION_COLORS[key] : 'transparent', border: `1px solid ${action === key ? 'rgba(77,182,168,0.25)' : 'transparent'}`, transition: 'all 0.12s ease' }}>
                    <input type="radio" name="action" value={key} checked={action === key} onChange={() => setAction(key)} style={{ accentColor: 'var(--teal-mid)' }} />
                    <span style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" onClick={handleSave} disabled={isPending} style={{ flex: 1, opacity: isPending ? 0.7 : 1 }}>
                {isPending ? 'Sparar…' : '💾 Spara instruktion'}
              </button>
              <button className="btn-secondary" onClick={closeModal} disabled={isPending}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
