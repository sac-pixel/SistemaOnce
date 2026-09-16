'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function TopBar() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-3 border-b border-cream-border bg-white px-4 py-2 sm:px-6">
      {email && (
        <span className="hidden truncate text-xs text-charcoal-soft sm:inline">
          {email}
        </span>
      )}
      <button
        onClick={handleLogout}
        className="text-xs font-medium text-charcoal-soft transition hover:text-terracotta"
      >
        Sair
      </button>
    </div>
  )
}
