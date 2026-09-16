'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EVIDENCIAS_BUCKET, getFotoUrl } from '@/lib/storage'
import {
  CATEGORIA_LABELS,
  type Caso,
  type CasoCategoria,
  type Foto,
} from '@/lib/types'

interface CasoModalProps {
  caso: Caso | null
  onClose: () => void
}

interface PendingFoto {
  file: File
  previewUrl: string
}

const CATEGORIA_OPTIONS = Object.entries(CATEGORIA_LABELS) as [
  CasoCategoria,
  string,
][]

export function CasoModal({ caso, onClose }: CasoModalProps) {
  const isEditing = caso !== null

  const [numeroPedido, setNumeroPedido] = useState(caso?.numero_pedido ?? '')
  const [cliente, setCliente] = useState(caso?.cliente ?? '')
  const [canalOrigem, setCanalOrigem] = useState(caso?.canal_origem ?? '')
  const [categoria, setCategoria] = useState<CasoCategoria>(
    caso?.categoria ?? 'defeito'
  )
  const [descricao, setDescricao] = useState(caso?.descricao ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [fotos, setFotos] = useState<Foto[]>([])
  const [pendingFotos, setPendingFotos] = useState<PendingFoto[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!caso) return
    const supabase = createClient()
    supabase
      .from('fotos')
      .select('*')
      .eq('caso_id', caso.id)
      .order('ordem', { ascending: true })
      .then(({ data }) => {
        if (data) setFotos(data as Foto[])
      })
  }, [caso])

  function handleSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    if (isEditing) {
      uploadFotosParaCaso(caso.id, files)
    } else {
      setPendingFotos((current) => [
        ...current,
        ...files.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ])
    }
  }

  async function uploadFotosParaCaso(casoId: string, files: File[]) {
    setError(null)
    setIsUploading(true)
    const supabase = createClient()

    for (const [index, file] of files.entries()) {
      const path = `${casoId}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from(EVIDENCIAS_BUCKET)
        .upload(path, file)

      if (uploadError) {
        setError(
          `Falha ao enviar "${file.name}". Verifique o tamanho/tipo do arquivo.`
        )
        continue
      }

      await supabase.from('fotos').insert({
        caso_id: casoId,
        storage_path: path,
        ordem: fotos.length + index,
      })
    }

    const { data } = await supabase
      .from('fotos')
      .select('*')
      .eq('caso_id', casoId)
      .order('ordem', { ascending: true })

    if (data) setFotos(data as Foto[])
    setIsUploading(false)
  }

  function removePendingFoto(index: number) {
    setPendingFotos((current) => {
      URL.revokeObjectURL(current[index].previewUrl)
      return current.filter((_, i) => i !== index)
    })
  }

  async function removeFoto(foto: Foto) {
    const supabase = createClient()
    await supabase.storage.from(EVIDENCIAS_BUCKET).remove([foto.storage_path])
    await supabase.from('fotos').delete().eq('id', foto.id)
    setFotos((current) => current.filter((f) => f.id !== foto.id))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!numeroPedido.trim()) {
      setError('Informe o número do pedido.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    const supabase = createClient()

    if (isEditing) {
      const { error } = await supabase
        .from('casos')
        .update({
          numero_pedido: numeroPedido.trim(),
          cliente: cliente.trim() || null,
          canal_origem: canalOrigem.trim() || null,
          categoria,
          descricao: descricao.trim() || null,
        })
        .eq('id', caso.id)

      setIsSubmitting(false)
      if (error) {
        setError('Não foi possível salvar. Tente novamente.')
        return
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: novoCaso, error } = await supabase
        .from('casos')
        .insert({
          numero_pedido: numeroPedido.trim(),
          cliente: cliente.trim() || null,
          canal_origem: canalOrigem.trim() || null,
          categoria,
          descricao: descricao.trim() || null,
          status: 'novo',
          registrado_por: user?.id ?? null,
        })
        .select()
        .single()

      if (error || !novoCaso) {
        setIsSubmitting(false)
        setError('Não foi possível criar o caso. Tente novamente.')
        return
      }

      if (pendingFotos.length > 0) {
        await uploadFotosParaCaso(
          novoCaso.id,
          pendingFotos.map((p) => p.file)
        )
        pendingFotos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      }

      setIsSubmitting(false)
    }

    onClose()
  }

  async function handleDelete() {
    if (!caso) return
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('casos').delete().eq('id', caso.id)
    setIsDeleting(false)
    if (error) {
      setError('Não foi possível excluir. Tente novamente.')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/40 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="flex h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:p-7">
        <div className="mx-auto mb-1 h-1.5 w-10 shrink-0 rounded-full bg-cream-border sm:hidden" />

        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-charcoal">
            {isEditing ? 'Editar caso' : 'Novo caso'}
          </h2>
          <button
            onClick={onClose}
            className="text-charcoal-soft transition hover:text-terracotta"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">
              Nº do pedido <span className="text-terracotta">*</span>
            </label>
            <input
              autoFocus
              required
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              className="rounded-lg border border-cream-border px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta-soft"
              placeholder="Ex: 10234"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">
              Cliente
            </label>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="rounded-lg border border-cream-border px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta-soft"
              placeholder="Nome do cliente"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">
              Canal de origem
            </label>
            <input
              value={canalOrigem}
              onChange={(e) => setCanalOrigem(e.target.value)}
              className="rounded-lg border border-cream-border px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta-soft"
              placeholder="Ex: WhatsApp, e-mail, Instagram"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">
              Categoria
            </label>
            <select
              value={categoria}
              onChange={(e) =>
                setCategoria(e.target.value as CasoCategoria)
              }
              className="rounded-lg border border-cream-border px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta-soft"
            >
              {CATEGORIA_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">
              Descrição do problema
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="rounded-lg border border-cream-border px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta-soft"
              placeholder="Resumo do que aconteceu"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal">
              Fotos
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSelectFiles}
              className="text-sm text-charcoal-soft file:mr-3 file:rounded-lg file:border-0 file:bg-cream-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-charcoal hover:file:bg-cream-border"
            />
            {isUploading && (
              <p className="text-xs text-charcoal-soft">Enviando fotos...</p>
            )}

            {(fotos.length > 0 || pendingFotos.length > 0) && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {fotos.map((foto) => (
                  <div key={foto.id} className="group relative">
                    <img
                      src={getFotoUrl(foto.storage_path)}
                      alt=""
                      className="h-16 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFoto(foto)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-dark text-xs text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remover foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {pendingFotos.map((pf, index) => (
                  <div key={pf.previewUrl} className="group relative">
                    <img
                      src={pf.previewUrl}
                      alt=""
                      className="h-16 w-full rounded-lg object-cover opacity-80"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingFoto(index)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-dark text-xs text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remover foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="sticky bottom-0 -mx-5 mt-2 flex flex-col-reverse gap-2 border-t border-cream-border bg-white px-5 pt-4 sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir caso'}
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal-soft hover:bg-cream-soft sm:flex-none"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-terracotta px-3 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-dark disabled:opacity-50 sm:flex-none"
              >
                {isSubmitting
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar alterações'
                    : 'Criar caso'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
