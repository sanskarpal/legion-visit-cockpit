import type { Chart, ClinicalEvent, MedState } from './types'

export function emptyChart(patientId: string): Chart {
  return { patientId, activeMeds: [], stoppedMeds: [], visits: [], pharmacyId: null, followUp: null }
}

/**
 * Folds one event into the chart. Pure and order-dependent: replaying the same
 * events always yields the same chart, which is what makes the audit log the
 * source of truth.
 */
export function apply(chart: Chart, e: ClinicalEvent): Chart {
  switch (e.type) {
    case 'MedStarted': {
      const med: MedState = {
        medId: e.medId,
        drugId: e.drugId,
        doseMg: e.doseMg,
        frequency: e.frequency,
        indication: e.indication,
        startedAt: e.at,
        lastChangedAt: e.at,
        history: [{ at: e.at, doseMg: e.doseMg, note: 'Started' }],
        lastRx: null,
      }
      return { ...chart, activeMeds: [...chart.activeMeds, med] }
    }
    case 'DoseChanged':
      return updateMed(chart, e.medId, (m) => ({
        ...m,
        doseMg: e.toMg,
        lastChangedAt: e.at,
        history: [...m.history, { at: e.at, doseMg: e.toMg, note: e.reason }],
      }))
    case 'MedStopped': {
      const med = chart.activeMeds.find((m) => m.medId === e.medId)
      if (!med) return chart
      return {
        ...chart,
        activeMeds: chart.activeMeds.filter((m) => m.medId !== e.medId),
        stoppedMeds: [
          { medId: med.medId, drugId: med.drugId, lastDoseMg: med.doseMg, stoppedAt: e.at, reason: e.reason },
          ...chart.stoppedMeds,
        ],
      }
    }
    case 'PrescriptionSent':
      return updateMed(chart, e.medId, (m) => ({
        ...m,
        lastRx: { at: e.at, daysSupply: e.daysSupply, refills: e.refills, pharmacyId: e.pharmacyId },
      }))
    case 'PharmacySelected':
      return { ...chart, pharmacyId: e.pharmacyId }
    case 'FollowUpScheduled':
      return { ...chart, followUp: { date: e.date, weeks: e.weeks, reason: e.reason } }
    case 'VisitCompleted':
      return {
        ...chart,
        visits: [
          { visitId: e.visitId, at: e.at, kind: e.kind, provider: e.provider, phq9: e.phq9, gad7: e.gad7, summary: e.summary },
          ...chart.visits,
        ],
      }
  }
}

export function project(patientId: string, events: ClinicalEvent[]): Chart {
  return events
    .filter((e) => e.patientId === patientId)
    .sort((a, b) => a.at.localeCompare(b.at))
    .reduce(apply, emptyChart(patientId))
}

function updateMed(chart: Chart, medId: string, fn: (m: MedState) => MedState): Chart {
  return { ...chart, activeMeds: chart.activeMeds.map((m) => (m.medId === medId ? fn(m) : m)) }
}
