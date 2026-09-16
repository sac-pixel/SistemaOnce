'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setError('E-mail ou senha inválidos.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-cream-border bg-white p-8 shadow-[0_8px_30px_-12px_rgba(43,38,32,0.15)] sm:p-10">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-charcoal">
          Casos ORNE
        </h1>
        <p className="mt-1.5 text-sm text-charcoal-soft">
          Entre com sua conta da equipe SAC.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-charcoal">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-cream-border bg-cream/40 px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-terracotta-soft"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-charcoal">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-cream-border bg-cream/40 px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-terracotta-soft"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-lg bg-terracotta px-3 py-2.5 text-sm font-medium text-white transition hover:bg-terracotta-dark disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
