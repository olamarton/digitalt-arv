'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addAccount, addAccounts, deleteAccount } from './actions'

type Category = 'social' | 'email' | 'banking' | 'streaming' | 'shopping' | 'other'
type ImportedEntry = { service_name: string; service_type: string; username: string; password: string; category: Category }

interface Account {
  id: string
  service_name: string
  service_type: string
  username: string | null
  category: string
  action: string
}

const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  social:    { label: 'Socialt',        icon: '📱' },
  email:     { label: 'E-post',         icon: '📧' },
  banking:   { label: 'Bank & ekonomi', icon: '🏦' },
  streaming: { label: 'Streaming',      icon: '🎬' },
  shopping:  { label: 'Shopping',       icon: '🛍' },
  other:     { label: 'Övrigt',         icon: '📂' },
}

const PRESETS = [
  { icon: '🏦', service: 'Swedbank',  type: 'swedbank',  category: 'banking'   as Category },
  { icon: '🏦', service: 'SEB',       type: 'seb',       category: 'banking'   as Category },
  { icon: '📧', service: 'Gmail',     type: 'gmail',     category: 'email'     as Category },
  { icon: '📧', service: 'Outlook',   type: 'outlook',   category: 'email'     as Category },
  { icon: '🎬', service: 'Netflix',   type: 'netflix',   category: 'streaming' as Category },
  { icon: '🎵', service: 'Spotify',   type: 'spotify',   category: 'streaming' as Category },
  { icon: '🛍', service: 'Amazon',    type: 'amazon',    category: 'shopping'  as Category },
  { icon: '🍎', service: 'Apple ID',  type: 'apple',     category: 'other'     as Category },
]

const PRESET_ICONS: Record<string, string> = Object.fromEntries(PRESETS.map((p) => [p.type, p.icon]))

// ─── CSV-parsning ────────────────────────────────────────────────────────────
// Stöd för Chrome (name,url,username,password), Firefox (url,username,password,httpRealm,formActionOrigin,guid,timeCreated,timeLastUsed,timePasswordChanged)
// och Safari (Title,URL,Username,Password,Notes,OTPAuth)
function parseCSV(text: string): ImportedEntry[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].toLowerCase().replace(/"/g, '')
  const cols = header.split(',')

  const idx = (names: string[]) => {
    for (const n of names) { const i = cols.indexOf(n); if (i !== -1) return i }
    return -1
  }

  const nameIdx     = idx(['name', 'title'])
  const urlIdx      = idx(['url'])
  const userIdx     = idx(['username'])
  const passwordIdx = idx(['password'])

  return lines.slice(1).map((line) => {
    const parts = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) ?? line.split(',')
    const clean = (i: number) => (parts[i] ?? '').replace(/^"|"$/g, '').trim()

    const rawName = nameIdx >= 0 ? clean(nameIdx) : ''
    const rawUrl  = urlIdx  >= 0 ? clean(urlIdx)  : ''
    let service = rawName
    if (!service && rawUrl) {
      try {
        service = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl).hostname.replace(/^www\./, '')
      } catch {
        service = rawUrl
      }
    }
    service = service || 'Okänd tjänst'

    let category: Category = 'other'
    const combined = (service + rawUrl).toLowerCase()
    if (/swedbank|seb|handels|nordea|danske|revolut/.test(combined)) category = 'banking'
    else if (/gmail|outlook|yahoo|hotmail|proton/.test(combined))    category = 'email'
    else if (/facebook|instagram|twitter|tiktok|linkedin/.test(combined)) category = 'social'
    else if (/netflix|spotify|hbo|disney|svtplay|viaplay/.test(combined)) category = 'streaming'
    else if (/amazon|ebay|tradera|zalando|klarna/.test(combined))    category = 'shopping'

    return {
      service_name: service,
      service_type: 'custom',
      username:     userIdx     >= 0 ? clean(userIdx)     : '',
      password:     passwordIdx >= 0 ? clean(passwordIdx) : '',
      category,
    }
  }).filter((e) => e.service_name && e.service_name !== 'Okänd tjänst')
}

