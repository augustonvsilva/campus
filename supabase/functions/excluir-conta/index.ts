// Edge Function: exclui a conta do usuário logado e todos os dados dele.
//
// Chamada pelo app com o token da sessão (sem corpo). Passos:
//   1. prepare_account_deletion(): passa a administração de comunidades em que ele é o único admin.
//   2. Apaga os arquivos dele no Storage (fotos de publicações, foto de perfil, comprovantes).
//   3. Apaga o usuário no Auth; o banco remove o perfil e o conteúdo em cascata.
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

const BUCKETS = ['post-images', 'avatars', 'verification'];

/** Apaga tudo em <bucket>/<comunidade>/<usuário>/ (é onde o app grava os arquivos de cada pessoa). */
async function removeFolder(bucket: string, folder: string) {
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 1000 });
    if (error) throw error;
    if (!data?.length) return;
    const { error: removeError } = await admin.storage.from(bucket).remove(data.map((f) => `${folder}/${f.name}`));
    if (removeError) throw removeError;
    if (data.length < 1000) return;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'método não permitido' });

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!auth.user) return json(401, { error: 'sem sessão' });
  const userId = auth.user.id;

  try {
    const { data: profile } = await admin.from('profiles').select('community_id').eq('id', userId).maybeSingle();

    const { error: prepError } = await admin.rpc('prepare_account_deletion', { p_user: userId });
    if (prepError) throw prepError;

    if (profile?.community_id) {
      for (const bucket of BUCKETS) await removeFolder(bucket, `${profile.community_id}/${userId}`);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;
    return json(200, { ok: true });
  } catch (e) {
    console.error('falha ao excluir conta', userId, e);
    return json(500, { error: 'falha ao excluir conta' });
  }
});
