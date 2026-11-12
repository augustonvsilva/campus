// Estado do app + ações.
// Dois modos, com a mesma interface para as telas:
//  • Supabase (EXPO_PUBLIC_SUPABASE_* definidos): atualização otimista local + sincronização remota,
//    recarga em tempo real e ao voltar para o app.
//  • Demonstração: tudo local (AsyncStorage) a partir de dados fictícios.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { avatarColors } from '@/theme';
import { ACTIVE_COMMUNITY, isInstitutionalEmail } from './community';
import type { PreparedImage } from './images';
import * as remote from './remote';
import { seedData } from './seed';
import { supabase, SUPABASE_ENABLED } from './supabase';
import { HOUR } from './time';
import type {
  Bora, BoraVisibility, CampusEvent, Comment, Community, EventCategory, Group, GroupKind, GroupRole, ID, Invite, Place,
  Post, RemovableTarget, Report, ReportTarget, Ride, Settings, User, VerificationRequest,
} from './types';

export { SUPABASE_ENABLED };
export type LocalImage = remote.LocalImage;

const STORAGE_KEY = 'campus:state:v3';
const C = ACTIVE_COMMUNITY.id;

interface State {
  session: { userId: ID } | null;
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
  /** Quem segue quem: seguidor → seguidos. */
  following: Record<ID, ID[]>;
}

const defaultSettings: Settings = {
  notify: { boras: true, eventos: true, comentarios: true },
  profileVisible: true,
  showBoraParticipation: true,
};

const emptyState = (): State => ({
  session: null, users: {}, posts: [], events: [], boras: [], places: [], reports: [], blocked: [],
  invites: [], verificationRequests: [], settings: defaultSettings, groups: [], rides: [], following: {},
});

const demoState = (): State => ({ ...emptyState(), ...seedData() });

export const newId = () => Crypto.randomUUID();
const toggleIn = (list: ID[], id: ID) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.');

function inviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I
  const bytes = Crypto.getRandomBytes(5);
  return 'MACK-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export type SignInInput =
  | { mode: 'signup'; name: string; email: string; course?: string; inviteCode: string; alternativeVerification: boolean }
  | { mode: 'login'; email: string };

