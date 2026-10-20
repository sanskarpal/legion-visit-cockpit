import { describeEvent } from '../lib/describe'
import type { ClinicalEvent, Pharmacy } from '../lib/types'
import { Panel, Pill } from './ui'

interface Props {
  signed: ClinicalEvent[]
  drafts: ClinicalEvent[]
  pharmacies: Pharmacy[]
  onUndo: () => void
}

/** The record itself. The chart above is just this list, folded. */
export function EventLog({ signed, drafts, pharmacies, onUndo }: Props) {
  const all = [...signed, ...drafts]
  const drugOf = (medId: string) =>
    all.find((e): e is Extract<ClinicalEvent, { type: 'MedStarted' }> => e.type === 'MedStarted' && e.medId === medId)?.drugId
  const draftIds = new Set(drafts.map((d) => d.id))
  const rows = [...all].sort((a, b) => b.at.localeCompare(a.at) || all.indexOf(b) - all.indexOf(a))

  return (
    <Panel
      title={`Event log (${all.length})`}
      action={drafts.length > 0 && <button onClick={onUndo} className="text-xs font-medium text-brand hover:underline">Undo last change</button>}
    >
      <ol className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {rows.map((e) => (
          <li key={e.id} className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm">
            <time className="pt-0.5 font-mono text-xs text-ink-muted" dateTime={e.at}>
              {new Date(e.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </time>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <code className="text-xs font-semibold text-brand-hover">{e.type}</code>
                {draftIds.has(e.id) && <Pill tone="warn">draft</Pill>}
              </div>
              <div className="text-ink-muted">{describeEvent(e, drugOf, pharmacies)}</div>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
