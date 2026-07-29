import type { CashType } from '../../shared/cash'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function formatThousandNumber(value: number) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function formatSignedThousandNumber(value: number, jenis: CashType) {
  const prefix = jenis === 'masuk' ? '+' : '-'
  return `${prefix}${formatThousandNumber(value)}`
}

export function formatDisplayDate(dateString: string) {
  const [year, month, day] = dateString.split('-')

  if (!year || !month || !day) {
    return dateString
  }

  return `${day}-${month}-${year}`
}

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function todayValue() {
  return toDateInputValue(new Date())
}

export function getTodayFilters() {
  const today = todayValue()

  return {
    startDate: today,
    endDate: today,
  }
}

export function getCurrentMonthFilters() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    startDate: toDateInputValue(monthStart),
    endDate: toDateInputValue(monthEnd),
  }
}
