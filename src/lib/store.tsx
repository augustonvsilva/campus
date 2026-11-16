// Estado do app + ações.
// Dois modos, com a mesma interface para as telas:
//  • Supabase (EXPO_PUBLIC_SUPABASE_* definidos): atualização otimista local + sincronização remota,
//    recarga em tempo real e ao voltar para o app.
//  • Demonstração: tudo local (AsyncStorage) a partir de dados fictícios.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, AppState } from 'react-native';

import { applyTheme, avatarColors, resolveTheme, type ThemePreference } from '@/theme';
import { deriveDemoActivity } from './activity';
import { ACTIVE_COMMUNITY, isInstitutionalEmail } from './community';
import { handleProblem, normalizeHandle, passwordProblem } from './handle';
import type { PreparedImage } from './images';
import * as remote from './remote';
import { seedData } from './seed';
import { supabase, SUPABASE_ENABLED } from './supabase';
import { HOUR } from './time';
import type {
  Activity, Bora, BoraVisibility, Message, CampusEvent, Comment, CommentTarget, Community, EventCategory, Group, GroupKind, GroupRole, ID, Invite, Place,
  Post, RemovableTarget, Report, ReportTarget, Ride, Settings, User, VerificationRequest,
} from './types';

export { SUPABASE_ENABLED };
export type LocalImage = remote.LocalImage;

const STORAGE_KEY = 'campus:state:v3';
/** Preferências deste aparelho (valem nos dois modos): última visita à atividade e boas-vindas concluídas. */
const PREFS_KEY = 'campus:prefs:v1';

interface Prefs {
  activitySeenAt: Record<ID, number>;
  onboarded: Record<ID, boolean>;
  /** Aparência: escuro, claro ou seguir o sistema (vale para o aparelho, não para a conta). */
  theme: ThemePreference;
}
const defaultPrefs: Prefs = { activitySeenAt: {}, onboarded: {}, theme: 'dark' };
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
  /** Só na demo: hash da senha de cada conta criada no aparelho. No Supabase, a senha fica no Auth. */
  passwords: Record<ID, string>;
  /** Supabase: central de atividade (my_activity). Na demo é derivada na hora. */
  activity: Activity[];
  /** Mensagens privadas: só na demo, guardadas no aparelho. */
  messages: Message[];
}

/** Mensagens privadas existem só no modo demonstração (ainda não há tabela/RLS no banco). */
export const MESSAGES_ENABLED = !SUPABASE_ENABLED;

/** Demo: respostas automáticas de quem é da comunidade fictícia, para a conversa parecer viva. */
const DEMO_REPLIES = [
  'Opa! Vi agora 👀',
  'Bora! Que horas você pensou?',
  'Fechado, te encontro no portão principal.',
  'Haha, verdade. Depois me conta como foi!',
  'Não vou conseguir hoje, mas me chama na próxima 🙌',
];

const defaultSettings: Settings = {
  notify: { boras: true, eventos: true, comentarios: true },
  profileVisible: true,
  showBoraParticipation: true,
};

