import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Opptera – BPO Tributário',
  description: 'Plataforma de recuperação de créditos fiscais. Powered by IT2Tax.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