// ─── Simulerade importdata (demo) ───────────────────────────────────────────
function simulateImport(browser: 'Chrome' | 'Firefox' | 'Safari'): ImportedEntry[] {
  const base: ImportedEntry[] = [
    { service_name: 'Gmail',    service_type: 'gmail',    username: 'anna.svensson@gmail.com', password: 'demo-lösenord-1', category: 'email'    },
    { service_name: 'Facebook', service_type: 'custom',   username: 'anna.svensson',           password: 'demo-lösenord-2', category: 'social'   },
    { service_name: 'Swedbank', service_type: 'swedbank', username: 'anna.svensson@gmail.com', password: 'demo-lösenord-3', category: 'banking'  },
    { service_name: 'Netflix',  service_type: 'netflix',  username: 'anna.svensson@gmail.com', password: 'demo-lösenord-4', category: 'streaming'},
    { service_name: 'Spotify',  service_type: 'spotify',  username: 'anna.svensson',           password: 'demo-lösenord-5', category: 'streaming'},
  ]
  const extra: Record<string, ImportedEntry[]> = {
    Chrome:  [{ service_name: 'Google Drive', service_type: 'custom', username: 'anna.svensson@gmail.com', password: 'demo-6', category: 'other'    },
              { service_name: 'YouTube',       service_type: 'custom', username: 'anna.svensson@gmail.com', password: 'demo-7', category: 'streaming'}],
    Firefox: [{ service_name: 'Amazon',        service_type: 'amazon', username: 'anna.svensson@gmail.com', password: 'demo-6', category: 'shopping' },
              { service_name: 'LinkedIn',       service_type: 'custom', username: 'anna.svensson@gmail.com', password: 'demo-7', category: 'social'   },
              { service_name: 'Tradera',        service_type: 'custom', username: 'anna.svensson',           password: 'demo-8', category: 'shopping' }],
    Safari:  [{ service_name: 'iCloud',        service_type: 'apple',  username: 'anna@icloud.com',         password: 'demo-6', category: 'other'   }],
  }
  return [...base, ...(extra[browser] ?? [])]
}

