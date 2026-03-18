'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'

export default function LinksPage() {
  const [parceiro, setParceiro] = useState<any>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [docCounts, setDocCounts] = useState<Record<string,number>>({})
  const [toast, setToast] = useState({ msg:'', type:'' as any })
  const router = useRouter()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://opptera.vercel.app'

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data:p } = await supabase.from('parceiros').select('*').eq('user_id',user.id).single()
    if (!p) return
    setParceiro(p)
    const { data:c } = await supabase.from('clientes').select('*').eq('parceiro_id',p.id).order('razao_social')
    setClientes(c||[])
    // contar docs por cliente
    const counts: Record<string,number> = {}
    for (const cl of (c||[])) {
      const { count } = await supabase.from('documentos').select('*',{count:'exact',head:true}).eq('cliente_id',cl.id)
      counts[cl.id] = count||0
    }
    setDocCounts(counts)
  }

  function gerarLink(token: string) {
    return `${appUrl}/upload/${token}`
  }

  async function copiarLink(token: string) {
    const link = gerarLink(token)
    try { await navigator.clipboard.writeText(link); setToast({ msg:'Link copiado!', type:'success' }) }
    catch { setToast({ msg:`Link: ${link}`, type:'info' }) }
  }

  async function enviarPorEmail(cliente: any) {
    const link = gerarLink(cliente.upload_token)
    const res = await fetch('/api/send-link-email', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        clienteNome: cliente.razao_social,
        clienteEmail: cliente.email_responsavel,
        emailsProfissionais: cliente.emails_profissionais||[],
        parceiroNome: parceiro?.nome_fantasia,
        link,
      })
    })
    if (res.ok) setToast({ msg:`Link enviado para ${cliente.email_responsavel}`, type:'success' })
    else setToast({ msg:'Erro ao enviar e-mail', type:'error' })
  }

  return (
    <AppShell userName={parceiro?.nome_fantasia}>
      <div className="page-header">
        <div>
          <div className="page-title">Links de Upload</div>
          <div className="page-sub">Envie o link white label para seus clientes fazerem o upload dos documentos</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Links por Cliente</div>
          <span className="badge badge-purple">{clientes.length} clientes</span>
        </div>
        <table>
          <thead>
            <tr><th>Cliente</th><th>CNPJ</th><th>Link Gerado</th><th>Arquivos</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {clientes.map(c=>(
              <tr key={c.id}>
                <td><strong style={{ color:'var(--g800)' }}>{c.razao_social}</strong></td>
                <td style={{ color:'var(--g500)',fontSize:12 }}>{c.cnpj}</td>
                <td style={{ maxWidth:260 }}>
                  <div className="link-box">
                    <span className="link-url">{gerarLink(c.upload_token)}</span>
                    <button className="btn btn-primary btn-sm" onClick={()=>copiarLink(c.upload_token)}>Copiar</button>
                  </div>
                </td>
                <td><span className="badge badge-purple">📁 {docCounts[c.id]||0}</span></td>
                <td style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>window.open(`/upload/${c.upload_token}`,'_blank')}>👁 Ver página</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>enviarPorEmail(c)}>📧 Enviar link</button>
                </td>
              </tr>
            ))}
            {clientes.length===0&&<tr><td colSpan={5} style={{ textAlign:'center',color:'var(--g400)',padding:'32px 0' }}>Cadastre clientes para gerar links.</td></tr>}
          </tbody>
        </table>
      </div>

      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:'',type:''})} />
    </AppShell>
  )
}
