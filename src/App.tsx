import { RotateCcw } from 'lucide-react'
import { useMemo, useReducer, useState } from 'react'
import { ChartHeader } from './components/ChartHeader'
import { Disclaimer } from './components/Disclaimer'
import { EventLog } from './components/EventLog'
import { MedicationList } from './components/MedicationList'
import { PatientQueue } from './components/PatientQueue'
import { PharmacyPicker } from './components/PharmacyPicker'
import { SignPanel } from './components/SignPanel'
import { SinceLastVisit } from './components/SinceLastVisit'
import { TodayScores } from './components/TodayScores'
import { Panel } from './components/ui'
import { PATIENTS, PHARMACIES, PROVIDER } from './data/seed'
import { daysBetween, formatDate } from './lib/dates'
import { suggestFollowUp } from './lib/followup'
import { stoppedSince } from './lib/meds'
import { project } from './lib/projection'
import type { NewEvent } from './lib/types'
import { changeDose, medsNeedingRx, selectPharmacy, signBlockers, signVisit, stamp, stopMed, type CommandResult } from './lib/visit'
import { cockpitReducer, EMPTY_SCORES, initialState } from './state/cockpit'

const newId = () => crypto.randomUUID()

export default function App() {
  const [state, dispatch] = useReducer(cockpitReducer, undefined, () => initialState())
  const [weeksOverride, setWeeksOverride] = useState<Record<string, number>>({})
  const { today, selectedId } = state

  const patient = PATIENTS.find((p) => p.id === selectedId)!
  const drafts = useMemo(() => state.drafts[selectedId] ?? [], [state.drafts, selectedId])
  const signedChart = useMemo(() => project(selectedId, state.log), [selectedId, state.log])
  const chart = useMemo(() => project(selectedId, [...state.log, ...drafts]), [selectedId, state.log, drafts])
  const scores = state.scores[selectedId] ?? EMPTY_SCORES

  const signedToday = useMemo(() => new Set(
    state.log.filter((e) => e.type === 'VisitCompleted' && daysBetween(e.at, today) === 0).map((e) => e.patientId),
  ), [state.log, today])
  const isSigned = signedToday.has(selectedId)

  // "Since last visit" means the last signed visit before today
  const priorVisits = signedChart.visits.filter((v) => daysBetween(v.at, today) > 0)
  const lastVisitAt = priorVisits[0]?.at ?? null
  const ctx = { patientId: selectedId, visitId: `visit-${selectedId}-${today.slice(0, 10)}`, actor: PROVIDER }

  const rxNeeded = medsNeedingRx(chart, lastVisitAt, today)
  const medChanges = new Set(drafts.flatMap((e) => ('medId' in e ? [e.medId] : []))).size
  const intake = [...priorVisits].reverse().find((v) => v.kind === 'intake')
  const suggestion = suggestFollowUp({ medChanges, phq9: scores.phq9, intakePhq9: intake?.phq9 ?? null })
  const weeks = weeksOverride[selectedId] ?? suggestion.weeks
  const blockers = signBlockers({ chart, lastVisitAt, phq9: scores.phq9, gad7: scores.gad7, today })

  const run = (result: CommandResult) => {
    if (!result.ok) return dispatch({ type: 'notice', notice: { tone: 'bad', text: result.error } })
    dispatch({ type: 'draft', patientId: selectedId, events: stamp(result.events, new Date().toISOString(), newId) })
  }

  const sign = () => {
    const result = signVisit({
      chart, lastVisitAt, ctx, phq9: scores.phq9, gad7: scores.gad7, followUpWeeks: weeks,
      followUpReason: weeks === suggestion.weeks ? suggestion.reason : 'Provider-selected interval',
      summary: visitSummary(drafts, scores.phq9),
      today,
    }, newId)
    if (!result.ok) return dispatch({ type: 'notice', notice: { tone: 'bad', text: result.error } })
    dispatch({ type: 'sign', patientId: selectedId, events: stamp(result.events, new Date().toISOString(), newId) })
  }

  const draftCounts = Object.fromEntries(Object.entries(state.drafts).map(([k, v]) => [k, v.length]))
  const draftMedIds = new Set(drafts.flatMap((e) => ('medId' in e ? [e.medId] : [])))

  return (
    <div className="min-h-screen bg-surface">
      <Disclaimer />
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-brand font-bold text-on-brand">V</div>
            <div>
              <div className="font-display font-semibold leading-tight">Visit Cockpit</div>
              <div className="text-xs text-ink-muted">{PROVIDER} · {formatDate(today)}</div>
            </div>
          </div>
          <button
            onClick={() => { dispatch({ type: 'reset' }); setWeeksOverride({}) }}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <RotateCcw size={14} aria-hidden /> Reset demo
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="min-w-0">
          <h2 className="mb-2 hidden text-xs font-semibold uppercase tracking-wide text-ink-muted lg:block">Today</h2>
          <PatientQueue
            patients={PATIENTS}
            selectedId={selectedId}
            draftCounts={draftCounts}
            signedToday={signedToday}
            onSelect={(id) => dispatch({ type: 'select', patientId: id })}
          />
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-line bg-bg p-4">
            <ChartHeader patient={patient} today={today} />
            <p className="mt-3 text-sm"><span className="text-ink-muted">Reason for visit:</span> {patient.visitReason}</p>
          </div>
          {state.notice && (
            <div role="status" className={`rounded-lg px-4 py-2.5 text-sm font-medium ${state.notice.tone === 'good' ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`}>
              {state.notice.text}
            </div>
          )}
          <SinceLastVisit visits={priorVisits} stoppedSince={stoppedSince(chart, lastVisitAt)} today={today} todayScores={scores} />
          <MedicationList
            meds={chart.activeMeds}
            lastVisitAt={lastVisitAt}
            today={today}
            draftMedIds={draftMedIds}
            onDose={(medId, dir) => run(changeDose(chart, ctx, medId, dir))}
            onStop={(medId) => run(stopMed(chart, ctx, medId, 'Discontinued at visit'))}
          />
          <TodayScores scores={scores} onChange={(s) => dispatch({ type: 'score', patientId: selectedId, scores: s })} />
        </div>

        <div className="space-y-4">
          <Panel title="Pharmacy">
            <PharmacyPicker pharmacies={PHARMACIES} selectedId={chart.pharmacyId} onSelect={(id) => run(selectPharmacy(ctx, id))} />
          </Panel>
          <Panel title="Orders & sign">
            <SignPanel
              rxNeeded={rxNeeded}
              suggestion={suggestion}
              weeks={weeks}
              onWeeks={(w) => setWeeksOverride((o) => ({ ...o, [selectedId]: w }))}
              blockers={blockers}
              today={today}
              alreadySigned={isSigned}
              booked={chart.followUp}
              onSign={sign}
            />
          </Panel>
          <EventLog
            signed={state.log.filter((e) => e.patientId === selectedId)}
            drafts={drafts}
            pharmacies={PHARMACIES}
            onUndo={() => dispatch({ type: 'undo', patientId: selectedId })}
          />
        </div>
      </main>
    </div>
  )
}

function visitSummary(drafts: NewEvent[], phq9: number | null): string {
  const changes = drafts.filter((e) => e.type === 'DoseChanged' || e.type === 'MedStopped').length
  const meds = changes ? `${changes} medication change${changes > 1 ? 's' : ''}` : 'No medication changes'
  return `${meds}. PHQ-9 today ${phq9 ?? 'not recorded'}.`
}
