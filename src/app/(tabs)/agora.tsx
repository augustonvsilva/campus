import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';

import { BoraCard, EventCard, PostCard } from '@/components/cards';
import { RideCard } from '@/components/social';
import { Button, Empty, Section, styles, TabHeader } from '@/components/ui';
import { useStore } from '@/lib/store';
import { DAY, HOUR, startOfDay, useNow } from '@/lib/time';
import { colors } from '@/theme';

// Radar da comunidade: só o que está acontecendo ou vai acontecer em breve.
// Tudo tem horário e validade, para não exibir informação velha.
export default function Agora() {
  const { events, boras, posts, rides, isVisible, community, refreshing, actions } = useStore();
  const now = useNow();
  const mine = <T extends { communityId: string }>(x: T) => x.communityId === community.id;

  const liveEvents = events.filter((e) => mine(e) && e.startsAt <= now && now < e.endsAt);
  const laterToday = events
    .filter((e) => mine(e) && e.startsAt > now && e.startsAt < startOfDay(now) + DAY)
    .sort((a, b) => a.startsAt - b.startsAt);
  const soonBoras = boras
    .filter((b) => mine(b) && !b.cancelled && b.visibility === 'comunidade' && isVisible(b.authorId)
      && b.startsAt > now - HOUR && b.startsAt < now + 12 * HOUR)
    .sort((a, b) => a.startsAt - b.startsAt);
  const soonRides = rides
    .filter((r) => mine(r) && !r.cancelled && r.departsAt > now - 15 * 60_000 && r.departsAt < now + DAY)
    .sort((a, b) => a.departsAt - b.departsAt);
  const trending = posts
    .filter((p) => mine(p) && !p.groupId && isVisible(p.authorId) && (p.expiresAt ? p.expiresAt > now : p.createdAt > now - DAY))
    .sort((a, b) => b.likes.length + 2 * b.comments.length - (a.likes.length + 2 * a.comments.length))
    .slice(0, 4);

  return (
    <View style={styles.screen}>
      <TabHeader title="Agora" subtitle="O que está rolando na comunidade" />
      <ScrollView
        contentContainerStyle={[styles.content, { gap: 28 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={actions.refresh} tintColor={colors.accent} />}>
        <Section title="Rolando agora">
          {liveEvents.length
            ? liveEvents.map((e) => <EventCard key={e.id} event={e} />)
            : <Empty icon="radio-outline" title="Nada ao vivo neste momento" />}
        </Section>

        <Section
          title="Bora? nas próximas horas"
          right={<Button label="Criar" icon="add" compact variant="secondary" onPress={() => router.push({ pathname: '/criar', params: { tipo: 'bora' } })} />}>
          {soonBoras.length
            ? soonBoras.map((b) => <BoraCard key={b.id} bora={b} />)
            : <Empty icon="people-outline" title="Nenhum plano por enquanto" text="Que tal propor um? Estudar, almoçar, ver um jogo…" />}
        </Section>

        {soonRides.length ? (
          <Section title="Saídas nas próximas horas">
            {soonRides.map((r) => <RideCard key={r.id} ride={r} />)}
          </Section>
        ) : null}

        {laterToday.length ? (
          <Section title="Mais tarde hoje">
            {laterToday.map((e) => <EventCard key={e.id} event={e} />)}
          </Section>
        ) : null}

        <Section title="Movimentando a comunidade">
          {trending.length
            ? trending.map((p) => <PostCard key={p.id} post={p} />)
            : <Empty icon="flame-outline" title="Tudo calmo por aqui" />}
        </Section>
      </ScrollView>
    </View>
  );
}
