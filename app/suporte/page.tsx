'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'

interface Msg { role:'user'|'suporte'; text:string; time:string }

const respostas = [
  'Entendido! Vou verificar isso para você em breve.',
  'Obrigado pelo contato. Nossa equipe retornará em até 1 hora útil.',
  'Poderia nos enviar mais detalhes? Isso nos ajudará a resolver mais rapidamente.',
  'Registrei seu chamado. Protocolo: #' + Math.floor(1000+Math.random()*9000),
  'Perfeito! Já identificamos a situação. Nosso time técnico irá resolver.',
  'Para agilizar, poderia acessar a seção de Documentação e verificar se o arquivo foi recebido corretamente?',
]

export default function SuportePage() {
  const [parceiro, setParceiro] = useState<any>(null)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role:'suporte', text:'Olá! Sou da equipe Opptera. Como posso ajudar você hoje? 😊', time:'agora' }
  ])
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState<'chat'|'email'>('chat')
  const [emailForm, setEmailForm] = useState({ assunto:'', mensagem:'' })
  const [toast, setToast] = useState({ msg:'', type:'' as any })
  const chatRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => { loadData() }, [])
  useEffect(() => { if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [msgs])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data:p } = await supabase.from('parceiros').select('nome_fantasia').eq('user_id',user.id).single()
    setParceiro(p)
  }

  function sendMsg() {
    if (!input.trim()) return
    const time = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    setMsgs(prev=>[...prev, { role:'user', text:input.trim(), time }])
    setInput('')
    setTimeout(()=>{
      const resp = respostas[Math.floor(Math.random()*respostas.length)]
      const t2 = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
      setMsgs(prev=>[...prev, { role:'suporte', text:resp, time:t2 }])
    }, 1200)
  }

  async function sendEmail() {
    if (!emailForm.assunto||!emailForm.mensagem) { setToast({ msg:'Preencha assunto e mensagem', type:'error' }); return }
    const res = await fetch('/api/send-support', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ ...emailForm, parceiroNome:parceiro?.nome_fantasia })
    })
    if (res.ok) {
      setToast({ msg:'E-mail enviado para a equipe Opptera!', type:'success' })
      setEmailForm({ assunto:'', mensagem:'' })
    } else {
      setToast({ msg:'Erro ao enviar e-mail', type:'error' })
    }
  }

  return (
    <AppShell userName={parceiro?.nome_fantasia}>
      <div className="page-header">
        <div>
          <div className="page-title">Suporte Técnico</div>
          <div className="page-sub">Fale diretamente com a equipe Opptera</div>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'3fr 2fr',gap:20 }}>
        <div className="card">
          <div className="tabs">
            <button className={`tab-btn ${activeTab==='chat'?'active':''}`} onClick={()=>setActiveTab('chat')}>💬 Chat</button>
            <button className={`tab-btn ${activeTab==='email'?'active':''}`} onClick={()=>setActiveTab('email')}>📧 E-mail</button>
          </div>

          {activeTab==='chat' && (
            <>
              <div className="chat-area" ref={chatRef}>
                {msgs.map((m,i)=>(
                  <div key={i} className={`chat-msg ${m.role==='user'?'sent':''}`}>
                    <div className="avatar" style={{ width:28,height:28,fontSize:10,background:m.role==='suporte'?'var(--p600)':'var(--p300)',color:m.role==='suporte'?'#fff':'var(--p900)' }}>
                      {m.role==='suporte'?'OP':'EU'}
                    </div>
                    <div>
                      <div className="chat-bubble">{m.text}</div>
                      <div className="chat-time" style={{ textAlign:m.role==='user'?'right':'left' }}>
                        {m.role==='suporte'?'Suporte Opptera':'Você'} · {m.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input-row">
                <input className="chat-input" value={input} onChange={e=>setInput(e.target.value)}
                  placeholder="Digite sua mensagem..." onKeyDown={e=>e.key==='Enter'&&sendMsg()} />
                <button className="btn btn-primary" onClick={sendMsg}>Enviar</button>
              </div>
            </>
          )}

          {activeTab==='email' && (
            <>
              <div className="form-group">
                <label>Assunto *</label>
                <input className="form-control" placeholder="Descreva o assunto do chamado" value={emailForm.assunto} onChange={e=>setEmailForm({...emailForm,assunto:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Mensagem *</label>
                <textarea className="form-control" rows={6} placeholder="Descreva detalhadamente sua dúvida ou problema..." value={emailForm.mensagem} onChange={e=>setEmailForm({...emailForm,mensagem:e.target.value})} />
              </div>
              <button className="btn btn-primary" onClick={sendEmail}>📧 Enviar E-mail</button>
            </>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom:14 }}>Contatos Diretos</div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {[
                { icon:'📧', label:'E-mail', val:'suporte@opptera.com.br' },
                { icon:'👤', label:'J. Victor', val:'jvictor@it2tax.com.br' },
                { icon:'👤', label:'Felipe', val:'felipe@it2tax.com.br' },
                { icon:'⏰', label:'Atendimento', val:'Seg–Sex, 08h–18h' },
              ].map(c=>(
                <div key={c.label} style={{ display:'flex',gap:10,alignItems:'center' }}>
                  <span style={{ fontSize:16 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize:11,color:'var(--g400)',textTransform:'uppercase',letterSpacing:.8 }}>{c.label}</div>
                    <div style={{ fontSize:13,color:'var(--g700)',fontWeight:500 }}>{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop:16 }}>
            <div className="card-title" style={{ marginBottom:14 }}>Tickets Recentes</div>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <div style={{ padding:'11px 13px',background:'var(--g100)',borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--g700)' }}>#1042 – Erro no upload EFD</div>
                <div style={{ fontSize:11,color:'var(--g400)',marginTop:2 }}>2 dias atrás</div>
                <div style={{ marginTop:6 }}><span className="badge badge-amber">Em andamento</span></div>
              </div>
              <div style={{ padding:'11px 13px',background:'var(--g100)',borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--g700)' }}>#1038 – Dúvida PERDCOMP</div>
                <div style={{ fontSize:11,color:'var(--g400)',marginTop:2 }}>5 dias atrás</div>
                <div style={{ marginTop:6 }}><span className="badge badge-green">Resolvido</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:'',type:''})} />
    </AppShell>
  )
}
