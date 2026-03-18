import { NextRequest, NextResponse } from 'next/server'
import { enviarEmailBoasVindas } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { nome, email, parceiroNome } = await req.json()
    await enviarEmailBoasVindas(nome, email, parceiroNome)
    return NextResponse.json({ ok:true })
  } catch(err:any) {
    return NextResponse.json({ error:err.message },{ status:500 })
  }
}
