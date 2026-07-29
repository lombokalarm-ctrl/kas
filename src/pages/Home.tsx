import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, BadgeDollarSign, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CreateCashTransactionRequest } from '../../shared/cash'
import type { CreateSaleRequest } from '../../shared/sales'
import { FilterBar } from '@/components/FilterBar'
import { SalesTable } from '@/components/SalesTable'
import { SummaryCard } from '@/components/SummaryCard'
import { TransactionForm } from '@/components/TransactionForm'
import { TransactionTable } from '@/components/TransactionTable'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCashStore } from '@/hooks/useCashStore'
import { useSalesStore } from '@/hooks/useSalesStore'
import { getCurrentMonthFilters, getTodayFilters } from '@/utils/format'

export default function Home() {
  const {
    items: cashItems,
    summary,
    filters: cashFilters,
    summaryFilters: cashSummaryFilters,
    isLoading: isCashLoading,
    isSubmitting: isCashSubmitting,
    error: cashError,
    successMessage: cashSuccessMessage,
    fetchTransactions,
    fetchSummary,
    setFilters,
    setSummaryFilters,
    createTransaction,
    updateTransaction,
    clearFeedback,
  } = useCashStore()
  const {
    items: salesItems,
    summary: salesSummary,
    filters: salesFilters,
    summaryFilters: salesSummaryFilters,
    isLoading: isSalesLoading,
    isSubmitting: isSalesSubmitting,
    error: salesError,
    successMessage: salesSuccessMessage,
    fetchSales,
    fetchSalesSummary,
    setFilters: setSalesFilters,
    setSummaryFilters: setSalesSummaryFilters,
    createSale,
    clearFeedback: clearSalesFeedback,
  } = useSalesStore()
  const { user, logout } = useAuthStore()
  const [historyTab, setHistoryTab] = useState<'transaksi' | 'penjualan'>('transaksi')
  const isStaff = user?.role === 'staff'
  const canAccessSales = user?.role !== 'staff'
  const todayFilters = useMemo(() => getTodayFilters(), [])
  const currentMonthFilters = useMemo(() => getCurrentMonthFilters(), [])

  const isSubmitting = isCashSubmitting || isSalesSubmitting
  const feedbackError = cashError || (canAccessSales ? salesError : null)
  const successMessage = (canAccessSales ? salesSuccessMessage : null) || cashSuccessMessage

  useEffect(() => {
    if (!user) {
      return
    }

    if (isStaff) {
      setFilters(todayFilters)
      setSummaryFilters(todayFilters)
      setSalesFilters(todayFilters)
      setSalesSummaryFilters(todayFilters)
      setHistoryTab('transaksi')
    }
  }, [isStaff, setFilters, setSalesFilters, setSalesSummaryFilters, setSummaryFilters, todayFilters, user])

  useEffect(() => {
    if (!user) {
      return
    }

    void fetchTransactions(cashFilters)
    void fetchSummary(cashSummaryFilters)

    if (canAccessSales) {
      void fetchSales(salesFilters)
      void fetchSalesSummary(salesSummaryFilters)
    }
  }, [
    canAccessSales,
    cashFilters,
    cashSummaryFilters,
    fetchSales,
    fetchSalesSummary,
    fetchSummary,
    fetchTransactions,
    isStaff,
    salesFilters,
    salesSummaryFilters,
    todayFilters,
    user,
  ])

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
            userRole={user?.role ?? 'staff'}
            onSubmit={async (type, payload) => {
              if (type === 'penjualan') {
                return createSale(payload as CreateSaleRequest)
              }

              return createTransaction(payload as CreateCashTransactionRequest)
            }}
          />
        </section>

        <section
          className={`mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 ${
            isStaff ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-4'
          }`}
        >
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
            value={isStaff ? summary.totalPenjualan : salesSummary.totalPenjualan}
            icon={BadgeDollarSign}
            tone="netral"
          />
        </section>

        {(feedbackError || successMessage) && (
          <section className="mb-4 sm:mb-6">
            <div
              className={`rounded-xl border px-4 py-3 text-xs shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm ${
                feedbackError
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span>{feedbackError || successMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    clearFeedback()
                    clearSalesFeedback()
                  }}
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
            filters={cashFilters}
            onApply={(nextFilters) => {
              setFilters(nextFilters)
              setSummaryFilters(nextFilters)

              if (canAccessSales) {
                setSalesFilters(nextFilters)
                setSalesSummaryFilters(nextFilters)
              }
            }}
            onReset={() => {
              const nextHistoryFilters = getTodayFilters()
              const nextSummaryFilters = isStaff ? nextHistoryFilters : getCurrentMonthFilters()

              setFilters(nextHistoryFilters)
              setSummaryFilters(nextSummaryFilters)

              if (canAccessSales) {
                setSalesFilters(nextHistoryFilters)
                setSalesSummaryFilters(nextSummaryFilters)
              }
            }}
            minDate={isStaff ? currentMonthFilters.startDate : undefined}
            maxDate={isStaff ? currentMonthFilters.endDate : undefined}
            helperText={
              isStaff
                ? 'Staff hanya bisa melihat riwayat pada bulan berjalan. Saldo mengikuti filter aktif, sedangkan total masuk, keluar, dan penjualan selalu hari ini.'
                : undefined
            }
          />
        </section>

        {canAccessSales && (
          <section className="mb-4 sm:mb-6">
            <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 sm:w-fit sm:rounded-2xl">
              <button
                type="button"
                onClick={() => setHistoryTab('transaksi')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition sm:rounded-[18px] sm:px-4 ${
                  historyTab === 'transaksi'
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Riwayat Transaksi
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('penjualan')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition sm:rounded-[18px] sm:px-4 ${
                  historyTab === 'penjualan'
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Riwayat Penjualan
              </button>
            </div>
          </section>
        )}

        {user &&
          (!canAccessSales || historyTab === 'transaksi' ? (
            <TransactionTable
              items={cashItems}
              isLoading={isCashLoading}
              userRole={user.role}
              isSubmitting={isCashSubmitting}
              onUpdateTransaction={async (id, payload) => {
                const result = await updateTransaction(id, payload)
                return result.ok
              }}
            />
          ) : (
            <SalesTable items={salesItems} isLoading={isSalesLoading} />
          ))}
      </div>
    </main>
  )
}
