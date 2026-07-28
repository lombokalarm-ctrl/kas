import { type FormEvent, useLayoutEffect, useRef, useState } from 'react'
import type { CashType, CreateCashTransactionRequest } from '../../shared/cash'
import { formatThousandNumber, todayValue } from '@/utils/format'
import { cn } from '@/lib/utils'

interface TransactionFormProps {
  isSubmitting: boolean
  onSubmit: (payload: CreateCashTransactionRequest) => Promise<boolean>
}

const defaultForm = {
  tanggal: todayValue(),
  keterangan: '',
  jenis: 'masuk' as CashType,
  jumlah: '',
}

export function TransactionForm({
  isSubmitting,
  onSubmit,
}: TransactionFormProps) {
  const [form, setForm] = useState(defaultForm)
  const jumlahInputRef = useRef<HTMLInputElement>(null)
  const desiredCaretRef = useRef<number | null>(null)

  function getFormattedJumlah(rawValue: string) {
    return rawValue ? formatThousandNumber(Number(rawValue)) : ''
  }

  function getCaretPosition(formattedValue: string, digitsBeforeCaret: number) {
    if (digitsBeforeCaret <= 0) {
      return 0
    }

    let totalDigits = 0

    for (let index = 0; index < formattedValue.length; index += 1) {
      if (/\d/.test(formattedValue[index])) {
        totalDigits += 1
      }

      if (totalDigits === digitsBeforeCaret) {
        return index + 1
      }
    }

    return formattedValue.length
  }

  useLayoutEffect(() => {
    const input = jumlahInputRef.current
    const caretPosition = desiredCaretRef.current

    if (!input || caretPosition === null) {
      return
    }

    input.setSelectionRange(caretPosition, caretPosition)
    desiredCaretRef.current = null
  }, [form.jumlah])

  function handleJumlahChange(value: string, caretPosition: number) {
    const digitsOnly = value.replace(/\D/g, '')
    const digitsBeforeCaret = value.slice(0, caretPosition).replace(/\D/g, '').length
    desiredCaretRef.current = getCaretPosition(
      getFormattedJumlah(digitsOnly),
      digitsBeforeCaret,
    )
    setForm({ ...form, jumlah: digitsOnly })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const success = await onSubmit({
      tanggal: form.tanggal,
      keterangan: form.keterangan,
      jenis: form.jenis,
      jumlah: Number(form.jumlah),
    })

    if (success) {
      setForm({
        ...defaultForm,
        tanggal: todayValue(),
        jenis: form.jenis,
      })
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-zinc-900/10 bg-white/90 p-4 shadow-[0_18px_50px_rgba(16,24,40,0.08)] sm:rounded-[28px] sm:p-5 md:rounded-[32px] md:p-6"
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <label className="space-y-1.5 text-xs text-zinc-700 sm:space-y-2 sm:text-sm">
          <span>Tanggal</span>
          <input
            type="date"
            value={form.tanggal}
            onChange={(event) => setForm({ ...form, tanggal: event.target.value })}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-700 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
            required
          />
        </label>

        <div className="space-y-1.5 text-xs text-zinc-700 sm:space-y-2 sm:text-sm">
          <span>Jenis transaksi</span>
          <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 sm:rounded-2xl">
            {(['masuk', 'keluar'] as CashType[]).map((jenis) => (
              <button
                key={jenis}
                type="button"
                onClick={() => setForm({ ...form, jenis })}
                className={cn(
                  'rounded-lg px-2 py-2 text-xs font-medium capitalize transition sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-sm',
                  form.jenis === jenis
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950',
                )}
              >
                {jenis}
              </button>
            ))}
          </div>
        </div>

        <label className="col-span-2 space-y-1.5 text-xs text-zinc-700 sm:space-y-2 sm:text-sm">
          <span>Keterangan</span>
          <input
            type="text"
            value={form.keterangan}
            onChange={(event) => setForm({ ...form, keterangan: event.target.value })}
            placeholder="Contoh: Setoran modal, beli ATK, penjualan tunai"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-700 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3"
            required
          />
        </label>

        <label className="col-span-2 space-y-1.5 text-xs text-zinc-700 sm:space-y-2 sm:text-sm">
          <span>Jumlah</span>
          <div className="relative">
            <span
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold sm:left-4 sm:text-xl',
                form.jenis === 'masuk' ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              {form.jenis === 'masuk' ? '+' : '-'}
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              ref={jumlahInputRef}
              value={getFormattedJumlah(form.jumlah)}
              onChange={(event) =>
                handleJumlahChange(
                  event.target.value,
                  event.target.selectionStart ?? event.target.value.length,
                )
              }
              placeholder="0"
              className={cn(
                'w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-3 text-lg font-semibold outline-none transition focus:border-emerald-700 focus:bg-white sm:rounded-2xl sm:py-3 sm:pl-10 sm:pr-4 sm:text-xl',
                form.jenis === 'masuk' ? 'text-emerald-700' : 'text-rose-700',
              )}
              required
            />
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full rounded-xl bg-emerald-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-50 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-6 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm sm:tracking-[0.28em]"
      >
        {isSubmitting ? 'Menyimpan...' : 'Simpan transaksi'}
      </button>
    </form>
  )
}
