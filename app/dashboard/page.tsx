'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import { useRouter } from 'next/navigation'

const etapaLabel: Record<string,string> = {
  upload:'Upload Docs', processamento:'Processando', sumario:'Sumário', implementacao:'Implementado'
}
const etapaBadge: Record<string,string> = {
  upload:'badge-blue', processamento:'badge-purple', sumario:'badge-amber', implementacao:'badge-green'
}

export default function DashboardPage() {
  const [parceiro, setParceiro] = useState<any>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await supabase.from('parceiros').select('*').eq('user_id', user.id).single()
    if (!p) { router.push('/parceiro'); return }
    setParceiro(p)

    const { data: c } = await supabase.from('clientes').select('*').eq('parceiro_id', p.id).order('created_at', { ascending:false })
    setClientes(c || [])

    const { count } = await supabase.from('documentos').select('*', { count:'exact', head:true }).eq('parceiro_id', p.id)
    setTotalDocs(count || 0)
    setLoading(false)
  }

  const ativos = clientes.filter(c=>c.status==='ativo').length
  const implementados = clientes.filter(c=>c.etapa==='implementacao').length
  const totalOportunidade = clientes.reduce((s,c)=>s+(c.oportunidade_valor||0),0)
  const fmtBRL = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

  return (
    <AppShell userName={parceiro?.nome_fantasia} userRole="Parceiro Comercial">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Visão geral das oportunidades e projetos</div>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>router.push('/clientes')}>👥 Clientes</button>
          <button className="btn btn-primary btn-sm" onClick={()=>router.push('/clientes')}>+ Novo Cliente</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-value">{ativos}</div>
          <div className="kpi-label">Clientes Ativos</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon">📁</div>
          <div className="kpi-value">{totalDocs}</div>
          <div className="kpi-label">Arquivos Recebidos</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon">💰</div>
          <div className="kpi-value">{fmtBRL(totalOportunidade)}</div>
          <div className="kpi-label">Valor das Oportunidades</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon">✅</div>
          <div className="kpi-value">{implementados}</div>
          <div className="kpi-label">Créditos Implementados</div>
        </div>
      </div>

      {/* Status resumo */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24 }}>
        {['upload','processamento','sumario','implementacao'].map(e=>{
          const count = clientes.filter(c=>c.etapa===e).length
          return (
            <div key={e} className="card" style={{ padding:'16px 20px',marginBottom:0 }}>
              <div className="kpi-label" style={{ marginBottom:6 }}>{etapaLabel[e]}</div>
              <div style={{ fontSize:26,fontFamily:'var(--font-display)',fontWeight:700,color:'var(--g900)' }}>{count}</div>
              <div style={{ marginTop:6 }}><span className={`badge ${etapaBadge[e]}`}>clientes</span></div>
            </div>
          )
        })}
      </div>

      {/* Tabela clientes */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Clientes Recentes</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>router.push('/clientes')}>Ver todos →</button>
        </div>
        {loading ? <p style={{ color:'var(--g400)',fontSize:13 }}>Carregando...</p> : (
        <table>
          <thead><tr><th>Empresa</th><th>CNPJ</th><th>Responsável</th><th>Status</th><th>Etapa</th><th>Oportunidade</th><th>Ações</th></tr></thead>
          <tbody>
            {clientes.slice(0,8).map(c=>(
              <tr key={c.id}>
                <td><strong style={{ color:'var(--g800)' }}>{c.razao_social}</strong></td>
                <td style={{ color:'var(--g500)',fontSize:12 }}>{c.cnpj}</td>
                <td>{c.email_responsavel?.split('@')[0]}</td>
                <td><span className={`badge ${c.status==='ativo'?'badge-green':'badge-amber'}`}>{c.status}</span></td>
                <td><span className={`badge ${etapaBadge[c.etapa]}`}>{etapaLabel[c.etapa]}</span></td>
                <td style={{ color:'var(--p600)',fontWeight:600 }}>{fmtBRL(c.oportunidade_valor||0)}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={()=>router.push(`/links`)}>🔗 Link</button>
                </td>
              </tr>
            ))}
            {clientes.length===0 && <tr><td colSpan={7} style={{ textAlign:'center',color:'var(--g400)',padding:'32px 0' }}>Nenhum cliente cadastrado ainda.</td></tr>}
          </tbody>
        </table>
        )}
      </div>
    </AppShell>
  )
}
