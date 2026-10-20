const DAY = 86_400_000

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY).toISOString()
}

/** Whole calendar days from a to b (negative when b is earlier). */
export function daysBetween(a: string, b: string): number {
  const start = Date.UTC(...ymd(a))
  const end = Date.UTC(...ymd(b))
  return Math.round((end - start) / DAY)
}

function ymd(iso: string): [number, number, number] {
  const d = new Date(iso)
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()]
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function ageOn(dob: string, today: string): number {
  const [by, bm, bd] = ymd(dob)
  const [ty, tm, td] = ymd(today)
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0)
}

export function relative(iso: string, today: string): string {
  const d = daysBetween(iso, today)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 14) return `${d} days ago`
  if (d < 60) return `${Math.round(d / 7)} weeks ago`
  return `${Math.round(d / 30)} months ago`
}
