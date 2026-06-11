'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setCarregando(false)
      return
    }

    router.push('/admin/pecas')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-light tracking-[0.2em] text-carvao">VRG</h1>
          <p className="font-sans text-xs text-muted mt-1">Área administrativa</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-sans text-xs text-carvao/70 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full border border-pedra bg-white px-4 py-3 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota transition-colors"
            />
          </div>

          <div>
            <label className="block font-sans text-xs text-carvao/70 mb-1.5">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-pedra bg-white px-4 py-3 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota transition-colors"
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 px-4 py-3">
              <p className="font-sans text-xs text-red-700">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-carvao text-cru font-sans text-sm py-3 hover:bg-carvao/85 transition-colors disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
