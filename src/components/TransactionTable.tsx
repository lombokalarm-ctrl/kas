import type { CashTransaction } from '../../shared/cash'
import {
  formatCurrency,
  formatDisplayDate,
  formatThousandNumber,
} from '@/utils/format'
import { cn } from '@/lib/utils'

interface TransactionTableProps {
  items: CashTransaction[]
  isLoading: boolean
}

export function TransactionTable({ items, isLoading }: TransactionTableProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-zinc-900/10 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
      <div className="border-b border-zinc-100 px-6 py-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
          Buku Mutasi
        </p>
        <h3 className="mt-2 font-display text-3xl text-zinc-950">
          Riwayat transaksi
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-zinc-950 text-left text-[11px] uppercase tracking-[0.28em] text-amber-50">
            <tr>
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-4 py-4">Hari</th>
              <th className="px-4 py-4">Keterangan</th>
              <th className="px-4 py-4">Jenis</th>
              <th className="px-4 py-4 text-right">Jumlah</th>
              <th className="px-6 py-4 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="border-b border-zinc-100">
                  <td className="px-6 py-4" colSpan={6}>
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
                  <td className="px-6 py-4 font-medium text-zinc-900">
                    {formatDisplayDate(item.tanggal)}
                  </td>
                  <td className="px-4 py-4 text-zinc-600">{item.hari}</td>
                  <td className="px-4 py-4 text-zinc-700">{item.keterangan}</td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
                        item.jenis === 'masuk'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800',
                      )}
                    >
                      {item.jenis}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-zinc-900">
                    {formatThousandNumber(Number(item.jumlah))}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-950">
                    {formatCurrency(Number(item.saldo))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-12 text-center text-zinc-500" colSpan={6}>
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
