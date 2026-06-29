'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/app/dashboard',      icon: '🏠', label: 'Översikt' },
  { href: '/app/social',         icon: '📱', label: 'Sociala konton' },
  { href: '/app/passwords',      icon: '🔑', label: 'Lösenordsvalv' },
  { href: '/app/farewell',       icon: '💌', label: 'Sista hälsning' },
  { href: '/app/white-archive',  icon: '📋', label: 'Vita Arkivet' },
  { href: '/app/settings',       icon: '⚙️', label: 'Inställningar' },
]

// Completion mock — ersätts med riktig data från Supabase
const completionSteps = [
  { label: 'BankID-inloggning', done: true },
  { label: 'Sociala konton', done: false },
  { label: 'Lösenord sparade', done: false },
  { label: 'Sista hälsning', done: false },
  { label: 'Kontakter inlagda', done: false },
]
const completionPercent = Math.round(
  (completionSteps.filter((s) => s.done).length / completionSteps.length) * 100
)

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: 'var(--bg-primary)',
      }}
    >
      {/* ─── Sidebar (desktop) ─────────────────────────────── */}
      <aside
        style={{
          width: 'var(--sidebar-w)',
          flexShrink: 0,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid rgba(77,182,168,0.1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 0',
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflowY: 'auto',
        }}
        className="hidden lg:flex"
        aria-label="Sidnavigation"
      >
        {/* Logo */}
        <div style={{ padding: '0 1.25rem 1.5rem' }}>
          <Link
            href="/app/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
              aria-hidden="true"
            >
              🔒
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Digitalt Arv
            </span>
          </Link>
        </div>

        {/* Demo-badge */}
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          <span className="badge-demo">Demo-läge</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          <p
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '0 0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            Meny
          </p>
          {navItems.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.125rem',
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--teal-light)' : 'var(--text-secondary)',
                  background: active ? 'rgba(77,182,168,0.1)' : 'transparent',
                  transition: 'all 0.12s ease',
                }}
                aria-current={active ? 'page' : undefined}
              >
                <span style={{ width: 20, textAlign: 'center' }} aria-hidden="true">
                  {icon}
                </span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Completion */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(77,182,168,0.1)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Döstädning klar
            </span>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--teal-light)',
              }}
            >
              {completionPercent}%
            </span>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: 'rgba(77,182,168,0.15)',
              overflow: 'hidden',
            }}
            role="progressbar"
            aria-valuenow={completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${completionPercent}% av din döstädning är klar`}
          >
            <div
              style={{
                height: '100%',
                width: `${completionPercent}%`,
                background: 'var(--teal-mid)',
                borderRadius: 2,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding: '0.75rem 1.25rem' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.12s',
            }}
          >
            <span aria-hidden="true">↩</span>
            Logga ut
          </Link>
        </div>
      </aside>

      {/* ─── Innehåll ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar (mobil) */}
        <header
          className="lg:hidden"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid rgba(77,182,168,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span aria-hidden="true">🔒</span>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Digitalt Arv</span>
          </div>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Öppna meny"
            aria-expanded={mobileNavOpen}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '0.375rem',
              fontSize: '1.375rem',
            }}
          >
            {mobileNavOpen ? '✕' : '☰'}
          </button>
        </header>

        {/* Mobil-dropdown */}
        {mobileNavOpen && (
          <div
            className="lg:hidden"
            style={{
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid rgba(77,182,168,0.1)',
              padding: '0.75rem',
            }}
          >
            {navItems.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: pathname.startsWith(href) ? 'var(--teal-light)' : 'var(--text-secondary)',
                  background: pathname.startsWith(href) ? 'rgba(77,182,168,0.1)' : 'transparent',
                  fontSize: '1rem',
                  marginBottom: '0.125rem',
                }}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Page content */}
        <main style={{ flex: 1, padding: '2rem 1.25rem' }} className="lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
