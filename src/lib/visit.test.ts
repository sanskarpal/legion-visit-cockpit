import { describe, expect, it } from 'vitest'
import { PHARMACIES } from '../data/seed'
import { suggestFollowUp } from './followup'
import { pharmacyOptions, searchPharmacies } from './pharmacy'
import { project } from './projection'
import type { ClinicalEvent } from './types'
import { changeDose, medsNeedingRx, signBlockers, signVisit, stamp } from './visit'

const ctx = { patientId: 'p', visitId: 'v9', actor: 'dr' }
const lastVisitAt = '2026-01-01T11:00:00Z'
const history: ClinicalEvent[] = [
  { id: '1', patientId: 'p', actor: 'dr', at: '2026-01-01T10:00:00Z', type: 'MedStarted', medId: 'm1', drugId: 'sertraline', doseMg: 50, frequency: 'daily', indication: '' },
  { id: '2', patientId: 'p', actor: 'dr', at: '2026-01-01T10:00:00Z', type: 'PrescriptionSent', rxId: 'r', medId: 'm1', pharmacyId: 'ph1', doseMg: 50, daysSupply: 30, refills: 0 },
  { id: '3', patientId: 'p', actor: 'dr', at: lastVisitAt, type: 'VisitCompleted', visitId: 'v1', kind: 'intake', provider: 'dr', phq9: 16, gad7: 10, summary: '' },
]
let n = 0
const id = () => `x${++n}`

describe('changeDose', () => {
  it('steps to the next listed strength', () => {
    const result = changeDose(project('p', history), ctx, 'm1', 1)
    expect(result).toMatchObject({ ok: true, events: [{ type: 'DoseChanged', fromMg: 50, toMg: 100 }] })
  })
  it('refuses to go past the top of the range', () => {
    const atMax = [...history, ...stamp([{ ...ctx, type: 'DoseChanged', medId: 'm1', fromMg: 50, toMg: 200, reason: '' }], '2026-01-02T00:00:00Z', id)]
    expect(changeDose(project('p', atMax), ctx, 'm1', 1)).toEqual({ ok: false, error: 'Sertraline is already at its highest listed dose' })
  })
})

describe('signing a visit', () => {
  const draft = () => {
    const r = changeDose(project('p', history), ctx, 'm1', 1)
    if (!r.ok) throw new Error(r.error)
    return stamp(r.events, '2026-02-01T09:30:00Z', id)
  }

  it('blocks until scores and a pharmacy are in place', () => {
    const chart = project('p', [...history, ...draft()])
    expect(signBlockers({ chart, lastVisitAt, phq9: null, gad7: 4, today: '2026-01-15T00:00:00Z' })).toEqual([
      'Enter today’s PHQ-9',
      'Choose a pharmacy for the new prescriptions',
    ])
  })

  it('emits a prescription for each changed med, then follow-up and the visit record', () => {
    const chart = project('p', [...history, ...draft(), ...stamp([{ ...ctx, type: 'PharmacySelected', pharmacyId: 'ph3' }], '2026-02-01T09:31:00Z', id)])
    expect(medsNeedingRx(chart, lastVisitAt, '2026-02-01T00:00:00Z').map((n) => [n.med.medId, n.reason])).toEqual([['m1', 'changed']])
    const result = signVisit({
      chart, lastVisitAt, ctx, phq9: 11, gad7: 8, followUpWeeks: 4, followUpReason: 'Medication change', summary: 'ok',
      today: '2026-02-01T00:00:00Z',
    }, () => 'rx-new')
    expect(result.ok && result.events.map((e) => e.type)).toEqual(['PrescriptionSent', 'FollowUpScheduled', 'VisitCompleted'])
    expect(result.ok && result.events[0]).toMatchObject({ pharmacyId: 'ph3', doseMg: 100 })
    expect(result.ok && result.events[1]).toMatchObject({ date: '2026-03-01T00:00:00.000Z' })
  })
})

describe('medsNeedingRx', () => {
  it('queues a renewal for an unchanged med that is about to run out', () => {
    // 30-day supply from Jan 1 runs out Jan 31; five days before is inside the warning window
    expect(medsNeedingRx(project('p', history), lastVisitAt, '2026-01-26T00:00:00Z')).toMatchObject([{ reason: 'renewal' }])
    expect(medsNeedingRx(project('p', history), lastVisitAt, '2026-01-10T00:00:00Z')).toEqual([])
  })
})

describe('suggestFollowUp', () => {
  it('prioritizes severity, then medication changes, then stability', () => {
    expect(suggestFollowUp({ medChanges: 1, phq9: 22, intakePhq9: 20 }).weeks).toBe(2)
    expect(suggestFollowUp({ medChanges: 1, phq9: 9, intakePhq9: 20 }).weeks).toBe(4)
    expect(suggestFollowUp({ medChanges: 0, phq9: 8, intakePhq9: 18 }).weeks).toBe(12)
    expect(suggestFollowUp({ medChanges: 0, phq9: 12, intakePhq9: 18 }).weeks).toBe(8)
  })
})

describe('pharmacyOptions', () => {
  const options = pharmacyOptions(PHARMACIES)
  it('marks every store that shares a chain as a lookalike', () => {
    const cvs = options.find((o) => o.pharmacy.id === 'ph1')!
    expect(cvs.lookalikes.map((p) => p.id).sort()).toEqual(['ph2', 'ph3'])
  })
  it('uses the cross street when two stores share a street', () => {
    const wag = options.find((o) => o.pharmacy.id === 'ph4')!
    expect(wag.distinguisher).toBe('3101 S Lamar Blvd at Barton Skyway, Austin, TX')
  })
  it('keeps unique pharmacies short', () => {
    expect(options.find((o) => o.pharmacy.id === 'ph7')!.distinguisher).toBe('2414 Exposition Blvd, Austin, TX')
  })
  it('searches across name, address and phone', () => {
    expect(searchPharmacies(options, 'burnet').map((o) => o.pharmacy.id)).toEqual(['ph2'])
    expect(searchPharmacies(options, '555-0119').map((o) => o.pharmacy.id)).toEqual(['ph7'])
  })
})
