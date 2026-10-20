import { CheckCircle2, PenLine } from 'lucide-react'
import { drug } from '../lib/catalog'
import { addDays, formatDate } from '../lib/dates'
import type { FollowUpSuggestion } from '../lib/followup'
import { DAYS_SUPPLY, type RxNeed } from '../lib/visit'

interface Props {
  rxNeeded: RxNeed[]
  suggestion: FollowUpSuggestion
  weeks: number
  onWeeks: (w: number) => void
  blockers: string[]
  today: string
  alreadySigned: boolean
  booked: { date: string; weeks: number; reason: string } | null
  onSign: () => void
}

const WEEK_OPTIONS = [1, 2, 4, 6, 8, 12]

export function SignPanel({ rxNeeded, suggestion, weeks, onWeeks, blockers, today, alreadySigned, booked, onSign }: Props) {
  if (alreadySigned && booked) {
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-2 font-semibold text-good"><CheckCircle2 size={18} aria-hidden /> Visit signed</p>
        <p className="text-sm">Next visit <strong>{formatDate(booked.date)}</strong> ({booked.weeks} weeks)</p>
        <p className="text-xs text-ink-muted">{booked.reason}</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Prescriptions to send</h3>
        {rxNeeded.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">None. No dose changes and no supply running low.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {rxNeeded.map(({ med: m, reason }) => (
              <li key={m.medId} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm">
                <span className="font-medium">{drug(m.drugId).name} {m.doseMg} mg {m.frequency}</span>
                <span className="text-right text-xs text-ink-muted">
                  {reason === 'renewal' ? 'Renewal' : 'New strength'} · {DAYS_SUPPLY}d + 1 refill
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="followup" className="text-sm font-semibold">Follow-up</label>
        <div className="mt-1.5 flex items-center gap-2">
          <select
            id="followup"
            value={weeks}
            onChange={(e) => onWeeks(Number(e.target.value))}
            className="rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand"
          >
            {WEEK_OPTIONS.map((w) => <option key={w} value={w}>{w} week{w > 1 ? 's' : ''}</option>)}
          </select>
          <span className="text-sm text-ink-muted">{formatDate(addDays(today, weeks * 7))}</span>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Suggested {suggestion.weeks} weeks: {suggestion.reason}.
          {weeks !== suggestion.weeks && (
            <button onClick={() => onWeeks(suggestion.weeks)} className="ml-1 font-medium text-brand hover:underline">Use suggestion</button>
          )}
        </p>
      </div>

      {blockers.length > 0 && !alreadySigned && (
        <ul className="space-y-1 text-sm text-warn">
          {blockers.map((b) => <li key={b}>• {b}</li>)}
        </ul>
      )}

      <button
        onClick={onSign}
        disabled={blockers.length > 0 || alreadySigned}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-semibold text-on-brand transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PenLine size={16} aria-hidden />
        {alreadySigned ? 'Visit signed' : `Sign visit${rxNeeded.length ? ` & send ${rxNeeded.length} Rx` : ''}`}
      </button>
    </div>
  )
}
