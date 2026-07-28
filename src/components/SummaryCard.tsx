import type { LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: number
  icon: LucideIcon
  tone?: 'saldo' | 'masuk' | 'keluar' | 'netral'
  kind?: 'currency' | 'number'
}

const toneMap = {
  saldo: 'border-emerald-900/20 bg-emerald-950 text-amber-50',
  masuk: 'border-emerald-900/10 bg-white text-zinc-900',
  keluar: 'border-rose-900/10 bg-white text-zinc-900',
  netral: 'border-zinc-900/10 bg-white text-zinc-900',
}

const iconMap = {
  saldo: 'bg-amber-200/20 text-amber-100',
  masuk: 'bg-emerald-100 text-emerald-700',
  keluar: 'bg-rose-100 text-rose-700',
  netral: 'bg-zinc-100 text-zinc-700',
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  tone = 'netral',
  kind = 'currency',
}: SummaryCardProps) {
  return (
    <article
      className={cn(
        'rounded-[20px] border p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:rounded-[24px] sm:p-4 md:p-5',
        toneMap[tone],
      )}
    >
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] opacity-70 sm:text-[11px] sm:tracking-[0.24em]">
          {title}
        </p>
        <span className={cn('rounded-full p-2 sm:p-2.5', iconMap[tone])}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
      </div>

      <p className="font-display text-lg leading-tight sm:text-2xl md:text-3xl xl:text-4xl">
        {kind === 'currency' ? formatCurrency(value) : value.toLocaleString('id-ID')}
      </p>
    </article>
  )
}
