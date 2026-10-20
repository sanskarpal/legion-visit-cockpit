// Fictional patients, pharmacies and history. Dates are generated relative to
// "today" so refill timing and "since last visit" always read correctly.
import { addDays } from '../lib/dates'
import type { ClinicalEvent, DistributiveOmit, NewEvent, Patient, Pharmacy } from '../lib/types'

export const PROVIDER = 'R. Alvarez, PMHNP'

export const PATIENTS: Patient[] = [
  {
    id: 'p1', name: 'Maya Okafor', pronouns: 'she/her', dob: '1997-03-14', mrn: 'LH-20417',
    allergies: ['Penicillin'], diagnoses: ['Major depressive disorder, recurrent', 'Generalized anxiety disorder'],
    visitTime: '9:00', visitReason: '4-week follow-up after dose increase',
  },
  {
    id: 'p2', name: 'Priya Natarajan', pronouns: 'she/they', dob: '2002-08-02', mrn: 'LH-21983',
    allergies: [], diagnoses: ['ADHD, combined presentation', 'Major depressive disorder, single episode'],
    visitTime: '9:30', visitReason: 'Check-in after starting atomoxetine',
  },
  {
    id: 'p3', name: 'Marcus Lee', pronouns: 'he/him', dob: '1984-11-21', mrn: 'LH-18820',
    allergies: ['Sulfa drugs', 'Latex'], diagnoses: ['Bipolar II disorder'],
    visitTime: '10:15', visitReason: 'Quarterly medication management',
  },
  {
    id: 'p4', name: 'Jordan Whitfield', pronouns: 'they/them', dob: '1990-05-30', mrn: 'LH-22305',
    allergies: [], diagnoses: ['Generalized anxiety disorder', 'Insomnia disorder'],
    visitTime: '11:00', visitReason: 'First follow-up after intake',
  },
]

export const PHARMACIES: Pharmacy[] = [
  { id: 'ph1', name: 'CVS Pharmacy', chain: 'CVS', street: '1101 W 6th St', crossStreet: 'N Lamar Blvd', city: 'Austin, TX', phone: '(512) 555-0141', distanceMi: 1.2, hours: '8a–9p' },
  { id: 'ph2', name: 'CVS Pharmacy', chain: 'CVS', street: '8820 Burnet Rd', crossStreet: 'Anderson Ln', city: 'Austin, TX', phone: '(512) 555-0177', distanceMi: 4.8, hours: '24 hours' },
  { id: 'ph3', name: 'CVS Pharmacy', chain: 'CVS', street: '2501 S Congress Ave', crossStreet: 'Oltorf St', city: 'Austin, TX', phone: '(512) 555-0102', distanceMi: 3.1, hours: '8a–10p' },
  { id: 'ph4', name: 'Walgreens', chain: 'Walgreens', street: '3101 S Lamar Blvd', crossStreet: 'Barton Skyway', city: 'Austin, TX', phone: '(512) 555-0163', distanceMi: 2.6, hours: '7a–10p' },
  { id: 'ph5', name: 'Walgreens', chain: 'Walgreens', street: '4610 S Lamar Blvd', crossStreet: 'W Ben White Blvd', city: 'Austin, TX', phone: '(512) 555-0188', distanceMi: 4.1, hours: '24 hours' },
  { id: 'ph6', name: 'H-E-B Pharmacy', chain: 'H-E-B', street: '1000 E 41st St', crossStreet: 'Red River St', city: 'Austin, TX', phone: '(512) 555-0125', distanceMi: 2.9, hours: '9a–9p' },
  { id: 'ph7', name: 'Tarrytown Apothecary', chain: null, street: '2414 Exposition Blvd', crossStreet: 'Westover Rd', city: 'Austin, TX', phone: '(512) 555-0119', distanceMi: 1.9, hours: '9a–6p' },
]

type Spec = [daysAgo: number, event: DistributiveOmit<NewEvent, 'patientId' | 'actor'>]

