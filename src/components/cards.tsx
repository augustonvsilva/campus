import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { eventCategory, placeCategory, price } from '@/lib/labels';
import { useMe, useStore } from '@/lib/store';
import { ago, hhmm, relativeStart, shortDate, useNow, validUntil, when } from '@/lib/time';
import type { Bora, CampusEvent, Place, Post } from '@/lib/types';
import { colors, radius } from '@/theme';
import { Avatar, Badge, Card, IconName, styles } from './ui';

function ActionButton({ icon, label, active, onPress, a11y }: {
  icon: IconName; label?: string; active?: boolean; onPress: () => void; a11y: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={a11y} style={styles.row}>
      <Ionicons name={icon} size={20} color={active ? colors.accent : colors.muted} />
      {label ? <Text style={[styles.muted, active && { color: colors.accent }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function PostCard({ post, linked = true, showGroup = true }: { post: Post; linked?: boolean; showGroup?: boolean }) {
  const { users, actions, groups } = useStore();
  const me = useMe();
  const now = useNow();
  const author = users[post.authorId];
  const group = post.groupId ? groups.find((g) => g.id === post.groupId) : undefined;
  const isGroupAdmin = !!group && group.members[post.authorId] === 'admin';
  const liked = post.likes.includes(me.id);
  const totalVotes = post.poll?.reduce((n, o) => n + o.votes.length, 0) ?? 0;
  const myVote = post.poll?.find((o) => o.votes.includes(me.id))?.id;

  return (
    <Card onPress={linked ? () => router.push(`/post/${post.id}`) : undefined}>
      {group && showGroup ? (
        <Pressable onPress={() => router.push(`/comunidade/${group.id}`)} accessibilityRole="link"
          style={[styles.row, { gap: 6, marginBottom: -4 }]}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: group.color }} />
          <Text style={[styles.label, { color: colors.muted }]}>em {group.name}</Text>
        </Pressable>
      ) : null}
      <View style={styles.row}>
        <Pressable onPress={() => author && router.push(`/usuario/${author.id}`)} accessibilityRole="link"
          accessibilityLabel={`Ver perfil de ${author?.name ?? 'alguém'}`} style={[styles.row, { flex: 1 }]}>
          <Avatar user={author} />
          <View style={{ flex: 1 }}>
            <View style={[styles.row, { gap: 6 }]}>
              <Text style={styles.title}>{author?.name ?? 'Alguém'}</Text>
              {isGroupAdmin ? <Badge label="admin" tone="accent" /> : null}
            </View>
            <Text style={styles.muted}>
              {author?.course ? `${author.course} · ` : ''}
              {ago(post.createdAt, now)}
              {post.editedAt ? ' · editado' : ''}
            </Text>
          </View>
        </Pressable>
        {post.expiresAt ? <Badge label={validUntil(post.expiresAt, now)} icon="time-outline" tone="accent" /> : null}
      </View>

      <Text style={styles.body}>{post.text}</Text>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.surface2 }}
          resizeMode="cover" accessibilityLabel={`Foto publicada por ${author?.name ?? 'alguém'}`} />
      ) : null}

      {post.poll ? (
        <View style={{ gap: 8 }}>
          {post.poll.map((o) => {
            const pct = totalVotes ? Math.round((o.votes.length / totalVotes) * 100) : 0;
            const mine = myVote === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => actions.vote(post.id, o.id)}
                accessibilityRole="button"
                accessibilityLabel={`Votar em ${o.label}`}
                style={{ borderRadius: radius.md, borderWidth: 1, borderColor: mine ? colors.accent : colors.border, overflow: 'hidden' }}>
                {myVote ? (
                  <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`, backgroundColor: mine ? '#C8F25A33' : colors.surface2 }} />
                ) : null}
                <View style={[styles.row, { paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'space-between' }]}>
                  <Text style={[styles.body, { flex: 1 }]}>{o.label}</Text>
                  {myVote ? <Text style={[styles.label, mine && { color: colors.accent }]}>{pct}%</Text> : null}
                </View>
              </Pressable>
            );
          })}
          <Text style={styles.hint}>{totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}{myVote ? ' · toque de novo para tirar o voto' : ''}</Text>
        </View>
      ) : null}

      <View style={[styles.row, { gap: 22 }]}>
        <ActionButton
          icon={liked ? 'heart' : 'heart-outline'} label={String(post.likes.length)} active={liked}
          onPress={() => actions.toggleLike(post.id)} a11y={liked ? 'Descurtir' : 'Curtir'}
        />
        <ActionButton
          icon="chatbubble-outline" label={String(post.comments.length)}
          onPress={() => router.push(`/post/${post.id}`)} a11y="Comentários"
        />
        <View style={{ flex: 1 }} />
        {post.authorId !== me.id ? (
          <ActionButton
            icon="flag-outline" a11y="Denunciar publicação"
            onPress={() => router.push({ pathname: '/denunciar', params: { tipo: 'post', id: post.id, autor: post.authorId } })}
          />
        ) : null}
      </View>
    </Card>
  );
}

export function EventCard({ event }: { event: CampusEvent }) {
  const me = useMe();
  const now = useNow();
  const { day, month } = shortDate(event.startsAt);
  const cat = eventCategory(event.category);
  const live = event.startsAt <= now && now < event.endsAt;
  const going = event.going.includes(me.id);
  const interested = event.interested.includes(me.id);

  return (
    <Card onPress={() => router.push(`/evento/${event.id}`)} style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ width: 52, alignItems: 'center', paddingVertical: 6, borderRadius: radius.md, backgroundColor: live ? colors.accent : colors.surface2 }}>
        <Text style={{ color: live ? colors.onAccent : colors.text, fontSize: 22, fontWeight: '900' }}>{day}</Text>
        <Text style={{ color: live ? colors.onAccent : colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>{month}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
          <Badge label={cat.label} icon={cat.icon} />
          {live ? <Badge label="ROLANDO AGORA" tone="accent" icon="radio" /> : null}
          {event.sponsored ? <Badge label="Patrocinado" tone="warn" /> : null}
        </View>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.muted}>{live ? `até ${hhmm(event.endsAt)}` : when(event.startsAt, now)} · {event.location}</Text>
        <Text style={[styles.hint, (going || interested) && { color: colors.accent }]}>
          {going ? 'Você vai · ' : interested ? 'Você tem interesse · ' : ''}
          {event.going.length} vão · {event.interested.length} interessados
        </Text>
      </View>
    </Card>
  );
}

export function BoraCard({ bora }: { bora: Bora }) {
  const { users, actions } = useStore();
  const me = useMe();
  const now = useNow();
  const author = users[bora.authorId];
  const joined = bora.participants.includes(me.id);
  const isAuthor = bora.authorId === me.id;
  const full = !!bora.capacity && bora.participants.length >= bora.capacity;

  return (
    <Card onPress={() => router.push(`/bora/${bora.id}`)}>
      <View style={styles.row}>
        <View style={{ backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color: colors.onAccent, fontWeight: '900', fontSize: 12 }}>BORA?</Text>
        </View>
        <Text style={[styles.label, { color: colors.accent }]}>{relativeStart(bora.startsAt, now)}</Text>
        {bora.cancelled ? <Badge label="Cancelado" tone="warn" /> : null}
      </View>
      <Text style={[styles.title, { fontSize: 18 }]}>{bora.activity}</Text>
      <View style={[styles.row, { gap: 6 }]}>
        <Ionicons name="location-outline" size={15} color={colors.muted} />
        <Text style={[styles.muted, { flex: 1 }]}>{bora.meetingPoint}</Text>
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={styles.row}>
          <View style={{ flexDirection: 'row' }}>
            {bora.participants.slice(0, 4).map((id, i) => (
              <View key={id} style={{ marginLeft: i ? -8 : 0, borderRadius: 99, borderWidth: 2, borderColor: colors.surface }}>
                <Avatar user={users[id]} size={26} />
              </View>
            ))}
          </View>
          <Text style={styles.muted}>
            {bora.participants.length}
            {bora.capacity ? `/${bora.capacity}` : ''} · por {author?.name.split(' ')[0] ?? 'alguém'}
          </Text>
        </View>
        {!isAuthor && !bora.cancelled ? (
          <Pressable
            onPress={() => actions.toggleBora(bora.id)}
            disabled={!joined && full}
            accessibilityRole="button"
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill,
              backgroundColor: joined ? colors.surface2 : colors.accent, opacity: !joined && full ? 0.4 : 1,
            }}>
            <Text style={{ fontWeight: '800', color: joined ? colors.text : colors.onAccent }}>
              {joined ? 'Tô dentro ✓' : full ? 'Lotado' : 'Bora!'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

export function PlaceCard({ place }: { place: Place }) {
  const cat = placeCategory(place.category);
  return (
    <Card onPress={() => router.push(`/lugar/${place.id}`)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={cat.icon} size={22} color={colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={[styles.row, { gap: 6 }]}>
          <Text style={styles.title}>{place.name}</Text>
          {place.verified ? <Ionicons name="checkmark-circle" size={15} color={colors.accent} accessibilityLabel="Informações verificadas" /> : null}
        </View>
        <Text style={styles.muted}>{cat.label} · {price(place.priceRange)} · {place.address}</Text>
        <Text style={styles.hint}>
          {place.recommendations.length
            ? `${place.recommendations.length} ${place.recommendations.length === 1 ? 'recomendação' : 'recomendações'} da comunidade`
            : 'Ainda sem recomendações'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Card>
  );
}
