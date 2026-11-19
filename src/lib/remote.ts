// Camada de acesso ao Supabase: leitura da comunidade e operações de escrita.
// Converte entre o formato do banco (snake_case, ISO) e os tipos do app.
import { activeCommunity } from './community';
import { supabase } from './supabase';
import { DAY } from './time';
import type {
  Bora, CampusEvent, Comment, EventCategory, Group, GroupKind, GroupRole, ID, Invite, Place, PlaceCategory, Post,
  RemovableTarget, Report, ReportTarget, Ride, Role, Settings, User, Verification, VerificationRequest,
  Activity, CommentTarget,
} from './types';
import { avatarColors } from '@/theme';

/** Universidade em uso (muda com o app aberto: escolha na entrada ou conta logada). */
const cid = () => activeCommunity().id;

function sb() {
  if (!supabase) throw new Error('Supabase não configurado');
  return supabase;
}

/** Lança o erro do PostgREST/Storage com mensagem amigável. */
function must<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(friendlyError(res.error.message));
  return res;
}

export function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('profiles_handle_key') || m.includes('nick indisponível')) return 'Esse nome de usuário já está em uso. Escolha outro.';
  if (m.includes('handle_format') || m.includes('nick inválido')) return 'Nome de usuário inválido. Use de 3 a 20 letras sem acento, números, ponto ou _.';
  if (m.includes('convite')) return 'Convite inválido ou esgotado.';
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos. Se você ainda não criou senha, use "Esqueci a senha".';
  if (m.includes('should be different from the old password')) return 'A nova senha precisa ser diferente da atual.';
  if (m.includes('password should') || m.includes('weak password') || m.includes('weak_password')) return 'Senha fraca. Use pelo menos 8 caracteres, com letras e números.';
  // O Supabase Auth esconde a mensagem do trigger de cadastro; o nome de usuário já foi conferido antes.
  if (m.includes('database error saving new user')) return 'Não foi possível criar a conta. Confira o código de convite (ou se o nome de usuário acabou de ser usado) e tente de novo.';
  if (m.includes('signups not allowed')) return 'Não encontramos uma conta com esse e-mail. Para entrar pela primeira vez, você precisa de um convite.';
  if (m.includes('token has expired') || m.includes('invalid') && m.includes('otp')) return 'Código inválido ou expirado. Peça um novo.';
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (m.includes('lotado')) return 'Esse plano já está lotado.';
  if (m.includes('cancelado')) return 'Esse plano foi cancelado.';
  if (m.includes('limite de convites')) return 'Você já tem 3 convites ativos. Espere alguém usar antes de gerar outro.';
  if (m.includes('saída lotada')) return 'Essa saída já está lotada.';
  if (m.includes('saída cancelada')) return 'Essa saída foi cancelada.';
  if (m.includes('pelo menos um admin')) return 'A comunidade precisa de pelo menos um admin. Promova alguém antes de sair.';
  if (m.includes('groups_community_id_name_key') || m.includes('duplicate key') && m.includes('groups')) return 'Já existe uma comunidade com esse nome.';
  if (m.includes('row-level security') || m.includes('permission denied') || m.includes('sem permissão')) return 'Você não tem permissão para fazer isso.';
  if (m.includes('domínio não institucional')) return `Use um e-mail institucional (@${activeCommunity().emailDomains.join(' ou @')}).`;
  if (m.includes('e-mail institucional já usado')) return 'Esse e-mail institucional já confirmou outra conta. Se ela não é sua, fale com a equipe.';
  if (m.includes('aguarde para reenviar')) return 'Espere 1 minuto para pedir um novo código.';
  if (m.includes('limite diário de códigos')) return 'Você pediu muitos códigos hoje. Tente de novo amanhã.';
  if (m.includes('vínculo já verificado')) return 'Seu vínculo já está verificado.';
  if (m.includes('falha ao enviar e-mail')) return 'Não conseguimos enviar o e-mail agora. Tente de novo em instantes.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão. Verifique sua internet.';
  return message;
}

