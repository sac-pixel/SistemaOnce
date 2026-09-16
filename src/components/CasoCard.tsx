'use client'

import { CATEGORIA_LABELS, type Caso } from '@/lib/types'
import { getFotoUrl } from '@/lib/storage'

interface CasoCardProps {
  caso: Caso
  fotoThumbnail?: string | null
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
}

function diasEmAberto(createdAt: string) {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const dias = Math.floor((now - created) / (1000 * 60 * 60 * 24))
  return Math.max(dias, 0)
}

export function CasoCard({
  caso,
  fotoThumbnail,
  onClick,
  onDragStart,
}: CasoCardProps) {
  const dias = diasEmAberto(caso.created_at)
  const atrasado = caso.status !== 'resolvido' && dias >= 5
  const critico = caso.status !== 'resolvido' && dias >= 30

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-cream-border bg-white p-3 shadow-[0_1px_2px_rgba(43,38,32,0.06)] transition hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-[0_8px_20px_-8px_rgba(43,38,32,0.18)] active:translate-y-0"
    >
      {fotoThumbnail && (
        <img
          src={getFotoUrl(fotoThumbnail)}
          alt=""
          className="mb-2 h-24 w-full rounded-lg object-cover"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-charcoal">
          #{caso.numero_pedido}
        </span>
        {(atrasado || critico) && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              critico
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {critico ? `${dias}d — crítico` : `${dias}d`}
          </span>
        )}
      </div>

      {caso.cliente && (
        <p className="mt-1 text-sm text-charcoal-soft">{caso.cliente}</p>
      )}

      <p className="mt-1 line-clamp-2 text-xs text-charcoal-soft/80">
        {caso.descricao || 'Sem descrição'}
      </p>

      <span className="mt-2 inline-block rounded-full bg-terracotta-soft px-2 py-0.5 text-xs font-medium text-terracotta-dark">
        {CATEGORIA_LABELS[caso.categoria]}
      </span>
    </div>
  )
}
