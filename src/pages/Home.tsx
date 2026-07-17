import { useEffect } from 'react'
import { ArrowDownCircle, ArrowUpCircle, BadgeDollarSign, Wallet } from 'lucide-react'
import { FilterBar } from '@/components/FilterBar'
import { SummaryCard } from '@/components/SummaryCard'
import { TransactionForm } from '@/components/TransactionForm'
import { TransactionTable } from '@/components/TransactionTable'
import { useCashStore } from '@/hooks/useCashStore'

export default function Home() {
  const {
    items,
    summary,
    filters,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    fetchTransactions,
    setFilters,
    createTransaction,
    clearFeedback,
  } = useCashStore()

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,83,45,0.12),_transparent_35%),linear-gradient(180deg,#f6f0e6_0%,#fbfaf7_45%,#f1ece3_100%)] px-4 py-8 text-zinc-950 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[36px] border border-emerald-950/10 bg-[#133127] px-6 py-8 text-amber-50 shadow-[0_35px_100px_rgba(15,23,42,0.18)] md:px-8">
            <p className="text-[11px] uppercase tracking-[0.36em] text-amber-200/80">
              Buku Besar Kas
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight md:text-6xl">
              Pencatatan kas sederhana, padat, dan langsung tersimpan ke PostgreSQL.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-amber-50/75 md:text-base">
              Gunakan satu halaman ini untuk mencatat pemasukan dan pengeluaran,
              memantau saldo berjalan, lalu meninjau mutasi harian tanpa berpindah
              layar.
            </p>
          </div>

          <TransactionForm
            isSubmitting={isSubmitting}
            onSubmit={async (payload) => {
              const ok = await createTransaction(payload)
              return ok
            }}
          />
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Saldo Terakhir"
            value={summary.saldoTerakhir}
            icon={Wallet}
            tone="saldo"
          />
          <SummaryCard
            title="Total Masuk"
            value={summary.totalMasuk}
            icon={ArrowDownCircle}
            tone="masuk"
          />
          <SummaryCard
            title="Total Keluar"
            value={summary.totalKeluar}
            icon={ArrowUpCircle}
            tone="keluar"
          />
          <SummaryCard
            title="Jumlah Transaksi"
            value={summary.jumlahTransaksi}
            icon={BadgeDollarSign}
            tone="netral"
            kind="number"
          />
        </section>

        {(error || successMessage) && (
          <section className="mb-6">
            <div
              className={`rounded-2xl border px-5 py-4 text-sm shadow-sm ${
                error
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span>{error || successMessage}</span>
                <button
                  type="button"
                  onClick={clearFeedback}
                  className="text-xs font-semibold uppercase tracking-[0.22em]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mb-6">
          <FilterBar
            filters={filters}
            onApply={(nextFilters) => {
              setFilters(nextFilters)
              fetchTransactions(nextFilters)
            }}
          />
        </section>

        <TransactionTable items={items} isLoading={isLoading} />
      </div>
    </main>
  )
}
