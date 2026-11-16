import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { PostCard } from '@/components/cards';
import { FollowButton, openProfile } from '@/components/social';
import { Avatar, Chip, useWide, Empty, styles, TabHeader, VerifyPrompt } from '@/components/ui';
import { canPublish, useMe, useStore } from '@/lib/store';
import { followingOf, suggestPeople } from '@/lib/social';
import { useNow } from '@/lib/time';
import { colors, glow, radius } from '@/theme';

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
        <Text style={[styles.label, { color: colors.accentSoft }]} onPress={() => router.push({ pathname: '/explorar', params: { aba: 'pessoas' } })}>
          Ver mais
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {people.map(({ user, reason }) => (
          <View key={user.id}
            style={{ width: 176, alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
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
  const wide = useWide();

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
            {/* Card de publicar + filtros do feed, como no modelo */}
            <View style={[styles.card, styles.cardStripe, { padding: 0, gap: 0, overflow: 'hidden' }]}>
              <Pressable
                onPress={() => router.push({ pathname: '/criar', params: { tipo: 'post' } })}
                accessibilityRole="button"
                style={[styles.row, { padding: 14, gap: 14 }]}>
                <Avatar user={me} size={48} />
                <Text style={[styles.muted, { fontSize: 16, flex: 1 }]}>Pergunte, recomende, combine algo…</Text>
              </Pressable>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={[styles.row, { padding: 12, gap: 8, flexWrap: 'wrap' }]}>
                <Chip label="Para você" icon="sparkles" active={feed === 'para-voce'} onPress={() => setFeed('para-voce')} />
                <Chip label={`Seguindo${myFollowing.size ? ` (${myFollowing.size})` : ''}`} icon="people" active={feed === 'seguindo'} onPress={() => setFeed('seguindo')} />
                {wide ? (
                  <>
                    <View style={{ width: 1, height: 26, backgroundColor: colors.border, marginHorizontal: 4 }} />
                    <Pressable onPress={() => router.push({ pathname: '/criar', params: { tipo: 'post' } })} accessibilityRole="button"
                      style={[styles.row, { gap: 6, paddingHorizontal: 6 }]}>
                      <Ionicons name="add" size={20} color={colors.text} />
                      <Text style={styles.label}>Criar post</Text>
                    </Pressable>
                  </>
                ) : null}
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => router.push({ pathname: '/criar', params: { tipo: 'post' } })} accessibilityRole="button" accessibilityLabel="Nova publicação"
                  style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...glow(0.8) }}>
                  <Ionicons name="paper-plane-outline" size={19} color={colors.onAccent} />
                </Pressable>
              </View>
            </View>
            {myFollowing.size < 3 ? <PeopleStrip /> : null}
          </View>
        }
        ListFooterComponent={list.length ? (
          <View style={{ alignItems: 'center', gap: 4, paddingVertical: 24 }}>
            <Text style={styles.hint}>Você viu tudo dos últimos 30 dias.</Text>
            <Text style={[styles.hint, { color: colors.accentSoft }]} accessibilityRole="link" onPress={() => router.push('/buscar')}>
              Buscar pessoas, comunidades e eventos
            </Text>
          </View>
        ) : undefined}
        ListEmptyComponent={
          feed === 'seguindo'
            ? <Empty icon="people-outline" title="Nada de quem você segue ainda" text="Siga pessoas e entre em comunidades para montar seu feed. Veja as sugestões acima ou toque na lupa para buscar." />
            : <Empty icon="chatbubbles-outline" title="O feed está quieto" text="Seja a primeira pessoa a publicar hoje." />
        }
      />
    </View>
  );
}
