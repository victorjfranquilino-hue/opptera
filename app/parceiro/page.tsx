'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'

export default function ParceiroPage() {
  const [parceiro, setParceiro] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const [modal, setModal] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ msg:'', type:'' as any })
  const [form, setForm] = useState({
    nome_fantasia:'', razao_social:'', cnpj:'', email:'', telefone:'', cidade:'', estado:'SP', cor_primaria:'#6B46C1'
  })
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    const { data:p } = await supabase.from('parceiros').select('*').eq('user_id',user.id).single()
    if (!p) {
      setIsNew(true)
      setModal(true)
      return
    }
    setParceiro(p)
    setForm({
      nome_fantasia: p.nome_fantasia||'', razao_social: p.razao_social||'',
      cnpj: p.cnpj||'', email: p.email||'', telefone: p.telefone||'',
      cidade: p.cidade||'', estado: p.estado||'SP', cor_primaria: p.cor_primaria||'#6B46C1'
    })
  }

  async function salvar() {
    if (!form.nome_fantasia||!form.razao_social||!form.cnpj||!form.email) {
      setToast({ msg:'Preencha todos os campos obrigatórios', type:'error' }); return
    }
    setLoading(true)
    const payload = { ...form, user_id: userId }
    let error
    if (isNew) {
      const res = await supabase.from('parceiros').insert(payload).select().single()
      error = res.error
      if (!error) { setParceiro(res.data); setIsNew(false) }
    } else {
      const res = await supabase.from('parceiros').update(form).eq('id',parceiro.id).select().single()
      error = res.error
      if (!error) setParceiro(res.data)
    }
    setLoading(false)
    if (error) { setToast({ msg:'Erro ao salvar', type:'error' }); return }
    setToast({ msg:'Dados salvos com sucesso!', type:'success' })
    setModal(false)
    loadData()
  }

  const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
  const initials = (parceiro?.nome_fantasia||'').split(' ').map((n:string)=>n[0]).join('').substr(0,2).toUpperCase()||'?'

  return (
    <AppShell userName={parceiro?.nome_fantasia}>
      <div className="page-header">
        <div>
          <div className="page-title">Minha Empresa</div>
          <div className="page-sub">Dados do parceiro comercial Opptera</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}>✏️ Editar Dados</button>
      </div>

      {parceiro ? (
        <>
          <div className="profile-header" style={{ background:`linear-gradient(135deg, #1A0A3C, ${parceiro.cor_primaria})` }}>
            <div style={{ display:'flex',alignItems:'center',gap:20 }}>
              <div className="avatar avatar-lg" style={{ background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:18 }}>{initials}</div>
              <div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,color:'#fff',marginBottom:4 }}>{parceiro.nome_fantasia}</div>
                <div style={{ fontSize:13,color:'rgba(255,255,255,0.7)' }}>CNPJ: {parceiro.cnpj}</div>
                <div style={{ marginTop:8,display:'flex',gap:8 }}>
                  <span className="badge badge-green">✓ Ativo</span>
                  <span className="badge badge-purple">Parceiro Comercial</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom:20 }}>Informações da Empresa</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
              {[
                ['Razão Social', parceiro.razao_social],
                ['E-mail Principal', parceiro.email],
                ['Telefone', parceiro.telefone||'—'],
                ['Cidade / Estado', `${parceiro.cidade||'—'} / ${parceiro.estado||'—'}`],
              ].map(([label,val])=>(
                <div key={label}>
                  <div style={{ fontSize:11,color:'var(--g400)',textTransform:'uppercase',letterSpacing:1,marginBottom:4 }}>{label}</div>
                  <div style={{ fontWeight:500,color:'var(--g800)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom:16 }}>Identidade White Label</div>
            <div style={{ display:'flex',alignItems:'center',gap:16 }}>
              <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background:parceiro.cor_primaria,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:'var(--font-display)',fontSize:18,fontWeight:800 }}>{initials}</div>
              <div>
                <div style={{ fontSize:13,fontWeight:500,color:'var(--g800)' }}>Cor principal dos links de upload</div>
                <div style={{ fontSize:12,color:'var(--g500)',marginTop:2 }}>{parceiro.cor_primaria} — Seus clientes verão essa cor ao acessar o link de envio</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign:'center',padding:'48px 0' }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🏢</div>
          <div style={{ fontSize:14,color:'var(--g500)' }}>Nenhum dado de empresa cadastrado ainda.</div>
          <button className="btn btn-primary" style={{ marginTop:16 }} onClick={()=>setModal(true)}>Cadastrar Empresa</button>
        </div>
      )}

      {modal&&(
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget&&!isNew)setModal(false)}}>
          <div className="modal">
            {!isNew&&<button className="modal-close" onClick={()=>setModal(false)}>×</button>}
            <h3>{isNew?'Cadastrar sua Empresa':'Editar Dados da Empresa'}</h3>
            <p>{isNew?'Preencha os dados do seu parceiro comercial para começar a usar a plataforma':'Atualize as informações do parceiro'}</p>
            <div className="form-group">
              <label>Nome Fantasia *</label>
              <input className="form-control" placeholder="Como sua empresa é conhecida" value={form.nome_fantasia} onChange={e=>setForm({...form,nome_fantasia:e.target.value})} />
            </div>
            <div className="form-group">
              <label>Razão Social *</label>
              <input className="form-control" placeholder="Razão social completa" value={form.razao_social} onChange={e=>setForm({...form,razao_social:e.target.value})} />
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
              <label>E-mail *</label>
              <input className="form-control" type="email" placeholder="contato@empresa.com.br" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cidade</label>
                <input className="form-control" placeholder="São Paulo" value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
                  {estados.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Cor Principal (White Label)</label>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <input type="color" value={form.cor_primaria} onChange={e=>setForm({...form,cor_primaria:e.target.value})}
                  style={{ width:48,height:38,padding:2,border:'1px solid var(--g300)',borderRadius:'var(--r-sm)',cursor:'pointer' }} />
                <span style={{ fontSize:13,color:'var(--g500)' }}>Esta cor aparece na página de upload dos seus clientes</span>
              </div>
            </div>
            <div className="modal-footer">
              {!isNew&&<button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>}
              <button className="btn btn-primary" onClick={salvar} disabled={loading}>{loading?'Salvando...':'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:'',type:''})} />
    </AppShell>
  )
}