const ts = (iso: string | null | undefined) => (iso ? Date.parse(iso) : undefined);
const iso = (n: number) => new Date(n).toISOString();
const colorFor = (id: string) => avatarColors[[...id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % avatarColors.length]!;

// ───────────────────────── Linhas do banco ─────────────────────────
interface ProfileRow {
  id: string; community_id: string; name: string; handle: string | null; course: string | null; campus: string | null; semester: string | null;
  interests: string[]; verification: Verification; role: Role; profile_visible: boolean; show_bora_participation: boolean;
  avatar_path: string | null; created_at: string;
}
interface CommentRow { id: string; author_id: string; body: string; created_at: string; edited_at?: string | null }
interface GroupRow {
  id: string; community_id: string; name: string; kind: GroupKind; description: string; color: string; verified: boolean;
  created_by: string | null; created_at: string; group_members: { user_id: string; role: GroupRole }[];
}
interface RideRow {
  id: string; community_id: string; group_id: string; event_id: string | null; title: string; departs_at: string;
  departure_point: string; destination: string; seats: number | null; price: string | null; notes: string | null;
  created_by: string | null; created_at: string; cancelled_at: string | null; ride_reservations: { user_id: string }[];
  pix_key: string | null; comments: CommentRow[];
}
interface PostRow {
  id: string; community_id: string; author_id: string; body: string; expires_at: string | null; created_at: string;
  image_path: string | null; group_id: string | null; edited_at: string | null;
  poll_options: { id: string; label: string; position: number }[];
  poll_votes: { option_id: string; user_id: string }[];
  post_likes: { user_id: string }[];
  comments: CommentRow[];
}
interface EventRow {
  id: string; community_id: string; title: string; category: EventCategory; starts_at: string; ends_at: string;
  location: string; description: string; organizer: string; ticket_url: string | null; sponsored: boolean;
  group_id: string | null; created_by: string | null; event_attendance: { user_id: string; status: 'interested' | 'going' }[];
}
interface BoraRow {
  id: string; community_id: string; author_id: string; activity: string; starts_at: string; meeting_point: string;
  visibility: Bora['visibility']; capacity: number | null; cancelled_at: string | null; created_at: string;
  bora_participants: { user_id: string }[]; comments: CommentRow[];
}
interface PlaceRow {
  id: string; community_id: string; name: string; category: PlaceCategory; address: string; price_range: 1 | 2 | 3;
  hours: string | null; verified: boolean; place_recommendations: CommentRow[];
}
interface ReportRow {
  id: string; reporter_id: string; target_type: ReportTarget; target_id: string; reason: string; details: string | null;
  created_at: string; status: string;
}

const mapComment = (c: CommentRow): Comment => ({
  id: c.id, authorId: c.author_id, text: c.body, createdAt: Date.parse(c.created_at), editedAt: ts(c.edited_at),
});
const byDate = (a: { createdAt: number }, b: { createdAt: number }) => a.createdAt - b.createdAt;

export interface Snapshot {
  users: Record<ID, User>;
  posts: Post[];
  events: CampusEvent[];
  boras: Bora[];
  places: Place[];
  reports: Report[];
  blocked: ID[];
  invites: Invite[];
  verificationRequests: VerificationRequest[];
  settings: Settings;
  groups: Group[];
  rides: Ride[];
  following: Record<ID, ID[]>;
}

/** Carrega tudo o que o app precisa da comunidade do usuário (o RLS limita o escopo). */
export async function fetchSnapshot(userId: ID): Promise<Snapshot> {
  const db = sb();
  const now = Date.now();
  const [profiles, posts, events, boras, places, blocks, notify, reports, verifs, invites, follows, groups, rides, institutional] = await Promise.all([
    db.from('profiles').select('*'),
    db.from('posts')
      .select('*, poll_options(id,label,position), poll_votes(option_id,user_id), post_likes(user_id), comments(id,author_id,body,created_at,edited_at)')
      .gte('created_at', iso(now - 30 * DAY)).order('created_at', { ascending: false }).limit(200),
    db.from('events').select('*, event_attendance(user_id,status)').gte('ends_at', iso(now - DAY)).order('starts_at').limit(200),
    db.from('boras').select('*, bora_participants(user_id), comments(id,author_id,body,created_at,edited_at)')
      .gte('starts_at', iso(now - DAY)).order('starts_at').limit(200),
    db.from('places').select('*, place_recommendations(id,author_id,body,created_at)'),
    db.from('blocks').select('blocked_id').eq('blocker_id', userId),
    db.from('notification_settings').select('*').eq('user_id', userId).maybeSingle(),
    db.from('reports').select('*').eq('status', 'aberta').order('created_at', { ascending: false }).limit(100),
    db.from('verification_requests').select('*').eq('status', 'aberta'),
    db.from('invites').select('*').eq('created_by', userId),
    db.from('follows').select('follower_id,followee_id'),
    db.from('groups').select('*, group_members(user_id,role)').order('name'),
    db.from('rides').select('*, ride_reservations(user_id), comments(id,author_id,body,created_at,edited_at)').gte('departs_at', iso(now - DAY)).order('departs_at').limit(200),
    db.from('institutional_emails').select('email').eq('user_id', userId).maybeSingle(),
  ]);
  [profiles, posts, events, boras, places, blocks, notify, reports, verifs, invites, follows, groups, rides, institutional].forEach(must);

  const following: Record<ID, ID[]> = {};
  for (const f of (follows.data ?? []) as { follower_id: string; followee_id: string }[]) {
    (following[f.follower_id] ??= []).push(f.followee_id);
  }

  const users: Record<ID, User> = {};
  let settings: Settings = {
    notify: { boras: true, eventos: true, comentarios: true }, profileVisible: true, showBoraParticipation: true,
  };
  const profileRows = (profiles.data ?? []) as ProfileRow[];
  const avatars = await signAll('avatars', profileRows.map((p) => p.avatar_path));
  for (const p of profileRows) {
    users[p.id] = {
      id: p.id, communityId: p.community_id, name: p.name, handle: p.handle ?? p.name.split(' ')[0]!.toLowerCase(),
      course: p.course ?? undefined, campus: p.campus ?? undefined, semester: p.semester ?? undefined, interests: p.interests ?? [],
      color: colorFor(p.id), avatarUrl: p.avatar_path ? avatars[p.avatar_path] : undefined, profileVisible: p.profile_visible,
      verification: p.verification, role: p.role, joinedAt: Date.parse(p.created_at),
    };
    if (p.id === userId) {
      users[p.id]!.institutionalEmail = (institutional.data as { email: string } | null)?.email;
      settings = { ...settings, profileVisible: p.profile_visible, showBoraParticipation: p.show_bora_participation };
    }
  }
  const n = notify.data as { boras: boolean; eventos: boolean; comentarios: boolean } | null;
  if (n) settings = { ...settings, notify: { boras: n.boras, eventos: n.eventos, comentarios: n.comentarios } };

  const postRows = (posts.data ?? []) as PostRow[];
  const signed = await signAll('post-images', postRows.map((p) => p.image_path));

  return {
    users,
    settings,
    following,
    groups: ((groups.data ?? []) as GroupRow[]).map((g) => ({
      id: g.id, communityId: g.community_id, name: g.name, kind: g.kind, description: g.description, color: g.color,
      verified: g.verified, createdBy: g.created_by ?? undefined, createdAt: Date.parse(g.created_at),
      members: Object.fromEntries(g.group_members.map((m) => [m.user_id, m.role])),
    })),
    rides: ((rides.data ?? []) as RideRow[]).map((r) => ({
      id: r.id, communityId: r.community_id, groupId: r.group_id, eventId: r.event_id ?? undefined, title: r.title,
      departsAt: Date.parse(r.departs_at), departurePoint: r.departure_point, destination: r.destination,
      seats: r.seats ?? undefined, price: r.price ?? undefined, notes: r.notes ?? undefined, pixKey: r.pix_key ?? undefined,
      comments: (r.comments ?? []).map(mapComment).sort(byDate),
      reservations: r.ride_reservations.map((x) => x.user_id), createdBy: r.created_by ?? undefined,
      createdAt: Date.parse(r.created_at), cancelled: !!r.cancelled_at,
    })),
    posts: postRows.map((p) => ({
      id: p.id, communityId: p.community_id, authorId: p.author_id, groupId: p.group_id ?? undefined,
      text: p.body, createdAt: Date.parse(p.created_at), editedAt: ts(p.edited_at),
      expiresAt: ts(p.expires_at), imageUrl: p.image_path ? signed[p.image_path] : undefined,
      poll: p.poll_options.length
        ? [...p.poll_options].sort((a, b) => a.position - b.position).map((o) => ({
            id: o.id, label: o.label, votes: p.poll_votes.filter((v) => v.option_id === o.id).map((v) => v.user_id),
          }))
        : undefined,
      likes: p.post_likes.map((l) => l.user_id),
      comments: p.comments.map(mapComment).sort(byDate),
    })),
    events: ((events.data ?? []) as EventRow[]).map((e) => ({
      id: e.id, communityId: e.community_id, title: e.title, category: e.category,
      startsAt: Date.parse(e.starts_at), endsAt: Date.parse(e.ends_at), location: e.location, description: e.description,
      organizer: e.organizer, ticketUrl: e.ticket_url ?? undefined, sponsored: e.sponsored, createdBy: e.created_by ?? undefined,
      groupId: e.group_id ?? undefined,
      interested: e.event_attendance.filter((a) => a.status === 'interested').map((a) => a.user_id),
      going: e.event_attendance.filter((a) => a.status === 'going').map((a) => a.user_id),
    })),
    boras: ((boras.data ?? []) as BoraRow[]).map((b) => ({
      id: b.id, communityId: b.community_id, authorId: b.author_id, activity: b.activity, startsAt: Date.parse(b.starts_at),
      meetingPoint: b.meeting_point, visibility: b.visibility, capacity: b.capacity ?? undefined,
      participants: b.bora_participants.map((x) => x.user_id), comments: b.comments.map(mapComment).sort(byDate),
      createdAt: Date.parse(b.created_at), cancelled: !!b.cancelled_at,
    })),
    places: ((places.data ?? []) as PlaceRow[]).map((p) => ({
      id: p.id, communityId: p.community_id, name: p.name, category: p.category, address: p.address,
      priceRange: p.price_range, hours: p.hours ?? undefined, verified: p.verified,
      recommendations: p.place_recommendations.map(mapComment).sort((a, b) => b.createdAt - a.createdAt),
    })),
    reports: ((reports.data ?? []) as ReportRow[]).map((r) => ({
      id: r.id, targetType: r.target_type, targetId: r.target_id, reason: r.reason, details: r.details ?? undefined,
      reporterId: r.reporter_id, createdAt: Date.parse(r.created_at), status: 'aberta',
    })),
    blocked: ((blocks.data ?? []) as { blocked_id: string }[]).map((b) => b.blocked_id),
    invites: ((invites.data ?? []) as { code: string; max_uses: number; uses: number; created_at: string }[]).map((i) => ({
      code: i.code, maxUses: i.max_uses, uses: i.uses, createdBy: userId, createdAt: Date.parse(i.created_at),
    })),
    verificationRequests: ((verifs.data ?? []) as { id: string; user_id: string; evidence_path: string | null; created_at: string }[]).map((v) => ({
      id: v.id, userId: v.user_id, evidence: v.evidence_path ?? undefined, createdAt: Date.parse(v.created_at),
    })),
  };
}

// ───────────────────────── Autenticação (código por e-mail) ─────────────────────────
export interface SignupMeta { name: string; handle: string; course: string; campus: string; semester: string; inviteCode: string }

export async function handleAvailable(handle: string): Promise<boolean> {
  const res = must(await sb().rpc('handle_available', { p_handle: handle }));
  return res.data === true;
}

export async function requestCode(email: string, signup?: SignupMeta) {
  const { error } = await sb().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: !!signup,
      data: signup ? {
        name: signup.name.trim(), handle: signup.handle, course: signup.course.trim(), campus: signup.campus, semester: signup.semester,
        invite_code: signup.inviteCode.trim().toUpperCase(),
      } : undefined,
    },
  });
  if (error) throw new Error(friendlyError(error.message));
}