export function seedEvents(today: string): ClinicalEvent[] {
  let n = 0
  const build = (patientId: string, specs: Spec[]): ClinicalEvent[] =>
    specs.map(([daysAgo, e]) => ({
      ...e, patientId, actor: PROVIDER, id: `e${++n}`, at: addDays(today, -daysAgo),
    }) as ClinicalEvent)

  return [
    ...build('p1', [
      [70, { type: 'PharmacySelected', pharmacyId: 'ph1' }],
      [70, { type: 'MedStarted', medId: 'm1', drugId: 'sertraline', doseMg: 50, frequency: 'daily', indication: 'Depression, anxiety' }],
      [70, { type: 'MedStarted', medId: 'm2', drugId: 'hydroxyzine', doseMg: 25, frequency: 'as needed', indication: 'Acute anxiety' }],
      [70, { type: 'PrescriptionSent', rxId: 'rx1', medId: 'm2', pharmacyId: 'ph1', doseMg: 25, daysSupply: 30, refills: 2 }],
      [70, { type: 'VisitCompleted', visitId: 'v1', kind: 'intake', provider: PROVIDER, phq9: 18, gad7: 15, summary: 'Intake. Recurrent MDD with prominent anxiety; started sertraline 50 mg.' }],
      [28, { type: 'DoseChanged', medId: 'm1', fromMg: 50, toMg: 100, reason: 'Partial response' }],
      [28, { type: 'PrescriptionSent', rxId: 'rx2', medId: 'm1', pharmacyId: 'ph1', doseMg: 100, daysSupply: 30, refills: 0 }],
      [28, { type: 'VisitCompleted', visitId: 'v2', kind: 'follow-up', provider: PROVIDER, phq9: 13, gad7: 11, summary: 'Partial response, mild GI upset resolved. Increased sertraline to 100 mg.' }],
    ]),
    ...build('p2', [
      [56, { type: 'PharmacySelected', pharmacyId: 'ph4' }],
      [56, { type: 'MedStarted', medId: 'm3', drugId: 'escitalopram', doseMg: 10, frequency: 'daily', indication: 'Depression' }],
      [56, { type: 'PrescriptionSent', rxId: 'rx3', medId: 'm3', pharmacyId: 'ph4', doseMg: 10, daysSupply: 30, refills: 2 }],
      [56, { type: 'VisitCompleted', visitId: 'v3', kind: 'intake', provider: PROVIDER, phq9: 14, gad7: 8, summary: 'Intake. ADHD symptoms since childhood, untreated; mood improving on prior PCP plan. Continue escitalopram.' }],
      [15, { type: 'MedStarted', medId: 'm4', drugId: 'atomoxetine', doseMg: 40, frequency: 'daily', indication: 'ADHD' }],
      [15, { type: 'PrescriptionSent', rxId: 'rx4', medId: 'm4', pharmacyId: 'ph4', doseMg: 40, daysSupply: 30, refills: 0 }],
    ]),
    ...build('p3', [
      [180, { type: 'PharmacySelected', pharmacyId: 'ph6' }],
      [180, { type: 'MedStarted', medId: 'm5', drugId: 'lamotrigine', doseMg: 100, frequency: 'daily', indication: 'Mood stabilization' }],
      [180, { type: 'MedStarted', medId: 'm6', drugId: 'bupropion', doseMg: 150, frequency: 'daily', indication: 'Bipolar depression' }],
      [180, { type: 'VisitCompleted', visitId: 'v4', kind: 'intake', provider: PROVIDER, phq9: 16, gad7: 7, summary: 'Intake. Bipolar II, depressive phase. Titrating lamotrigine; bupropion adjunct.' }],
      [90, { type: 'DoseChanged', medId: 'm5', fromMg: 100, toMg: 150, reason: 'Titration' }],
      [90, { type: 'PrescriptionSent', rxId: 'rx5', medId: 'm5', pharmacyId: 'ph6', doseMg: 150, daysSupply: 90, refills: 1 }],
      [90, { type: 'VisitCompleted', visitId: 'v5', kind: 'follow-up', provider: PROVIDER, phq9: 7, gad7: 5, summary: 'Euthymic. Lamotrigine to 150 mg target. Discussed tapering bupropion.' }],
      [40, { type: 'MedStopped', medId: 'm6', reason: 'Mood stable; tapered off (patient call)' }],
    ]),
    ...build('p4', [
      [21, { type: 'PharmacySelected', pharmacyId: 'ph7' }],
      [21, { type: 'MedStarted', medId: 'm7', drugId: 'escitalopram', doseMg: 10, frequency: 'daily', indication: 'Anxiety' }],
      [21, { type: 'MedStarted', medId: 'm8', drugId: 'trazodone', doseMg: 50, frequency: 'at bedtime', indication: 'Insomnia' }],
      [21, { type: 'PrescriptionSent', rxId: 'rx6', medId: 'm7', pharmacyId: 'ph7', doseMg: 10, daysSupply: 30, refills: 1 }],
      [21, { type: 'PrescriptionSent', rxId: 'rx7', medId: 'm8', pharmacyId: 'ph7', doseMg: 50, daysSupply: 30, refills: 1 }],
      [21, { type: 'VisitCompleted', visitId: 'v6', kind: 'intake', provider: PROVIDER, phq9: 9, gad7: 16, summary: 'Intake. Long-standing GAD, sleep onset insomnia. Started escitalopram 10 mg and trazodone 50 mg qhs.' }],
    ]),
  ]
}
