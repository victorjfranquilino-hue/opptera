'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const nav = [
  { group:'Principal', items:[
    { href:'/dashboard', icon:'📊', label:'Dashboard' },
    { href:'/kanban',    icon:'📋', label:'Kanban' },
  ]},
  { group:'Cadastros', items:[
    { href:'/parceiro',  icon:'🏢', label:'Minha Empresa' },
    { href:'/clientes',  icon:'👥', label:'Clientes' },
    { href:'/usuarios',  icon:'👤', label:'Usuários' },
  ]},
  { group:'Operacional', items:[
    { href:'/documentos', icon:'📁', label:'Documentação' },
    { href:'/links',      icon:'🔗', label:'Links de Upload' },
  ]},
  { group:'Suporte', items:[
    { href:'/suporte', icon:'💬', label:'Suporte Técnico' },
  ]},
]

export default function AppShell({ children, userName='', userRole='' }: {
  children: React.ReactNode; userName?: string; userRole?: string
}) {
  const router = useRouter()
  const path = usePathname()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName.split(' ').map((n:string)=>n[0]).join('').substr(0,2).toUpperCase() || 'U'

  return (
    <div className="app-wrapper">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-brand">Opp<span>tera</span></div>
        <div className="topbar-powered">Powered by IT2Tax</div>
        <div className="spacer" />
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 10px',borderRadius:8,cursor:'pointer' }}
             onClick={()=>router.push('/parceiro')}>
          <div className="avatar">{initials}</div>
          <div>
            <div style={{ color:'#fff',fontSize:13,fontWeight:500 }}>{userName||'Parceiro'}</div>
            <div style={{ color:'#6B6B85',fontSize:11 }}>{userRole||'Parceiro Comercial'}</div>
          </div>
        </div>
        <button onClick={logout} style={{ padding:'6px 13px',borderRadius:6,background:'transparent',border:'1px solid #2A2A3A',color:'#9999AE',fontSize:12,cursor:'pointer',transition:'all .2s' }}
          onMouseEnter={e=>(e.currentTarget.style.color='#EF4444')}
          onMouseLeave={e=>(e.currentTarget.style.color='#9999AE')}>
          Sair
        </button>
      </header>

      <div className="main-layout">
        {/* SIDEBAR */}
        <nav className="sidebar">
          {nav.map(group => (
            <div key={group.group} style={{ marginBottom:8 }}>
              <div className="sidebar-label">{group.group}</div>
              {group.items.map(item => (
                <div key={item.href}
                     className={`nav-item ${path===item.href?'active':''}`}
                     onClick={()=>router.push(item.href)}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* CONTENT */}
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
