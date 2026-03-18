'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'

export default function UsuariosPage() {
  const [parceiro, setParceiro] = useState<any>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ msg:'', type:'' as any })
  const [form, setForm] = useState({ nome:'', email:'', perfil:'analista' })
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data:p } = await supabase.from('parceiros').select('*').eq('user_id',user.id).single()
    if (!p) return
    setParceiro(p)
    const { data:u } = await supabase.from('usuarios').select('*').eq('parceiro_id',p.id).order('created_at',{ascending:false})
    setUsuarios(u||[])
  }

  async function salvarUsuario() {
    if (!form.nome||!form.email) { setToast({ msg:'Preencha nome e e-mail', type:'error' }); return }
    setLoading(true)
    const { error } = await supabase.from('usuarios').insert({
      parceiro_id: parceiro.id,
      nome: form.nome,
      email: form.email,
      perfil: form.perfil,
    })
    if (error) { setToast({ msg:'Erro ao criar usuário', type:'error' }); setLoading(false); return }

    // Enviar e-mail de boas-vindas
    await fetch('/api/send-welcome', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ nome:form.nome, email:form.email, parceiroNome:parceiro.nome_fantasia })
    })

    setToast({ msg:'Usuário criado! E-mail de boas-vindas enviado.', type:'success' })
    setModal(false)
    setForm({ nome:'', email:'', perfil:'analista' })
    setLoading(false)
    loadData()
  }

  async function toggleAtivo(u: any) {
    await supabase.from('usuarios').update({ ativo:!u.ativo }).eq('id',u.id)
    loadData()
    setToast({ msg: u.ativo?'Usuário desativado':'Usuário ativado', type:'info' })
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este usuário?')) return
    await supabase.from('usuarios').delete().eq('id',id)
    loadData()
    setToast({ msg:'Usuário removido', type:'info' })
  }

  const perfilLabel: Record<string,string> = { admin:'Administrador', analista:'Analista', consultor:'Consultor', visualizador:'Visualizador' }
  const perfilBadge: Record<string,string> = { admin:'badge-purple', analista:'badge-blue', consultor:'badge-green', visualizador:'badge-gray' }

  return (
    <AppShell userName={parceiro?.nome_fantasia}>
      <div className="page-header">
        <div>
          <div className="page-title">Usuários</div>
          <div className="page-sub">Gerencie quem pode acessar a plataforma</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}>+ Novo Usuário</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Cadastrado em</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {usuarios.map(u=>(
              <tr key={u.id}>
                <td>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div className="avatar" style={{ width:28,height:28,fontSize:10 }}>
                      {u.nome.split(' ').map((n:string)=>n[0]).join('').substr(0,2).toUpperCase()}
                    </div>
                    {u.nome}
                  </div>
                </td>
                <td style={{ color:'var(--g500)',fontSize:12 }}>{u.email}</td>
                <td><span className={`badge ${perfilBadge[u.perfil]||'badge-gray'}`}>{perfilLabel[u.perfil]||u.perfil}</span></td>
                <td><span className={`badge ${u.ativo?'badge-green':'badge-red'}`}>{u.ativo?'Ativo':'Inativo'}</span></td>
                <td style={{ color:'var(--g400)',fontSize:12 }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ display:'flex',gap:6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>toggleAtivo(u)}>{u.ativo?'⏸ Desativar':'▶ Ativar'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>excluir(u.id)}>🗑️</button>
                </td>
              </tr>
            ))}
            {usuarios.length===0&&<tr><td colSpan={6} style={{ textAlign:'center',color:'var(--g400)',padding:'32px 0' }}>Nenhum usuário cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal&&(
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <button className="modal-close" onClick={()=>setModal(false)}>×</button>
            <h3>Novo Usuário</h3>
            <p>O usuário receberá um e-mail de boas-vindas com acesso à plataforma</p>
            <div className="form-group">
              <label>Nome completo *</label>
              <input className="form-control" placeholder="Nome e Sobrenome" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} />
            </div>
            <div className="form-group">
              <label>E-mail *</label>
              <input className="form-control" type="email" placeholder="usuario@empresa.com.br" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Perfil de Acesso</label>
              <select className="form-control" value={form.perfil} onChange={e=>setForm({...form,perfil:e.target.value})}>
                <option value="admin">Administrador</option>
                <option value="analista">Analista</option>
                <option value="consultor">Consultor</option>
                <option value="visualizador">Visualizador</option>
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarUsuario} disabled={loading}>{loading?'Criando...':'Criar Usuário'}</button>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:'',type:''})} />
    </AppShell>
  )
}
