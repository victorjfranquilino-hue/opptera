'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'

const typeIcon: Record<string,string> = {
  'EFD-Contribuições':'📊','EFD-ICMS/IPI':'📈','ECD':'📒','ECF':'📗','DARFs Pagos':'💳','PERDCOMPs':'📑'
}

function fmtBytes(b: number) {
  if (!b) return '—'
  if (b < 1024*1024) return (b/1024).toFixed(1)+' KB'
  return (b/1024/1024).toFixed(1)+' MB'
}

export default function DocumentosPage() {
  const [parceiro, setParceiro] = useState<any>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [filtroCliente, setFiltroCliente] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ msg:'', type:'' as any })
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data:p } = await supabase.from('parceiros').select('*').eq('user_id',user.id).single()
    if (!p) return
    setParceiro(p)
    const { data:c } = await supabase.from('clientes').select('id,razao_social').eq('parceiro_id',p.id)
    setClientes(c||[])
    const { data:d } = await supabase.from('documentos').select('*').eq('parceiro_id',p.id).order('created_at',{ascending:false})
    setDocs(d||[])
    setLoading(false)
  }

  async function downloadDoc(path: string, nome: string) {
    const { data, error } = await supabase.storage.from('documentos-fiscais').createSignedUrl(path, 3600)
    if (error || !data) { setToast({ msg:'Erro ao gerar link de download', type:'error' }); return }
    const a = document.createElement('a')
    a.href = data.signedUrl; a.download = nome; a.click()
    setToast({ msg:`Download iniciado: ${nome}`, type:'success' })
  }

  async function excluirDoc(id: string, path: string) {
    if (!confirm('Excluir este arquivo?')) return
    await supabase.storage.from('documentos-fiscais').remove([path])
    await supabase.from('documentos').delete().eq('id',id)
    setToast({ msg:'Arquivo excluído', type:'info' })
    loadData()
  }

  const filtrados = filtroCliente ? docs.filter(d=>d.cliente_id===filtroCliente) : docs
  const clienteMap = Object.fromEntries(clientes.map(c=>[c.id,c.razao_social]))

  return (
    <AppShell userName={parceiro?.nome_fantasia}>
      <div className="page-header">
        <div>
          <div className="page-title">Documentação</div>
          <div className="page-sub">Arquivos recebidos dos clientes via plataforma</div>
        </div>
        <select value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
          style={{ padding:'8px 12px',border:'1px solid var(--g300)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none' }}>
          <option value="">Todos os clientes</option>
          {clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Arquivos Recebidos</div>
          <span className="badge badge-purple">{filtrados.length} arquivos</span>
        </div>

        {loading && <p style={{ color:'var(--g400)',fontSize:13 }}>Carregando...</p>}

        {!loading && filtrados.length===0 && (
          <div style={{ textAlign:'center',padding:'48px 0',color:'var(--g400)' }}>
            <div style={{ fontSize:40,marginBottom:12 }}>📭</div>
            <div style={{ fontSize:14 }}>Nenhum arquivo recebido ainda.</div>
            <div style={{ fontSize:12,marginTop:6 }}>Envie o link de upload para seus clientes.</div>
          </div>
        )}

        {filtrados.map(d=>(
          <div key={d.id} className="doc-row">
            <div className="doc-icon">{typeIcon[d.tipo_documento]||'📄'}</div>
            <div className="doc-info">
              <div className="doc-name">{d.nome_arquivo}</div>
              <div className="doc-meta">
                {d.tipo_documento} · {clienteMap[d.cliente_id]||'—'} · {new Date(d.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div style={{ fontSize:12,color:'var(--g500)',marginRight:8 }}>{fmtBytes(d.tamanho_bytes)}</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>downloadDoc(d.storage_path,d.nome_arquivo)}>⬇ Baixar</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>excluirDoc(d.id,d.storage_path)}>🗑️</button>
          </div>
        ))}
      </div>

      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:'',type:''})} />
    </AppShell>
  )
}
