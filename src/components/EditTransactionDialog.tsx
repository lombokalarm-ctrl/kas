import { type FormEvent, useLayoutEffect, useRef, useState } from 'react'
import type { CashTransaction, UpdateCashTransactionRequest } from '../../shared/cash'
import type { CashType } from '../../shared/cash'
import { cn } from '@/lib/utils'
import { formatThousandNumber } from '@/utils/format'

interface EditTransactionDialogProps {
  item: CashTransaction
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: UpdateCashTransactionRequest) => Promise<void>
}

export function EditTransactionDialog({
  item,
  isSubmitting,
  onClose,
  onSubmit,
}: EditTransactionDialogProps) {
  const [form, setForm] = useState({
    tanggal: item.tanggal,
    keterangan: item.keterangan,
    jenis: item.jenis,
    jumlah: String(Number(item.jumlah)),
    catatanEdit: item.catatan_edit || '',
  })
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

    setForm((current) => ({ ...current, jumlah: digitsOnly }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await onSubmit({
      tanggal: form.tanggal,
      keterangan: form.keterangan,
      jenis: form.jenis,
      jumlah: Number(form.jumlah),
      catatanEdit: form.catatanEdit,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/45 p-3 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-[24px] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Edit transaksi</p>
            <h3 className="mt-1 font-display text-xl text-zinc-950">Koreksi data transaksi</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600"
          >
            Tutup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5 text-xs text-zinc-700 sm:text-sm">
              <span>Tanggal</span>
              <input
                type="date"
                value={form.tanggal}
                onChange={(event) => setForm((current) => ({ ...current, tanggal: event.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
                required
              />
            </label>

            <div className="space-y-1.5 text-xs text-zinc-700 sm:text-sm">
              <span>Jenis transaksi</span>
              <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
                {(['masuk', 'keluar'] as CashType[]).map((jenis) => (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, jenis }))}
                    className={cn(
                      'rounded-lg px-2 py-2 text-xs font-medium capitalize transition sm:text-sm',
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
          </div>

          <label className="block space-y-1.5 text-xs text-zinc-700 sm:text-sm">
            <span>Keterangan</span>
            <input
              type="text"
              value={form.keterangan}
              onChange={(event) =>
                setForm((current) => ({ ...current, keterangan: event.target.value }))
              }
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
              required
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-700 sm:text-sm">
            <span>Jumlah</span>
            <div className="relative">
              <span
                className={cn(
                  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold',
                  form.jenis === 'masuk' ? 'text-emerald-700' : 'text-rose-700',
                )}
              >
                {form.jenis === 'masuk' ? '+' : '-'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                ref={jumlahInputRef}
                value={getFormattedJumlah(form.jumlah)}
                onChange={(event) =>
                  handleJumlahChange(
                    event.target.value,
                    event.target.selectionStart ?? event.target.value.length,
                  )
                }
                className={cn(
                  'w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-8 pr-3 text-lg font-semibold outline-none transition focus:border-emerald-700 focus:bg-white',
                  form.jenis === 'masuk' ? 'text-emerald-700' : 'text-rose-700',
                )}
                required
              />
            </div>
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-700 sm:text-sm">
            <span>Catatan edit</span>
            <textarea
              value={form.catatanEdit}
              onChange={(event) =>
                setForm((current) => ({ ...current, catatanEdit: event.target.value }))
              }
              placeholder="Tuliskan alasan koreksi transaksi"
              className="min-h-24 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
              required
            />
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-xs font-semibold text-zinc-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
