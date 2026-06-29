'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function BankIDContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Tillbaka */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '2rem',
          }}
        >
          ← Tillbaka
        </Link>

        <div className="card">
          {/* Logotyp */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: '#193E4F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '2rem',
                fontWeight: 900,
                color: '#fff',
                fontFamily: 'serif',
              }}
            >
              B
            </div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              Logga in med BankID
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Säker inloggning via BankID
            </p>
          </div>

          {/* Felmeddelande */}
          {error && (
            <div
              role="alert"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.875rem',
                color: 'var(--error)',
              }}
            >
              {error}
            </div>
          )}

          {/* BankID-knapp — redirectar till /api/auth/bankid/login → Idura → BankID */}
          <a
            href="/api/auth/bankid/login"
            className="btn-bankid"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              textDecoration: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect width="24" height="24" rx="4" fill="white" fillOpacity="0.15" />
              <path d="M12 4L4 8v8l8 4 8-4V8l-8-4z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            Öppna BankID-appen
          </a>

          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '1.25rem',
              lineHeight: 1.5,
            }}
          >
            Personnummer lagras krypterat. Aldrig i loggar.
          </p>

          {/* Dev-bypass — visas BARA i development */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
                DEV — simulerad inloggning (198001011234)
              </p>
              <a
                href="/api/auth/dev-login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.625rem',
                  borderRadius: 8,
                  border: '1px dashed rgba(255,255,255,0.2)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                }}
              >
                Logga in som testanvändare →
              </a>
            </div>
          )}
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            marginTop: '1.5rem',
          }}
        >
          Inloggning sker via Idura — BankID-certifierad leverantör.
        </p>
      </div>
    </main>
  )
}

export default function BankIDPage() {
  return (
    <Suspense>
      <BankIDContent />
    </Suspense>
  )
}