export async function verifyCode(email: string, token: string) {
  const { data, error } = await sb().auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'email' });
  if (error) throw new Error(friendlyError(error.message));
  return data.session;
}

// ───────────────────────── Vínculo pelo e-mail institucional ─────────────────────────
/** Pede o envio do código para o e-mail institucional (Edge Function `verificar-vinculo`). */
export async function requestInstitutionalCode(email: string) {
  const { error } = await sb().functions.invoke('verificar-vinculo', { body: { email: email.trim().toLowerCase() } });
  if (!error) return;
  // Em erro HTTP, a mensagem da função vem no corpo da resposta.
  let message = error.message;
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    message = ((await context.json().catch(() => null)) as { error?: string } | null)?.error ?? message;
  }
  throw new Error(friendlyError(message));
}

const CONFIRM_MESSAGES: Record<string, string> = {
  incorreto: 'Código incorreto. Confira e tente de novo.',
  expirado: 'Esse código expirou. Peça um novo.',
  tentativas: 'Muitas tentativas erradas. Peça um novo código.',
  sem_codigo: 'Peça um código primeiro.',
  em_uso: 'Esse e-mail institucional acabou de confirmar outra conta. Se ela não é sua, fale com a equipe.',
};

export async function confirmInstitutionalCode(code: string) {
  const res = must(await sb().rpc('confirm_institutional_code', { p_code: code.trim() }));
  const status = res.data as string;
  if (status !== 'ok') throw new Error(CONFIRM_MESSAGES[status] ?? 'Não foi possível confirmar o código.');
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await sb().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(friendlyError(error.message));
  return data.session;
}

