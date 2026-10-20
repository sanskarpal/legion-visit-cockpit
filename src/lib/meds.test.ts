import { describe, expect, it } from 'vitest'
import { changeSince, refillStatus, scanOrder } from './meds'
import type { MedState } from './types'

function med(overrides: Partial<MedState>): MedState {
  return {
    medId: 'm', drugId: 'sertraline', doseMg: 100, frequency: 'daily', indication: '',
    startedAt: '2026-01-01T00:00:00Z', lastChangedAt: '2026-01-01T00:00:00Z',
    history: [{ at: '2026-01-01T00:00:00Z', doseMg: 100, note: 'Started' }], lastRx: null,
    ...overrides,
  }
}

describe('changeSince', () => {
  const lastVisit = '2026-02-01T00:00:00Z'
  it('flags meds started after the last visit as new', () => {
    expect(changeSince(med({ startedAt: '2026-02-10T00:00:00Z' }), lastVisit)).toBe('new')
  })
  it('compares against the dose in effect at the last visit', () => {
    const history = [
      { at: '2026-01-01T00:00:00Z', doseMg: 50, note: '' },
      { at: '2026-02-15T00:00:00Z', doseMg: 100, note: '' },
    ]
    expect(changeSince(med({ doseMg: 100, history }), lastVisit)).toBe('increased')
    expect(changeSince(med({ doseMg: 25, history: [...history, { at: '2026-02-20T00:00:00Z', doseMg: 25, note: '' }] }), lastVisit)).toBe('decreased')
  })
  it('treats a change that was reverted as unchanged', () => {
    const history = [
      { at: '2026-01-01T00:00:00Z', doseMg: 50, note: '' },
      { at: '2026-02-10T00:00:00Z', doseMg: 100, note: '' },
      { at: '2026-02-12T00:00:00Z', doseMg: 50, note: '' },
    ]
    expect(changeSince(med({ doseMg: 50, history }), lastVisit)).toBe('unchanged')
  })
  it('reports nothing when there is no prior visit', () => {
    expect(changeSince(med({}), null)).toBe('unchanged')
  })
})

describe('refillStatus', () => {
  const rx = (at: string, daysSupply: number, refills: number) => ({ at, daysSupply, refills, pharmacyId: 'ph' })
  it('counts refills toward the supply', () => {
    const s = refillStatus(med({ lastRx: rx('2026-01-01T00:00:00Z', 30, 2) }), '2026-02-01T00:00:00Z')
    expect(s).toMatchObject({ kind: 'ok', daysLeft: 59 })
  })
  it('warns inside the window and flags a lapse', () => {
    expect(refillStatus(med({ lastRx: rx('2026-01-01T00:00:00Z', 30, 0) }), '2026-01-26T00:00:00Z').kind).toBe('due')
    expect(refillStatus(med({ lastRx: rx('2026-01-01T00:00:00Z', 30, 0) }), '2026-02-05T00:00:00Z')).toMatchObject({ kind: 'out', daysLeft: -5 })
  })
  it('handles meds never prescribed here', () => {
    expect(refillStatus(med({}), '2026-02-01T00:00:00Z').kind).toBe('none')
  })
})

describe('scanOrder', () => {
  it('puts lapsed, changed and due meds above stable ones', () => {
    const today = '2026-03-01T00:00:00Z'
    const stable = med({ medId: 'a', drugId: 'aripiprazole', lastRx: { at: '2026-02-20T00:00:00Z', daysSupply: 30, refills: 1, pharmacyId: 'ph' } })
    const changed = med({ medId: 'b', drugId: 'bupropion', startedAt: '2026-02-25T00:00:00Z' })
    const lapsed = med({ medId: 'c', drugId: 'zzz', lastRx: { at: '2026-01-01T00:00:00Z', daysSupply: 30, refills: 0, pharmacyId: 'ph' } })
    expect(scanOrder([stable, changed, lapsed], '2026-02-01T00:00:00Z', today).map((m) => m.medId)).toEqual(['c', 'b', 'a'])
  })
})
