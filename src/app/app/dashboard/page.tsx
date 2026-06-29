import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/bankid')

  const supabase = createAdminClient()

  const [
    { count: socialCount },
    { count: accountsCount },
    { data: farewell },
  ] = await Promise.all([
    supabase.from('social_platforms').select('*', { count: 'exact', head: true }).eq('user_id', user.userId),
    supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('user_id', user.userId),
    supabase.from('farewell_messages').select('id').eq('user_id', user.userId).maybeSingle(),
  ])

  const hasFarewell = !!farewell

  const statCards = [
    { icon: '📱', label: 'Sociala konton',  value: String(socialCount ?? 0),   max: '∞', href: '/app/social',    color: 'var(--teal-mid)' },
    { icon: '🔐', label: 'Sparade konton',   value: String(accountsCount ?? 0), max: '∞', href: '/app/passwords', color: 'var(--teal-brand)' },
    { icon: '💌', label: 'Sista hälsning',   value: hasFarewell ? '1' : '0',    max: '1', href: '/app/farewell',  color: '#8B5CF6' },
    { icon: '👥', label: 'Kontakter',        value: '0',                         max: '3', href: '/app/settings',  color: 'var(--gold)' },
  ]

  const completionSteps = [
    { label: 'BankID-inloggning klar',      done: true,                      href: null },
    { label: 'Lägg till ett socialt konto', done: (socialCount ?? 0) > 0,   href: '/app/social' },
    { label: 'Spara ett lösenord',           done: (accountsCount ?? 0) > 0, href: '/app/passwords' },
    { label: 'Skriv din sista hälsning',     done: hasFarewell,              href: '/app/farewell' },
    { label: 'Lägg till en kontakt',         done: false,                    href: '/app/settings' },
  ]

  const completionPercent = Math.round(
    (completionSteps.filter((s) => s.done).length / completionSteps.length) * 100
  )

  const firstName = user.fullName?.split(' ')[0] ?? 'där'

  return (
    <DashboardClient
      firstName={firstName}
      completionPercent={completionPercent}
      statCards={statCards}
      completionSteps={completionSteps}
    />
  )
}