/** Cria ou troca a senha do usuário logado. */
export async function setPassword(password: string) {
  const { error } = await sb().auth.updateUser({ password });
  if (error) throw new Error(friendlyError(error.message));
}

/** Exclui a conta logada e todos os dados dela (Edge Function `excluir-conta`). */
export async function deleteAccount() {
  const { error } = await sb().functions.invoke('excluir-conta', { method: 'POST' });
  if (error) throw new Error('Não foi possível excluir a conta agora. Tente de novo em instantes.');
}

export async function signOut() {
  await sb().auth.signOut();
}

// ───────────────────────── Arquivos ─────────────────────────
export interface LocalImage { uri: string; mimeType?: string }
type Bucket = 'post-images' | 'verification' | 'avatars';

/** URLs assinadas (1 h) para os caminhos informados, numa única chamada. */
async function signAll(bucket: Bucket, paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((x): x is string => !!x))];
  const out: Record<string, string> = {};
  if (!unique.length) return out;
  const res = await sb().storage.from(bucket).createSignedUrls(unique, 60 * 60);
  for (const s of res.data ?? []) if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
  return out;
}

async function upload(bucket: Bucket, folderUser: ID, id: string, image: LocalImage) {
  const type = image.mimeType ?? 'image/jpeg';
  const ext = type.split('/')[1] ?? 'jpg';
  const path = `${cid()}/${folderUser}/${id}.${ext}`;
  const body = await (await fetch(image.uri)).arrayBuffer();
  must(await sb().storage.from(bucket).upload(path, body, { contentType: type, upsert: false }));
  return path;
}