// ─── Komponent ───────────────────────────────────────────────────────────────
export default function PasswordsClient({ initialAccounts }: { initialAccounts: Account[] }) {
  const router               = useRouter()
  const [isPending, startT]  = useTransition()
  const csvRef               = useRef<HTMLInputElement>(null)

  // Vy: 'list' | 'import' | 'manual'
  const [view, setView]      = useState<'list' | 'import' | 'manual'>('list')
  const [importPreview, setImportPreview] = useState<ImportedEntry[]>([])
  const [importSource, setImportSource]   = useState('')
  const [importing, setImporting]         = useState(false)
  const [savedMsg, setSavedMsg]           = useState('')
  const [deletingId, setDeletingId]       = useState<string | null>(null)

  // Manuellt formulär
  const [service,    setService]    = useState('')
  const [serviceType,setServiceType]= useState('custom')
  const [username,   setUsername]   = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [category,   setCategory]   = useState<Category>('other')
  const [action,     setAction]     = useState<'delete' | 'transfer' | 'nothing'>('delete')
  const [formError,  setFormError]  = useState('')

  function flash(msg: string) {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 3500)
  }

  // ── CSV-filuppladdning ──────────────────────────────────────────────────
  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const entries = parseCSV(text)
      setImportPreview(entries)
      setImportSource(file.name)
      setView('import')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Simulerad webbläsarimport ───────────────────────────────────────────
  function handleSimulate(browser: 'Chrome' | 'Firefox' | 'Safari') {
    const entries = simulateImport(browser)
    setImportPreview(entries)
    setImportSource(`${browser} (demo-data)`)
    setView('import')
  }

  // ── Spara importerade konton (bulk) ────────────────────────────────────
  async function handleImportSave() {
    setImporting(true)
    startT(async () => {
      try {
        const count = await addAccounts(importPreview.map((e) => ({ ...e, action: 'delete' })))
        setView('list')
        setImportPreview([])
        router.refresh()
        flash(`✓ ${count} konton importerade och krypterade`)
      } catch (e) {
        console.error(e)
        flash('Fel vid import — försök igen')
      }
      setImporting(false)
    })
  }

  // ── Manuell sparning ────────────────────────────────────────────────────
  async function handleManualSave() {
    if (!service.trim()) { setFormError('Ange tjänstens namn'); return }
    startT(async () => {
      try {
        await addAccount({ service_name: service.trim(), service_type: serviceType, username, password, category, action })
        setView('list')
        router.refresh()
        flash('✓ Konto sparat och krypterat')
      } catch (e) { setFormError(e instanceof Error ? e.message : 'Fel vid sparning') }
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    startT(async () => {
      try { await deleteAccount(id); router.refresh() }
      catch (e) { console.error(e) }
      finally { setDeletingId(null) }
    })
  }

  const getCategoryMeta = (cat: string) => CATEGORY_META[cat as Category] ?? { label: cat, icon: '📂' }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* Rubrik */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.375rem' }}>Lösenordsvalv</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Krypterat med AES-256.{initialAccounts.length > 0 && ` ${initialAccounts.length} konto${initialAccounts.length !== 1 ? 'n' : ''} sparat.`}
          </p>
        </div>
        {view === 'list' && (
          <button className="btn-primary" onClick={() => setView('manual')}>+ Lägg till manuellt</button>
        )}
      </div>

      {/* Statusmeddelande */}
      {savedMsg && (
        <div style={{ padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '0.9375rem', fontWeight: 500 }}>
          {savedMsg}
        </div>
      )}

      {/* ── VY: IMPORTERA ────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.375rem' }}>Importera lösenord</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Ladda upp en CSV-export från Chrome, Firefox eller Safari — behandlas 100% lokalt
          </p>

          {/* CSV-knapp */}
          <input ref={csvRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleCSVFile} />
          <button
            className="btn-primary"
            onClick={() => csvRef.current?.click()}
            style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem', fontSize: '1rem', padding: '0.875rem' }}
          >
            📂 Importera CSV från webbläsare
          </button>

          {/* Demo-knappar */}
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Demo-testdata:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(['Chrome', 'Firefox', 'Safari'] as const).map((b) => (
              <button
                key={b}
                onClick={() => handleSimulate(b)}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(77,182,168,0.06)', border: '1px solid rgba(77,182,168,0.15)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal-mid)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(77,182,168,0.15)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
              >
                <span>{b === 'Chrome' ? '🌐' : b === 'Firefox' ? '🦊' : '🧭'}</span> {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── VY: FÖRHANDSGRANSKNING AV IMPORT ─────────────────────────────── */}
      {view === 'import' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.0625rem' }}>Granska import</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{importSource} · {importPreview.length} konton hittade</p>
            </div>
            <button className="btn-secondary" onClick={() => { setView('list'); setImportPreview([]) }}>Avbryt</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 320, overflowY: 'auto', marginBottom: '1.25rem' }}>
            {importPreview.map((e, i) => {
              const meta = getCategoryMeta(e.category)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(77,182,168,0.08)' }}>
                  <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>{meta.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{e.service_name}</p>
                    {e.username && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.username}</p>}
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 999, background: 'rgba(77,182,168,0.08)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{meta.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔒</span>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            🔒 Alla lösenord krypteras med AES-256 innan de sparas.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={handleImportSave} disabled={importing || isPending} style={{ opacity: importing ? 0.7 : 1 }}>
              {importing ? '🔐 Krypterar och sparar…' : `🔐 Spara ${importPreview.length} konton`}
            </button>
          </div>
        </div>
      )}

      {/* ── VY: MANUELLT FORMULÄR ─────────────────────────────────────────── */}
      {view === 'manual' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.0625rem' }}>Lägg till konto</h2>
            <button className="btn-secondary" onClick={() => { setView('list'); setFormError('') }}>Avbryt</button>
          </div>

          {/* Snabblänkar */}
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>Vanliga tjänster</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {PRESETS.map((p) => (
              <button key={p.service} onClick={() => { setService(p.service); setServiceType(p.type); setCategory(p.category) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', background: service === p.service ? 'rgba(77,182,168,0.1)' : 'var(--bg-primary)', border: `1px solid ${service === p.service ? 'var(--teal-mid)' : 'rgba(77,182,168,0.1)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '1.1rem' }}>{p.icon}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{p.service}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tjänst</label>
              <input className="form-input" type="text" placeholder="t.ex. Swedbank" value={service} onChange={(e) => setService(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value as Category)} style={{ cursor: 'pointer' }}>
                {(Object.entries(CATEGORY_META) as [Category, { label: string; icon: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Användarnamn / e-post</label>
              <input className="form-input" type="text" placeholder="din@email.se" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Lösenord</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: '2.5rem', width: '100%' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="form-label" style={{ marginBottom: '0.5rem' }}>Vad ska hända med kontot?</p>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {([['delete', '🗑 Radera'], ['transfer', '🔑 Överlämna'], ['nothing', '— Inget']] as const).map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: 999, cursor: 'pointer', background: action === val ? 'rgba(77,182,168,0.12)' : 'transparent', border: `1px solid ${action === val ? 'var(--teal-mid)' : 'rgba(77,182,168,0.2)'}`, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <input type="radio" name="pw-action" value={val} checked={action === val} onChange={() => setAction(val)} style={{ accentColor: 'var(--teal-mid)' }} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          {formError && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={handleManualSave} disabled={isPending} style={{ opacity: isPending ? 0.7 : 1 }}>
              {isPending ? '🔐 Krypterar…' : '🔐 Spara krypterat'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.875rem' }}>🔒 Lösenordet krypteras med AES-256 innan det sparas.</p>
        </div>
      )}

      {/* ── SPARADE KONTON ────────────────────────────────────────────────── */}
      <div className="card">
        <h2 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem' }}>
          Dina lösenord ({initialAccounts.length})
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Krypterat med AES-256</p>

        {initialAccounts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', textAlign: 'center', padding: '2rem 0' }}>
            Inga lösenord ännu. Importera från webbläsare ovan.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {initialAccounts.map((a) => {
              const meta = getCategoryMeta(a.category)
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--bg-primary)', border: '1px solid rgba(77,182,168,0.1)', borderRadius: 'var(--radius-md)', opacity: deletingId === a.id ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(77,182,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                    {PRESET_ICONS[a.service_type] ?? '🔑'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{a.service_name}</p>
                    {a.username && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.username}</p>}
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 999, background: 'rgba(77,182,168,0.08)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{meta.icon} {meta.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔒</span>
                  <button onClick={() => handleDelete(a.id)} disabled={isPending}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '0.25rem', flexShrink: 0 }}
                    aria-label={`Ta bort ${a.service_name}`}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
