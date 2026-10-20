import { AlertTriangle, Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { pharmacyOptions, searchPharmacies } from '../lib/pharmacy'
import type { Pharmacy } from '../lib/types'

interface Props {
  pharmacies: Pharmacy[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function PharmacyPicker({ pharmacies, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const options = useMemo(() => pharmacyOptions(pharmacies), [pharmacies])
  const selected = options.find((o) => o.pharmacy.id === selectedId)
  const shown = searchPharmacies(options, query)

  return (
    <div>
      {selected && !open ? (
        <div className="rounded-lg border border-brand/40 bg-brand-soft/50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{selected.pharmacy.name}</div>
              <div className="text-sm">{selected.distinguisher}</div>
              <div className="mt-1 text-xs text-ink-muted">{selected.pharmacy.phone} · {selected.pharmacy.hours} · {selected.pharmacy.distanceMi} mi</div>
            </div>
            <button onClick={() => setOpen(true)} className="text-sm font-medium text-brand hover:underline">Change</button>
          </div>
          {selected.lookalikes.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-warn">
              <AlertTriangle size={13} aria-hidden /> {selected.lookalikes.length + 1} {selected.pharmacy.chain} locations nearby. Confirm the street with the patient.
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className="relative block">
            <span className="sr-only">Search pharmacies</span>
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, street or phone"
              className="w-full rounded-lg border border-line bg-bg py-2 pr-3 pl-9 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto" role="listbox" aria-label="Pharmacies">
            {shown.map(({ pharmacy: p, lookalikes, distinguisher }) => (
              <li key={p.id}>
                <button
                  role="option"
                  aria-selected={p.id === selectedId}
                  onClick={() => { onSelect(p.id); setOpen(false); setQuery('') }}
                  className="flex w-full items-start justify-between gap-2 rounded-lg border border-line px-3 py-2 text-left hover:border-brand/50"
                >
                  <span>
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className={`block text-sm ${lookalikes.length ? 'font-medium text-ink' : 'text-ink-muted'}`}>{distinguisher}</span>
                    <span className="block text-xs text-ink-muted">{p.phone} · {p.distanceMi} mi</span>
                  </span>
                  {p.id === selectedId && <Check size={16} className="mt-1 text-brand" aria-hidden />}
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="px-1 text-sm text-ink-muted">No pharmacy matches “{query}”.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
