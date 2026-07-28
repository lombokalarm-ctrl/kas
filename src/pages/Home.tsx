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
        <section className="mb-6">
          <h1 className="font-display text-3xl text-zinc-950 md:text-4xl">
            Catatan Kas Harian
          </h1>
        </section>

        <section className="mb-8">
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
