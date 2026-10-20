import { AlertTriangle } from 'lucide-react'
import { ageOn } from '../lib/dates'
import type { Patient } from '../lib/types'
import { Pill } from './ui'

export function ChartHeader({ patient, today }: { patient: Patient; today: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{patient.name}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          {ageOn(patient.dob, today)} y · {patient.pronouns} · {patient.mrn}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {patient.diagnoses.map((d) => <Pill key={d}>{d}</Pill>)}
        </div>
      </div>
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
          patient.allergies.length ? 'border-bad/30 bg-bad/10 text-bad' : 'border-line text-ink-muted'
        }`}
      >
        {patient.allergies.length > 0 && <AlertTriangle size={16} aria-hidden />}
        {patient.allergies.length ? `Allergies: ${patient.allergies.join(', ')}` : 'No known allergies'}
      </div>
    </div>
  )
}
