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
      className="rounded-[32px] border border-zinc-900/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(16,24,40,0.08)]"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-emerald-900/70">
            Input Cepat
          </p>
          <h2 className="mt-2 font-display text-3xl text-zinc-950">
            Catat transaksi kas
          </h2>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-amber-900">
          Harian
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-zinc-700">
          <span>Tanggal</span>
          <input
            type="date"
            value={form.tanggal}
            onChange={(event) => setForm({ ...form, tanggal: event.target.value })}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-emerald-700 focus:bg-white"
            required
          />
        </label>

        <div className="space-y-2 text-sm text-zinc-700">
          <span>Jenis transaksi</span>
          <div className="grid grid-cols-2 rounded-2xl bg-zinc-100 p-1">
            {(['masuk', 'keluar'] as CashType[]).map((jenis) => (
              <button
                key={jenis}
                type="button"
                onClick={() => setForm({ ...form, jenis })}
                className={cn(
                  'rounded-[18px] px-4 py-3 text-sm font-medium capitalize transition',
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

        <label className="space-y-2 text-sm text-zinc-700 md:col-span-2">
          <span>Keterangan</span>
          <input
            type="text"
            value={form.keterangan}
            onChange={(event) => setForm({ ...form, keterangan: event.target.value })}
            placeholder="Contoh: Setoran modal, beli ATK, penjualan tunai"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-emerald-700 focus:bg-white"
            required
          />
        </label>

        <label className="space-y-2 text-sm text-zinc-700 md:col-span-2">
          <span>Jumlah</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
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
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xl font-semibold outline-none transition focus:border-emerald-700 focus:bg-white"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-amber-50 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Menyimpan...' : 'Simpan transaksi'}
      </button>
    </form>
  )
}
