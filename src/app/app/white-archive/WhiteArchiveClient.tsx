'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface WishesData {
  funeral_type: string
  ceremony_location: string
  music_wishes: string
  flower_wishes: string
  donation_org: string
  obituary_text: string
  grave_or_urn: string
  other_wishes: string
}

const FUNERAL_TYPES = [
  { value: 'civil',      label: '⚖️ Civil begravning',    desc: 'Utan religiöst innehåll' },
  { value: 'church',     label: '⛪ Kyrklig begravning',   desc: 'Svenska kyrkan eller annat trossamfund' },
  { value: 'humanist',   label: '🌿 Humanistisk',          desc: 'Livsåskådningsceremoni' },
  { value: 'no_pref',    label: '— Ingen preferens',       desc: 'Anhöriga bestämmer' },
]

const GRAVE_OPTIONS = [
  { value: 'grave',      label: '🪦 Kistbegravning',       desc: 'Traditionell grav' },
  { value: 'urn',        label: '⚱️ Urna / kremering',     desc: 'Askan i urna' },
  { value: 'scatter',    label: '🌊 Askan sprids',          desc: 'Till havs, skog eller annan plats' },
  { value: 'no_pref',    label: '— Ingen preferens',       desc: 'Anhöriga bestämmer' },
]

export default function WhiteArchiveClient({ initialWishes }: { initialWishes: WishesData | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [funeralType,        setFuneralType]        = useState(initialWishes?.funeral_type        ?? 'no_pref')
  const [ceremonyLocation,   setCeremonyLocation]   = useState(initialWishes?.ceremony_location   ?? '')
  const [musicWishes,        setMusicWishes]        = useState(initialWishes?.music_wishes        ?? '')
  const [flowerWishes,       setFlowerWishes]       = useState(initialWishes?.flower_wishes       ?? '')
  const [donationOrg,        setDonationOrg]        = useState(initialWishes?.donation_org        ?? '')
  const [obituaryText,       setObituaryText]       = useState(initialWishes?.obituary_text       ?? '')
  const [graveOrUrn,         setGraveOrUrn]         = useState(initialWishes?.grave_or_urn        ?? 'no_pref')
  const [otherWishes,        setOtherWishes]        = useState(initialWishes?.other_wishes        ?? '')

  async function handleSave() {
    startTransition(async () => {
      try {
        const { saveWishes } = await import('./actions')
        await saveWishes({
          funeral_type: funeralType,
          ceremony_location: ceremonyLocation,
          music_wishes: musicWishes,
          flower_wishes: flowerWishes,
          donation_org: donationOrg,
          obituary_text: obituaryText,
          grave_or_urn: graveOrUrn,
          other_wishes: otherWishes,
        })
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 3000)
      } catch (e) {
        console.error(e)
      }
    })
  }

  const sectionHead = (title: string, sub?: string) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: sub ? '0.25rem' : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )

  const radioRow = (
    options: { value: string; label: string; desc: string }[],
    selected: string,
    onChange: (v: string) => void,
  ) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.625rem', marginBottom: '1.5rem' }}>
      {options.map((o) => (
        <label
          key={o.value}
          style={{
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${selected === o.value ? 'var(--teal-mid)' : 'rgba(77,182,168,0.12)'}`,
            background: selected === o.value ? 'rgba(77,182,168,0.08)' : 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name={`radio-${options[0].value}`}
              value={o.value}
              checked={selected === o.value}
              onChange={() => onChange(o.value)}
              style={{ accentColor: 'var(--teal-mid)' }}
            />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{o.label}</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.25rem' }}>{o.desc}</span>
        </label>
      ))}
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Rubrik */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.375rem' }}>
          📋 Vita Arkivet
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Dina önskemål kring begravning och avsked. Delas med dina kontakter när det är dags.
        </p>
      </div>

      {saved && (
        <div style={{ padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '0.9375rem', fontWeight: 500 }}>
          ✓ Önskemål sparade
        </div>
      )}

      {/* Begravningstyp */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        {sectionHead('Typ av begravningsceremoni', 'Religiös, civil eller humanistisk?')}
        {radioRow(FUNERAL_TYPES, funeralType, setFuneralType)}

        <div className="form-group">
          <label className="form-label">Plats för ceremonin (om du har önskemål)</label>
          <input
            className="form-input"
            type="text"
            placeholder="t.ex. Limhamns kyrka, Malmö stadsbibliotek..."
            value={ceremonyLocation}
            onChange={(e) => setCeremonyLocation(e.target.value)}
          />
        </div>
      </div>

      {/* Kremering / grav */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        {sectionHead('Kremering eller kistbegravning?')}
        {radioRow(GRAVE_OPTIONS, graveOrUrn, setGraveOrUrn)}
      </div>

      {/* Musik & blommor */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        {sectionHead('Musik & blommor')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Önskad musik</label>
            <input
              className="form-input"
              type="text"
              placeholder="t.ex. Bach, Ulf Lundell, Evert Taube..."
              value={musicWishes}
              onChange={(e) => setMusicWishes(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Blommor</label>
            <input
              className="form-input"
              type="text"
              placeholder="t.ex. vita liljor, inga blommor / ge till välgörenhet..."
              value={flowerWishes}
              onChange={(e) => setFlowerWishes(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Välgörenhetsorganisation (istället för blommor)</label>
          <input
            className="form-input"
            type="text"
            placeholder="t.ex. Rädda Barnen, Läkare utan gränser..."
            value={donationOrg}
            onChange={(e) => setDonationOrg(e.target.value)}
          />
        </div>
      </div>

      {/* Dödsannons & övriga önskemål */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {sectionHead('Dödsannons & övriga önskemål')}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Text till dödsannonsen (valfritt)</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Skriv den text du vill ska publiceras i dödsannonsen..."
            value={obituaryText}
            onChange={(e) => setObituaryText(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Övriga önskemål</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Klädsel, mat vid minnesstund, vad som ska hända med husdjur, arvsfördelning av sentimental egendom..."
            value={otherWishes}
            onChange={(e) => setOtherWishes(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Spara */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn-primary" onClick={handleSave} disabled={isPending} style={{ opacity: isPending ? 0.7 : 1 }}>
          {isPending ? '💾 Sparar…' : '💾 Spara önskemål'}
        </button>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          🔒 Krypteras och delas endast med dina valda kontakter
        </p>
      </div>
    </div>
  )
}
