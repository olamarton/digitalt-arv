import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inställningar' }

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.375rem' }}>
          Inställningar
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Konto och kontakter.</p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Kontoinformation</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { label: 'Namn', value: 'Demo-användare' },
            { label: 'Personnummer', value: '••••••-••••' },
            { label: 'Plan', value: 'Gratis' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid rgba(77,182,168,0.07)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Betrodda kontakter</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Gratis-plan: upp till 3 kontakter.
        </p>
        <button className="btn-primary">+ Lägg till kontakt</button>
      </div>
    </div>
  )
}
