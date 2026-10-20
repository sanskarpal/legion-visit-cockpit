import type { Chart, MedChange, MedState } from './types'
import { addDays, daysBetween } from './dates'

/** How each active med differs from what the patient was on at a given moment. */
export function changeSince(med: MedState, since: string | null): MedChange {
  if (!since) return 'unchanged'
  if (med.startedAt > since) return 'new'
  const before = [...med.history].reverse().find((h) => h.at <= since)
  if (!before || before.doseMg === med.doseMg) return 'unchanged'
  return med.doseMg > before.doseMg ? 'increased' : 'decreased'
}

/** Stopped after `since`: these must stay visible so nobody restarts them by accident. */
export function stoppedSince(chart: Chart, since: string | null) {
  return since ? chart.stoppedMeds.filter((s) => s.stoppedAt > since) : []
}

export type RefillStatus =
  | { kind: 'none' } // never prescribed through this chart
  | { kind: 'ok'; runsOut: string; daysLeft: number }
  | { kind: 'due'; runsOut: string; daysLeft: number } // within the warning window
  | { kind: 'out'; runsOut: string; daysLeft: number }

/** Supply lasts daysSupply × (1 + refills) from the last prescription. */
export function refillStatus(med: MedState, today: string, warnDays = 7): RefillStatus {
  if (!med.lastRx) return { kind: 'none' }
  const runsOut = addDays(med.lastRx.at, med.lastRx.daysSupply * (1 + med.lastRx.refills))
  const daysLeft = daysBetween(today, runsOut)
  if (daysLeft < 0) return { kind: 'out', runsOut, daysLeft }
  if (daysLeft <= warnDays) return { kind: 'due', runsOut, daysLeft }
  return { kind: 'ok', runsOut, daysLeft }
}

/** Sort for scanning: anything that changed or needs action floats to the top. */
export function scanOrder(meds: MedState[], since: string | null, today: string): MedState[] {
  const rank = (m: MedState) => {
    const change = changeSince(m, since)
    const refill = refillStatus(m, today).kind
    if (refill === 'out') return 0
    if (change !== 'unchanged') return 1
    if (refill === 'due') return 2
    return 3
  }
  return [...meds].sort((a, b) => rank(a) - rank(b) || a.drugId.localeCompare(b.drugId))
}
