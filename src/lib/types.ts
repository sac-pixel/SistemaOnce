export type CasoStatus = 'novo' | 'em_analise' | 'resolvido'

export type CasoCategoria =
  | 'defeito'
  | 'cor_modelo_errado'
  | 'incompleto'
  | 'atraso_entrega'
  | 'outro'

export type Responsavel = 'paula' | 'marilia' | 'olivia' | 'erick'

export interface Caso {
  id: string
  numero_pedido: string
  cliente: string | null
  canal_origem: string | null
  categoria: CasoCategoria
  descricao: string | null
  status: CasoStatus
  responsavel: Responsavel | null
  registrado_por: string | null
  created_at: string
  updated_at: string
}

export interface Anotacao {
  id: string
  caso_id: string
  autor_id: string | null
  autor_nome: string
  conteudo: string
  created_at: string
}

export interface Foto {
  id: string
  caso_id: string
  storage_path: string
  ordem: number
  created_at: string
}

export const STATUS_ORDER: CasoStatus[] = ['novo', 'em_analise', 'resolvido']

export const STATUS_LABELS: Record<CasoStatus, string> = {
  novo: 'Novo',
  em_analise: 'Em Análise',
  resolvido: 'Resolvido',
}

export const CATEGORIA_LABELS: Record<CasoCategoria, string> = {
  defeito: 'Item com defeito',
  cor_modelo_errado: 'Cor/modelo errado',
  incompleto: 'Item incompleto',
  atraso_entrega: 'Atraso na entrega',
  outro: 'Outro',
}

export const RESPONSAVEL_LABELS: Record<Responsavel, string> = {
  paula: 'Paula',
  marilia: 'Marília',
  olivia: 'Olivia',
  erick: 'Erick',
}
