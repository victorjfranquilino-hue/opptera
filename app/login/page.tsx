'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('E-mail ou senha inválidos.'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="logo">Opp<span>tera</span></div>
          <div className="sub">Powered by IT2Tax</div>
        </div>
        <h1 className="auth-headline">
          Recuperação de<br /><em>Créditos Fiscais</em><br />Inteligente
        </h1>
        <p className="auth-desc">
          Plataforma BPO tecnológico white label para empresas de consultoria tributária.
          Gerencie clientes, documentos e oportunidades com eficiência.
        </p>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Bem-vindo de volta</h2>
          <p>Acesse sua conta Opptera</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>E-mail</label>
              <input className="form-control" type="email" required placeholder="seu@email.com.br"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input className="form-control" type="password" required placeholder="••••••••"
                value={senha} onChange={e => setSenha(e.target.value)} />
            </div>
            {erro && <p style={{ color:'#EF4444', fontSize:13, marginBottom:12 }}>{erro}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </button>
          </form>
          <div className="auth-footer">
            <a href="mailto:suporte@opptera.com.br">Problemas de acesso? Fale com o suporte</a><br /><br />
            <span style={{ fontSize:11 }}>Opptera © 2025 – Powered by <a href="https://www.it2tax.com.br" target="_blank">IT2Tax</a></span>
          </div>
        </div>
      </div>
    </div>
  )
}
