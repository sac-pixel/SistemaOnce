'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STATUS_LABELS, STATUS_ORDER, type Caso, type CasoStatus } from '@/lib/types'
import { CasoCard } from '@/components/CasoCard'
import { CasoModal } from '@/components/CasoModal'

interface CasoComFotos extends Caso {
  fotos: { storage_path: string; ordem: number }[]
}

export function KanbanBoard() {
  const [casos, setCasos] = useState<CasoComFotos[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCaso, setModalCaso] = useState<Caso | null | 'new'>(null)
  const [dragOverStatus, setDragOverStatus] = useState<CasoStatus | null>(
    null
  )

  const loadCasos = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('casos')
      .select('*, fotos(storage_path, ordem)')
      .order('created_at', { ascending: false })

    if (data) setCasos(data as CasoComFotos[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCasos()

    const supabase = createClient()
    const channel = supabase
      .channel('casos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'casos' },
        () => loadCasos()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fotos' },
        () => loadCasos()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadCasos])

  async function updateStatus(casoId: string, status: CasoStatus) {
    setCasos((current) =>
      current.map((c) => (c.id === casoId ? { ...c, status } : c))
    )
    const supabase = createClient()
    await supabase.from('casos').update({ status }).eq('id', casoId)
  }

  function handleDrop(e: React.DragEvent, status: CasoStatus) {
    e.preventDefault()
    setDragOverStatus(null)
    const casoId = e.dataTransfer.getData('text/plain')
    if (casoId) updateStatus(casoId, status)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
          Casos KLUZZI
        </h1>
        <button
          onClick={() => setModalCaso('new')}
          className="shrink-0 rounded-lg bg-terracotta px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-terracotta-dark active:scale-[0.98] sm:px-4"
        >
          + Novo caso
        </button>
      </div>

      {loading ? (
        <p className="px-4 text-sm text-charcoal-soft sm:px-6">
          Carregando casos...
        </p>
      ) : (
        <div className="flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-6 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const casosDoStatus = casos.filter((c) => c.status === status)
            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverStatus(status)
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex min-h-[200px] w-[85vw] shrink-0 snap-center flex-col gap-2.5 rounded-2xl border p-3 transition sm:w-auto sm:shrink ${
                  dragOverStatus === status
                    ? 'border-terracotta/50 bg-terracotta-soft/40'
                    : 'border-cream-border bg-cream-soft'
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-charcoal">
                    {STATUS_LABELS[status]}
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-charcoal-soft">
                    {casosDoStatus.length}
                  </span>
                </div>

                {casosDoStatus.map((caso) => {
                  const primeiraFoto = [...caso.fotos].sort(
                    (a, b) => a.ordem - b.ordem
                  )[0]
                  return (
                    <CasoCard
                      key={caso.id}
                      caso={caso}
                      fotoThumbnail={primeiraFoto?.storage_path ?? null}
                      onClick={() => setModalCaso(caso)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', caso.id)
                      }}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {modalCaso !== null && (
        <CasoModal
          caso={modalCaso === 'new' ? null : modalCaso}
          onClose={() => setModalCaso(null)}
        />
      )}
    </div>
  )
}
