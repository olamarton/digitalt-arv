import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Digitalt Arv — Digital döstädning',
    template: '%s | Digitalt Arv',
  },
  description:
    'Hantera ditt digitala arv. Säkra dina lösenord, sociala konton och sista hälsningar med BankID — så dina anhöriga slipper det digitala kaoset.',
  keywords: ['digitalt arv', 'digital döstädning', 'dödsbo', 'BankID', 'lösenord', 'sociala konton'],
  authors: [{ name: 'Scandinavian Design www AB' }],
  creator: 'Scandinavian Design www AB',
  metadataBase: new URL('https://digitaltarv.se'),
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    siteName: 'Digitalt Arv',
    title: 'Digitalt Arv — Digital döstädning',
    description: 'Säkra ditt digitala liv. Hantera dina konton och sista hälsningar med BankID.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Digitalt Arv',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0D1F1C',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
