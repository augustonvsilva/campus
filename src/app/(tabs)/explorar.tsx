import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { PlaceCard } from '@/components/cards';
import { GroupCard, PersonRow } from '@/components/social';
import { Button, Chip, ChipRow, Empty, Notice, Section, styles, TabHeader, useWide } from '@/components/ui';
import { GROUP_KINDS, PLACE_CATEGORIES } from '@/lib/labels';
import { canPublish, useMe, useStore } from '@/lib/store';
import { matchesQuery, suggestPeople } from '@/lib/social';
import { useNow } from '@/lib/time';
import type { GroupKind, PlaceCategory } from '@/lib/types';
import { colors, radius } from '@/theme';

type Segment = 'lugares' | 'pessoas' | 'comunidades';

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      autoCapitalize="none"
      accessibilityLabel={placeholder}
      style={{
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
        color: colors.text, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15,
      }}
    />
  );
}

function Lugares() {
  const { places, community } = useStore();
  const [filter, setFilter] = useState<PlaceCategory | 'todos'>('todos');
  const list = places
    .filter((p) => p.communityId === community.id && (filter === 'todos' || p.category === filter))
    .sort((a, b) => b.recommendations.length - a.recommendations.length);
  return (
    <>
      <ChipRow>
        <Chip label="Todos" active={filter === 'todos'} onPress={() => setFilter('todos')} />
        {PLACE_CATEGORIES.map((c) => <Chip key={c.id} label={c.label} icon={c.icon} active={filter === c.id} onPress={() => setFilter(c.id)} />)}
      </ChipRow>
      {list.length ? list.map((p) => <PlaceCard key={p.id} place={p} />) : <Empty icon="map-outline" title="Nenhum lugar nesta categoria ainda" />}
      <Notice icon="checkmark-circle" text="O selo indica horário e endereço verificados pela equipe Campus. Recomendações são da comunidade e passam por moderação." />
    </>
  );
}

function Pessoas() {
  const { users, following, events, boras, groups, blocked } = useStore();
  const me = useMe();
  const now = useNow(60_000);
  const [query, setQuery] = useState('');
  // Lista congelada ao abrir a tela: quem você segue daqui continua visível (botão vira "Seguindo"), sem sumir.
  const [frozen] = useState(() => suggestPeople(me, users, following, events, boras, groups, blocked, now).slice(0, 15));
  const suggestions = frozen.filter((s) => !blocked.includes(s.user.id) && users[s.user.id])
    .map((s) => ({ ...s, user: users[s.user.id]! }));
  const results = query.trim()
    ? Object.values(users).filter((u) => u.id !== me.id && !blocked.includes(u.id) && matchesQuery(u, query))
      .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <>
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nome, curso ou interesse" />
      {query.trim() ? (
        results.length ? (
          <View style={{ gap: 2 }}>{results.map((u) => <PersonRow key={u.id} user={u} />)}</View>
        ) : <Empty icon="search-outline" title="Ninguém encontrado" />
      ) : (
        <Section title="Quem vai aos mesmos rolês que você">
          {suggestions.length ? (
            <View style={{ gap: 2 }}>
              {suggestions.map((s) => <PersonRow key={s.user.id} user={s.user} subtitle={s.reason} />)}
            </View>
          ) : (
            <Empty icon="people-outline" title="Ainda sem sugestões"
              text="Marque presença em eventos, entre em Bora? e comunidades — a gente sugere quem vai aos mesmos rolês." />
          )}
        </Section>
      )}
    </>
  );
}

function Comunidades() {
  const { groups } = useStore();
  const me = useMe();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<GroupKind | 'todas'>('todas');
  const filtered = groups.filter((g) => (kind === 'todas' || g.kind === kind) && (!query.trim() || g.name.toLowerCase().includes(query.trim().toLowerCase())));
  const mine = filtered.filter((g) => g.members[me.id]);
  const others = filtered.filter((g) => !g.members[me.id])
    .sort((a, b) => Number(b.verified) - Number(a.verified) || Object.keys(b.members).length - Object.keys(a.members).length);

  return (
    <>
      {canPublish(me) ? (
        <Button label="Criar comunidade" icon="add" variant="secondary" onPress={() => router.push('/comunidade/nova')} />
      ) : null}
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar comunidade" />
      <ChipRow>
        <Chip label="Todas" active={kind === 'todas'} onPress={() => setKind('todas')} />
        {GROUP_KINDS.map((k) => <Chip key={k.id} label={k.label} icon={k.icon} active={kind === k.id} onPress={() => setKind(k.id)} />)}
      </ChipRow>
      {mine.length ? <Section title="Suas comunidades">{mine.map((g) => <GroupCard key={g.id} group={g} />)}</Section> : null}
      <Section title={mine.length ? 'Descobrir' : 'Comunidades do campus'}>
        {others.length ? others.map((g) => <GroupCard key={g.id} group={g} />)
          : <Text style={styles.muted}>Nenhuma comunidade encontrada. Que tal criar a primeira?</Text>}
      </Section>
    </>
  );
}

export default function Explorar() {
  const params = useLocalSearchParams<{ aba?: Segment }>();
  const [segment, setSegment] = useState<Segment>(params.aba ?? 'lugares');
  const wide = useWide();
  // Abas: fixas no celular; no computador rolam junto com a capa.
  const tabs = (
    <ChipRow>
      <Chip label="Lugares" icon="map-outline" active={segment === 'lugares'} onPress={() => setSegment('lugares')} />
      <Chip label="Pessoas" icon="people-outline" active={segment === 'pessoas'} onPress={() => setSegment('pessoas')} />
      <Chip label="Comunidades" icon="flag-outline" active={segment === 'comunidades'} onPress={() => setSegment('comunidades')} />
    </ChipRow>
  );

  return (
    <View style={styles.screen}>
      <TabHeader title="Explorar" subtitle="Lugares, pessoas e comunidades" />
      {wide ? null : <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>{tabs}</View>}
      <ScrollView contentContainerStyle={[styles.content, { gap: 12 }]} keyboardShouldPersistTaps="handled">
        <TabHeader title="Explorar" subtitle="Lugares, pessoas e comunidades" scrolling />
        {wide ? tabs : null}
        {segment === 'lugares' ? <Lugares /> : segment === 'pessoas' ? <Pessoas /> : <Comunidades />}
      </ScrollView>
    </View>
  );
}
