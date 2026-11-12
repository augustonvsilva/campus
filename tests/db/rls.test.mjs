// Aplica as migrations do Campus num Postgres em memória (PGlite) com stubs mínimos do Supabase
// (auth.uid, roles, storage) e roda cenários de segurança/RLS. Uso: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync } from 'node:fs';

const root = process.argv[2] ?? process.cwd();
const db = new PGlite({ extensions: { pgcrypto } });

const stub = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
create publication supabase_realtime;
grant usage on schema public, auth, storage to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant all on storage.objects to authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
`;

let failures = 0;
const ok = (name) => console.log('  ✔', name);
const bad = (name, extra = '') => { failures++; console.log('  ✘', name, extra); };

async function as(userId, fn) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}
async function expectOk(name, fn) { try { const r = await fn(); ok(name); return r; } catch (e) { bad(name, '→ ' + e.message); } }
async function expectFail(name, fn, match) {
  try { await fn(); bad(name, '→ deveria ter falhado'); }
  catch (e) { if (!match || e.message.includes(match)) ok(`${name} (bloqueado: ${e.message})`); else bad(name, '→ erro inesperado: ' + e.message); }
}
const q = (sql, params) => db.query(sql, params);
const rows = async (sql, params) => (await q(sql, params)).rows;

console.log('Aplicando stubs + migrations');
await db.exec(stub);
for (const f of ['migrations/0001_init.sql', 'migrations/0002_moderacao_midia_convites.sql', 'migrations/0003_foto_perfil.sql',
  'migrations/0004_conexoes_comunidades.sql', 'seed.sql']) {
  await expectOk(f, () => db.exec(readFileSync(`${root}/supabase/${f}`, 'utf8')));
}

console.log('Cadastro por convite');
const newUser = async (email, meta) =>
  (await rows(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [email, meta]))[0].id;
const ana = await expectOk('convite válido + e-mail institucional', () => newUser('ana@mackenzista.com.br', { name: 'Ana', invite_code: 'fundadores' }));
const gui = await expectOk('convite válido + gmail', () => newUser('gui@gmail.com', { name: 'Gui', invite_code: 'FUNDADORES' }));
const caio = await expectOk('terceiro usuário', () => newUser('caio@mackenzie.br', { name: 'Caio', invite_code: 'FUNDADORES' }));
await expectFail('convite inexistente é recusado', () => newUser('x@mackenzista.com.br', { name: 'X', invite_code: 'NAOEXISTE' }), 'convite');
const v = await rows(`select id, verification, invited_with from profiles`);
const ver = Object.fromEntries(v.map((r) => [r.id, r.verification]));
ver[ana] === 'email' && ver[gui] === 'pending' && ver[caio] === 'email'
  ? ok('verificação automática por domínio (email/pending)') : bad('verificação por domínio', JSON.stringify(ver));
v.every((r) => r.invited_with === 'FUNDADORES') ? ok('invited_with registrado') : bad('invited_with');

console.log('Outra comunidade (isolamento)');
await db.exec(`insert into communities (id, name, short_name, email_domains) values ('puc', 'PUC', 'PUC', array['pucsp.edu.br']);
               insert into invites (code, community_id, max_uses) values ('PUC1', 'puc', 1);`);
const pedro = await newUser('pedro@pucsp.edu.br', { name: 'Pedro', invite_code: 'PUC1' });
await expectFail('convite de uso único não reaproveita', () => newUser('p2@pucsp.edu.br', { name: 'P2', invite_code: 'PUC1' }), 'convite');

console.log('Publicações e RLS');
const postId = await as(ana, async () => (await rows(
  `insert into posts (community_id, author_id, body) values ('mackenzie', $1, 'Oi Mackenzie') returning id`, [ana]))[0].id);
postId ? ok('verificado publica') : bad('verificado publica');
await as(gui, () => expectFail('pendente não publica', () => q(`insert into posts (community_id, author_id, body) values ('mackenzie', $1, 'oi')`, [gui])));
await as(ana, () => expectFail('não publica em nome de outro', () => q(`insert into posts (community_id, author_id, body) values ('mackenzie', $1, 'oi')`, [caio])));
await as(ana, () => expectFail('não publica em outra comunidade', () => q(`insert into posts (community_id, author_id, body) values ('puc', $1, 'oi')`, [ana])));
const seenByPedro = await as(pedro, () => rows(`select * from posts`));
seenByPedro.length === 0 ? ok('PUC não vê posts do Mackenzie') : bad('PUC vê posts do Mackenzie');
const seenByGui = await as(gui, () => rows(`select * from posts`));
seenByGui.length === 1 ? ok('pendente consegue ler a comunidade') : bad('pendente lê', String(seenByGui.length));
await as(pedro, () => expectFail('PUC não curte post do Mackenzie', () => q(`insert into post_likes (post_id, user_id) values ($1, $2)`, [postId, pedro])));
await as(caio, () => expectOk('curtir post da comunidade', () => q(`insert into post_likes (post_id, user_id) values ($1, $2)`, [postId, caio])));
await as(pedro, () => expectFail('PUC não comenta no Mackenzie', () => q(
  `insert into comments (community_id, post_id, author_id, body) values ('puc', $1, $2, 'oi')`, [postId, pedro])));
await as(caio, () => expectOk('comentar', () => q(
  `insert into comments (community_id, post_id, author_id, body) values ('mackenzie', $1, $2, 'boa!')`, [postId, caio])));

console.log('Perfil');
await as(gui, () => expectFail('não se autoverifica', () => q(`update profiles set verification = 'email' where id = $1`, [gui])));
await as(gui, () => expectFail('não vira admin', () => q(`update profiles set role = 'admin' where id = $1`, [gui])));
await as(gui, () => expectOk('edita nome e curso', () => q(`update profiles set name = 'Guilherme', course = 'Direito' where id = $1`, [gui])));
const other = await as(gui, () => q(`update profiles set name = 'hack' where id = $1`, [ana]));
other.affectedRows === 0 ? ok('não edita perfil alheio') : bad('editou perfil alheio');

console.log('Enquete');
const optId = await as(ana, async () => {
  const p = (await rows(`insert into posts (community_id, author_id, body) values ('mackenzie', $1, 'Enquete?') returning id`, [ana]))[0].id;
  return { p, o: (await rows(`insert into poll_options (post_id, label, position) values ($1, 'Sim', 0) returning id`, [p]))[0].id };
});
await as(caio, () => expectOk('votar', () => q(`insert into poll_votes (post_id, option_id, user_id) values ($1, $2, $3)`, [optId.p, optId.o, caio])));
await as(caio, () => expectFail('opção de outra enquete', () => q(`insert into poll_votes (post_id, option_id, user_id) values ($1, $2, $3)`, [postId, optId.o, caio])));

console.log('Bora? com lotação');
const boraId = await as(ana, async () => {
  const id = (await rows(`insert into boras (community_id, author_id, activity, starts_at, meeting_point, capacity)
    values ('mackenzie', $1, 'Estudar', now() + interval '1 hour', 'Biblioteca', 2) returning id`, [ana]))[0].id;
  await q(`insert into bora_participants (bora_id, user_id) values ($1, $2)`, [id, ana]);
  return id;
});
await as(caio, () => expectOk('entrar no Bora?', () => q(`insert into bora_participants (bora_id, user_id) values ($1, $2)`, [boraId, caio])));
await as(gui, () => expectFail('Bora? lotado', () => q(`insert into bora_participants (bora_id, user_id) values ($1, $2)`, [boraId, gui]), 'lotado'));
await as(pedro, () => expectFail('PUC não entra em Bora? do Mackenzie (lotado, sem vazar)', () => q(`insert into bora_participants (bora_id, user_id) values ($1, $2)`, [boraId, pedro]), 'row-level security'));
const openBora = await as(ana, async () => (await rows(`insert into boras (community_id, author_id, activity, starts_at, meeting_point)
    values ('mackenzie', $1, 'Almoço', now() + interval '1 hour', 'Portão') returning id`, [ana]))[0].id);
await as(pedro, () => expectFail('PUC não entra em Bora? aberto do Mackenzie', () => q(`insert into bora_participants (bora_id, user_id) values ($1, $2)`, [openBora, pedro]), 'row-level security'));
await as(ana, () => expectOk('autora cancela o Bora?', () => q(`update boras set cancelled_at = now() where id = $1`, [openBora])));
await as(caio, () => expectFail('não entra em Bora? cancelado', () => q(`insert into bora_participants (bora_id, user_id) values ($1, $2)`, [openBora, caio]), 'cancelado'));

console.log('Eventos');
const evs = await as(caio, () => rows(`select id, sponsored from events`));
evs.length === 4 ? ok('seed de eventos visível') : bad('seed eventos', String(evs.length));
await as(caio, () => expectFail('não cria evento patrocinado', () => q(`insert into events (community_id, title, category, starts_at, ends_at, location, organizer, created_by, sponsored)
  values ('mackenzie', 'Festa', 'festa', now(), now() + interval '1 hour', 'X', 'Y', $1, true)`, [caio])));
const evId = await as(caio, async () => (await rows(`insert into events (community_id, title, category, starts_at, ends_at, location, organizer, created_by)
  values ('mackenzie', 'Encontro', 'encontro', now(), now() + interval '1 hour', 'X', 'Y', $1) returning id`, [caio]))[0].id);
await as(caio, () => expectFail('não se autopromove a patrocinado', () => q(`update events set sponsored = true where id = $1`, [evId])));
await as(caio, () => expectOk('marcar "vou"', () => q(`insert into event_attendance (event_id, user_id, status) values ($1, $2, 'going')`, [evs[0].id, caio])));

console.log('Convites individuais');
for (let i = 1; i <= 3; i++) {
  await as(caio, () => expectOk(`gerar convite ${i}`, () => q(`insert into invites (code, community_id, created_by, max_uses) values ($1, 'mackenzie', $2, 3)`, [`CAIO${i}`, caio])));
}
await as(caio, () => expectFail('máximo 3 convites ativos', () => q(`insert into invites (code, community_id, created_by, max_uses) values ('CAIO4', 'mackenzie', $1, 3)`, [caio]), 'limite'));
await as(gui, () => expectFail('pendente não gera convite', () => q(`insert into invites (code, community_id, created_by, max_uses) values ('GUI1', 'mackenzie', $1, 3)`, [gui])));
const bia = await expectOk('cadastro com convite de membro', () => newUser('bia@mackenzista.com.br', { name: 'Bia', invite_code: 'caio1' }));
const caioInv = await as(caio, () => rows(`select code, uses from invites where code = 'CAIO1'`));
caioInv[0]?.uses === 1 ? ok('uso do convite contabilizado') : bad('uso do convite', JSON.stringify(caioInv));
void bia;

console.log('Denúncia e moderação');
await as(caio, () => expectOk('denunciar', () => q(`insert into reports (community_id, reporter_id, target_type, target_id, reason)
  values ('mackenzie', $1, 'post', $2, 'Spam ou golpe')`, [caio, postId])));
const visibleReports = await as(gui, () => rows(`select * from reports`));
visibleReports.length === 0 ? ok('denúncia não é visível a terceiros') : bad('denúncia vazou');
await as(caio, () => expectFail('membro não remove conteúdo', () => q(`select remove_content('post', $1)`, [postId]), 'permissão'));
await as(gui, () => expectFail('membro não aprova verificação', () => q(`select review_verification($1, true)`, [gui]), 'permissão'));
await db.query(`update profiles set role = 'admin' where id = $1`, [ana]);
await as(ana, () => expectOk('moderador vê denúncias', async () => { if ((await rows(`select * from reports`)).length !== 1) throw new Error('não viu'); }));
await as(ana, () => expectOk('moderador remove post', () => q(`select remove_content('post', $1)`, [postId])));
const afterRemoval = await as(caio, () => rows(`select id from posts where id = $1`, [postId]));
afterRemoval.length === 0 ? ok('post removido some para todos') : bad('post removido ainda visível');
await as(ana, () => expectOk('moderador aprova verificação', () => q(`select review_verification($1, true)`, [gui])));
(await rows(`select verification from profiles where id = $1`, [gui]))[0].verification === 'manual' ? ok('verificação manual aplicada') : bad('verificação manual');
await db.query(`update profiles set role = 'admin' where id = $1`, [pedro]);
await as(pedro, () => q(`select review_verification($1, false)`, [caio]));
(await rows(`select verification from profiles where id = $1`, [caio]))[0].verification === 'email' ? ok('admin da PUC não mexe no Mackenzie') : bad('admin de outra comunidade alterou');

console.log('Storage');
await as(caio, () => expectOk('upload na própria pasta', () => q(`insert into storage.objects (bucket_id, name, owner) values ('post-images', $1, $2)`, [`mackenzie/${caio}/a.jpg`, caio])));
await as(caio, () => expectFail('upload na pasta de outro', () => q(`insert into storage.objects (bucket_id, name, owner) values ('post-images', $1, $2)`, [`mackenzie/${ana}/a.jpg`, caio])));
const imgs = await as(pedro, () => rows(`select * from storage.objects where bucket_id = 'post-images'`));
imgs.length === 0 ? ok('PUC não lê imagens do Mackenzie') : bad('imagem vazou');

console.log('Foto de perfil');
await as(gui, () => expectOk('pendente envia a própria foto', () => q(`insert into storage.objects (bucket_id, name, owner) values ('avatars', $1, $2)`, [`mackenzie/${gui}/f1.jpg`, gui])));
await as(gui, () => expectOk('salva a foto no perfil', () => q(`update profiles set avatar_path = $1 where id = $2`, [`mackenzie/${gui}/f1.jpg`, gui])));
await as(gui, () => expectFail('não aponta o perfil para a foto de outro', () => q(`update profiles set avatar_path = $1 where id = $2`, [`mackenzie/${caio}/a.jpg`, gui]), 'avatar_path_own_folder'));
await as(gui, () => expectFail('não envia foto na pasta de outro', () => q(`insert into storage.objects (bucket_id, name, owner) values ('avatars', $1, $2)`, [`mackenzie/${caio}/x.jpg`, gui])));
const caioSees = await as(caio, () => rows(`select name from storage.objects where bucket_id = 'avatars'`));
caioSees.length === 1 ? ok('colega da comunidade vê a foto') : bad('colega vê foto', String(caioSees.length));
const pucSees = await as(pedro, () => rows(`select name from storage.objects where bucket_id = 'avatars'`));
pucSees.length === 0 ? ok('PUC não vê fotos de perfil do Mackenzie') : bad('foto de perfil vazou');
const delOther = await as(caio, () => q(`delete from storage.objects where bucket_id = 'avatars' and name = $1`, [`mackenzie/${gui}/f1.jpg`]));
delOther.affectedRows === 0 ? ok('não apaga a foto de outro') : bad('apagou foto alheia');

console.log('Seguir');
await as(caio, () => expectOk('seguir colega', () => q(`insert into follows (follower_id, followee_id) values ($1, $2)`, [caio, gui])));
await as(caio, () => expectFail('não segue a si mesmo', () => q(`insert into follows (follower_id, followee_id) values ($1, $1)`, [caio])));
await as(caio, () => expectFail('não segue alguém da PUC', () => q(`insert into follows (follower_id, followee_id) values ($1, $2)`, [caio, pedro])));
await as(caio, () => expectFail('não cria follow em nome de outro', () => q(`insert into follows (follower_id, followee_id) values ($1, $2)`, [gui, caio])));
const pucFollows = await as(pedro, () => rows(`select * from follows`));
pucFollows.length === 0 ? ok('PUC não vê conexões do Mackenzie') : bad('conexões vazaram');
await as(caio, () => expectOk('deixar de seguir', () => q(`delete from follows where follower_id = $1 and followee_id = $2`, [caio, gui])));

console.log('Comunidades');
const atl = await as(caio, async () => (await rows(
  `insert into groups (community_id, name, kind, created_by) values ('mackenzie', 'Atlética Teste', 'atletica', $1) returning id`, [caio]))[0].id);
atl ? ok('verificado cria comunidade') : bad('criar comunidade');
const caioRole = await as(caio, () => rows(`select role from group_members where group_id = $1 and user_id = $2`, [atl, caio]));
caioRole[0]?.role === 'admin' ? ok('criador vira admin') : bad('criador admin', JSON.stringify(caioRole));
const zeca = await newUser('zeca@gmail.com', { name: 'Zeca', invite_code: 'FUNDADORES' }); // fica pendente
await as(zeca, () => expectFail('pendente não cria comunidade', () => q(`insert into groups (community_id, name, kind, created_by) values ('mackenzie', 'X do Zeca', 'interesse', $1)`, [zeca])));
await as(caio, () => expectFail('não se dá selo oficial', () => q(`update groups set verified = true where id = $1`, [atl]), 'selo'));
await as(caio, () => expectFail('não cria já com selo', () => q(`insert into groups (community_id, name, kind, created_by, verified) values ('mackenzie', 'Fake Oficial', 'atletica', $1, true)`, [caio])));
await as(gui, () => expectOk('entrar como membro', () => q(`insert into group_members (group_id, user_id) values ($1, $2)`, [atl, gui])));
await as(bia, () => expectFail('não entra já como admin', () => q(`insert into group_members (group_id, user_id, role) values ($1, $2, 'admin')`, [atl, bia])));
await as(pedro, () => expectFail('PUC não entra em comunidade do Mackenzie', () => q(`insert into group_members (group_id, user_id) values ($1, $2)`, [atl, pedro])));
const guiPromo = await as(gui, () => q(`update group_members set role = 'admin' where group_id = $1 and user_id = $2`, [atl, gui]).catch(() => ({ affectedRows: 0 })));
guiPromo.affectedRows === 0 ? ok('membro não se promove a admin') : bad('membro se promoveu');
await as(caio, () => expectFail('último admin não sai', () => q(`delete from group_members where group_id = $1 and user_id = $2`, [atl, caio]), 'pelo menos um admin'));
await as(caio, () => expectOk('admin promove membro', () => q(`update group_members set role = 'admin' where group_id = $1 and user_id = $2`, [atl, gui])));
await as(caio, () => expectOk('admin sai quando há outro admin', () => q(`delete from group_members where group_id = $1 and user_id = $2`, [atl, caio])));
await as(caio, () => expectOk('volta como membro', () => q(`insert into group_members (group_id, user_id) values ($1, $2)`, [atl, caio])));

console.log('Mural e agenda da comunidade');
await as(caio, () => expectOk('membro publica no mural', () => q(`insert into posts (community_id, author_id, body, group_id) values ('mackenzie', $1, 'Bora treino!', $2)`, [caio, atl])));
await as(bia, () => expectFail('não-membro não publica no mural', () => q(`insert into posts (community_id, author_id, body, group_id) values ('mackenzie', $1, 'oi', $2)`, [bia, atl])));
await as(caio, () => expectFail('membro comum não cria evento da comunidade', () => q(`insert into events (community_id, title, category, starts_at, ends_at, location, organizer, created_by, group_id)
  values ('mackenzie', 'Treino', 'treino', now(), now() + interval '1 hour', 'Quadra', 'Atl', $1, $2)`, [caio, atl])));
await db.query(`update profiles set verification = 'email' where id = $1`, [gui]);
const atlEvent = await as(gui, async () => (await rows(`insert into events (community_id, title, category, starts_at, ends_at, location, organizer, created_by, group_id)
  values ('mackenzie', 'Treino aberto', 'treino', now() + interval '1 day', now() + interval '1 day 2 hours', 'Quadra', 'Atlética Teste', $1, $2) returning id`, [gui, atl]))[0].id);
atlEvent ? ok('admin cria treino (categoria nova)') : bad('admin cria evento');

console.log('Saídas (combis)');
await as(caio, () => expectFail('membro comum não cria saída', () => q(`insert into rides (community_id, group_id, title, departs_at, departure_point, destination, created_by)
  values ('mackenzie', $1, 'Combi', now() + interval '1 day', 'Portão', 'Ginásio', $2)`, [atl, caio])));
const ride = await as(gui, async () => (await rows(`insert into rides (community_id, group_id, event_id, title, departs_at, departure_point, destination, seats, price, created_by)
  values ('mackenzie', $1, $2, 'Combi pro jogo', now() + interval '1 day', 'Portão principal', 'Ginásio', 2, 'R$ 15', $3) returning id`, [atl, atlEvent, gui]))[0].id);
ride ? ok('admin cria saída') : bad('admin cria saída');
await as(caio, () => expectOk('reservar lugar', () => q(`insert into ride_reservations (ride_id, user_id) values ($1, $2)`, [ride, caio])));
await as(bia, () => expectOk('qualquer aluno reserva (mesmo sem ser membro)', () => q(`insert into ride_reservations (ride_id, user_id) values ($1, $2)`, [ride, bia])));
await as(ana, () => expectFail('saída lotada', () => q(`insert into ride_reservations (ride_id, user_id) values ($1, $2)`, [ride, ana]), 'lotada'));
await as(pedro, () => expectFail('PUC não reserva saída do Mackenzie', () => q(`insert into ride_reservations (ride_id, user_id) values ($1, $2)`, [ride, pedro]), 'row-level security'));
await as(bia, () => expectOk('cancelar a própria reserva', () => q(`delete from ride_reservations where ride_id = $1 and user_id = $2`, [ride, bia])));
await as(gui, () => expectOk('admin cancela saída', () => q(`update rides set cancelled_at = now() where id = $1`, [ride])));
await as(ana, () => expectFail('não reserva saída cancelada', () => q(`insert into ride_reservations (ride_id, user_id) values ($1, $2)`, [ride, ana]), 'cancelada'));

console.log('Moderação de comunidade');
await as(caio, () => expectOk('denunciar comunidade', () => q(`insert into reports (community_id, reporter_id, target_type, target_id, reason) values ('mackenzie', $1, 'comunidade', $2, 'Spam ou golpe')`, [caio, atl])));
await as(ana, () => expectOk('moderador remove comunidade', () => q(`select remove_content('comunidade', $1)`, [atl])));
const goneGroup = await as(caio, () => rows(`select id from groups where id = $1`, [atl]));
const goneEvent = await as(caio, () => rows(`select id from events where id = $1`, [atlEvent]));
const gonePosts = await as(caio, () => rows(`select id from posts where group_id = $1`, [atl]));
const goneRides = await as(caio, () => rows(`select id from rides where group_id = $1`, [atl]));
goneGroup.length + goneEvent.length + gonePosts.length + goneRides.length === 0
  ? ok('comunidade removida leva mural, agenda e saídas junto') : bad('conteúdo de comunidade removida ainda visível');

console.log(failures ? `\n${failures} FALHA(S)` : '\nTodos os cenários passaram.');
process.exit(failures ? 1 : 0);