export async function signedEvidenceUrl(path: string) {
  const res = must(await sb().storage.from('verification').createSignedUrl(path, 10 * 60));
  return res.data?.signedUrl;
}

// ───────────────────────── Escritas ─────────────────────────
export async function addPost(me: ID, post: Post, image?: LocalImage) {
  const image_path = image ? await upload('post-images', me, post.id, image) : null;
  must(await sb().from('posts').insert({
    id: post.id, community_id: cid(), author_id: me, body: post.text,
    expires_at: post.expiresAt ? iso(post.expiresAt) : null, image_path, group_id: post.groupId ?? null,
  }));
  if (post.poll?.length) {
    must(await sb().from('poll_options').insert(post.poll.map((o, i) => ({ id: o.id, post_id: post.id, label: o.label, position: i }))));
  }
}

export const deletePost = async (id: ID) => void must(await sb().from('posts').delete().eq('id', id));

export async function setLike(me: ID, postId: ID, on: boolean) {
  if (on) must(await sb().from('post_likes').insert({ post_id: postId, user_id: me }));
  else must(await sb().from('post_likes').delete().match({ post_id: postId, user_id: me }));
}

export async function setVote(me: ID, postId: ID, optionId: ID | null) {
  must(await sb().from('poll_votes').delete().match({ post_id: postId, user_id: me }));
  if (optionId) must(await sb().from('poll_votes').insert({ post_id: postId, option_id: optionId, user_id: me }));
}

export async function addComment(me: ID, target: CommentTarget, targetId: ID, comment: Comment) {
  must(await sb().from('comments').insert({
    id: comment.id, community_id: cid(), author_id: me, body: comment.text,
    post_id: target === 'post' ? targetId : null, bora_id: target === 'bora' ? targetId : null,
    ride_id: target === 'ride' ? targetId : null,
  }));
}

export const updateComment = async (id: ID, text: string) => void must(await sb().from('comments').update({ body: text }).eq('id', id));
export const deleteComment = async (id: ID) => void must(await sb().from('comments').delete().eq('id', id));
export const updatePost = async (id: ID, text: string) => void must(await sb().from('posts').update({ body: text }).eq('id', id));

