'use client'

import Link from 'next/link'

interface StatCard {
  icon: string
  label: string
  value: string
  max: string
  href: string
  color: string
}

interface CompletionStep {
  label: string
  done: boolean
  href: string | null
}

interface DashboardClientProps {
  firstName: string
  completionPercent: number
  statCards: StatCard[]
  completionSteps: CompletionStep[]
}

export default function DashboardClient({
  firstName,
  completionPercent,
  statCards,
  completionSteps,
}: DashboardClientProps) {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
          God dag, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Din digitala döstädning är {completionPercent}% klar.
        </p>
      </div>

      {/* Stat-kort */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(({ icon, label, value, max, href, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div
              className="card"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'border-color 0.15s, transform 0.1s' }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = color
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(77,182,168,0.1)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{ width: 44, height: 44, borderRadius: 11, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}
                aria-hidden="true"
              >
                {icon}
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '0.25rem' }}>
                  {value}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>/{max}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Kom igång */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Kom igång</h2>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {completionSteps.filter((s) => s.done).length} av {completionSteps.length} steg
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--teal-light)' }}>{completionPercent}%</span>
            </div>
            <div
              style={{ height: 6, borderRadius: 3, background: 'rgba(77,182,168,0.15)', overflow: 'hidden' }}
              role="progressbar"
              aria-valuenow={completionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                style={{ height: '100%', width: `${completionPercent}%`, background: 'linear-gradient(90deg, var(--teal-brand), var(--teal-light))', borderRadius: 3, transition: 'width 0.4s ease' }}
              />
            </div>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {completionSteps.map(({ label, done, href }) => (
              <li key={label}>
                {href ? (
                  <Link
                    href={href}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', padding: '0.5rem', borderRadius: 'var(--radius-sm)', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(77,182,168,0.07)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <CheckIcon done={done} />
                    <span style={{ fontSize: '0.9375rem', color: done ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: done ? 'line-through' : 'none' }}>
                      {label}
                    </span>
                    {!done && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--teal-light)' }}>→</span>}
                  </Link>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                    <CheckIcon done={done} />
                    <span style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{label}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(196,164,90,0.1) 0%, rgba(30,92,84,0.2) 100%)', border: '1px solid rgba(196,164,90,0.2)' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }} aria-hidden="true">✨</div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gold)' }}>Uppgradera till Premium</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Obegränsat antal konton, omedelbar SPAR-bevakning och 5 GB krypterat valv.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['Obegränsat sociala konton', 'Omedelbar SPAR-bevakning', '5 GB krypterat valv', 'Upp till 20 kontakter', 'Prioriterad support'].map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--success)' }} aria-hidden="true">✓</span>{f}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ background: 'var(--gold)', color: '#1a1200', flex: '1 1 120px' }}>49 kr/mån</button>
            <button className="btn-secondary" style={{ flex: '1 1 120px', borderColor: 'rgba(196,164,90,0.3)', color: 'var(--gold)' }}>990 kr — Lifetime</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckIcon({ done }: { done: boolean }) {
  return (
    <div
      style={{ width: 24, height: 24, borderRadius: '50%', background: done ? 'rgba(16,185,129,0.15)' : 'rgba(77,182,168,0.1)', border: `2px solid ${done ? 'var(--success)' : 'rgba(77,182,168,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', color: done ? 'var(--success)' : 'transparent' }}
      aria-hidden="true"
    >
      {done ? '✓' : ''}
    </div>
  )
}
