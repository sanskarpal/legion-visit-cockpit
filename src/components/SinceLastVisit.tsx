import { CircleSlash } from 'lucide-react'
import { drug } from '../lib/catalog'
import { formatDate, relative } from '../lib/dates'
import { gad7Band, phq9Band } from '../lib/followup'
import type { StoppedMed, VisitSummary } from '../lib/types'
import { Panel, Pill } from './ui'

interface Props {
  visits: VisitSummary[] // newest first
  stoppedSince: StoppedMed[]
  today: string
  todayScores: { phq9: number | null; gad7: number | null }
}

export function SinceLastVisit({ visits, stoppedSince, today, todayScores }: Props) {
  const last = visits[0]
  if (!last) return <Panel title="Since last visit"><p className="text-sm text-ink-muted">First visit.</p></Panel>

  const series = [...visits].reverse()
  return (
    <Panel title="Since last visit" action={<span className="text-xs text-ink-muted">{formatDate(last.at)} · {relative(last.at, today)}</span>}>
      <p className="text-sm leading-relaxed">{last.summary}</p>
      <p className="mt-1 text-xs text-ink-muted">{last.provider}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ScoreTrend label="PHQ-9" max={27} values={series.map((v) => v.phq9)} today={todayScores.phq9} band={phq9Band} />
        <ScoreTrend label="GAD-7" max={21} values={series.map((v) => v.gad7)} today={todayScores.gad7} band={gad7Band} />
      </div>

      {stoppedSince.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {stoppedSince.map((s) => (
            <div key={s.medId} className="flex items-start gap-2 rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn">
              <CircleSlash size={16} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                <strong>Stopped {drug(s.drugId).name} {s.lastDoseMg} mg</strong> {relative(s.stoppedAt, today)}: {s.reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function ScoreTrend({ label, max, values, today, band }: {
  label: string
  max: number
  values: number[]
  today: number | null
  band: (n: number) => { label: string; tone: 'good' | 'warn' | 'bad' }
}) {
  const latest = today ?? values[values.length - 1]
  const b = band(latest)
  const bars = today === null ? values : [...values, today]
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink-muted">{label}</span>
        <Pill tone={b.tone}>{b.label}</Pill>
      </div>
      <div className="mt-2 flex items-end gap-3">
        <span className="font-display text-3xl font-semibold tabular-nums">{latest}</span>
        <div className="flex h-10 flex-1 items-end gap-1" aria-label={`${label} history: ${bars.join(', ')}`}>
          {bars.map((v, i) => (
            <div
              key={i}
              title={String(v)}
              className={`flex-1 rounded-sm ${i === bars.length - 1 && today !== null ? 'bg-brand' : 'bg-brand/30'}`}
              style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
            />
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{values.join(' → ')}{today !== null ? ` → ${today} today` : ''}</p>
    </div>
  )
}
