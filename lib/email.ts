// Serviço de e-mail usando Resend (resend.com - gratuito até 3000 emails/mês)

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

// E-mails fixos da equipe Opptera que recebem notificações
const OPPTERA_TEAM = ['jvictor@it2tax.com.br', 'felipe@it2tax.com.br']

interface EmailDocumentosParams {
  clienteNome: string
  clienteCnpj: string
  parceiroNome: string
  parceiroEmail: string
  documentos: Array<{
    nome: string
    tipo: string
    signedUrl: string
    tamanho: string
  }>
}

export async function enviarEmailDocumentos(params: EmailDocumentosParams) {
  const { clienteNome, clienteCnpj, parceiroNome, parceiroEmail, documentos } = params

  const linksHtml = documentos.map(d => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px">
        <strong>${d.tipo}</strong><br>
        <span style="color:#666;font-size:12px">${d.nome} · ${d.tamanho}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right">
        <a href="${d.signedUrl}"
           style="background:#6B46C1;color:#fff;text-decoration:none;padding:7px 16px;border-radius:6px;font-size:13px;font-weight:600">
          ⬇ Baixar
        </a>
      </td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f5f5f7;font-family:'DM Sans',Arial,sans-serif">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        
        <!-- Header -->
        <div style="background:#0A0A0F;padding:28px 36px;display:flex;align-items:center">
          <div>
            <span style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px">
              Opp<span style="color:#A78BFA">tera</span>
            </span>
            <div style="font-size:10px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-top:2px">
              Powered by IT2Tax
            </div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:36px">
          <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 6px">
            📁 Novos documentos recebidos
          </h2>
          <p style="color:#666;font-size:14px;margin:0 0 24px">
            O cliente abaixo fez upload de ${documentos.length} arquivo(s) pela plataforma Opptera.
          </p>

          <!-- Cliente info -->
          <div style="background:#F5F3FF;border-radius:10px;padding:16px 20px;margin-bottom:24px">
            <div style="font-size:12px;color:#7C3AED;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Cliente</div>
            <div style="font-size:16px;font-weight:700;color:#1a1a2e">${clienteNome}</div>
            <div style="font-size:13px;color:#666;margin-top:2px">CNPJ: ${clienteCnpj}</div>
            <div style="font-size:13px;color:#666;margin-top:2px">Parceiro: ${parceiroNome} (${parceiroEmail})</div>
          </div>

          <!-- Documentos -->
          <div style="font-size:13px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">
            Arquivos enviados
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden">
            ${linksHtml}
          </table>

          <p style="font-size:12px;color:#999;margin-top:24px">
            ⏰ Os links de download ficam disponíveis por 7 dias.<br>
            Acesse o painel da Opptera para gerenciar os documentos.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f9f9f9;padding:20px 36px;border-top:1px solid #eee">
          <p style="font-size:12px;color:#aaa;margin:0;text-align:center">
            Opptera BPO Tributário · Powered by <a href="https://www.it2tax.com.br" style="color:#6B46C1">IT2Tax</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  // Enviar para a equipe Opptera + e-mail do parceiro
  const destinatarios = [...OPPTERA_TEAM, parceiroEmail]

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Opptera <noreply@opptera.com.br>',
      to: destinatarios,
      subject: `📁 Novos documentos – ${clienteNome} (${documentos.length} arquivo${documentos.length > 1 ? 's' : ''})`,
      html,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Resend error:', err)
    throw new Error('Falha ao enviar e-mail')
  }

  return await response.json()
}

// E-mail de boas-vindas para novo usuário
export async function enviarEmailBoasVindas(nome: string, email: string, parceiroNome: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
      <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
        <div style="background:#0A0A0F;padding:24px 32px">
          <span style="font-size:22px;font-weight:800;color:#fff">Opp<span style="color:#A78BFA">tera</span></span>
        </div>
        <div style="padding:32px">
          <h2 style="color:#111;margin:0 0 12px">Olá, ${nome}! 👋</h2>
          <p style="color:#555;font-size:14px;line-height:1.7">
            Você foi adicionado como usuário da plataforma Opptera pelo parceiro <strong>${parceiroNome}</strong>.
          </p>
          <p style="color:#555;font-size:14px;line-height:1.7">
            Acesse a plataforma com o e-mail <strong>${email}</strong> e configure sua senha no primeiro acesso.
          </p>
          <a href="${APP_URL}/login"
             style="display:inline-block;margin-top:20px;background:#6B46C1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
            Acessar Plataforma →
          </a>
        </div>
      </div>
    </body>
    </html>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Opptera <noreply@opptera.com.br>',
      to: [email],
      subject: `Bem-vindo à Opptera – ${parceiroNome}`,
      html,
    }),
  })
}
