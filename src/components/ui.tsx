import type { ReactNode } from 'react'

type Tone = 'brand' | 'good' | 'warn' | 'bad' | 'muted'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand-hover',
  good: 'bg-good/10 text-good',
  warn: 'bg-warn/10 text-warn',
  bad: 'bg-bad/10 text-bad',
  muted: 'bg-surface text-ink-muted border border-line',
}

export function Pill({ tone = 'muted', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  )
}

export function Panel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-bg ${className}`}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}
