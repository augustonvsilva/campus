// Lógica de conexões: seguidores, mútuos, rolês em comum e sugestões de pessoas.
import type { Bora, CampusEvent, Group, ID, User } from './types';

export type FollowGraph = Record<ID, ID[]>; // seguidor → seguidos

export const followingOf = (g: FollowGraph, id: ID) => g[id] ?? [];
export const followersOf = (g: FollowGraph, id: ID) => Object.keys(g).filter((f) => g[f]!.includes(id));
export const isFollowing = (g: FollowGraph, a: ID, b: ID) => followingOf(g, a).includes(b);
export const isMutual = (g: FollowGraph, a: ID, b: ID) => isFollowing(g, a, b) && isFollowing(g, b, a);

/** Eventos e Bora? em que as duas pessoas marcaram presença/interesse — "vocês vão aos mesmos rolês". */
export function sharedRoles(a: ID, b: ID, events: CampusEvent[], boras: Bora[], now = Date.now()) {
  const inEvent = (e: CampusEvent, id: ID) => e.going.includes(id) || e.interested.includes(id);
  return {
    events: events.filter((e) => e.endsAt > now && inEvent(e, a) && inEvent(e, b)).sort((x, y) => x.startsAt - y.startsAt),
    boras: boras.filter((x) => !x.cancelled && x.startsAt > now - 2 * 3_600_000 && x.participants.includes(a) && x.participants.includes(b)),
  };
}

export const groupsOf = (groups: Group[], id: ID) => groups.filter((g) => g.members[id]);

export interface Suggestion {
  user: User;
  score: number;
  /** Motivo principal, exibido no card ("3 rolês em comum", "2 amigos em comum"…). */
  reason: string;
}

/** Pessoas que vale a pena seguir: rolês em comum pesam mais, depois amigos e comunidades em comum. */
export function suggestPeople(
  me: User, users: Record<ID, User>, graph: FollowGraph, events: CampusEvent[], boras: Bora[], groups: Group[],
  blocked: ID[], now = Date.now(),
): Suggestion[] {
  const mine = new Set(followingOf(graph, me.id));
  const myGroups = new Set(groupsOf(groups, me.id).map((g) => g.id));
  const out: Suggestion[] = [];

  for (const u of Object.values(users)) {
    if (u.id === me.id || mine.has(u.id) || blocked.includes(u.id) || u.communityId !== me.communityId) continue;
    const roles = sharedRoles(me.id, u.id, events, boras, now);
    const roleCount = roles.events.length + roles.boras.length;
    const mutualFriends = followersOf(graph, u.id).filter((f) => mine.has(f)).length;
    const sharedGroups = groupsOf(groups, u.id).filter((g) => myGroups.has(g.id)).length;
    const sameCourse = !!me.course && me.course === u.course;
    const sharedInterests = u.interests.filter((i) => me.interests.includes(i)).length;
    const followsMe = isFollowing(graph, u.id, me.id);

    const score = roleCount * 3 + mutualFriends * 2 + sharedGroups * 2 + (sameCourse ? 2 : 0) + sharedInterests + (followsMe ? 4 : 0);
    if (score === 0) continue;

    const reason = followsMe ? 'Segue você'
      : roleCount ? `${roleCount} ${roleCount === 1 ? 'rolê' : 'rolês'} em comum`
        : mutualFriends ? `${mutualFriends} ${mutualFriends === 1 ? 'conexão' : 'conexões'} em comum`
          : sharedGroups ? 'Mesma comunidade'
            : sameCourse ? `Também faz ${u.course}`
              : 'Interesses em comum';
    out.push({ user: u, score, reason });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Busca simples por nome, @handle, curso ou interesse. */
export function matchesQuery(u: User, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [u.name, u.handle, u.course ?? '', ...u.interests].some((s) => s.toLowerCase().includes(q));
}
