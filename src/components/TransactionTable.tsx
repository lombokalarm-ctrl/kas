import type { CashTransaction } from '../../shared/cash'
import {
  formatCurrency,
  formatDisplayDate,
  formatSignedThousandNumber,
} from '@/utils/format'
import { cn } from '@/lib/utils'

interface TransactionTableProps {
  items: CashTransaction[]
  isLoading: boolean
}

export function TransactionTable({ items, isLoading }: TransactionTableProps) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-zinc-900/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] md:rounded-[32px]">
      <div className="border-b border-zinc-100 px-4 py-4 sm:px-5 sm:py-4 md:px-6 md:py-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 sm:text-[11px] sm:tracking-[0.24em]">
          Buku Mutasi
        </p>
        <h3 className="mt-1 font-display text-xl text-zinc-950 sm:mt-2 sm:text-2xl md:text-3xl">
          Riwayat transaksi
        </h3>
      </div>

      <div className="divide-y divide-zinc-100 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="px-4 py-4">
              <div className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            </div>
          ))
        ) : items.length > 0 ? (
          items.map((item, index) => (
            <article
              key={item.id}
              className={cn(
                'px-4 py-3',
                index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900">
                    {formatDisplayDate(item.tanggal)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{item.hari}</p>
                </div>
                <p
                  className={cn(
                    'shrink-0 text-sm font-semibold',
                    item.jenis === 'masuk' ? 'text-emerald-700' : 'text-rose-700',
                  )}
                >
                  {formatSignedThousandNumber(Number(item.jumlah), item.jenis)}
                </p>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{item.keterangan}</p>
              <p className="mt-2 text-xs font-semibold text-zinc-500">
                Saldo: <span className="text-zinc-800">{formatCurrency(Number(item.saldo))}</span>
              </p>
            </article>
          ))
        ) : (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Belum ada transaksi kas.
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-xs lg:text-sm">
          <thead className="bg-zinc-950 text-left text-[11px] uppercase tracking-[0.28em] text-amber-50">
            <tr>
              <th className="px-4 py-3 lg:px-6 lg:py-4">Tanggal</th>
              <th className="px-3 py-3 lg:px-4 lg:py-4">Hari</th>
              <th className="px-3 py-3 lg:px-4 lg:py-4">Keterangan</th>
              <th className="px-3 py-3 text-right lg:px-4 lg:py-4">Jumlah</th>
              <th className="px-4 py-3 text-right lg:px-6 lg:py-4">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="border-b border-zinc-100">
                  <td className="px-4 py-3 lg:px-6 lg:py-4" colSpan={5}>
                    <div className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
                  </td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item, index) => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-zinc-100 transition hover:bg-amber-50/60',
                    index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50',
                  )}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 lg:px-6 lg:py-4">
                    {formatDisplayDate(item.tanggal)}
                  </td>
                  <td className="px-3 py-3 text-zinc-600 lg:px-4 lg:py-4">{item.hari}</td>
                  <td className="px-3 py-3 text-zinc-700 lg:px-4 lg:py-4">{item.keterangan}</td>
                  <td
                    className={cn(
                      'px-3 py-3 text-right font-semibold lg:px-4 lg:py-4',
                      item.jenis === 'masuk' ? 'text-emerald-700' : 'text-rose-700',
                    )}
                  >
                    {formatSignedThousandNumber(Number(item.jumlah), item.jenis)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-950 lg:px-6 lg:py-4">
                    {formatCurrency(Number(item.saldo))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-zinc-500 lg:px-6 lg:py-12" colSpan={5}>
                  Belum ada transaksi kas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
