import { PATIENTS, seedEvents } from '../data/seed'
import type { ClinicalEvent } from '../lib/types'

export interface Scores {
  phq9: number | null
  gad7: number | null
}

export const EMPTY_SCORES: Scores = { phq9: null, gad7: null }

export interface CockpitState {
  today: string
  log: ClinicalEvent[] // signed, permanent
  drafts: Record<string, ClinicalEvent[]> // per patient, unsigned
  scores: Record<string, Scores>
  selectedId: string
  notice: { tone: 'good' | 'bad'; text: string } | null
}

export type CockpitAction =
  | { type: 'select'; patientId: string }
  | { type: 'draft'; patientId: string; events: ClinicalEvent[] }
  | { type: 'undo'; patientId: string }
  | { type: 'score'; patientId: string; scores: Partial<Scores> }
  | { type: 'sign'; patientId: string; events: ClinicalEvent[] }
  | { type: 'notice'; notice: CockpitState['notice'] }
  | { type: 'reset' }

export function initialState(today = new Date().toISOString()): CockpitState {
  return { today, log: seedEvents(today), drafts: {}, scores: {}, selectedId: PATIENTS[0].id, notice: null }
}

export function cockpitReducer(state: CockpitState, action: CockpitAction): CockpitState {
  switch (action.type) {
    case 'select':
      return { ...state, selectedId: action.patientId, notice: null }
    case 'draft':
      return {
        ...state,
        drafts: { ...state.drafts, [action.patientId]: [...(state.drafts[action.patientId] ?? []), ...action.events] },
        notice: null,
      }
    case 'undo':
      return { ...state, drafts: { ...state.drafts, [action.patientId]: (state.drafts[action.patientId] ?? []).slice(0, -1) } }
    case 'score':
      return {
        ...state,
        scores: { ...state.scores, [action.patientId]: { ...(state.scores[action.patientId] ?? EMPTY_SCORES), ...action.scores } },
      }
    case 'sign': {
      // drafts and the events signing implies land in the log together, as one commit
      const committed = [...(state.drafts[action.patientId] ?? []), ...action.events]
      return {
        ...state,
        log: [...state.log, ...committed],
        drafts: { ...state.drafts, [action.patientId]: [] },
        notice: { tone: 'good', text: `Visit signed: ${committed.length} events added to the record` },
      }
    }
    case 'notice':
      return { ...state, notice: action.notice }
    case 'reset':
      return initialState(state.today)
  }
}
