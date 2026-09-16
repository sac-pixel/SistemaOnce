const EVIDENCIAS_BUCKET = 'evidencias'

export function getFotoUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/storage/v1/object/public/${EVIDENCIAS_BUCKET}/${storagePath}`
}

export { EVIDENCIAS_BUCKET }
