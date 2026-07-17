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
        'rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1',
        toneMap[tone],
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.3em] opacity-70">{title}</p>
        <span className={cn('rounded-full p-3', iconMap[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className="font-display text-3xl leading-tight md:text-4xl">
        {kind === 'currency' ? formatCurrency(value) : value.toLocaleString('id-ID')}
      </p>
    </article>
  )
}
