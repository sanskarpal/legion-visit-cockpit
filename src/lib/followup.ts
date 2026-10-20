export interface FollowUpInput {
  medChanges: number // starts, dose changes and stops made this visit
  phq9: number | null
  intakePhq9: number | null
}

export interface FollowUpSuggestion {
  weeks: number
  reason: string
}

/**
 * Suggested interval to the next visit. A starting point the provider can
 * override, written as rules so each suggestion explains itself.
 */
export function suggestFollowUp({ medChanges, phq9, intakePhq9 }: FollowUpInput): FollowUpSuggestion {
  if (phq9 !== null && phq9 >= 20) return { weeks: 2, reason: 'Severe depressive symptoms (PHQ-9 ≥ 20)' }
  if (medChanges > 0) return { weeks: 4, reason: 'Medication change: check response and side effects' }
  if (phq9 !== null && intakePhq9 !== null && intakePhq9 > 0 && phq9 <= intakePhq9 / 2) {
    return { weeks: 12, reason: 'Stable: PHQ-9 at least 50% below intake' }
  }
  return { weeks: 8, reason: 'Routine follow-up' }
}

export function phq9Band(score: number): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (score < 5) return { label: 'minimal', tone: 'good' }
  if (score < 10) return { label: 'mild', tone: 'good' }
  if (score < 15) return { label: 'moderate', tone: 'warn' }
  if (score < 20) return { label: 'mod. severe', tone: 'bad' }
  return { label: 'severe', tone: 'bad' }
}

export function gad7Band(score: number): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (score < 5) return { label: 'minimal', tone: 'good' }
  if (score < 10) return { label: 'mild', tone: 'good' }
  if (score < 15) return { label: 'moderate', tone: 'warn' }
  return { label: 'severe', tone: 'bad' }
}
