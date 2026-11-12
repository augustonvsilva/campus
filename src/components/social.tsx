import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { groupKind } from '@/lib/labels';
import { useMe, useStore } from '@/lib/store';
import { isFollowing } from '@/lib/social';
import { relativeStart, useNow, when } from '@/lib/time';
import type { Group, ID, Ride, User } from '@/lib/types';
import { colors, radius } from '@/theme';
import { Avatar, Badge, Card, styles } from './ui';

export const openProfile = (id: ID) => router.push(`/usuario/${id}`);
export const openGroup = (id: ID) => router.push(`/comunidade/${id}`);

export function FollowButton({ userId, compact }: { userId: ID; compact?: boolean }) {
  const { following, actions } = useStore();
  const me = useMe();
  if (userId === me.id) return null;
  const on = isFollowing(following, me.id, userId);
  const followsMe = isFollowing(following, userId, me.id);
  const label = on ? (followsMe ? 'Conectados' : 'Seguindo') : followsMe ? 'Seguir de volta' : 'Seguir';
  return (
    <Pressable
      onPress={() => actions.toggleFollow(userId)}
      accessibilityRole="button"
      accessibilityLabel={on ? 'Deixar de seguir' : label}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill,
        paddingHorizontal: compact ? 12 : 18, paddingVertical: compact ? 6 : 10,
        backgroundColor: on ? colors.surface2 : colors.accent, opacity: pressed ? 0.8 : 1,
      })}>
      {on ? <Ionicons name={followsMe ? 'people' : 'checkmark'} size={14} color={colors.text} /> : null}
      <Text style={{ fontWeight: '800', fontSize: compact ? 13 : 15, color: on ? colors.text : colors.onAccent }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Pessoa em listas (sugestões, seguidores, membros).
 * A área clicável do perfil e as ações ficam lado a lado — nunca um botão dentro de outro
 * (no navegador isso gera <button> aninhado, que é HTML inválido).
 */
export function PersonRow({ user, subtitle, right }: { user: User; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={[styles.row, { paddingVertical: 6 }]} accessibilityLabel={`Pessoa: ${user.name}`}>
      <Pressable onPress={() => openProfile(user.id)} accessibilityRole="button" accessibilityLabel={`Ver perfil de ${user.name}`}
        style={[styles.row, { flex: 1 }]}>
        <Avatar user={user} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.muted} numberOfLines={1}>{subtitle ?? (user.course ? `${user.course}${user.semester ? ` · ${user.semester} sem.` : ''}` : `@${user.handle}`)}</Text>
        </View>
      </Pressable>
      {right ?? <FollowButton userId={user.id} compact />}
    </View>
  );
}

export function GroupBadge({ group, size = 44 }: { group: Group; size?: number }) {
  const kind = groupKind(group.kind);
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: group.color, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={kind.icon} size={size * 0.5} color={colors.onAccent} />
    </View>
  );
}

export function GroupCard({ group }: { group: Group }) {
  const me = useMe();
  const { events } = useStore();
  const now = useNow(60_000);
  const count = Object.keys(group.members).length;
  const next = events.filter((e) => e.groupId === group.id && e.endsAt > now).sort((a, b) => a.startsAt - b.startsAt)[0];
  const role = group.members[me.id];
  return (
    <Card onPress={() => openGroup(group.id)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      <GroupBadge group={group} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={[styles.row, { gap: 6 }]}>
          <Text style={styles.title} numberOfLines={1}>{group.name}</Text>
          {group.verified ? <Ionicons name="checkmark-circle" size={15} color={colors.accent} accessibilityLabel="Comunidade oficial" /> : null}
        </View>
        <Text style={styles.muted}>{groupKind(group.kind).label} · {count} {count === 1 ? 'membro' : 'membros'}{role ? ' · você participa' : ''}</Text>
        {next ? <Text style={[styles.hint, { color: colors.accent }]} numberOfLines={1}>Próximo: {next.title} · {when(next.startsAt, now)}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Card>
  );
}

export function RideCard({ ride, showGroup = true }: { ride: Ride; showGroup?: boolean }) {
  const { groups, actions } = useStore();
  const me = useMe();
  const now = useNow();
  const group = groups.find((g) => g.id === ride.groupId);
  const reserved = ride.reservations.includes(me.id);
  const full = !!ride.seats && ride.reservations.length >= ride.seats;
  const departed = ride.departsAt < now - 15 * 60_000;
  return (
    <Card onPress={() => router.push(`/saida/${ride.id}`)}>
      <View style={styles.row}>
        <View style={{ backgroundColor: colors.surface2, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Ionicons name="bus" size={12} color={colors.accent} />
          <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 12 }}>SAÍDA</Text>
        </View>
        <Text style={[styles.label, { color: colors.accent }]}>{relativeStart(ride.departsAt, now)}</Text>
        {ride.cancelled ? <Badge label="Cancelada" tone="warn" /> : full ? <Badge label="Lotada" tone="warn" /> : null}
      </View>
      <Text style={[styles.title, { fontSize: 17 }]}>{ride.title}</Text>
      <View style={[styles.row, { gap: 6 }]}>
        <Ionicons name="navigate-outline" size={15} color={colors.muted} />
        <Text style={[styles.muted, { flex: 1 }]}>{ride.departurePoint} → {ride.destination}</Text>
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={styles.muted}>
          {ride.reservations.length}{ride.seats ? `/${ride.seats}` : ''} lugares{ride.price ? ` · ${ride.price}` : ''}
          {showGroup && group ? ` · ${group.name}` : ''}
        </Text>
        {!ride.cancelled && !departed ? (
          <Pressable
            onPress={() => actions.toggleRide(ride.id)}
            disabled={!reserved && full}
            accessibilityRole="button"
            accessibilityLabel={reserved ? 'Cancelar reserva' : 'Reservar lugar'}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: reserved ? colors.surface2 : colors.accent, opacity: !reserved && full ? 0.4 : 1 }}>
            <Text style={{ fontWeight: '800', color: reserved ? colors.text : colors.onAccent }}>{reserved ? 'Reservado ✓' : full ? 'Lotada' : 'Reservar'}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
