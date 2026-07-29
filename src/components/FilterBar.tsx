import { useEffect, useState } from 'react'
import type { CashFilters } from '../../shared/cash'
import { todayValue } from '@/utils/format'

interface FilterBarProps {
  filters: CashFilters
  onApply: (filters: CashFilters) => void
}

export function FilterBar({ filters, onApply }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<CashFilters>(filters)

  function getTodayFilters(): CashFilters {
    const today = todayValue()

    return {
      startDate: today,
      endDate: today,
    }
  }

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  return (
    <section className="rounded-[20px] border border-zinc-900/10 bg-[#f7f2e8] p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:rounded-[24px] sm:p-5 md:rounded-[28px]">
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 sm:text-[11px] sm:tracking-[0.24em]">
            Filter Riwayat
          </p>
          <h3 className="mt-1 font-display text-lg text-zinc-950 sm:mt-2 sm:text-2xl">
            Pilih rentang tanggal
          </h3>
        </div>

        <div className="hidden rounded-full bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 sm:block sm:text-xs sm:tracking-[0.24em]">
          Lokal
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
          <input
            type="date"
            value={localFilters.startDate || ''}
            onChange={(event) =>
              setLocalFilters({ ...localFilters, startDate: event.target.value })
            }
            className="min-w-0 rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-xs outline-none transition focus:border-emerald-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          />
          <span className="text-center text-xs font-semibold text-zinc-600 sm:text-sm">s/d</span>
          <input
            type="date"
            value={localFilters.endDate || ''}
            onChange={(event) =>
              setLocalFilters({ ...localFilters, endDate: event.target.value })
            }
            className="min-w-0 rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-xs outline-none transition focus:border-emerald-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 lg:flex-none">
          <button
            type="button"
            onClick={() => onApply(localFilters)}
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:flex-1 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={() => {
              const reset = getTodayFilters()
              setLocalFilters(reset)
              onApply(reset)
            }}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 sm:flex-1 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  )
}
