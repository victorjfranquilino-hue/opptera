import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY!

export async function POST(req: NextRequest) {
  try {
    const { clienteNome, clienteEmail, emailsProfissionais, parceiroNome, link } = await req.json()

    const destinatarios = [clienteEmail, ...(emailsProfissionais||[])].filter(Boolean)

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <div style="background:#0A0A0F;padding:24px 32px">
            <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">Opp<span style="color:#A78BFA">tera</span></span>
            <div style="font-size:10px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-top:2px">Powered by IT2Tax</div>
          </div>
          <div style="padding:36px">
            <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">Envio de Documentos Fiscais</h2>
            <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 24px">
              Olá! <strong>${parceiroNome}</strong> solicita o envio dos seus documentos fiscais para dar início à análise de recuperação de créditos tributários.
            </p>
            <div style="background:#F5F3FF;border-radius:10px;padding:16px 20px;margin-bottom:24px">
              <div style="font-size:12px;color:#7C3AED;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Empresa</div>
              <div style="font-size:16px;font-weight:700;color:#1a1a2e">${clienteNome}</div>
            </div>
            <div style="margin-bottom:24px">
              <div style="font-size:13px;color:#666;line-height:1.7;margin-bottom:16px">
                Clique no botão abaixo para acessar a área segura de envio e fazer o upload dos seguintes documentos:
              </div>
              <ul style="font-size:13px;color:#555;line-height:2;padding-left:20px">
                <li>EFD-Contribuições</li>
                <li>EFD-ICMS/IPI</li>
                <li>ECD – Escrituração Contábil Digital</li>
                <li>ECF – Escrituração Contábil Fiscal</li>
                <li>Relação de DARFs pagos</li>
                <li>PERDCOMPs</li>
              </ul>
            </div>
            <a href="${link}"
               style="display:inline-block;background:#6B46C1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px">
              📤 Acessar Área de Upload
            </a>
            <p style="font-size:12px;color:#aaa;margin-top:24px">
              Ou copie e cole o link: <span style="color:#6B46C1">${link}</span><br/>
              🔒 Área segura e criptografada.
            </p>
          </div>
          <div style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center">
            <p style="font-size:12px;color:#aaa;margin:0">
              Opptera BPO Tributário · Powered by <a href="https://www.it2tax.com.br" style="color:#6B46C1">IT2Tax</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json' },
      body: JSON.stringify({
        from: `${parceiroNome} via Opptera <noreply@opptera.com.br>`,
        to: destinatarios,
        subject: `📤 Envio de documentos – ${clienteNome}`,
        html,
      })
    })

    if (!response.ok) throw new Error(await response.text())
    return NextResponse.json({ ok:true })
  } catch(err:any) {
    return NextResponse.json({ error:err.message },{ status:500 })
  }
}