const emptyState = (): State => ({
  session: null, users: {}, posts: [], events: [], boras: [], places: [], reports: [], blocked: [],
  invites: [], verificationRequests: [], settings: defaultSettings, groups: [], rides: [], following: {}, passwords: {}, activity: [], messages: [],
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

/** Demo: remove a conta e o que ela criou, com as mesmas regras do banco (migration 0007). */
function withoutUser(s: State, m: ID): State {
  const notMe = (ids: ID[]) => ids.filter((id) => id !== m);
  const noComments = <T extends { comments: Comment[] }>(x: T): T => ({ ...x, comments: x.comments.filter((c) => c.authorId !== m) });
  const users = { ...s.users };
  delete users[m];
  const passwords = { ...s.passwords };
  delete passwords[m];
  const following: Record<ID, ID[]> = {};
  for (const [who, list] of Object.entries(s.following)) if (who !== m) following[who] = notMe(list);
  const groups = s.groups.flatMap((g) => {
    if (!g.members[m]) return [g];
    const members = { ...g.members };
    delete members[m];
    const others = Object.keys(members);
    if (!others.length) return [];
    // Era o único admin: o membro mais antigo (primeiro da lista) assume.
    if (g.members[m] === 'admin' && !others.some((id) => members[id] === 'admin')) members[others[0]!] = 'admin';
    return [{ ...g, members }];
  });
  const groupIds = new Set(groups.map((g) => g.id));
  return {
    ...s,
    session: null,
    users,
    passwords,
    following,
    groups,
    posts: s.posts.filter((p) => p.authorId !== m && (!p.groupId || groupIds.has(p.groupId))).map((p) => noComments({
      ...p, likes: notMe(p.likes), poll: p.poll?.map((o) => ({ ...o, votes: notMe(o.votes) })),
    })),
    boras: s.boras.filter((b) => b.authorId !== m).map((b) => noComments({ ...b, participants: notMe(b.participants) })),
    events: s.events.filter((e) => !e.groupId || groupIds.has(e.groupId))
      .map((e) => ({ ...e, interested: notMe(e.interested), going: notMe(e.going) })),
    rides: s.rides.filter((r) => groupIds.has(r.groupId)).map((r) => noComments({ ...r, reservations: notMe(r.reservations) })),
    places: s.places.map((pl) => ({ ...pl, recommendations: pl.recommendations.filter((r) => r.authorId !== m) })),
    reports: s.reports.filter((r) => r.reporterId !== m),
    invites: s.invites.filter((i) => i.createdBy !== m),
    verificationRequests: s.verificationRequests.filter((v) => v.userId !== m),
    blocked: notMe(s.blocked),
    messages: s.messages.filter((x) => x.fromId !== m && x.toId !== m),
  };
}

export type SignInInput =
  | { mode: 'signup'; name: string; handle: string; email: string; password: string; course: string; semester: string; inviteCode: string }
  | { mode: 'login'; email: string; password: string }
  /** Entrar com código por e-mail (esqueci a senha / conta sem senha). */
  | { mode: 'code'; email: string };

/** Demo: hash da senha (nunca guardamos a senha em texto, nem no aparelho). */
const demoHash = (userId: ID, password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${userId}:${password}`);

function useCampusState() {
  const [state, setState] = useState<State>(SUPABASE_ENABLED ? emptyState : demoState);
  const [hydrated, setHydrated] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [prefsReady, setPrefsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const stateRef = useRef(state);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Supabase: senha escolhida no cadastro, gravada assim que o código do e-mail é confirmado. */
  const pendingPassword = useRef<string | null>(null);
  /** Demo: código de verificação pendente (no Supabase, ele só existe no banco e no e-mail). */
  const demoCode = useRef<{ email: string; code: string } | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Carregamento remoto ──
  const load = useCallback(async (userId: ID) => {
    setRefreshing(true);
    try {
      const [snap, activity] = await Promise.all([
        remote.fetchSnapshot(userId),
        // A atividade não pode derrubar o app (ex.: migration 0008 ainda não aplicada).
        remote.fetchActivity().catch(() => [] as Activity[]),
      ]);
      setState((s) => ({ ...s, ...snap, activity, session: { userId } }));
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
          if (!raw) return;
          const saved = JSON.parse(raw) as Partial<State>;
          // Dados salvos por versões anteriores: saídas ainda sem conversa.
          if (saved.rides) saved.rides = saved.rides.map((r) => ({ ...r, comments: r.comments ?? [] }));
          saved.messages = saved.messages ?? [];
          setState({ ...demoState(), ...saved });
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

  // ── Preferências do aparelho ──
  // O tema é aplicado antes da primeira tela aparecer (o app só renderiza com prefsReady).
  const [themeKey, setThemeKey] = useState(0);
  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) };
        applyTheme(resolveTheme(saved.theme));
        setPrefs(saved);
      })
      .catch(() => {})
      .finally(() => setPrefsReady(true));
  }, []);
  // "Seguir o sistema": acompanha a troca de claro/escuro do aparelho.
  useEffect(() => {
    if (prefs.theme !== 'system') return;
    const sub = Appearance.addChangeListener(() => {
      applyTheme(resolveTheme('system'));
      setThemeKey((k) => k + 1);
    });
    return () => sub.remove();
  }, [prefs.theme]);
  useEffect(() => {
    if (prefsReady) AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs, prefsReady]);

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
    const mapRide = (id: ID, fn: (r: Ride, me: ID) => Ride) =>
      local((s, m) => ({ ...s, rides: s.rides.map((r) => (r.id === id ? fn(r, m) : r)) }));
    /** Aplica fn à lista de comentários do alvo (post, Bora? ou saída). */
    const mapThread = (target: CommentTarget, id: ID, fn: (c: Comment[], me: ID) => Comment[]) => {
      if (target === 'post') mapPost(id, (p, m) => ({ ...p, comments: fn(p.comments, m) }));
      else if (target === 'bora') mapBora(id, (b, m) => ({ ...b, comments: fn(b.comments, m) }));
      else mapRide(id, (r, m) => ({ ...r, comments: fn(r.comments, m) }));
    };
    const mkComment = (authorId: ID, text: string): Comment => ({ id: newId(), authorId, text: text.trim(), createdAt: Date.now() });

    /** Valida formato e disponibilidade do nome de usuário; devolve normalizado ou lança com a mensagem para o usuário. */
    const checkHandle = async (raw: string): Promise<string> => {
      const problem = handleProblem(raw);
      if (problem) throw new Error(problem);
      const handle = normalizeHandle(raw);
      const m = me();
      const free = SUPABASE_ENABLED
        ? await remote.handleAvailable(handle)
        : !Object.values(stateRef.current.users).some((u) => u.id !== m && u.handle === handle);
      if (!free) throw new Error('Esse nome de usuário já está em uso. Escolha outro.');
      return handle;
    };

    const setPref = <K extends 'activitySeenAt' | 'onboarded'>(key: K, value: Prefs[K][ID]) => {
      const m = me();
      if (m) setPrefs((p) => ({ ...p, [key]: { ...p[key], [m]: value } }));
    };

    return {
      clearError: () => setError(null),
      /** Marca a atividade como vista (zera o contador do sino). */
      markActivitySeen: () => setPref('activitySeenAt', Date.now()),
      /** Conclui a tela de boas-vindas. */
      finishOnboarding: () => setPref('onboarded', true),
      /** Troca a aparência (escuro, claro ou sistema) e redesenha o app. */
      setTheme(pref: ThemePreference) {
        applyTheme(resolveTheme(pref));
        setPrefs((p) => ({ ...p, theme: pref }));
        setThemeKey((k) => k + 1);
      },
      checkHandle,
      refresh,

      // ── Conta ──
      /** Retorna true quando é preciso digitar o código enviado por e-mail (modo Supabase). */
      async startSignIn(input: SignInInput): Promise<boolean> {
        if (input.mode === 'signup') {
          const problem = passwordProblem(input.password);
          if (problem) throw new Error(problem);
        }
        const handle = input.mode === 'signup' ? await checkHandle(input.handle) : '';
        if (SUPABASE_ENABLED) {
          if (input.mode === 'login') {
            const session = await remote.signInWithPassword(input.email, input.password);
            if (session) await load(session.user.id);
            return false;
          }
          pendingPassword.current = input.mode === 'signup' ? input.password : null;
          await remote.requestCode(input.email, input.mode === 'signup'
            ? { name: input.name, handle, course: input.course, semester: input.semester, inviteCode: input.inviteCode } : undefined);
          return true;
        }
        const s = stateRef.current;
        const email = input.email.trim().toLowerCase();
        if (input.mode !== 'signup') {
          const user = Object.values(s.users).find((u) => u.email === email);
          if (!user) throw new Error('Não encontramos uma conta com esse e-mail neste aparelho.');
          // Demo: "entrar com código" entra direto (não há envio de e-mail).
          if (input.mode === 'login') {
            const saved = s.passwords[user.id];
            if (!saved) throw new Error('Essa conta ainda não tem senha. Use "Esqueci a senha" para entrar com código e criar uma.');
            if (saved !== await demoHash(user.id, input.password)) throw new Error('E-mail ou senha incorretos.');
          }
          setState((x) => ({ ...x, session: { userId: user.id } }));
          return false;
        }
        const code = input.inviteCode.trim().toUpperCase();
        const memberInvite = s.invites.find((i) => i.code === code && i.uses < i.maxUses);
        if (!ACTIVE_COMMUNITY.inviteCodes.includes(code) && !memberInvite) throw new Error('Convite inválido ou esgotado.');
        const id = newId();
        // Entrou direto com o e-mail institucional (e ele não verificou outra conta): já nasce verificado.
        const institutional = isInstitutionalEmail(email) && !Object.values(s.users).some((u) => u.institutionalEmail === email);
        const user: User = {
          id, communityId: C, name: input.name.trim(), handle, email,
          course: input.course.trim(), semester: input.semester, interests: [],
          color: avatarColors[Crypto.getRandomBytes(1)[0]! % avatarColors.length]!,
          verification: institutional ? 'email' : 'pending',
          institutionalEmail: institutional ? email : undefined,
          // Demo: quem entra com o convite da equipe fundadora vira admin (para testar a moderação).
          role: code === 'FUNDADORES' ? 'admin' : 'member',
          joinedAt: Date.now(),
        };
        const passwordHash = await demoHash(id, input.password);
        setState((x) => ({
          ...x,
          users: { ...x.users, [id]: user },
          passwords: { ...x.passwords, [id]: passwordHash },
          // Demo: a Ana manda as boas-vindas por mensagem privada.
          messages: x.users.u_ana ? [...x.messages, {
            id: newId(), fromId: 'u_ana', toId: id, createdAt: Date.now(),
            text: `Oi, ${input.name.trim().split(/\s+/)[0]}! Vi que você chegou no Campus. Hoje tem futsal às 19h, se quiser colar é só entrar no Bora?.`,
          }] : x.messages,
          // Demo: duas pessoas da comunidade seguem quem chega, para a central de atividade ter o que mostrar.
          following: Object.fromEntries(Object.entries(x.following).map(([f, list]) =>
            [f, ['u_ana', 'u_bruno'].includes(f) ? [...list, id] : list])),
          invites: x.invites.map((i) => (i.code === code ? { ...i, uses: i.uses + 1 } : i)),
          session: { userId: id },
        }));
        return false;
      },
      /** Confirma o código do e-mail. Grava a senha do cadastro ou a nova senha de "Esqueci a senha". */
      async confirmCode(email: string, code: string, newPassword?: string) {
        const session = await remote.verifyCode(email, code);
        const password = newPassword || pendingPassword.current;
        pendingPassword.current = null;
        if (!session) return;
        if (password) {
          // Se falhar, a pessoa já está logada: avisa e segue (dá para criar a senha no perfil).
          await remote.setPassword(password).catch((e) =>
            setError(`Você entrou, mas a senha não foi salva: ${errorMessage(e)} Crie uma no perfil.`));
        }
        await load(session.user.id);
      },
      /**
       * Exclui a conta e todos os dados dela (LGPD). No Supabase, a Edge Function `excluir-conta`
       * apaga arquivos, passa a administração de comunidades e remove o usuário (o banco apaga o resto).
       */
      async deleteAccount() {
        const m = me();
        if (!m) throw new Error('Sem sessão');
        if (SUPABASE_ENABLED) {
          await remote.deleteAccount();
          await remote.signOut().catch(() => {});
          setState(emptyState());
          return;
        }
        setState((s) => withoutUser(s, m));
      },
      // ── Mensagens privadas (demo) ──
      sendMessage(toId: ID, text: string) {
        const m = me();
        const body = text.trim();
        if (!m || !body || !MESSAGES_ENABLED) return;
        if (stateRef.current.blocked.includes(toId)) throw new Error('Você bloqueou essa pessoa. Desbloqueie no perfil para conversar.');
        const msg: Message = { id: newId(), fromId: m, toId, text: body.slice(0, 1000), createdAt: Date.now() };
        setState((s) => ({ ...s, messages: [...s.messages, msg] }));
        // Pessoas fictícias da demo respondem sozinhas depois de um instante.
        if (toId.startsWith('u_')) {
          setTimeout(() => {
            setState((s) => {
              const sent = s.messages.filter((x) => x.fromId === m && x.toId === toId).length;
              const reply: Message = { id: newId(), fromId: toId, toId: m, text: DEMO_REPLIES[(sent - 1) % DEMO_REPLIES.length]!, createdAt: Date.now() };
              return s.session?.userId === m ? { ...s, messages: [...s.messages, reply] } : s;
            });
          }, 1500);
        }
      },
      /** Marca como lidas as mensagens recebidas dessa pessoa. */
      markConversationRead(otherId: ID) {
        const m = me();
        if (!m || !stateRef.current.messages.some((x) => x.fromId === otherId && x.toId === m && !x.readAt)) return;
        const now = Date.now();
        setState((s) => ({ ...s, messages: s.messages.map((x) => (x.fromId === otherId && x.toId === m && !x.readAt ? { ...x, readAt: now } : x)) }));
      },
      /** Cria ou troca a senha da conta logada. */
      async setPassword(password: string) {
        const problem = passwordProblem(password);
        if (problem) throw new Error(problem);
        const m = me();
        if (!m) throw new Error('Sem sessão');
        if (SUPABASE_ENABLED) return remote.setPassword(password);
        const hash = await demoHash(m, password);
        setState((x) => ({ ...x, passwords: { ...x.passwords, [m]: hash } }));
      },
      signOut() {
        if (SUPABASE_ENABLED) void remote.signOut().catch(() => {});
        setState((s) => (SUPABASE_ENABLED ? emptyState() : { ...s, session: null }));
      },
      resetDemo() {
        if (!SUPABASE_ENABLED) setState(demoState());
      },
      updateProfile(patch: Partial<Pick<User, 'name' | 'handle' | 'course' | 'semester' | 'interests'>>) {
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
      /**
       * Envia um código de 6 dígitos para o e-mail institucional informado.
       * Na demo não há envio: o código volta em `demoCode` para ser mostrado na tela.
       */
      async requestInstitutionalCode(rawEmail: string): Promise<{ demoCode?: string }> {
        const email = rawEmail.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Digite um e-mail válido.');
        if (!isInstitutionalEmail(email)) {
          throw new Error(`Use um e-mail institucional (@${ACTIVE_COMMUNITY.emailDomains.join(' ou @')}).`);
        }
        if (SUPABASE_ENABLED) {
          await remote.requestInstitutionalCode(email);
          return {};
        }
        const m = me();
        if (Object.values(stateRef.current.users).some((u) => u.id !== m && u.institutionalEmail === email)) {
          throw new Error('Esse e-mail institucional já confirmou outra conta. Se ela não é sua, fale com a equipe.');
        }
        const code = String(Crypto.getRandomBytes(3).reduce((n, b) => n * 256 + b, 0) % 1000000).padStart(6, '0');
        demoCode.current = { email, code };
        return { demoCode: code };
      },
      async confirmInstitutionalCode(code: string) {
        const m = me();
        if (!m) throw new Error('Sem sessão');
        if (SUPABASE_ENABLED) {
          await remote.confirmInstitutionalCode(code);
          await load(m);
          return;
        }
        const pending = demoCode.current;
        if (!pending) throw new Error('Peça um código primeiro.');
        if (pending.code !== code.trim()) throw new Error('Código incorreto. Confira e tente de novo.');
        demoCode.current = null;
        setState((s) => ({
          ...s,
          users: { ...s.users, [m]: { ...s.users[m]!, verification: 'email', institutionalEmail: pending.email } },
          verificationRequests: s.verificationRequests.filter((v) => v.userId !== m),
        }));
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
      addComment(target: CommentTarget, id: ID, text: string) {
        const m = me();
        if (!m) return;
        const comment = mkComment(m, text);
        mapThread(target, id, (list) => [...list, comment]);
        sync(() => remote.addComment(m, target, id, comment));
      },
      /** Edita o texto do próprio comentário. */
      editComment(target: CommentTarget, parentId: ID, commentId: ID, text: string) {
        const body = text.trim();
        if (!body) return;
        mapThread(target, parentId, (list, m) =>
          list.map((c) => (c.id === commentId && c.authorId === m ? { ...c, text: body, editedAt: Date.now() } : c)));
        sync(() => remote.updateComment(commentId, body));
      },
      deleteComment(target: CommentTarget, parentId: ID, commentId: ID) {
        mapThread(target, parentId, (list, m) => list.filter((c) => !(c.id === commentId && c.authorId === m)));
        sync(() => remote.deleteComment(commentId));
      },
      /** Edita o texto da própria publicação. */
      editPost(id: ID, text: string) {
        const body = text.trim();
        if (!body) return;
        mapPost(id, (p, m) => (p.authorId === m ? { ...p, text: body, editedAt: Date.now() } : p));
        sync(() => remote.updatePost(id, body));
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
      addRide(input: Omit<Ride, 'id' | 'communityId' | 'reservations' | 'createdBy' | 'createdAt' | 'cancelled' | 'comments'> & { comments?: Comment[] }) {
        const m = me();
        if (!m) return '';
        const ride: Ride = { ...input, comments: [], id: newId(), communityId: C, reservations: [], createdBy: m, createdAt: Date.now() };
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
            case 'comentario': return { ...s, posts: s.posts.map(dropComment), boras: s.boras.map(dropComment), rides: s.rides.map(dropComment) };
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

  const activity = useMemo(() => {
    if (!me) return [];
    const list = SUPABASE_ENABLED ? state.activity : deriveDemoActivity(state, me.id);
    return list.filter((a) => !state.blocked.includes(a.actorId) && state.users[a.actorId]);
  }, [state, me]);
  const activitySeenAt = me ? prefs.activitySeenAt[me.id] ?? 0 : 0;
  const unreadActivity = activity.filter((a) => a.at > activitySeenAt).length;
  const onboarded = me ? !!prefs.onboarded[me.id] : true;

  // Conversas privadas: uma por pessoa, a mais recente primeiro. Quem está bloqueado some.
  const conversations = useMemo(() => {
    if (!me || !MESSAGES_ENABLED) return [];
    const byPeer = new Map<ID, { peerId: ID; last: Message; unread: number }>();
    for (const msg of state.messages) {
      if (msg.fromId !== me.id && msg.toId !== me.id) continue;
      const peerId = msg.fromId === me.id ? msg.toId : msg.fromId;
      if (state.blocked.includes(peerId) || !state.users[peerId]) continue;
      const c = byPeer.get(peerId) ?? { peerId, last: msg, unread: 0 };
      if (msg.createdAt >= c.last.createdAt) c.last = msg;
      if (msg.toId === me.id && !msg.readAt) c.unread++;
      byPeer.set(peerId, c);
    }
    return [...byPeer.values()].sort((a, b) => b.last.createdAt - a.last.createdAt);
  }, [state.messages, state.blocked, state.users, me]);
  const unreadMessages = conversations.reduce((n, c) => n + c.unread, 0);

  return {
    ...state, hydrated: hydrated && prefsReady, error, refreshing, me, actions, isVisible,
    activity, activitySeenAt, unreadActivity, onboarded, themePref: prefs.theme, themeKey, conversations, unreadMessages, messagesEnabled: MESSAGES_ENABLED,
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
