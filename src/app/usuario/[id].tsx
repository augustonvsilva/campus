import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { EventCard, PostCard } from '@/components/cards';
import { FollowButton, GroupCard } from '@/components/social';
import { Avatar, Badge, Button, Chip, ChipRow, Empty, Notice, Section, styles } from '@/components/ui';
import { canPublish, useMe, useStore } from '@/lib/store';
import { followersOf, followingOf, groupsOf, isFollowing, isMutual, sharedRoles } from '@/lib/social';
import { useNow } from '@/lib/time';
import { colors } from '@/theme';

function Stat({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={{ alignItems: 'center', minWidth: 72 }}>
      <Text style={[styles.title, { fontSize: 20 }]}>{value}</Text>
      <Text style={styles.hint}>{label}</Text>
    </Pressable>
  );
}

export default function UsuarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { users, following, events, boras, groups, posts, blocked, actions, messagesEnabled } = useStore();
  const me = useMe();
  const now = useNow(60_000);
  const user = users[id];

  if (!user || blocked.includes(user.id)) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Empty icon="person-outline" title={user ? 'Você bloqueou esta pessoa' : 'Perfil não encontrado'} />
        {user ? <Button label="Desbloquear" variant="secondary" onPress={() => actions.toggleBlock(user.id)} /> : null}
      </ScrollView>
    );
  }

  const isMe = user.id === me.id;
  const mutual = isMutual(following, me.id, user.id);
  const followsMe = isFollowing(following, user.id, me.id);
  // Perfil reservado: interesses, comunidades e publicações só para conexões mútuas.
  const profileOpen = isMe || mutual || user.profileVisible !== false;
  const roles = isMe ? { events: [], boras: [] } : sharedRoles(me.id, user.id, events, boras, now);
  const theirGroups = groupsOf(groups, user.id);
  const theirPosts = posts.filter((p) => p.authorId === user.id && (!p.expiresAt || p.expiresAt > now))
    .sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  const nFollowers = followersOf(following, user.id).length;
  const nFollowing = followingOf(following, user.id).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { gap: 24 }]}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Avatar user={user} size={96} />
        <Text style={styles.h2}>{user.name}</Text>
        <Text style={styles.muted}>
          @{user.handle}{user.course ? ` · ${user.course}` : ''}{user.semester ? ` (${user.semester} sem.)` : ''}
        </Text>
        <View style={[styles.row, { gap: 6, flexWrap: 'wrap', justifyContent: 'center' }]}>
          {canPublish(user) ? <Badge label="Vínculo verificado" icon="shield-checkmark" tone="accent" /> : null}
          {mutual ? <Badge label="Conectados" icon="people" tone="accent" /> : followsMe ? <Badge label="Segue você" /> : null}
        </View>
        <View style={[styles.row, { gap: 8, marginTop: 4 }]}>
          <Stat value={nFollowers} label="seguidores" onPress={() => router.push({ pathname: '/conexoes', params: { usuario: user.id, lista: 'seguidores' } })} />
          <Stat value={nFollowing} label="seguindo" onPress={() => router.push({ pathname: '/conexoes', params: { usuario: user.id, lista: 'seguindo' } })} />
          <Stat value={theirGroups.length} label="comunidades" />
        </View>
        {isMe ? (
          <Button label="Editar meu perfil" icon="create-outline" variant="secondary" compact onPress={() => router.push('/perfil')} />
        ) : (
          <View style={[styles.row, { gap: 10 }]}>
            <FollowButton userId={user.id} />
            {messagesEnabled ? (
              <Button label="Mensagem" icon="chatbubble-ellipses-outline" variant="secondary" compact
                onPress={() => router.push(`/mensagens/${user.id}`)} />
            ) : null}
            <Pressable
              onPress={() => router.push({ pathname: '/denunciar', params: { tipo: 'usuario', id: user.id, autor: user.id } })}
              accessibilityRole="button" accessibilityLabel="Denunciar ou bloquear"
              style={{ padding: 10, borderRadius: 99, backgroundColor: colors.surface2 }}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
            </Pressable>
          </View>
        )}
      </View>

      {!isMe && (roles.events.length || roles.boras.length) ? (
        <Section title={`Vocês vão aos mesmos rolês (${roles.events.length + roles.boras.length})`}>
          {roles.events.slice(0, 3).map((e) => <EventCard key={e.id} event={e} />)}
          {roles.boras.length ? (
            <Text style={styles.muted}>
              + {roles.boras.length} Bora? juntos: {roles.boras.map((b) => b.activity).join(', ')}
            </Text>
          ) : null}
        </Section>
      ) : null}

      {!profileOpen ? (
        <Notice icon="lock-closed-outline" text="Perfil reservado: conecte-se (sigam um ao outro) para ver interesses e publicações." />
      ) : (
        <>
          {user.interests.length ? (
            <Section title="Curte">
              <ChipRow>{user.interests.map((i) => <Chip key={i} label={i} />)}</ChipRow>
            </Section>
          ) : null}

          {theirGroups.length ? (
            <Section title="Comunidades">
              {theirGroups.map((g) => <GroupCard key={g.id} group={g} />)}
            </Section>
          ) : null}

          <Section title="Publicações">
            {theirPosts.length ? theirPosts.map((p) => <PostCard key={p.id} post={p} />) : <Text style={styles.muted}>Nada publicado ainda.</Text>}
          </Section>
        </>
      )}
    </ScrollView>
  );
}
