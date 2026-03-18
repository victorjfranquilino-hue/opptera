'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const TIPOS = [
  { key:'efd-contrib',  label:'EFD-Contribuições',  desc:'Escrituração Fiscal Digital de PIS/COFINS',   icon:'📊' },
  { key:'efd-icms',     label:'EFD-ICMS/IPI',       desc:'Escrituração Fiscal Digital ICMS e IPI',      icon:'📈' },
  { key:'ecd',          label:'ECD',                desc:'Escrituração Contábil Digital',               icon:'📒' },
  { key:'ecf',          label:'ECF',                desc:'Escrituração Contábil Fiscal',                icon:'📗' },
  { key:'darfs',        label:'DARFs Pagos',        desc:'Relação de DARFs pagos',                      icon:'💳' },
  { key:'perdcomp',     label:'PERDCOMPs',          desc:'Pedidos de Restituição/Compensação',          icon:'📑' },
]

export default function UploadClientePage({ params }: { params: { token: string } }) {
  const [cliente, setCliente] = useState<any>(null)
  const [parceiro, setParceiro] = useState<any>(null)
  const [files, setFiles] = useState<Record<string,File>>({})
  const [uploading, setUploading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { loadCliente() }, [])

  async function loadCliente() {
    const { data:c } = await supabase.from('clientes').select('*').eq('upload_token',params.token).single()
    if (!c) { setErro('Link inválido ou expirado.'); return }
    setCliente(c)
    const { data:p } = await supabase.from('parceiros').select('*').eq('id',c.parceiro_id).single()
    setParceiro(p)
  }

  function handleFile(key: string, file: File | null) {
    if (!file) return
    setFiles(prev=>({...prev,[key]:file}))
  }

  async function handleSubmit() {
    if (Object.keys(files).length===0) { alert('Selecione pelo menos um arquivo.'); return }
    setUploading(true)

    try {
      const docsMeta: any[] = []

      for (const [key, file] of Object.entries(files)) {
        const path = `${cliente.parceiro_id}/${cliente.id}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('documentos-fiscais').upload(path, file)
        if (error) throw error

        const tipo = TIPOS.find(t=>t.key===key)?.label || key
        docsMeta.push({
          cliente_id: cliente.id,
          parceiro_id: cliente.parceiro_id,
          nome_arquivo: file.name,
          tipo_documento: tipo,
          storage_path: path,
          tamanho_bytes: file.size,
          enviado_por: 'cliente',
        })
      }

      await supabase.from('documentos').insert(docsMeta)

      // Notificar equipe Opptera por e-mail
      await fetch('/api/notify-upload', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          clienteId: cliente.id,
          parceiroId: cliente.parceiro_id,
          docsMeta,
        })
      })

      setEnviado(true)
    } catch(e: any) {
      alert('Erro ao enviar arquivos: ' + e.message)
    }
    setUploading(false)
  }

  const topbarColor = parceiro?.cor_primaria || '#6B46C1'
  const initials = (parceiro?.nome_fantasia||'').split(' ').map((n:string)=>n[0]).join('').substr(0,2).toUpperCase()

  if (erro) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f7' }}>
      <div style={{ textAlign:'center',padding:40 }}>
        <div style={{ fontSize:48,marginBottom:16 }}>⚠️</div>
        <h2 style={{ fontFamily:'Syne,sans-serif',color:'#111',marginBottom:8 }}>Link inválido</h2>
        <p style={{ color:'#666',fontSize:14 }}>{erro}</p>
      </div>
    </div>
  )

  if (!cliente) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f7' }}>
      <div style={{ color:'#666',fontSize:14 }}>Carregando...</div>
    </div>
  )

  if (enviado) return (
    <div className="wl-page">
      <div className="wl-topbar" style={{ background:topbarColor }}>
        <div className="wl-logo-area">
          <div className="wl-logo-box" style={{ background:'rgba(0,0,0,0.3)' }}>{initials}</div>
          <div>
            <div className="wl-company">{parceiro?.nome_fantasia}</div>
            <div className="wl-powered">Powered by Opptera</div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:500,margin:'80px auto',textAlign:'center',padding:'0 20px' }}>
        <div style={{ fontSize:56,marginBottom:20 }}>✅</div>
        <h2 style={{ fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:800,color:'#111',marginBottom:12 }}>Documentos enviados!</h2>
        <p style={{ color:'#666',fontSize:15,lineHeight:1.7 }}>
          Recebemos {Object.keys(files).length} arquivo(s) de <strong>{cliente.razao_social}</strong>.<br/>
          Nossa equipe iniciará a análise em breve e entrará em contato.
        </p>
        <div style={{ marginTop:32,padding:'20px 24px',background:'#F5F3FF',borderRadius:12 }}>
          <div style={{ fontSize:13,color:'#7C3AED',fontWeight:600,marginBottom:4 }}>Próximos passos</div>
          <div style={{ fontSize:13,color:'#555',lineHeight:1.7 }}>
            Nosso time irá processar os documentos e entrar em contato para apresentar o relatório de oportunidades de recuperação de créditos.
          </div>
        </div>
      </div>
    </div>
  )

  const countSelected = Object.keys(files).length

  return (
    <div className="wl-page">
      {/* TOPBAR */}
      <div className="wl-topbar" style={{ background:topbarColor }}>
        <div className="wl-logo-area">
          <div className="wl-logo-box" style={{ background:'rgba(0,0,0,0.3)' }}>{initials}</div>
          <div>
            <div className="wl-company">{parceiro?.nome_fantasia}</div>
            <div className="wl-powered">Powered by Opptera</div>
          </div>
        </div>
        <div style={{ color:'rgba(255,255,255,0.6)',fontSize:12 }}>🔒 Área segura de envio</div>
      </div>

      <div className="wl-content">
        {/* HERO */}
        <div className="wl-hero">
          <h1>Envio de Documentos</h1>
          <p>Faça o upload dos arquivos solicitados para iniciarmos a análise de recuperação de créditos tributários.</p>
          <div className="wl-client-tag" style={{ background:topbarColor+'22',color:topbarColor }}>
            🏢 {cliente.razao_social}
          </div>
        </div>

        {/* CARD */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Documentos Necessários</div>
            <span className="badge" style={{ background: countSelected===6?'#D1FAE5':'#FEF3C7', color: countSelected===6?'#065F46':'#92400E' }}>
              {countSelected===6 ? '✓ Todos selecionados' : `${countSelected} de 6 selecionados`}
            </span>
          </div>

          <div className="upload-grid">
            {TIPOS.map(t=>{
              const f = files[t.key]
              return (
                <label key={t.key} className={`upload-item ${f?'done':''}`} style={{ cursor:'pointer' }}>
                  <input type="file" style={{ display:'none' }} onChange={e=>handleFile(t.key, e.target.files?.[0]||null)} />
                  <div className="upload-icon">{f ? '✅' : t.icon}</div>
                  <div className="upload-label">{t.label}</div>
                  <div className="upload-desc">{t.desc}</div>
                  {f && <div className="upload-fname">✓ {f.name}</div>}
                  {!f && <div style={{ fontSize:11,color:'var(--g400)',marginTop:6 }}>Clique para selecionar</div>}
                </label>
              )
            })}
          </div>

          <div style={{ marginTop:24,display:'flex',justifyContent:'flex-end',gap:12,alignItems:'center' }}>
            {countSelected>0&&<span style={{ fontSize:13,color:'var(--g500)' }}>{countSelected} arquivo(s) selecionado(s)</span>}
            <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading||countSelected===0}
              style={{ background:topbarColor,opacity:countSelected===0?.5:1 }}>
              {uploading ? '⏳ Enviando...' : '📤 Enviar Documentos'}
            </button>
          </div>
        </div>

        <div style={{ textAlign:'center',marginTop:32,fontSize:12,color:'var(--g400)' }}>
          Seus dados estão protegidos e criptografados.<br/>
          Plataforma Opptera – Powered by <a href="https://www.it2tax.com.br" style={{ color:'var(--p600)' }}>IT2Tax</a>
        </div>
      </div>
    </div>
  )
}
