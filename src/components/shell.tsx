// Layout de computador: menu lateral, barra superior (busca, mensagens, atividade, perfil)
// e coluna da direita (em alta + pessoas da comunidade). No celular nada disso aparece.
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { canPublish, useMe, useStore } from '@/lib/store';
import { useNow } from '@/lib/time';
import { colors, glow, radius, themeMode } from '@/theme';
import { Avatar, BrandWatermark, CampusLogo, IconName, styles } from './ui';

const DAY = 86_400_000;

interface NavItem { label: string; icon: IconName; href: string; match: (path: string) => boolean; badge?: number }

function NavLink({ item }: { item: NavItem }) {
  const path = usePathname();
  const active = item.match(path);
  return (
    <Pressable
      onPress={() => router.push(item.href as never)}
      accessibilityRole="link"
      accessibilityLabel={item.badge ? `${item.label}, ${item.badge} novidades` : item.label}
      accessibilityState={{ selected: active }}
      style={(state) => {
        // "hovered" existe no navegador (react-native-web), mas não está nos tipos do React Native.
        const { hovered, pressed } = state as typeof state & { hovered?: boolean };
        return [
        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
        active && { backgroundColor: colors.navActiveBg, borderColor: colors.navActiveBorder },
        !active && (hovered || pressed) && { backgroundColor: colors.surface },
        ];
      }}>
      <Ionicons name={item.icon} size={22} color={active ? colors.text : colors.muted} />
      <Text style={{ flex: 1, color: active ? colors.text : colors.navText, fontSize: 16, fontWeight: active ? '800' : '600' }}>{item.label}</Text>
      {item.badge ? (
        <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text style={{ color: colors.onAccent, fontSize: 11, fontWeight: '900' }}>{item.badge > 99 ? '99+' : item.badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Sidebar() {
  const { community, unreadActivity, unreadMessages, messagesEnabled, ticketsEnabled } = useStore();
  const items: NavItem[] = [
    { label: 'Início', icon: 'home', href: '/', match: (p) => p === '/' },
    { label: 'Explorar', icon: 'compass-outline', href: '/explorar', match: (p) => p.startsWith('/explorar') || p.startsWith('/lugar') },
    { label: 'Notificações', icon: 'notifications-outline', href: '/atividade', match: (p) => p.startsWith('/atividade'), badge: unreadActivity },
    ...(messagesEnabled ? [{ label: 'Mensagens', icon: 'mail-outline' as IconName, href: '/mensagens', match: (p: string) => p.startsWith('/mensagens'), badge: unreadMessages }] : []),
    { label: 'Eventos', icon: 'calendar-outline', href: '/eventos', match: (p) => p.startsWith('/eventos') || p.startsWith('/evento/') },
    ...(ticketsEnabled ? [{ label: 'Ingressos', icon: 'ticket-outline' as IconName, href: '/ingressos', match: (p: string) => p.startsWith('/ingressos') }] : []),
    { label: 'Agora', icon: 'flash-outline', href: '/agora', match: (p) => p.startsWith('/agora') || p.startsWith('/bora') },
    { label: 'Comunidades', icon: 'people-outline', href: '/explorar?aba=comunidades', match: (p) => p.startsWith('/comunidade') },
    { label: 'Configurações', icon: 'settings-outline', href: '/perfil', match: (p) => p.startsWith('/perfil') },
  ];
  return (
    <View style={{ width: 290, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.glass }}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 22, flexGrow: 1 }}>
        <Pressable onPress={() => router.push('/')} accessibilityRole="link" accessibilityLabel="Campus, início" style={[styles.row, { gap: 14 }]}>
          <CampusLogo size={58} />
          <View>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>Campus</Text>
            <Text style={styles.muted}>Comunidade · {community.shortName}</Text>
          </View>
        </Pressable>
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={{ gap: 4 }}>{items.map((i) => <NavLink key={i.label} item={i} />)}</View>
        <Pressable
          onPress={() => router.push('/criar')}
          accessibilityRole="button"
          accessibilityLabel="Criar publicação, Bora? ou evento"
          style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.pill, backgroundColor: colors.accent, ...glow(pressed ? 0.4 : 0.9) }]}>
          <Ionicons name="add" size={22} color={colors.onAccent} />
          <Text style={{ color: colors.onAccent, fontSize: 16, fontWeight: '900' }}>Criar</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <InviteCard />
      </ScrollView>
    </View>
  );
}

