import type { Pharmacy } from './types'

export interface PharmacyOption {
  pharmacy: Pharmacy
  /** Pharmacies that could be confused with this one (same chain or same name). */
  lookalikes: Pharmacy[]
  /** The one line that tells this location apart from its lookalikes. */
  distinguisher: string
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const streetName = (street: string) => normalize(street.replace(/^\d+\s*/, ''))

function sameBrand(a: Pharmacy, b: Pharmacy): boolean {
  if (a.id === b.id) return false
  if (a.chain && b.chain) return a.chain === b.chain
  return normalize(a.name) === normalize(b.name)
}

/**
 * Wrong-pharmacy errors usually come from picking "CVS" when there are three
 * CVS stores in town. Every option carries its lookalikes and the address
 * detail that separates them, so the UI can never show an ambiguous label.
 */
export function pharmacyOptions(all: Pharmacy[]): PharmacyOption[] {
  return [...all]
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .map((p) => {
      const lookalikes = all.filter((o) => sameBrand(p, o))
      const sameStreet = lookalikes.some((o) => streetName(o.street) === streetName(p.street))
      const distinguisher = lookalikes.length === 0
        ? `${p.street}, ${p.city}`
        : sameStreet
          ? `${p.street} at ${p.crossStreet}, ${p.city}`
          : `${p.street} (near ${p.crossStreet}), ${p.city}`
      return { pharmacy: p, lookalikes, distinguisher }
    })
}

export function searchPharmacies(options: PharmacyOption[], query: string): PharmacyOption[] {
  const q = normalize(query)
  if (!q) return options
  return options.filter(({ pharmacy: p }) =>
    [p.name, p.street, p.crossStreet, p.city, p.phone].some((f) => normalize(f).includes(q)),
  )
}