interface ActivityRow { kind: Activity['kind']; actor_id: string; target_type: Activity['targetType']; target_id: string; snippet: string | null; at: string }

/** O que outras pessoas fizeram com o seu conteúdo nos últimos 30 dias (RPC my_activity). */
export async function fetchActivity(): Promise<Activity[]> {
  const res = must(await sb().rpc('my_activity'));
  return ((res.data ?? []) as ActivityRow[]).map((a) => ({
    id: `${a.kind}:${a.actor_id}:${a.target_id}:${a.at}`, kind: a.kind, actorId: a.actor_id,
    targetType: a.target_type, targetId: a.target_id, snippet: a.snippet ?? undefined, at: Date.parse(a.at),
  }));
}

export async function setAttendance(me: ID, eventId: ID, status: 'interested' | 'going' | null) {
  if (!status) must(await sb().from('event_attendance').delete().match({ event_id: eventId, user_id: me }));
  else must(await sb().from('event_attendance').upsert({ event_id: eventId, user_id: me, status }, { onConflict: 'event_id,user_id' }));
}

export async function addEvent(me: ID, e: CampusEvent) {
  must(await sb().from('events').insert({
    id: e.id, community_id: cid(), title: e.title, category: e.category, starts_at: iso(e.startsAt), ends_at: iso(e.endsAt),
    location: e.location, description: e.description, organizer: e.organizer, ticket_url: e.ticketUrl ?? null, created_by: me,
    group_id: e.groupId ?? null,
  }));
  await setAttendance(me, e.id, 'going');
}

export async function addBora(me: ID, b: Bora) {
  must(await sb().from('boras').insert({
    id: b.id, community_id: cid(), author_id: me, activity: b.activity, starts_at: iso(b.startsAt),
    meeting_point: b.meetingPoint, visibility: b.visibility, capacity: b.capacity ?? null,
  }));
  must(await sb().from('bora_participants').insert({ bora_id: b.id, user_id: me }));
}

export async function setBoraParticipation(me: ID, boraId: ID, on: boolean) {
  if (on) must(await sb().from('bora_participants').insert({ bora_id: boraId, user_id: me }));
  else must(await sb().from('bora_participants').delete().match({ bora_id: boraId, user_id: me }));
}

export const cancelBora = async (id: ID) => void must(await sb().from('boras').update({ cancelled_at: iso(Date.now()) }).eq('id', id));

export async function addRecommendation(me: ID, placeId: ID, rec: Comment) {
  must(await sb().from('place_recommendations').insert({ id: rec.id, place_id: placeId, author_id: me, body: rec.text }));
}

export async function report(me: ID, r: Pick<Report, 'targetType' | 'targetId' | 'reason' | 'details'>) {
  must(await sb().from('reports').insert({
    community_id: cid(), reporter_id: me, target_type: r.targetType, target_id: r.targetId, reason: r.reason, details: r.details ?? null,
  }));
}

export async function setBlock(me: ID, userId: ID, on: boolean) {
  if (on) must(await sb().from('blocks').insert({ blocker_id: me, blocked_id: userId }));
  else must(await sb().from('blocks').delete().match({ blocker_id: me, blocked_id: userId }));
}

export async function updateProfile(me: ID, patch: Partial<Pick<User, 'name' | 'handle' | 'course' | 'campus' | 'semester' | 'interests'>>) {
  must(await sb().from('profiles').update({
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.handle !== undefined && { handle: patch.handle }),
    ...('course' in patch && { course: patch.course ?? null }),
    ...('campus' in patch && { campus: patch.campus ?? null }),
    ...('semester' in patch && { semester: patch.semester ?? null }),
    ...(patch.interests !== undefined && { interests: patch.interests }),
  }).eq('id', me));
}

/** Envia a nova foto (ou remove, com null), atualiza o perfil e apaga a anterior. */
export async function setAvatar(me: ID, fileId: string, image: LocalImage | null) {
  const db = sb();
  const current = must(await db.from('profiles').select('avatar_path').eq('id', me).single()).data as { avatar_path: string | null } | null;
  const path = image ? await upload('avatars', me, fileId, image) : null;
  must(await db.from('profiles').update({ avatar_path: path }).eq('id', me));
  if (current?.avatar_path) await db.storage.from('avatars').remove([current.avatar_path]); // melhor esforço
}

