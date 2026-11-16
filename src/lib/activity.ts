// Central de atividade: o que outras pessoas fizeram com o seu conteúdo.
// No Supabase vem pronta da função my_activity() (migration 0008). Na demo, é derivada do estado local.
import type { Activity, Bora, Group, ID, Post, Ride, User } from './types';

const DAY = 86_400_000;

interface DemoSource {
  users: Record<ID, User>;
  posts: Post[];
  boras: Bora[];
  rides: Ride[];
  groups: Group[];
  following: Record<ID, ID[]>;
}

/** Demo: mesma lógica da função do banco, a partir do estado local (horários aproximados quando não há registro). */
export function deriveDemoActivity(s: DemoSource, me: ID, now = Date.now()): Activity[] {
  const out: Activity[] = [];
  // Horários aproximados nunca podem ficar no futuro (senão nunca contam como vistos).
  const add = (a: Omit<Activity, 'id'>) => {
    const at = Math.min(a.at, now);
    out.push({ ...a, at, id: `${a.kind}:${a.actorId}:${a.targetId}:${at}` });
  };
  const joinedAt = s.users[me]?.joinedAt ?? now;

  for (const [follower, list] of Object.entries(s.following)) {
    if (follower !== me && list.includes(me)) add({ kind: 'follow', actorId: follower, targetType: 'usuario', targetId: follower, at: joinedAt + 60_000 });
  }
  const threads: { type: Activity['targetType']; id: ID; owner?: ID; comments: Post['comments'] }[] = [
    ...s.posts.map((p) => ({ type: 'post' as const, id: p.id, owner: p.authorId, comments: p.comments })),
    ...s.boras.map((b) => ({ type: 'bora' as const, id: b.id, owner: b.authorId, comments: b.comments })),
    ...s.rides.map((r) => ({ type: 'saida' as const, id: r.id, owner: r.createdBy, comments: r.comments })),
  ];
  for (const t of threads) {
    const myFirst = t.comments.find((c) => c.authorId === me)?.createdAt;
    for (const c of t.comments) {
      if (c.authorId === me) continue;
      if (t.owner === me) add({ kind: 'comment', actorId: c.authorId, targetType: t.type, targetId: t.id, snippet: c.text, at: c.createdAt });
      else if (myFirst !== undefined && c.createdAt > myFirst) add({ kind: 'reply', actorId: c.authorId, targetType: t.type, targetId: t.id, snippet: c.text, at: c.createdAt });
    }
  }
  for (const p of s.posts) {
    if (p.authorId !== me) continue;
    for (const u of p.likes) if (u !== me) add({ kind: 'like', actorId: u, targetType: 'post', targetId: p.id, snippet: p.text, at: p.createdAt + 60_000 });
  }
  for (const b of s.boras) {
    if (b.authorId !== me) continue;
    for (const u of b.participants) if (u !== me) add({ kind: 'bora_join', actorId: u, targetType: 'bora', targetId: b.id, snippet: b.activity, at: b.createdAt + 60_000 });
  }
  for (const r of s.rides) {
    if (r.createdBy !== me) continue;
    for (const u of r.reservations) if (u !== me) add({ kind: 'ride_reserve', actorId: u, targetType: 'saida', targetId: r.id, snippet: r.title, at: r.createdAt + 60_000 });
  }
  for (const g of s.groups) {
    if (g.members[me] !== 'admin') continue;
    for (const u of Object.keys(g.members)) if (u !== me) add({ kind: 'group_join', actorId: u, targetType: 'comunidade', targetId: g.id, snippet: g.name, at: g.createdAt + 60_000 });
  }
  return out.filter((a) => a.at > now - 30 * DAY).sort((a, b) => b.at - a.at).slice(0, 100);
}

/** Frase da atividade, sem o nome de quem fez (a tela põe o nome em negrito antes). */
export function activityText(a: Activity): string {
  const where = { post: 'na sua publicação', bora: 'no seu Bora?', saida: 'na sua saída', usuario: '', comunidade: '' }[a.targetType];
  switch (a.kind) {
    case 'follow': return 'começou a seguir você';
    case 'like': return 'curtiu sua publicação';
    case 'comment': return `comentou ${where}`;
    case 'reply': return 'respondeu numa conversa em que você comentou';
    case 'bora_join': return 'entrou no seu Bora?';
    case 'ride_reserve': return 'reservou lugar na sua saída';
    case 'group_join': return 'entrou na comunidade';
  }
}

/** Para onde levar ao tocar na atividade. */
export function activityHref(a: Activity): string {
  switch (a.targetType) {
    case 'usuario': return `/usuario/${a.targetId}`;
    case 'post': return `/post/${a.targetId}`;
    case 'bora': return `/bora/${a.targetId}`;
    case 'saida': return `/saida/${a.targetId}`;
    case 'comunidade': return `/comunidade/${a.targetId}`;
  }
}
