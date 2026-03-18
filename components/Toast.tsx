'use client'
import { useEffect } from 'react'

interface ToastProps {
  msg: string; type: 'success'|'error'|'info'|''; onClose: ()=>void
}
export default function Toast({ msg, type, onClose }: ToastProps) {
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [msg])

  const icons = { success:'✓', error:'✕', info:'ℹ', '':'ℹ' }
  return (
    <div className={`toast ${msg?'show':''} ${type}`}>
      <span>{icons[type]}</span>
      <span>{msg}</span>
    </div>
  )
}
