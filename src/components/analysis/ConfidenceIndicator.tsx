import { cn } from '@/lib/utils'

export function ConfidenceIndicator({ score }: { score: number | null }) {
  if (!score) return null
  const pct = Math.round(score * 100)
  const color =
    pct >= 80 ? 'text-green-600 bg-green-100' : pct >= 60 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
  const barColor =
    pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3">
      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', color)}>{pct}%</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">Încredere AI</span>
    </div>
  )
}
