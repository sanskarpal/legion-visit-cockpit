import { drug } from './catalog'
import type { ClinicalEvent, Pharmacy } from './types'

/** One plain-language line per event for the audit log. */
export function describeEvent(e: ClinicalEvent, drugOf: (medId: string) => string | undefined, pharmacies: Pharmacy[]): string {
  const name = (medId: string) => {
    const id = drugOf(medId)
    return id ? drug(id).name : medId
  }
  const pharmacy = (id: string) => {
    const p = pharmacies.find((x) => x.id === id)
    return p ? `${p.name}, ${p.street}` : id
  }
  switch (e.type) {
    case 'MedStarted': return `Started ${drug(e.drugId).name} ${e.doseMg} mg ${e.frequency}`
    case 'DoseChanged': return `${name(e.medId)} ${e.fromMg} → ${e.toMg} mg (${e.reason.toLowerCase()})`
    case 'MedStopped': return `Stopped ${name(e.medId)}: ${e.reason}`
    case 'PharmacySelected': return `Pharmacy set to ${pharmacy(e.pharmacyId)}`
    case 'PrescriptionSent': return `Rx ${name(e.medId)} ${e.doseMg} mg, ${e.daysSupply} days + ${e.refills} refill${e.refills === 1 ? '' : 's'} → ${pharmacy(e.pharmacyId)}`
    case 'FollowUpScheduled': return `Follow-up in ${e.weeks} weeks: ${e.reason}`
    case 'VisitCompleted': return `${e.kind === 'intake' ? 'Intake' : 'Follow-up'} signed · PHQ-9 ${e.phq9}, GAD-7 ${e.gad7}`
  }
}