function useCampusState() {
  const [state, setState] = useState<State>(SUPABASE_ENABLED ? emptyState : demoState);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const stateRef = useRef(state);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Carregamento remoto ──
  const load = useCallback(async (userId: ID) => {
    setRefreshing(true);
    try {
      const snap = await remote.fetchSnapshot(userId);
      setState((s) => ({ ...s, ...snap, session: { userId } }));
    } catch (e) {
      setState((s) => ({ ...s, session: { userId } }));
      setError(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const userId = stateRef.current.session?.userId;
    if (SUPABASE_ENABLED && userId) await load(userId);
  }, [load]);

  const refreshSoon = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void refresh(), 1200);
  }, [refresh]);

  // ── Inicialização ──
  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase) {
      AsyncStorage.getItem(STORAGE_KEY)
        .then((raw) => {
          if (raw) setState({ ...demoState(), ...(JSON.parse(raw) as Partial<State>) });
        })
        .catch(() => {})
        .finally(() => setHydrated(true));
      return;
    }
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (data.session) await load(data.session.user.id);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setHydrated(true));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setState(emptyState());
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // ── Persistência local (só demo) ──
  // Salva a cada mudança, sem debounce: o estado é pequeno e assim nada se perde
  // se o app (ou a aba do navegador) fechar logo depois de uma ação.
  useEffect(() => {
    if (SUPABASE_ENABLED || !hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  // ── Tempo real + recarga ao voltar para o app (só Supabase) ──
  const sessionUser = state.session?.userId;
  useEffect(() => {
    if (!SUPABASE_ENABLED || !sessionUser) return;
    const unsubscribe = remote.subscribe(refreshSoon);
    const appState = AppState.addEventListener('change', (s) => s === 'active' && refreshSoon());
    return () => {
      unsubscribe();
      appState.remove();
    };
  }, [sessionUser, refreshSoon]);

  const actions = useMemo(() => {
    const me = () => stateRef.current.session?.userId;

    /** Dispara a escrita remota; se falhar, mostra o erro e recarrega para desfazer o otimismo. */
    const sync = (fn: (me: ID) => Promise<unknown>) => {
      const userId = me();
      if (!SUPABASE_ENABLED || !userId) return;
      fn(userId).catch((e) => {
        setError(errorMessage(e));
        void refresh();
      });
    };
    const local = (fn: (s: State, me: ID) => State) => setState((s) => (s.session ? fn(s, s.session.userId) : s));
    const mapPost = (id: ID, fn: (p: Post, me: ID) => Post) =>
      local((s, m) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? fn(p, m) : p)) }));
    const mapBora = (id: ID, fn: (b: Bora, me: ID) => Bora) =>
      local((s, m) => ({ ...s, boras: s.boras.map((b) => (b.id === id ? fn(b, m) : b)) }));
    const mapEvent = (id: ID, fn: (e: CampusEvent, me: ID) => CampusEvent) =>
      local((s, m) => ({ ...s, events: s.events.map((e) => (e.id === id ? fn(e, m) : e)) }));
    const mkComment = (authorId: ID, text: string): Comment => ({ id: newId(), authorId, text: text.trim(), createdAt: Date.now() });

    return {
      clearError: () => setError(null),
      refresh,

      // ── Conta ──
      /** Retorna true quando é preciso digitar o código enviado por e-mail (modo Supabase). */
      async startSignIn(input: SignInInput): Promise<boolean> {
        if (SUPABASE_ENABLED) {
          await remote.requestCode(input.email, input.mode === 'signup'
            ? { name: input.name, course: input.course, inviteCode: input.inviteCode } : undefined);
          return true;
        }
        const s = stateRef.current;
        const email = input.email.trim().toLowerCase();
        if (input.mode === 'login') {
          const user = Object.values(s.users).find((u) => u.email === email);
          if (!user) throw new Error('Não encontramos uma conta com esse e-mail neste aparelho.');
          setState((x) => ({ ...x, session: { userId: user.id } }));
          return false;
        }
        const code = input.inviteCode.trim().toUpperCase();
        const memberInvite = s.invites.find((i) => i.code === code && i.uses < i.maxUses);
        if (!ACTIVE_COMMUNITY.inviteCodes.includes(code) && !memberInvite) throw new Error('Convite inválido ou esgotado.');
        const id = newId();
        const first = input.name.trim().split(/\s+/)[0] ?? 'aluno';
        const user: User = {
          id, communityId: C, name: input.name.trim(), handle: `${first.toLowerCase()}.${id.slice(0, 3)}`, email,
          course: input.course?.trim() || undefined, interests: [],
          color: avatarColors[Crypto.getRandomBytes(1)[0]! % avatarColors.length]!,
          verification: !input.alternativeVerification && isInstitutionalEmail(email) ? 'email' : 'pending',
          // Demo: quem entra com o convite da equipe fundadora vira admin (para testar a moderação).
          role: code === 'FUNDADORES' ? 'admin' : 'member',
          joinedAt: Date.now(),
        };
        setState((x) => ({
          ...x,
          users: { ...x.users, [id]: user },
          invites: x.invites.map((i) => (i.code === code ? { ...i, uses: i.uses + 1 } : i)),
          session: { userId: id },
        }));
        return false;
      },
      async confirmCode(email: string, code: string) {
        const session = await remote.verifyCode(email, code);
        if (session) await load(session.user.id);
      },
      signOut() {
        if (SUPABASE_ENABLED) void remote.signOut().catch(() => {});
        setState((s) => (SUPABASE_ENABLED ? emptyState() : { ...s, session: null }));
      },
      resetDemo() {
        if (!SUPABASE_ENABLED) setState(demoState());
      },
      updateProfile(patch: Partial<Pick<User, 'name' | 'course' | 'semester' | 'interests'>>) {
        local((s, m) => ({ ...s, users: { ...s.users, [m]: { ...s.users[m]!, ...patch } } }));
        sync((m) => remote.updateProfile(m, patch));
      },
      /** Troca (ou remove, com null) a foto de perfil. Mostra na hora; no Supabase, desfaz se o envio falhar. */
      async setAvatar(image: PreparedImage | null) {
        const m = me();
        if (!m) throw new Error('Sem sessão');
        const previous = stateRef.current.users[m]?.avatarUrl;
        const apply = (avatarUrl: string | undefined) =>
          setState((s) => (s.users[m] ? { ...s, users: { ...s.users, [m]: { ...s.users[m]!, avatarUrl } } } : s));
        apply(image?.dataUri);
        if (!SUPABASE_ENABLED) return;
        try {
          await remote.setAvatar(m, newId(), image ? { uri: image.uri, mimeType: image.mimeType } : null);
        } catch (e) {
          apply(previous);
          throw e;
        }
      },
      updateSettings(patch: Partial<Settings>) {
        const cur = stateRef.current.settings;
        const next: Settings = { ...cur, ...patch, notify: { ...cur.notify, ...patch.notify } };
        local((s, m) => ({
          ...s, settings: next,
          users: { ...s.users, [m]: { ...s.users[m]!, profileVisible: next.profileVisible } },
        }));
        sync((m) => remote.updateSettings(m, next));
      },
      async createInvite(): Promise<string> {
        const s = stateRef.current;
        const m = me();
        if (!m) throw new Error('Sem sessão');
        const active = s.invites.filter((i) => i.createdBy === m && i.uses < i.maxUses);
        if (active.length >= 3) throw new Error('Você já tem 3 convites ativos. Espere alguém usar antes de gerar outro.');
        const invite: Invite = { code: inviteCode(), maxUses: 5, uses: 0, createdBy: m, createdAt: Date.now() };
        if (SUPABASE_ENABLED) await remote.createInvite(m, invite);
        setState((x) => ({ ...x, invites: [...x.invites, invite] }));
        return invite.code;
      },
      async requestVerification(image: LocalImage) {
        const m = me();
        if (!m) throw new Error('Sem sessão');
        const req: VerificationRequest = { id: newId(), userId: m, evidence: image.uri, createdAt: Date.now() };
        if (SUPABASE_ENABLED) await remote.requestVerification(m, req, image);
        setState((x) => ({ ...x, verificationRequests: [...x.verificationRequests.filter((v) => v.userId !== m), req] }));
      },

      // ── Feed ──
      addPost(input: { text: string; pollOptions?: string[]; ttlHours?: number; image?: LocalImage; groupId?: ID }) {
        const m = me();
        if (!m) return '';
        const now = Date.now();
        const post: Post = {
          id: newId(), communityId: C, authorId: m, groupId: input.groupId, text: input.text.trim(), createdAt: now,
          expiresAt: input.ttlHours ? now + input.ttlHours * HOUR : undefined,
          imageUrl: input.image?.uri,
          poll: input.pollOptions?.length ? input.pollOptions.map((label) => ({ id: newId(), label, votes: [] })) : undefined,
          likes: [], comments: [],
        };
        setState((s) => ({ ...s, posts: [post, ...s.posts] }));
        sync((mm) => remote.addPost(mm, post, input.image));
        return post.id;
      },
      deletePost(id: ID) {
        local((s, m) => ({ ...s, posts: s.posts.filter((p) => !(p.id === id && p.authorId === m)) }));
        sync(() => remote.deletePost(id));
      },
      toggleLike(postId: ID) {
        const m = me();
        const post = stateRef.current.posts.find((p) => p.id === postId);
        if (!m || !post) return;
        const on = !post.likes.includes(m);
        mapPost(postId, (p) => ({ ...p, likes: toggleIn(p.likes, m) }));
        sync(() => remote.setLike(m, postId, on));
      },
      vote(postId: ID, optionId: ID) {
        const m = me();
        const post = stateRef.current.posts.find((p) => p.id === postId);
        if (!m || !post?.poll) return;
        const current = post.poll.find((o) => o.votes.includes(m))?.id;
        const next = current === optionId ? null : optionId;
        mapPost(postId, (p) => ({
          ...p,
          poll: p.poll?.map((o) => {
            const without = o.votes.filter((v) => v !== m);
            return { ...o, votes: o.id === next ? [...without, m] : without };
          }),
        }));
        sync(() => remote.setVote(m, postId, next));
      },
      addComment(target: 'post' | 'bora', id: ID, text: string) {
        const m = me();
        if (!m) return;
        const comment = mkComment(m, text);
        const add = <T extends { comments: Comment[] }>(x: T): T => ({ ...x, comments: [...x.comments, comment] });
        if (target === 'post') mapPost(id, add);
        else mapBora(id, add);
        sync(() => remote.addComment(m, target, id, comment));
      },

      // ── Eventos ──
      toggleEvent(id: ID, field: 'interested' | 'going') {
        const m = me();
        const ev = stateRef.current.events.find((e) => e.id === id);
        if (!m || !ev) return;
        const next = ev[field].includes(m) ? null : field;
        mapEvent(id, (e) => ({
          ...e,
          interested: next === 'interested' ? [...e.interested.filter((x) => x !== m), m] : e.interested.filter((x) => x !== m),
          going: next === 'going' ? [...e.going.filter((x) => x !== m), m] : e.going.filter((x) => x !== m),
        }));
        sync(() => remote.setAttendance(m, id, next));
      },
      addEvent(input: {
        title: string; category: EventCategory; startsAt: number; endsAt: number;
        location: string; description: string; organizer: string; ticketUrl?: string; groupId?: ID;
      }) {
        const m = me();
        if (!m) return '';
        const event: CampusEvent = { ...input, id: newId(), communityId: C, createdBy: m, interested: [], going: [m] };
        setState((s) => ({ ...s, events: [...s.events, event] }));
        sync((mm) => remote.addEvent(mm, event));
        return event.id;
      },

      // ── Bora? ──
      addBora(input: { activity: string; startsAt: number; meetingPoint: string; visibility: BoraVisibility; capacity?: number }) {
        const m = me();
        if (!m) return '';
        const bora: Bora = { ...input, id: newId(), communityId: C, authorId: m, participants: [m], comments: [], createdAt: Date.now() };
        setState((s) => ({ ...s, boras: [bora, ...s.boras] }));
        sync((mm) => remote.addBora(mm, bora));
        return bora.id;
      },
      toggleBora(id: ID) {
        const m = me();
        const b = stateRef.current.boras.find((x) => x.id === id);
        if (!m || !b || b.authorId === m || b.cancelled) return;
        const joined = b.participants.includes(m);
        if (!joined && b.capacity && b.participants.length >= b.capacity) return;
        mapBora(id, (x) => ({ ...x, participants: toggleIn(x.participants, m) }));
        sync(() => remote.setBoraParticipation(m, id, !joined));
      },
      cancelBora(id: ID) {
        mapBora(id, (b, m) => (b.authorId === m ? { ...b, cancelled: true } : b));
        sync(() => remote.cancelBora(id));
      },

      // ── Conexões ──
      toggleFollow(userId: ID) {
        const m = me();
        if (!m || userId === m) return;
        const on = !(stateRef.current.following[m] ?? []).includes(userId);
        setState((s) => ({ ...s, following: { ...s.following, [m]: toggleIn(s.following[m] ?? [], userId) } }));
        sync(() => remote.setFollow(m, userId, on));
      },

      // ── Comunidades ──
      createGroup(input: { name: string; kind: GroupKind; description: string; color: string }) {
        const m = me();
        if (!m) throw new Error('Sem sessão');
        const name = input.name.trim();
        if (stateRef.current.groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
          throw new Error('Já existe uma comunidade com esse nome.');
        }
        const group: Group = {
          id: newId(), communityId: C, name, kind: input.kind, description: input.description.trim(), color: input.color,
          verified: false, createdBy: m, createdAt: Date.now(), members: { [m]: 'admin' },
        };
        setState((s) => ({ ...s, groups: [...s.groups, group] }));
        sync((mm) => remote.createGroup(mm, group));
        return group.id;
      },
      updateGroup(id: ID, patch: Partial<Pick<Group, 'name' | 'description' | 'color' | 'kind'>>) {
        setState((s) => ({ ...s, groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
        sync(() => remote.updateGroup(id, patch));
      },
      /** Entra ou sai. Lança erro se for o último admin tentando sair. */
      toggleMembership(groupId: ID) {
        const m = me();
        const g = stateRef.current.groups.find((x) => x.id === groupId);
        if (!m || !g) return;
        const role = g.members[m];
        if (role === 'admin' && Object.values(g.members).filter((r) => r === 'admin').length === 1) {
          throw new Error('Você é o único admin. Promova outra pessoa antes de sair.');
        }
        setState((s) => ({
          ...s,
          groups: s.groups.map((x) => {
            if (x.id !== groupId) return x;
            const members = { ...x.members };
            if (role) delete members[m];
            else members[m] = 'membro';
            return { ...x, members };
          }),
        }));
        sync(() => remote.setMembership(m, groupId, !role));
      },
      setMemberRole(groupId: ID, userId: ID, role: GroupRole) {
        const g = stateRef.current.groups.find((x) => x.id === groupId);
        if (!g) return;
        if (role === 'membro' && g.members[userId] === 'admin' && Object.values(g.members).filter((r) => r === 'admin').length === 1) {
          throw new Error('A comunidade precisa de pelo menos um admin.');
        }
        setState((s) => ({
          ...s, groups: s.groups.map((x) => (x.id === groupId ? { ...x, members: { ...x.members, [userId]: role } } : x)),
        }));
        sync(() => remote.setMemberRole(groupId, userId, role));
      },
      removeMember(groupId: ID, userId: ID) {
        setState((s) => ({
          ...s,
          groups: s.groups.map((x) => {
            if (x.id !== groupId) return x;
            const members = { ...x.members };
            delete members[userId];
            return { ...x, members };
          }),
        }));
        sync(() => remote.removeMember(groupId, userId));
      },

      // ── Saídas (combis/ônibus) ──
      addRide(input: Omit<Ride, 'id' | 'communityId' | 'reservations' | 'createdBy' | 'createdAt' | 'cancelled'>) {
        const m = me();
        if (!m) return '';
        const ride: Ride = { ...input, id: newId(), communityId: C, reservations: [], createdBy: m, createdAt: Date.now() };
        setState((s) => ({ ...s, rides: [...s.rides, ride] }));
        sync((mm) => remote.addRide(mm, ride));
        return ride.id;
      },
      toggleRide(id: ID) {
        const m = me();
        const r = stateRef.current.rides.find((x) => x.id === id);
        if (!m || !r || r.cancelled) return;
        const on = !r.reservations.includes(m);
        if (on && r.seats && r.reservations.length >= r.seats) return;
        setState((s) => ({ ...s, rides: s.rides.map((x) => (x.id === id ? { ...x, reservations: toggleIn(x.reservations, m) } : x)) }));
        sync(() => remote.setReservation(m, id, on));
      },
      cancelRide(id: ID) {
        setState((s) => ({ ...s, rides: s.rides.map((x) => (x.id === id ? { ...x, cancelled: true } : x)) }));
        sync(() => remote.cancelRide(id));
      },

      // ── Explorar ──
      addRecommendation(placeId: ID, text: string) {
        const m = me();
        if (!m) return;
        const rec = mkComment(m, text);
        setState((s) => ({
          ...s,
          places: s.places.map((p) => (p.id === placeId ? { ...p, recommendations: [rec, ...p.recommendations] } : p)),
        }));
        sync(() => remote.addRecommendation(m, placeId, rec));
      },

      // ── Segurança ──
      report(input: { targetType: ReportTarget; targetId: ID; reason: string; details?: string }) {
        local((s, m) => ({
          ...s, reports: [...s.reports, { ...input, id: newId(), reporterId: m, createdAt: Date.now(), status: 'aberta' }],
        }));
        sync((m) => remote.report(m, input));
      },
      toggleBlock(userId: ID) {
        const m = me();
        if (!m || userId === m) return;
        const on = !stateRef.current.blocked.includes(userId);
        setState((s) => ({ ...s, blocked: toggleIn(s.blocked, userId) }));
        sync(() => remote.setBlock(m, userId, on));
      },

      // ── Moderação ──
      removeContent(type: RemovableTarget, id: ID) {
        setState((s) => {
          const dropComment = <T extends { comments: Comment[] }>(x: T): T => ({ ...x, comments: x.comments.filter((c) => c.id !== id) });
          switch (type) {
            case 'post': return { ...s, posts: s.posts.filter((p) => p.id !== id) };
            case 'bora': return { ...s, boras: s.boras.filter((b) => b.id !== id) };
            case 'evento': return { ...s, events: s.events.filter((e) => e.id !== id) };
            case 'comentario': return { ...s, posts: s.posts.map(dropComment), boras: s.boras.map(dropComment) };
            case 'recomendacao':
              return { ...s, places: s.places.map((p) => ({ ...p, recommendations: p.recommendations.filter((r) => r.id !== id) })) };
            case 'comunidade':
              return {
                ...s,
                groups: s.groups.filter((g) => g.id !== id),
                posts: s.posts.filter((p) => p.groupId !== id),
                events: s.events.filter((e) => e.groupId !== id),
                rides: s.rides.filter((r) => r.groupId !== id),
              };
            case 'saida': return { ...s, rides: s.rides.map((r) => (r.id === id ? { ...r, cancelled: true } : r)) };
          }
        });
        sync(() => remote.removeContent(type, id));
      },
      resolveReport(id: ID, status: 'resolvida' | 'descartada') {
        setState((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, status } : r)) }));
        sync((m) => remote.resolveReport(m, id, status));
      },
      reviewVerification(userId: ID, approve: boolean) {
        setState((s) => {
          const u = s.users[userId];
          return {
            ...s,
            users: u ? { ...s.users, [userId]: { ...u, verification: approve ? 'manual' : 'rejected' } } : s.users,
            verificationRequests: s.verificationRequests.filter((v) => v.userId !== userId),
          };
        });
        sync(() => remote.reviewVerification(userId, approve));
      },
    };
  }, [load, refresh]);

  const me = state.session ? state.users[state.session.userId] : undefined;
  const isVisible = useCallback((authorId: ID) => !state.blocked.includes(authorId), [state.blocked]);

  return {
    ...state, hydrated, error, refreshing, me, actions, isVisible,
    community: ACTIVE_COMMUNITY as Community,
    backend: SUPABASE_ENABLED ? ('supabase' as const) : ('demo' as const),
  };
}

type Store = ReturnType<typeof useCampusState>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useCampusState();
  if (!store.hydrated) return null;
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}

const SIGNED_OUT: User = {
  id: '__signed_out__', communityId: C, name: 'Visitante', handle: 'visitante',
  interests: [], color: '#9AA0AE', verification: 'pending', role: 'member', joinedAt: 0,
};

/**
 * Usuário logado. As telas protegidas só existem com sessão ativa; o fallback cobre
 * o instante em que uma tela ainda está desmontando após o logout.
 */
export function useMe(): User {
  return useStore().me ?? SIGNED_OUT;
}

export function canPublish(user: User | undefined) {
  return user?.verification === 'email' || user?.verification === 'manual';
}

export function isModerator(user: User | undefined) {
  return user?.role === 'moderator' || user?.role === 'admin';
}
