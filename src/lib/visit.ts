import { drug, stepDose } from './catalog'
import { addDays } from './dates'
import { changeSince, refillStatus } from './meds'
import type { Chart, ClinicalEvent, MedState, NewEvent } from './types'

/**
 * Commands turn a provider's intent into events. During a visit, events are
 * held as a draft; signing appends them, plus the prescriptions, follow-up and
 * visit record they imply, to the permanent log in one step.
 */

export type CommandResult = { ok: true; events: NewEvent[] } | { ok: false; error: string }

export interface VisitContext {
  patientId: string
  visitId: string
  actor: string
}

export function changeDose(chart: Chart, ctx: VisitContext, medId: string, direction: 1 | -1): CommandResult {
  const med = chart.activeMeds.find((m) => m.medId === medId)
  if (!med) return { ok: false, error: 'Medication is not active' }
  const next = stepDose(med.drugId, med.doseMg, direction)
  if (next === null) {
    const d = drug(med.drugId)
    return { ok: false, error: `${d.name} is already at its ${direction === 1 ? 'highest' : 'lowest'} listed dose` }
  }
  return {
    ok: true,
    events: [{
      type: 'DoseChanged', patientId: ctx.patientId, visitId: ctx.visitId, actor: ctx.actor,
      medId, fromMg: med.doseMg, toMg: next, reason: direction === 1 ? 'Partial response' : 'Side effects',
    }],
  }
}

export function stopMed(chart: Chart, ctx: VisitContext, medId: string, reason: string): CommandResult {
  if (!chart.activeMeds.some((m) => m.medId === medId)) return { ok: false, error: 'Medication is not active' }
  return {
    ok: true,
    events: [{ type: 'MedStopped', patientId: ctx.patientId, visitId: ctx.visitId, actor: ctx.actor, medId, reason }],
  }
}

export function selectPharmacy(ctx: VisitContext, pharmacyId: string): CommandResult {
  return {
    ok: true,
    events: [{ type: 'PharmacySelected', patientId: ctx.patientId, visitId: ctx.visitId, actor: ctx.actor, pharmacyId }],
  }
}

export interface SignInput {
  chart: Chart // projection including the draft
  lastVisitAt: string | null
  ctx: VisitContext
  phq9: number | null
  gad7: number | null
  followUpWeeks: number
  followUpReason: string
  summary: string
  today: string
}

export const DAYS_SUPPLY = 30

/** Everything that must be true before a visit can be signed, as readable messages. */
export function signBlockers(input: Pick<SignInput, 'chart' | 'lastVisitAt' | 'phq9' | 'gad7' | 'today'>): string[] {
  const blockers: string[] = []
  if (input.phq9 === null) blockers.push('Enter today’s PHQ-9')
  if (input.gad7 === null) blockers.push('Enter today’s GAD-7')
  if (medsNeedingRx(input.chart, input.lastVisitAt, input.today).length > 0 && !input.chart.pharmacyId) {
    blockers.push('Choose a pharmacy for the new prescriptions')
  }
  return blockers
}

export interface RxNeed {
  med: MedState
  reason: 'changed' | 'renewal'
}

/**
 * New or re-dosed meds need a fresh prescription at the new strength (unless
 * one already went out), and meds about to run out need a renewal.
 */
export function medsNeedingRx(chart: Chart, lastVisitAt: string | null, today: string): RxNeed[] {
  return chart.activeMeds.flatMap((m): RxNeed[] => {
    if (changeSince(m, lastVisitAt) !== 'unchanged' && (!m.lastRx || m.lastRx.at < m.lastChangedAt)) {
      return [{ med: m, reason: 'changed' }]
    }
    const refill = refillStatus(m, today).kind
    return refill === 'due' || refill === 'out' ? [{ med: m, reason: 'renewal' }] : []
  })
}

export function signVisit(input: SignInput, makeRxId: () => string): CommandResult {
  const blockers = signBlockers(input)
  if (blockers.length) return { ok: false, error: blockers.join('; ') }
  const { chart, ctx } = input
  const base = { patientId: ctx.patientId, visitId: ctx.visitId, actor: ctx.actor }
  const rx: NewEvent[] = medsNeedingRx(chart, input.lastVisitAt, input.today).map(({ med: m }) => ({
    ...base, type: 'PrescriptionSent', rxId: makeRxId(), medId: m.medId, pharmacyId: chart.pharmacyId!,
    doseMg: m.doseMg, daysSupply: DAYS_SUPPLY, refills: 1,
  }))
  return {
    ok: true,
    events: [
      ...rx,
      { ...base, type: 'FollowUpScheduled', date: addDays(input.today, input.followUpWeeks * 7), weeks: input.followUpWeeks, reason: input.followUpReason },
      { ...base, type: 'VisitCompleted', kind: 'follow-up', provider: ctx.actor, phq9: input.phq9!, gad7: input.gad7!, summary: input.summary },
    ],
  }
}

/** Stamps ids and timestamps; the only place new events become real. */
export function stamp(events: NewEvent[], at: string, makeId: () => string): ClinicalEvent[] {
  return events.map((e) => ({ ...e, id: makeId(), at }) as ClinicalEvent)
}
