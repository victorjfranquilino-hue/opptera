'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'

const etapaLabel: Record<string,string> = { upload:'Upload Docs', processamento:'Processando', sumario:'Sumário', implementacao:'Implementado' }
const etapaBadge: Record<string,string> = { upload:'badge-blue', processamento:'badge-purple', sumario:'badge-amber', implementacao:'badge-green' }

export default function ClientesPage() {
  const [parceiro, setParceiro] = useState<any>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ msg:'', type:'' as any })
  const [form, setForm] = useState({ razao_social:'', cnpj:'', email_responsavel:'', emails_profissionais:'', telefone:'', oportunidade_valor:'' })
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data:p } = await supabase.from('parceiros').select('*').eq('user_id',user.id).single()
    if (!p) { router.push('/parceiro'); return }
    setParceiro(p)
    const { data:c } = await supabase.from('clientes').select('*').eq('parceiro_id',p.id).order('created_at',{ ascending:false })
    setClientes(c||[])
  }

  async function salvarCliente() {
    if (!form.razao_social||!form.cnpj||!form.email_responsavel) {
      setToast({ msg:'Preencha os campos obrigatórios', type:'error' }); return
    }
    setLoading(true)
    const emails = form.emails_profissionais.split('\n').map(e=>e.trim()).filter(Boolean)
    const { error } = await supabase.from('clientes').insert({
      parceiro_id: parceiro.id,
      razao_social: form.razao_social,
      cnpj: form.cnpj,
      email_responsavel: form.email_responsavel,
      emails_profissionais: emails,
      telefone: form.telefone,
      oportunidade_valor: parseFloat(form.oportunidade_valor||'0'),
    })
    setLoading(false)
    if (error) { setToast({ msg:'Erro ao cadastrar cliente', type:'error' }); return }
    setToast({ msg:'Cliente cadastrado com sucesso!', type:'success' })
    setModal(false)
    setForm({ razao_social:'', cnpj:'', email_responsavel:'', emails_profissionais:'', telefone:'', oportunidade_valor:'' })
    loadData()
  }

  async function excluirCliente(id: string) {
    if (!confirm('Excluir este cliente e todos os seus documentos?')) return
    await supabase.from('clientes').delete().eq('id',id)
    setToast({ msg:'Cliente excluído', type:'info' })
    loadData()
  }

  const filtrados = busca
    ? clientes.filter(c=>c.razao_social.toLowerCase().includes(busca.toLowerCase())||c.cnpj.includes(busca))
    : clientes

  return (
    <AppShell userName={parceiro?.nome_fantasia}>
      <div className="page-header">
        <div>
          <div className="page-title">Clientes</div>
          <div className="page-sub">Gestão de clientes do seu escritório</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}>+ Novo Cliente</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Lista de Clientes ({filtrados.length})</div>
          <input type="text" placeholder="Buscar por nome ou CNPJ..." value={busca} onChange={e=>setBusca(e.target.value)}
            style={{ padding:'7px 12px',border:'1px solid var(--g300)',borderRadius:'var(--r-sm)',fontSize:13,width:240,outline:'none',fontFamily:'var(--font-body)' }} />
        </div>
        <table>
          <thead><tr><th>Empresa</th><th>CNPJ</th><th>E-mail</th><th>Status</th><th>Etapa</th><th>Oportunidade</th><th>Ações</th></tr></thead>
          <tbody>
            {filtrados.map(c=>(
              <tr key={c.id}>
                <td><strong style={{ color:'var(--g800)' }}>{c.razao_social}</strong></td>
                <td style={{ color:'var(--g500)',fontSize:12 }}>{c.cnpj}</td>
                <td style={{ fontSize:12 }}>{c.email_responsavel}</td>
                <td><span className={`badge ${c.status==='ativo'?'badge-green':'badge-amber'}`}>{c.status}</span></td>
                <td><span className={`badge ${etapaBadge[c.etapa]||'badge-gray'}`}>{etapaLabel[c.etapa]||c.etapa}</span></td>
                <td style={{ color:'var(--p600)',fontWeight:600 }}>{(c.oportunidade_valor||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}</td>
                <td style={{ display:'flex',gap:6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>router.push('/links')}>🔗 Link</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>excluirCliente(c.id)}>🗑️</button>
                </td>
              </tr>
            ))}
            {filtrados.length===0&&<tr><td colSpan={7} style={{ textAlign:'center',color:'var(--g400)',padding:'32px 0' }}>Nenhum cliente encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modal&&(
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <button className="modal-close" onClick={()=>setModal(false)}>×</button>
            <h3>Novo Cliente</h3>
            <p>Preencha os dados do cliente do seu escritório</p>
            <div className="form-group">
              <label>Razão Social *</label>
              <input className="form-control" placeholder="Nome completo da empresa" value={form.razao_social} onChange={e=>setForm({...form,razao_social:e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>CNPJ *</label>
                <input className="form-control" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e=>setForm({...form,cnpj:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input className="form-control" placeholder="(00) 00000-0000" value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>E-mail do Responsável *</label>
              <input className="form-control" type="email" placeholder="responsavel@empresa.com.br" value={form.email_responsavel} onChange={e=>setForm({...form,email_responsavel:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Valor estimado da oportunidade (R$)</label>
              <input className="form-control" type="number" placeholder="0" value={form.oportunidade_valor} onChange={e=>setForm({...form,oportunidade_valor:e.target.value})} />
            </div>
            <div className="form-group">
              <label>E-mails dos profissionais que farão upload (um por linha)</label>
              <textarea className="form-control" rows={3} placeholder={"analista1@empresa.com.br\nanalista2@empresa.com.br"} value={form.emails_profissionais} onChange={e=>setForm({...form,emails_profissionais:e.target.value})} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarCliente} disabled={loading}>{loading?'Salvando...':'Cadastrar Cliente'}</button>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:'',type:''})} />
    </AppShell>
  )
}
