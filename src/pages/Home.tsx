import { useEffect } from 'react'
import { ArrowDownCircle, ArrowUpCircle, BadgeDollarSign, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FilterBar } from '@/components/FilterBar'
import { SummaryCard } from '@/components/SummaryCard'
import { TransactionForm } from '@/components/TransactionForm'
import { TransactionTable } from '@/components/TransactionTable'
import { useAuthStore } from '@/hooks/useAuthStore'
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
    updateTransaction,
    clearFeedback,
  } = useCashStore()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,83,45,0.12),_transparent_35%),linear-gradient(180deg,#f6f0e6_0%,#fbfaf7_45%,#f1ece3_100%)] px-3 py-4 text-zinc-950 sm:px-4 sm:py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-4 sm:mb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-zinc-950 sm:text-3xl md:text-4xl">
                Catatan Kas Harian
              </h1>
              {user && (
                <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                  Login sebagai <span className="font-semibold">{user.username}</span> · role{' '}
                  <span className="font-semibold uppercase">{user.role}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {user?.role === 'owner' && (
                <Link
                  to="/owner/users"
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 sm:text-xs"
                >
                  User
                </Link>
              )}
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 sm:text-xs"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        <section className="mb-4 sm:mb-6">
          <TransactionForm
            isSubmitting={isSubmitting}
            onSubmit={async (payload) => {
              const ok = await createTransaction(payload)
              return ok
            }}
          />
        </section>

        <section className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            title="Total Penjualan"
            value={summary.totalPenjualan}
            icon={BadgeDollarSign}
            tone="netral"
          />
        </section>

        {(error || successMessage) && (
          <section className="mb-4 sm:mb-6">
            <div
              className={`rounded-xl border px-4 py-3 text-xs shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm ${
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
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-xs sm:tracking-[0.22em]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mb-4 sm:mb-6">
          <FilterBar
            filters={filters}
            onApply={(nextFilters) => {
              setFilters(nextFilters)
              fetchTransactions(nextFilters)
            }}
          />
        </section>

        {user && (
          <TransactionTable
            items={items}
            isLoading={isLoading}
            userRole={user.role}
            isSubmitting={isSubmitting}
            onUpdateTransaction={async (id, payload) => {
              const result = await updateTransaction(id, payload)
              return result.ok
            }}
          />
        )}
      </div>
    </main>
  )
}
