import { describe, expect, it } from 'vitest'
import { project } from './projection'
import type { ClinicalEvent } from './types'

const base = { patientId: 'p', actor: 'dr' }
const events: ClinicalEvent[] = [
  { ...base, id: '1', at: '2026-01-01T10:00:00Z', type: 'MedStarted', medId: 'm1', drugId: 'sertraline', doseMg: 50, frequency: 'daily', indication: 'dep' },
  { ...base, id: '2', at: '2026-01-01T10:00:01Z', type: 'PrescriptionSent', rxId: 'r1', medId: 'm1', pharmacyId: 'ph', doseMg: 50, daysSupply: 30, refills: 0 },
  { ...base, id: '3', at: '2026-02-01T10:00:00Z', type: 'DoseChanged', medId: 'm1', fromMg: 50, toMg: 100, reason: 'Partial response' },
  { ...base, id: '4', at: '2026-01-01T10:00:00Z', type: 'MedStarted', medId: 'm2', drugId: 'trazodone', doseMg: 50, frequency: 'at bedtime', indication: 'sleep' },
  { ...base, id: '5', at: '2026-03-01T10:00:00Z', type: 'MedStopped', medId: 'm2', reason: 'Not needed' },
  { ...base, id: '6', at: '2026-01-01T11:00:00Z', type: 'VisitCompleted', visitId: 'v1', kind: 'intake', provider: 'dr', phq9: 18, gad7: 12, summary: 'intake' },
  { ...base, id: '7', at: '2026-02-01T11:00:00Z', type: 'VisitCompleted', visitId: 'v2', kind: 'follow-up', provider: 'dr', phq9: 12, gad7: 9, summary: 'fu' },
  { ...base, patientId: 'other', id: '8', at: '2026-01-02T00:00:00Z', type: 'PharmacySelected', pharmacyId: 'x' },
]

describe('project', () => {
  it('folds starts, dose changes and stops into the current med list', () => {
    const chart = project('p', events)
    expect(chart.activeMeds.map((m) => [m.drugId, m.doseMg])).toEqual([['sertraline', 100]])
    expect(chart.activeMeds[0].history.map((h) => h.doseMg)).toEqual([50, 100])
    expect(chart.stoppedMeds).toEqual([
      { medId: 'm2', drugId: 'trazodone', lastDoseMg: 50, stoppedAt: '2026-03-01T10:00:00Z', reason: 'Not needed' },
    ])
  })

  it('lists visits newest first and ignores other patients', () => {
    const chart = project('p', events)
    expect(chart.visits.map((v) => v.visitId)).toEqual(['v2', 'v1'])
    expect(chart.pharmacyId).toBeNull()
  })

  it('is order-independent on input because it sorts by time', () => {
    const shuffled = [...events].reverse()
    expect(project('p', shuffled)).toEqual(project('p', events))
  })

  it('records the latest prescription on the med', () => {
    const chart = project('p', events)
    expect(chart.activeMeds[0].lastRx).toMatchObject({ daysSupply: 30, refills: 0, pharmacyId: 'ph' })
  })
})
