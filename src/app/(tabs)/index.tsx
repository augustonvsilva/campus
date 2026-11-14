import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { PostCard } from '@/components/cards';
import { FollowButton, openProfile } from '@/components/social';
import { Avatar, Chip, ChipRow, Empty, styles, TabHeader, VerifyPrompt } from '@/components/ui';
import { canPublish, useMe, useStore } from '@/lib/store';
import { followingOf, suggestPeople } from '@/lib/social';
import { useNow } from '@/lib/time';
import { colors, radius } from '@/theme';

type Feed = 'para-voce' | 'seguindo';

/** Faixa horizontal de sugestões para quem ainda segue pouca gente. */
function PeopleStrip() {
  const { users, following, events, boras, groups, blocked } = useStore();
  const me = useMe();
  const now = useNow(60_000);
  // Congelada ao montar: seguir alguém daqui não faz o card sumir (o botão vira "Seguindo").
  const [frozen] = useState(() => suggestPeople(me, users, following, events, boras, groups, blocked, now).slice(0, 8));
  const people = frozen.filter((s) => !blocked.includes(s.user.id) && users[s.user.id]).map((s) => ({ ...s, user: users[s.user.id]! }));
  if (!people.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={styles.sectionTitle}>Conecte-se</Text>
        <Text style={[styles.label, { color: colors.accent }]} onPress={() => router.push({ pathname: '/explorar', params: { aba: 'pessoas' } })}>
          Ver mais
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {people.map(({ user, reason }) => (
          <View key={user.id}
            style={{ width: 150, alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <Pressable onPress={() => openProfile(user.id)} accessibilityRole="button" accessibilityLabel={`Ver perfil de ${user.name}`}
              style={{ alignItems: 'center', gap: 6, alignSelf: 'stretch' }}>
              <Avatar user={user} size={56} />
              <Text style={[styles.label, { textAlign: 'center' }]} numberOfLines={1}>{user.name}</Text>
              <Text style={[styles.hint, { textAlign: 'center' }]} numberOfLines={1}>{reason}</Text>
            </Pressable>
            <FollowButton userId={user.id} compact />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function Inicio() {
  const { posts, isVisible, community, refreshing, actions, following, groups } = useStore();
  const me = useMe();
  const now = useNow();
  const [feed, setFeed] = useState<Feed>('para-voce');

  const myFollowing = new Set(followingOf(following, me.id));
  const myGroups = new Set(groups.filter((g) => g.members[me.id]).map((g) => g.id));
  const fromMyGroup = (groupId?: string) => !!groupId && myGroups.has(groupId);

  const list = posts
    .filter((p) => p.communityId === community.id && isVisible(p.authorId) && (!p.expiresAt || p.expiresAt > now))
    .filter((p) =>
      feed === 'seguindo'
        ? fromMyGroup(p.groupId) || (myFollowing.has(p.authorId) && (!p.groupId || fromMyGroup(p.groupId))) || p.authorId === me.id
        : !p.groupId || fromMyGroup(p.groupId))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <View style={styles.screen}>
      <TabHeader title="Início" />
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={actions.refresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {!canPublish(me) ? (
              <VerifyPrompt text="Confirme que você é aluno para publicar, comentar e entrar nos Bora?. Enviamos um código para o seu e-mail institucional." />
            ) : null}
            <Pressable
              onPress={() => router.push({ pathname: '/criar', params: { tipo: 'post' } })}
              accessibilityRole="button"
              style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: colors.border }]}>
              <Avatar user={me} />
              <Text style={[styles.muted, { fontSize: 15, flex: 1 }]}>Pergunte, recomende, combine algo…</Text>
            </Pressable>
            {myFollowing.size < 3 ? <PeopleStrip /> : null}
            <ChipRow>
              <Chip label="Para você" icon="sparkles" active={feed === 'para-voce'} onPress={() => setFeed('para-voce')} />
              <Chip label={`Seguindo${myFollowing.size ? ` (${myFollowing.size})` : ''}`} icon="people" active={feed === 'seguindo'} onPress={() => setFeed('seguindo')} />
            </ChipRow>
          </View>
        }
        ListEmptyComponent={
          feed === 'seguindo'
            ? <Empty icon="people-outline" title="Nada de quem você segue ainda" text="Siga pessoas e entre em comunidades para montar seu feed." />
            : <Empty icon="chatbubbles-outline" title="O feed está quieto" text="Seja a primeira pessoa a publicar hoje." />
        }
      />
    </View>
  );
}
