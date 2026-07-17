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

export function formatDisplayDate(dateString: string) {
  const [year, month, day] = dateString.split('-')

  if (!year || !month || !day) {
    return dateString
  }

  return `${day}-${month}-${year}`
}

export function todayValue() {
  return new Date().toISOString().slice(0, 10)
}
