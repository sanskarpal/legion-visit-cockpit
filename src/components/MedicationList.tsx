import { Minus, Plus, X } from 'lucide-react'
import { drug } from '../lib/catalog'
import { formatShort } from '../lib/dates'
import { changeSince, refillStatus, scanOrder } from '../lib/meds'
import type { MedState } from '../lib/types'
import { Panel, Pill } from './ui'

interface Props {
  meds: MedState[]
  lastVisitAt: string | null
  today: string
  draftMedIds: Set<string>
  onDose: (medId: string, direction: 1 | -1) => void
  onStop: (medId: string) => void
}

export function MedicationList({ meds, lastVisitAt, today, draftMedIds, onDose, onStop }: Props) {
  const ordered = scanOrder(meds, lastVisitAt, today)
  return (
    <Panel title={`Active medications (${meds.length})`} action={<span className="text-xs text-ink-muted">Changes and refill problems sort first</span>}>
      {ordered.length === 0 && <p className="text-sm text-ink-muted">No active medications.</p>}
      <ul className="divide-y divide-line">
        {ordered.map((m) => {
          const d = drug(m.drugId)
          const change = changeSince(m, lastVisitAt)
          const prior = [...m.history].reverse().find((h) => lastVisitAt && h.at <= lastVisitAt)
          const inDraft = draftMedIds.has(m.medId)
          return (
            <li key={m.medId} className={`flex flex-wrap items-center gap-x-4 gap-y-2 py-3 ${inDraft ? '-mx-2 rounded-lg bg-brand-soft/60 px-2' : ''}`}>
              <div className="min-w-40 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-lg font-semibold">{d.name}</span>
                  <span className="text-lg font-semibold tabular-nums">{m.doseMg} mg</span>
                  <span className="text-sm text-ink-muted">{m.frequency}</span>
                </div>
                <div className="text-xs text-ink-muted">{d.brand} · {m.indication} · since {formatShort(m.startedAt)}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {change === 'new' && <Pill tone="brand">New since last visit</Pill>}
                {change === 'increased' && <Pill tone="brand">↑ from {prior?.doseMg} mg</Pill>}
                {change === 'decreased' && <Pill tone="brand">↓ from {prior?.doseMg} mg</Pill>}
                {inDraft && <Pill tone="warn">Unsigned</Pill>}
                <RefillPill med={m} today={today} />
              </div>
              <div className="flex items-center gap-1">
                <IconButton label={`Lower ${d.name} dose`} onClick={() => onDose(m.medId, -1)}><Minus size={15} /></IconButton>
                <IconButton label={`Raise ${d.name} dose`} onClick={() => onDose(m.medId, 1)}><Plus size={15} /></IconButton>
                <IconButton label={`Stop ${d.name}`} onClick={() => onStop(m.medId)} danger><X size={15} /></IconButton>
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function RefillPill({ med, today }: { med: MedState; today: string }) {
  const s = refillStatus(med, today)
  if (s.kind === 'none') return <Pill>No Rx on file</Pill>
  if (s.kind === 'out') return <Pill tone="bad">Ran out {-s.daysLeft}d ago</Pill>
  if (s.kind === 'due') return <Pill tone="warn">Runs out in {s.daysLeft}d</Pill>
  return <Pill tone="good">{s.daysLeft}d supply</Pill>
}

function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg border border-line text-ink-muted transition hover:text-ink ${
        danger ? 'hover:border-bad/40 hover:bg-bad/10 hover:text-bad' : 'hover:border-brand/50 hover:bg-brand-soft'
      }`}
    >
      {children}
    </button>
  )
}
