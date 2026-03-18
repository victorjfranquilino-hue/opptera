'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'

const LANES = [
  { id:'upload',        label:'📤 Upload de Documentos',       cls:'col-upload' },
  { id:'processamento', label:'⚙️ Processamento de Dados',     cls:'col-proc'   },
  { id:'sumario',       label:'📋 Sumário de Oportunidades',   cls:'col-sum'    },
  { id:'implementacao', label:'✅ Implementação',               cls:'col-impl'   },
]

export default function KanbanPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [parceiroId, setParceiroId] = useState('')
  const [toast, setToast] = useState({ msg:'', type:'' as any })
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data:p } = await supabase.from('parceiros').select('id').eq('user_id',user.id).single()
    if (!p) return
    setParceiroId(p.id)
    const { data:c } = await supabase.from('clientes').select('*').eq('parceiro_id',p.id)
    setClientes(c||[])
  }

  function onDragStart(e: React.DragEvent, clienteId: string) {
    e.dataTransfer.setData('clienteId', clienteId)
  }

  async function onDrop(e: React.DragEvent, etapa: string) {
    e.preventDefault()
    const id = e.dataTransfer.getData('clienteId')
    const c = clientes.find(x=>x.id===id)
    if (!c || c.etapa===etapa) return
    // otimistic update
    setClientes(prev=>prev.map(x=>x.id===id?{...x,etapa}:x))
    const { error } = await supabase.from('clientes').update({ etapa }).eq('id',id)
    if (error) { setToast({ msg:'Erro ao mover cliente', type:'error' }); loadData() }
    else setToast({ msg:`${c.razao_social} movido para ${etapa}`, type:'info' })
  }

  const fmtBRL = (v:number) => v>=1000
    ? 'R$ '+(v/1000).toFixed(0)+'K'
    : v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <div className="page-title">Painel Kanban</div>
          <div className="page-sub">Arraste os cards para atualizar a etapa do projeto</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>router.push('/clientes')}>+ Novo Cliente</button>
      </div>

      <div className="kanban-board">
        {LANES.map(lane=>{
          const cards = clientes.filter(c=>c.etapa===lane.id)
          return (
            <div key={lane.id} className={`kanban-col ${lane.cls}`}
                 onDragOver={e=>e.preventDefault()}
                 onDrop={e=>onDrop(e,lane.id)}>
              <div className="kanban-col-strip"></div>
              <div className="kanban-col-header">
                <div className="kanban-col-title">{lane.label}</div>
                <div className="kanban-count">{cards.length}</div>
              </div>
              {cards.map(c=>(
                <div key={c.id} className="kanban-card"
                     draggable onDragStart={e=>onDragStart(e,c.id)}>
                  <div className="kc-name">{c.razao_social}</div>
                  <div className="kc-cnpj">{c.cnpj}</div>
                  <div className="kc-meta">
                    <div className="kc-value">{fmtBRL(c.oportunidade_valor||0)}</div>
                    <div className="kc-docs">📅 {new Date(c.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              ))}
              {cards.length===0&&<div style={{textAlign:'center',color:'var(--g400)',fontSize:12,paddingTop:20}}>Vazio</div>}
            </div>
          )
        })}
      </div>
      <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast({msg:'',type:''})} />
    </AppShell>
  )
}