export async function updateSettings(me: ID, s: Settings) {
  must(await sb().from('profiles').update({
    profile_visible: s.profileVisible, show_bora_participation: s.showBoraParticipation,
  }).eq('id', me));
  must(await sb().from('notification_settings').upsert({ user_id: me, ...s.notify }));
}

export async function createInvite(me: ID, invite: Invite) {
  must(await sb().from('invites').insert({ code: invite.code, community_id: cid(), created_by: me, max_uses: invite.maxUses }));
}

export async function requestVerification(me: ID, req: VerificationRequest, image: LocalImage) {
  const evidence_path = await upload('verification', me, req.id, image);
  must(await sb().from('verification_requests').insert({ id: req.id, user_id: me, evidence_path }));
}

// ───────────────────────── Conexões ─────────────────────────
export async function setFollow(me: ID, userId: ID, on: boolean) {
  if (on) must(await sb().from('follows').insert({ follower_id: me, followee_id: userId }));
  else must(await sb().from('follows').delete().match({ follower_id: me, followee_id: userId }));
}

// ───────────────────────── Comunidades ─────────────────────────
export async function createGroup(me: ID, g: Group) {
  // O trigger do banco adiciona quem criou como admin.
  must(await sb().from('groups').insert({
    id: g.id, community_id: cid(), name: g.name, kind: g.kind, description: g.description, color: g.color, created_by: me,
  }));
}

export async function updateGroup(id: ID, patch: Partial<Pick<Group, 'name' | 'description' | 'color' | 'kind'>>) {
  must(await sb().from('groups').update(patch).eq('id', id));
}

export async function setMembership(me: ID, groupId: ID, on: boolean) {
  if (on) must(await sb().from('group_members').insert({ group_id: groupId, user_id: me }));
  else must(await sb().from('group_members').delete().match({ group_id: groupId, user_id: me }));
}

export async function setMemberRole(groupId: ID, userId: ID, role: GroupRole) {
  must(await sb().from('group_members').update({ role }).match({ group_id: groupId, user_id: userId }));
}

export async function removeMember(groupId: ID, userId: ID) {
  must(await sb().from('group_members').delete().match({ group_id: groupId, user_id: userId }));
}

// ───────────────────────── Saídas ─────────────────────────
export async function addRide(me: ID, r: Ride) {
  must(await sb().from('rides').insert({
    id: r.id, community_id: cid(), group_id: r.groupId, event_id: r.eventId ?? null, title: r.title,
    departs_at: iso(r.departsAt), departure_point: r.departurePoint, destination: r.destination,
    seats: r.seats ?? null, price: r.price ?? null, notes: r.notes ?? null, pix_key: r.pixKey ?? null, created_by: me,
  }));
}

export async function setReservation(me: ID, rideId: ID, on: boolean) {
  if (on) must(await sb().from('ride_reservations').insert({ ride_id: rideId, user_id: me }));
  else must(await sb().from('ride_reservations').delete().match({ ride_id: rideId, user_id: me }));
}

export const cancelRide = async (id: ID) => void must(await sb().from('rides').update({ cancelled_at: iso(Date.now()) }).eq('id', id));

// ───────────────────────── Moderação ─────────────────────────
export async function removeContent(type: RemovableTarget, id: ID) {
  must(await sb().rpc('remove_content', { p_type: type, p_id: id }));
}

export async function resolveReport(me: ID, id: ID, status: 'resolvida' | 'descartada') {
  must(await sb().from('reports').update({ status, resolved_by: me }).eq('id', id));
}

export async function reviewVerification(userId: ID, approve: boolean) {
  must(await sb().rpc('review_verification', { p_user: userId, p_approve: approve }));
}

/** Escuta mudanças da comunidade e chama `onChange` (o app recarrega o snapshot). */
export function subscribe(onChange: () => void) {
  const db = sb();
  const tables = [
    'posts', 'comments', 'post_likes', 'poll_votes', 'events', 'event_attendance', 'boras', 'bora_participants',
    'place_recommendations', 'follows', 'groups', 'group_members', 'rides', 'ride_reservations',
  ];
  const channel = db.channel('campus-community');
  for (const table of tables) channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange);
  channel.subscribe();
  return () => void db.removeChannel(channel);
}
