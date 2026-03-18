import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const OPPTERA_TEAM = ['jvictor@it2tax.com.br', 'felipe@it2tax.com.br']

export async function POST(req: NextRequest) {
  try {
    const { assunto, mensagem, parceiroNome } = await req.json()

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0A0A0F;padding:20px 28px;border-radius:12px 12px 0 0">
          <span style="font-size:20px;font-weight:800;color:#fff">Opp<span style="color:#A78BFA">tera</span></span>
          <span style="font-size:12px;color:#666;margin-left:12px">Chamado de Suporte</span>
        </div>
        <div style="background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:28px">
          <p style="font-size:14px;color:#555"><strong>Parceiro:</strong> ${parceiroNome}</p>
          <p style="font-size:14px;color:#555"><strong>Assunto:</strong> ${assunto}</p>
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-top:12px;font-size:14px;color:#333;line-height:1.7">
            ${mensagem.replace(/\n/g,'<br/>')}
          </div>
        </div>
      </div>
    `

    await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json' },
      body: JSON.stringify({
        from: 'Opptera Suporte <noreply@opptera.com.br>',
        to: OPPTERA_TEAM,
        subject: `🎫 Suporte: ${assunto} – ${parceiroNome}`,
        html,
      })
    })

    return NextResponse.json({ ok:true })
  } catch(err:any) {
    return NextResponse.json({ error:err.message },{ status:500 })
  }
}
