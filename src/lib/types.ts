// Domain model. The chart is never stored directly: it is a projection of an
// append-only list of clinical events, the same shape as an event-sourced EHR.

export type Frequency = 'daily' | 'twice daily' | 'at bedtime' | 'as needed'

export interface Patient {
  id: string
  name: string
  pronouns: string
  dob: string // ISO date
  mrn: string
  allergies: string[]
  diagnoses: string[]
  visitTime: string // today's appointment, e.g. "9:30"
  visitReason: string
}

export interface Pharmacy {
  id: string
  name: string
  chain: string | null
  street: string
  crossStreet: string
  city: string
  phone: string
  distanceMi: number
  hours: string
}

interface EventBase {
  id: string
  patientId: string
  at: string // ISO timestamp
  actor: string
  visitId?: string
}

export type ClinicalEvent = EventBase &
  (
    | {
        type: 'VisitCompleted'
        visitId: string
        kind: 'intake' | 'follow-up'
        provider: string
        phq9: number
        gad7: number
        summary: string
      }
    | { type: 'MedStarted'; medId: string; drugId: string; doseMg: number; frequency: Frequency; indication: string }
    | { type: 'DoseChanged'; medId: string; fromMg: number; toMg: number; reason: string }
    | { type: 'MedStopped'; medId: string; reason: string }
    | { type: 'PharmacySelected'; pharmacyId: string }
    | {
        type: 'PrescriptionSent'
        rxId: string
        medId: string
        pharmacyId: string
        doseMg: number
        daysSupply: number
        refills: number
      }
    | { type: 'FollowUpScheduled'; date: string; weeks: number; reason: string }
  )

export type EventType = ClinicalEvent['type']

/** Omit applied to each member of a union, so every event variant keeps its own fields. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** An event before it is stamped with an id and timestamp. */
export type NewEvent = DistributiveOmit<ClinicalEvent, 'id' | 'at'>

export interface MedState {
  medId: string
  drugId: string
  doseMg: number
  frequency: Frequency
  indication: string
  startedAt: string
  lastChangedAt: string
  history: { at: string; doseMg: number; note: string }[]
  lastRx: { at: string; daysSupply: number; refills: number; pharmacyId: string } | null
}

export interface StoppedMed {
  medId: string
  drugId: string
  lastDoseMg: number
  stoppedAt: string
  reason: string
}

export interface VisitSummary {
  visitId: string
  at: string
  kind: 'intake' | 'follow-up'
  provider: string
  phq9: number
  gad7: number
  summary: string
}

export interface Chart {
  patientId: string
  activeMeds: MedState[]
  stoppedMeds: StoppedMed[]
  visits: VisitSummary[] // newest first
  pharmacyId: string | null
  followUp: { date: string; weeks: number; reason: string } | null
}

export type MedChange = 'new' | 'increased' | 'decreased' | 'unchanged'
