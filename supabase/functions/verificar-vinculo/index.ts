// Edge Function: envia o código de verificação de vínculo para o e-mail institucional.
//
// Chamada pelo app (usuário logado) com { email: "voce@mackenzista.com.br" }.
// As regras (domínio aceito, endereço não usado por outra conta, limite de reenvio)
// ficam no banco, em issue_institutional_code(); aqui só autenticamos e enviamos o e-mail.
//
// Segredos (supabase secrets set ...):
//   RESEND_API_KEY  chave da API do Resend
//   EMAIL_FROM      remetente verificado, ex.: "Campus <verificacao@seudominio.com.br>"
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente das Edge Functions.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'método não permitido' });

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!auth.user) return json(401, { error: 'sem sessão' });

  let email = '';
  try {
    email = String((await req.json()).email ?? '').trim().toLowerCase();
  } catch {
    return json(400, { error: 'e-mail inválido' });
  }

  const { data: code, error } = await admin.rpc('issue_institutional_code', { p_user: auth.user.id, p_email: email });
  if (error) return json(400, { error: error.message });

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM'),
      to: [email],
      subject: `Seu código de verificação do Campus: ${code}`,
      text:
        `Seu código para confirmar o vínculo com a universidade no Campus é ${code}.\n\n` +
        'Ele vale por 15 minutos. Se você não pediu este código, ignore este e-mail.\n\n' +
        'O Campus é um projeto independente, sem vínculo oficial com a universidade.',
      html:
        `<p>Seu código para confirmar o vínculo com a universidade no Campus é:</p>` +
        `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>` +
        `<p>Ele vale por 15 minutos. Se você não pediu este código, ignore este e-mail.</p>` +
        `<p style="color:#888;font-size:12px">O Campus é um projeto independente, sem vínculo oficial com a universidade.</p>`,
    }),
  });

  if (!send.ok) {
    console.error('falha no envio', send.status, await send.text());
    // Libera um novo pedido em seguida: o código não chegou a ser enviado.
    await admin.from('institutional_email_codes').delete().eq('user_id', auth.user.id);
    return json(502, { error: 'falha ao enviar e-mail' });
  }
  return json(200, { ok: true });
});
