import { useState } from 'react';
import { RefreshControl, ScrollView, SectionList, Text, View } from 'react-native';

import { EventCard } from '@/components/cards';
import { Chip, Empty, styles, TabHeader, useWide } from '@/components/ui';
import { EVENT_CATEGORIES } from '@/lib/labels';
import { useMe, useStore } from '@/lib/store';
import { dayLabel, useNow } from '@/lib/time';
import type { CampusEvent, EventCategory } from '@/lib/types';
import { colors } from '@/theme';

type Filter = EventCategory | 'todos' | 'meus';

export default function Eventos() {
  const { events, community, refreshing, actions } = useStore();
  const me = useMe();
  const now = useNow(60_000);
  const [filter, setFilter] = useState<Filter>('todos');
  const wide = useWide();

  const upcoming = events
    .filter((e) => e.communityId === community.id && e.endsAt > now)
    .filter((e) =>
      filter === 'todos' ? true
        : filter === 'meus' ? e.going.includes(me.id) || e.interested.includes(me.id)
          : e.category === filter)
    .sort((a, b) => a.startsAt - b.startsAt);

  const sections: { title: string; data: CampusEvent[] }[] = [];
  for (const e of upcoming) {
    const title = e.startsAt <= now ? 'Agora' : dayLabel(e.startsAt, now);
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(e);
    else sections.push({ title, data: [e] });
  }

  // Filtros: fixos no celular; no computador rolam junto com a capa.
  const filters = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: wide ? 0 : 16, paddingBottom: 8 }}>
      <Chip label="Todos" active={filter === 'todos'} onPress={() => setFilter('todos')} />
      <Chip label="Meus" icon="star" active={filter === 'meus'} onPress={() => setFilter('meus')} />
      {EVENT_CATEGORIES.map((c) => (
        <Chip key={c.id} label={c.label} icon={c.icon} active={filter === c.id} onPress={() => setFilter(c.id)} />
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <TabHeader title="Eventos" subtitle="Agenda universitária" />
      {wide ? null : <View>{filters}</View>}
      <SectionList
        ListHeaderComponent={wide ? (
          <View style={{ gap: 12, marginBottom: 6 }}>
            <TabHeader title="Eventos" subtitle="Agenda universitária" scrolling />
            {filters}
          </View>
        ) : undefined}
        sections={sections}
        keyExtractor={(e) => e.id}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={actions.refresh} tintColor={colors.accent} />}
        contentContainerStyle={[styles.content, { gap: 10 }]}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.label, { color: colors.accentSoft, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={
          <Empty
            icon="calendar-outline"
            title={filter === 'meus' ? 'Você ainda não marcou nenhum evento' : 'Nenhum evento por aqui'}
            text={filter === 'meus' ? 'Marque “Tenho interesse” ou “Eu vou” em um evento.' : 'Volte mais tarde ou cadastre um evento.'}
          />
        }
      />
    </View>
  );
}
