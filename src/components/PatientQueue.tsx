import { CheckCircle2, PencilLine } from 'lucide-react'
import type { Patient } from '../lib/types'

interface Props {
  patients: Patient[]
  selectedId: string
  draftCounts: Record<string, number>
  signedToday: Set<string>
  onSelect: (id: string) => void
}

export function PatientQueue({ patients, selectedId, draftCounts, signedToday, onSelect }: Props) {
  return (
    <nav aria-label="Today's visits" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
      {patients.map((p) => {
        const active = p.id === selectedId
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            aria-current={active ? 'true' : undefined}
            className={`min-w-56 rounded-xl border px-3 py-2.5 text-left transition lg:min-w-0 ${
              active ? 'border-brand bg-brand-soft' : 'border-line bg-bg hover:border-brand/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-ink-muted">{p.visitTime}</span>
              {signedToday.has(p.id) ? (
                <span className="flex items-center gap-1 text-xs font-medium text-good"><CheckCircle2 size={13} /> Signed</span>
              ) : draftCounts[p.id] ? (
                <span className="flex items-center gap-1 text-xs font-medium text-warn"><PencilLine size={13} /> {draftCounts[p.id]} unsigned</span>
              ) : null}
            </div>
            <div className="mt-0.5 font-semibold">{p.name}</div>
            <div className="truncate text-xs text-ink-muted">{p.visitReason}</div>
          </button>
        )
      })}
    </nav>
  )
}