/** Cartão de convite no pé do menu (no lugar da foto institucional do modelo). */
function InviteCard() {
  return (
    <Pressable onPress={() => router.push('/perfil')} accessibilityRole="link" accessibilityLabel="Convidar amigos para o Campus"
      style={{ borderRadius: radius.lg, padding: 18, gap: 6, backgroundColor: colors.inviteBg, borderWidth: 1, borderColor: colors.navActiveBorder, overflow: 'hidden' }}>
      <BrandWatermark size={150} opacity={0.18} style={{ right: -36, top: -30 }} />
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>Campus</Text>
      <Text style={styles.body}>Mais que uma rede,{'\n'}a sua turma.</Text>
      <View style={[styles.row, { justifyContent: 'space-between', marginTop: 4 }]}>
        <Text style={[styles.label, { color: colors.accentSoft }]}>Convide amigos</Text>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...glow(0.8) }}>
          <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
        </View>
      </View>
    </Pressable>
  );
}

function TopIcon({ icon, label, badge, onPress }: { icon: IconName; label: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={badge ? `${label}, ${badge} novidades` : label} hitSlop={8}
      style={(state) => [
        { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
        (state as typeof state & { hovered?: boolean }).hovered && { backgroundColor: colors.surface },
      ]}>
      <Ionicons name={icon} size={24} color={colors.text} />
      {badge ? <View style={[styles.badgeDot, { top: 4, right: 4 }]}><Text style={styles.badgeDotText}>{badge > 9 ? '9+' : badge}</Text></View> : null}
    </Pressable>
  );
}

export function TopBar() {
  const { me, unreadActivity, unreadMessages, messagesEnabled } = useStore();
  return (
    <View style={[styles.row, { paddingHorizontal: 24, paddingVertical: 16, gap: 14 }]}>
      <Pressable onPress={() => router.push('/buscar')} accessibilityRole="search" accessibilityLabel="Buscar na rede"
        style={{ flex: 1, maxWidth: 640, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <Text style={{ color: colors.muted, fontSize: 16 }}>Buscar na rede…</Text>
      </Pressable>
      <View style={{ flex: 1 }} />
      {messagesEnabled ? <TopIcon icon="chatbox-ellipses-outline" label="Mensagens" badge={unreadMessages} onPress={() => router.push('/mensagens')} /> : null}
      <TopIcon icon="notifications-outline" label="Atividade" badge={unreadActivity} onPress={() => router.push('/atividade')} />
      <Pressable onPress={() => router.push('/perfil')} accessibilityRole="button" accessibilityLabel="Abrir perfil">
        <Avatar user={me} size={46} />
        <View style={{ position: 'absolute', right: 0, bottom: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: colors.online, borderWidth: 2, borderColor: colors.bg }} />
      </Pressable>
    </View>
  );
}

function RailCard({ title, icon, iconColor, right, children }: { title: string; icon: IconName; iconColor?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={[styles.card, { gap: 14 }]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={[styles.row, { gap: 8 }]}>
          <Ionicons name={icon} size={20} color={iconColor ?? colors.accentSoft} />
          <Text style={[styles.title, { fontSize: 17 }]}>{title}</Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

/** Coluna da direita: o que mais movimentou a semana e as pessoas da comunidade. Só dados reais. */
export function RightRail() {
  const { posts, events, users, isVisible, community } = useStore();
  const me = useMe();
  const now = useNow(60_000);

  const hot = [
    ...posts.filter((p) => isVisible(p.authorId) && p.createdAt > now - 7 * DAY && (!p.expiresAt || p.expiresAt > now))
      .map((p) => ({ key: p.id, title: p.text, score: p.likes.length + p.comments.length * 2, href: `/post/${p.id}`, unit: 'interações', n: p.likes.length + p.comments.length })),
    ...events.filter((e) => e.endsAt > now)
      .map((e) => ({ key: e.id, title: e.title, score: e.going.length * 2 + e.interested.length, href: `/evento/${e.id}`, unit: 'confirmados', n: e.going.length })),
  ].filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

  const people = Object.values(users).filter((u) => u.communityId === community.id && u.id !== me.id && isVisible(u.id));
  const shown = people.slice(0, 4);

  return (
    <View style={{ width: 330, paddingTop: 96, paddingRight: 24, gap: 18 }}>
      <RailCard title="Em alta" icon="flame" iconColor="#FF7A45"
        right={<Text style={[styles.label, { color: colors.accentSoft }]} onPress={() => router.push('/buscar')}>Ver mais →</Text>}>
        {hot.length ? hot.map((h, i) => (
          <Pressable key={h.key} onPress={() => router.push(h.href as never)} accessibilityRole="link" style={[styles.row, { alignItems: 'flex-start', gap: 14 }]}>
            <Text style={{ color: colors.muted, fontSize: 18, fontWeight: '800', width: 16 }}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.label} numberOfLines={1}>{h.title}</Text>
              <Text style={styles.hint}>{h.n} {h.unit}</Text>
            </View>
          </Pressable>
        )) : <Text style={styles.muted}>Ainda não há nada em alta esta semana.</Text>}
      </RailCard>

      <RailCard title="Na comunidade" icon="ellipse" iconColor={colors.online}
        right={<Text style={[styles.label, { color: colors.accentSoft }]} numberOfLines={1}>{people.length + 1} {people.length ? 'pessoas' : 'pessoa'}</Text>}>
        <Pressable onPress={() => router.push({ pathname: '/explorar', params: { aba: 'pessoas' } })} accessibilityRole="link"
          accessibilityLabel="Ver pessoas da comunidade" style={[styles.row, { gap: 0 }]}>
          {shown.map((u, i) => (
            <View key={u.id} style={{ marginLeft: i ? -8 : 0, borderRadius: 99, borderWidth: 2, borderColor: colors.surface }}>
              <Avatar user={u} size={46} />
            </View>
          ))}
          {people.length > shown.length ? (
            <View style={{ marginLeft: -8, width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.label, { color: colors.text }]}>+{people.length - shown.length}</Text>
            </View>
          ) : null}
        </Pressable>
        {!canPublish(me) ? <Text style={styles.hint}>Confirme seu vínculo para interagir com todo mundo.</Text> : null}
      </RailCard>
    </View>
  );
}

/**
 * Celular: as telas cobrem tudo, então o logo fica por cima como marca d'água
 * (bem transparente e sem bloquear toques).
 */
export function MobileWatermark() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <BrandWatermark size={440} opacity={themeMode() === 'light' ? 0.06 : 0.08} style={{ right: -120, bottom: 70 }} />
    </View>
  );
}

/** Fundo do computador: brilho suave e o logo do Campus em marca d'água bem visível. */
export function BackgroundGlow() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: -140, left: 160, width: 240, height: 240, borderRadius: 120, backgroundColor: `rgba(${colors.glowRgb},0.06)`, boxShadow: `0 0 220px 150px rgba(${colors.glowRgb},0.07)` }} />
      {/* O logo do Campus, grande e apagado, ao fundo (como a marca d'água do modelo). */}
      <BrandWatermark size={860} opacity={themeMode() === 'light' ? 0.11 : 0.17} style={{ right: -240, bottom: -120 }} />
    </View>
  );
}
