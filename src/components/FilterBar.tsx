import { useEffect, useState } from 'react'
import type { CashFilters } from '../../shared/cash'

interface FilterBarProps {
  filters: CashFilters
  onApply: (filters: CashFilters) => void
}

export function FilterBar({ filters, onApply }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<CashFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  return (
    <section className="rounded-[28px] border border-zinc-900/10 bg-[#f7f2e8] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-600">
            Filter Mutasi
          </p>
          <h3 className="mt-2 font-display text-2xl text-zinc-950">
            Pilih rentang tanggal
          </h3>
        </div>

        <div className="rounded-full bg-white px-4 py-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
          Lokal
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
        <input
          type="date"
          value={localFilters.startDate || ''}
          onChange={(event) =>
            setLocalFilters({ ...localFilters, startDate: event.target.value })
          }
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-700"
        />
        <input
          type="date"
          value={localFilters.endDate || ''}
          onChange={(event) =>
            setLocalFilters({ ...localFilters, endDate: event.target.value })
          }
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-700"
        />
        <button
          type="button"
          onClick={() => onApply(localFilters)}
          className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Terapkan
        </button>
        <button
          type="button"
          onClick={() => {
            const reset = {}
            setLocalFilters(reset)
            onApply(reset)
          }}
          className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
        >
          Reset
        </button>
      </div>
    </section>
  )
}
