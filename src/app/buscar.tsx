import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { BoraCard, EventCard, PlaceCard, PostCard } from '@/components/cards';
import { GroupCard, PersonRow } from '@/components/social';
import { Chip, ChipRow, Empty, Section, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import { useNow } from '@/lib/time';
import { colors, radius } from '@/theme';

type Kind = 'tudo' | 'pessoas' | 'comunidades' | 'eventos' | 'boras' | 'lugares' | 'posts';
const KINDS: { id: Kind; label: string }[] = [
  { id: 'tudo', label: 'Tudo' }, { id: 'pessoas', label: 'Pessoas' }, { id: 'comunidades', label: 'Comunidades' },
  { id: 'eventos', label: 'Eventos' }, { id: 'boras', label: 'Bora?' }, { id: 'lugares', label: 'Lugares' },
  { id: 'posts', label: 'Publicações' },
];

/** Minúsculas e sem acento, para "ciencia" achar "Ciência". */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Busca em tudo o que a comunidade já carregou: pessoas (@usuário), comunidades, eventos, Bora?, lugares e publicações. */
export default function Buscar() {
  const { users, groups, events, boras, places, posts, isVisible, community } = useStore();
  const me = useMe();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<Kind>('tudo');

  const raw = query.trim();
  const q = fold(raw.replace(/^@/, ''));
  const byHandle = raw.startsWith('@');
  const has = (...fields: (string | undefined)[]) => fields.some((f) => !!f && fold(f).includes(q));

  const people = Object.values(users)
    .filter((u) => u.id !== me.id && u.communityId === community.id && isVisible(u.id))
    .filter((u) => (byHandle ? fold(u.handle).startsWith(q) : has(u.name, u.handle, u.course, ...u.interests)));
  const groupHits = groups.filter((g) => has(g.name, g.description));
  const eventHits = events.filter((e) => e.endsAt > now && has(e.title, e.location, e.organizer, e.description)).sort((a, b) => a.startsAt - b.startsAt);
  const boraHits = boras.filter((b) => !b.cancelled && b.startsAt > now - 2 * 3_600_000 && b.visibility === 'comunidade' && isVisible(b.authorId) && has(b.activity, b.meetingPoint));
  const placeHits = places.filter((p) => has(p.name, p.address));
  const postHits = posts.filter((p) => isVisible(p.authorId) && (!p.expiresAt || p.expiresAt > now) && has(p.text)).slice(0, 20);

  const show = (k: Kind) => q && (kind === 'tudo' || kind === k);
  const limit = (n: number) => (kind === 'tudo' ? n : 50);
  const total = q ? people.length + groupHits.length + eventHits.length + boraHits.length + placeHits.length + postHits.length : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { gap: 18 }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Pessoas, @usuário, comunidades, eventos…"
          placeholderTextColor={colors.muted}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar"
          style={{ flex: 1, color: colors.text, paddingVertical: 12, fontSize: 15 }}
        />
      </View>
      <ChipRow>
        {KINDS.map((k) => <Chip key={k.id} label={k.label} active={kind === k.id} onPress={() => setKind(k.id)} />)}
      </ChipRow>

      {!q ? <Text style={styles.muted}>Dica: comece com @ para buscar pelo nome de usuário.</Text> : null}
      {q && !total ? <Empty icon="search-outline" title="Nada encontrado" text={`Nenhum resultado para "${raw}".`} /> : null}

      {show('pessoas') && people.length ? (
        <Section title={`Pessoas (${people.length})`}>
          {people.slice(0, limit(5)).map((u) => <PersonRow key={u.id} user={u} subtitle={`@${u.handle}${u.course ? ` · ${u.course}` : ''}`} />)}
        </Section>
      ) : null}
      {show('comunidades') && groupHits.length ? (
        <Section title={`Comunidades (${groupHits.length})`}>
          {groupHits.slice(0, limit(3)).map((g) => <GroupCard key={g.id} group={g} />)}
        </Section>
      ) : null}
      {show('eventos') && eventHits.length ? (
        <Section title={`Eventos (${eventHits.length})`}>
          {eventHits.slice(0, limit(3)).map((e) => <EventCard key={e.id} event={e} />)}
        </Section>
      ) : null}
      {show('boras') && boraHits.length ? (
        <Section title={`Bora? (${boraHits.length})`}>
          {boraHits.slice(0, limit(3)).map((b) => <BoraCard key={b.id} bora={b} />)}
        </Section>
      ) : null}
      {show('lugares') && placeHits.length ? (
        <Section title={`Lugares (${placeHits.length})`}>
          {placeHits.slice(0, limit(3)).map((p) => <PlaceCard key={p.id} place={p} />)}
        </Section>
      ) : null}
      {show('posts') && postHits.length ? (
        <Section title={`Publicações (${postHits.length})`}>
          {postHits.slice(0, limit(3)).map((p) => <PostCard key={p.id} post={p} />)}
        </Section>
      ) : null}
    </ScrollView>
  );
}
