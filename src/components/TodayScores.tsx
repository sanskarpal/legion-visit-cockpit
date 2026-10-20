import { gad7Band, phq9Band } from '../lib/followup'
import type { Scores } from '../state/cockpit'
import { Panel, Pill } from './ui'

export function TodayScores({ scores, onChange }: { scores: Scores; onChange: (s: Partial<Scores>) => void }) {
  return (
    <Panel title="Today's measures">
      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreInput label="PHQ-9" max={27} value={scores.phq9} band={phq9Band} onChange={(phq9) => onChange({ phq9 })} />
        <ScoreInput label="GAD-7" max={21} value={scores.gad7} band={gad7Band} onChange={(gad7) => onChange({ gad7 })} />
      </div>
    </Panel>
  )
}

function ScoreInput({ label, max, value, band, onChange }: {
  label: string
  max: number
  value: number | null
  band: (n: number) => { label: string; tone: 'good' | 'warn' | 'bad' }
  onChange: (v: number | null) => void
}) {
  const id = `score-${label}`
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-14 text-sm font-semibold">{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        placeholder={`0–${max}`}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(null)
          const n = Math.round(Number(raw))
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(0, n)))
        }}
        className="w-20 rounded-lg border border-line bg-bg px-3 py-1.5 tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {value !== null && <Pill tone={band(value).tone}>{band(value).label}</Pill>}
    </div>
  )
}
