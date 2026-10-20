// Small formulary for the demo. Strengths are the common tablet steps a
// prescriber clicks through; this is illustrative data, not dosing guidance.

export interface Drug {
  id: string
  name: string
  brand: string
  steps: number[] // allowed daily doses in mg, ascending
}

export const DRUGS: Record<string, Drug> = {
  sertraline: { id: 'sertraline', name: 'Sertraline', brand: 'Zoloft', steps: [25, 50, 100, 150, 200] },
  escitalopram: { id: 'escitalopram', name: 'Escitalopram', brand: 'Lexapro', steps: [5, 10, 15, 20] },
  bupropion: { id: 'bupropion', name: 'Bupropion XL', brand: 'Wellbutrin XL', steps: [150, 300, 450] },
  lamotrigine: { id: 'lamotrigine', name: 'Lamotrigine', brand: 'Lamictal', steps: [25, 50, 100, 150, 200] },
  aripiprazole: { id: 'aripiprazole', name: 'Aripiprazole', brand: 'Abilify', steps: [2, 5, 10, 15] },
  trazodone: { id: 'trazodone', name: 'Trazodone', brand: 'Desyrel', steps: [25, 50, 100] },
  hydroxyzine: { id: 'hydroxyzine', name: 'Hydroxyzine', brand: 'Vistaril', steps: [10, 25, 50] },
  atomoxetine: { id: 'atomoxetine', name: 'Atomoxetine', brand: 'Strattera', steps: [40, 60, 80, 100] },
}

export function drug(id: string): Drug {
  const d = DRUGS[id]
  if (!d) throw new Error(`Unknown drug ${id}`)
  return d
}

/** The next allowed dose up or down, or null at either end of the range. */
export function stepDose(drugId: string, currentMg: number, direction: 1 | -1): number | null {
  const steps = drug(drugId).steps
  if (direction === 1) return steps.find((s) => s > currentMg) ?? null
  return [...steps].reverse().find((s) => s < currentMg) ?? null
}
