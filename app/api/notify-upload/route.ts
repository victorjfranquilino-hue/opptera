import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarEmailDocumentos } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { clienteId, parceiroId, docsMeta } = await req.json()

    const admin = supabaseAdmin()

    // Buscar dados do cliente e parceiro
    const { data: cliente } = await admin.from('clientes').select('razao_social,cnpj').eq('id',clienteId).single()
    const { data: parceiro } = await admin.from('parceiros').select('nome_fantasia,email').eq('id',parceiroId).single()

    if (!cliente || !parceiro) {
      return NextResponse.json({ error:'Dados não encontrados' },{ status:404 })
    }

    // Gerar URLs assinadas (válidas por 7 dias = 604800 segundos)
    const documentosComLinks = await Promise.all(
      docsMeta.map(async (doc: any) => {
        const { data } = await admin.storage
          .from('documentos-fiscais')
          .createSignedUrl(doc.storage_path, 604800)

        const bytes = doc.tamanho_bytes || 0
        const tamanho = bytes < 1024*1024
          ? (bytes/1024).toFixed(1)+' KB'
          : (bytes/1024/1024).toFixed(1)+' MB'

        return {
          nome: doc.nome_arquivo,
          tipo: doc.tipo_documento,
          signedUrl: data?.signedUrl || '#',
          tamanho,
        }
      })
    )

    // Enviar e-mail para jvictor@it2tax.com.br, felipe@it2tax.com.br e e-mail do parceiro
    await enviarEmailDocumentos({
      clienteNome: cliente.razao_social,
      clienteCnpj: cliente.cnpj,
      parceiroNome: parceiro.nome_fantasia,
      parceiroEmail: parceiro.email,
      documentos: documentosComLinks,
    })

    return NextResponse.json({ ok:true })
  } catch (err: any) {
    console.error('notify-upload error:', err)
    return NextResponse.json({ error: err.message },{ status:500 })
  }
}
