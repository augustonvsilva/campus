import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { openGroup, RideCard } from '@/components/social';
import { Avatar, Badge, Button, Card, Empty, IconName, Section, styles } from '@/components/ui';
import { eventCategory } from '@/lib/labels';
import { followingOf } from '@/lib/social';
import { useMe, useStore } from '@/lib/store';
import { hhmm, useNow, when } from '@/lib/time';
import { colors } from '@/theme';

export default function EventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, actions, groups, rides, following, users } = useStore();
  const me = useMe();
  const now = useNow();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Empty icon="calendar-outline" title="Evento não encontrado" /></ScrollView>;
  }

  const cat = eventCategory(event.category);
  const live = event.startsAt <= now && now < event.endsAt;
  const ended = event.endsAt <= now;
  const going = event.going.includes(me.id);
  const interested = event.interested.includes(me.id);
  const group = event.groupId ? groups.find((g) => g.id === event.groupId) : undefined;
  const isGroupAdmin = !!group && group.members[me.id] === 'admin';
  const eventRides = rides.filter((r) => r.eventId === event.id && !r.cancelled).sort((a, b) => a.departsAt - b.departsAt);
  const myFollowing = new Set(followingOf(following, me.id));
  const friendsGoing = [...event.going, ...event.interested].filter((uid, i, arr) => arr.indexOf(uid) === i && myFollowing.has(uid))
    .map((uid) => users[uid]).filter((u): u is NonNullable<typeof u> => !!u);

  const info = (icon: IconName, text: string) => (
    <View style={[styles.row, { alignItems: 'flex-start' }]}>
      <Ionicons name={icon} size={18} color={colors.accent} style={{ marginTop: 1 }} />
      <Text style={[styles.body, { flex: 1 }]}>{text}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { gap: 20 }]}>
      <View style={{ gap: 10 }}>
        <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
          <Badge label={cat.label} icon={cat.icon} />
          {live ? <Badge label="ROLANDO AGORA" icon="radio" tone="accent" /> : null}
          {ended ? <Badge label="Encerrado" /> : null}
          {event.sponsored ? <Badge label="Patrocinado" tone="warn" /> : null}
        </View>
        <Text style={[styles.h1, { fontSize: 32 }]}>{event.title}</Text>
      </View>

      <Card>
        {info('time-outline', `${when(event.startsAt, now)} – ${hhmm(event.endsAt)}`)}
        {info('location-outline', event.location)}
        {group ? (
          <Pressable onPress={() => openGroup(group.id)} accessibilityRole="link" style={[styles.row, { alignItems: 'flex-start' }]}>
            <Ionicons name="megaphone-outline" size={18} color={colors.accent} style={{ marginTop: 1 }} />
            <Text style={[styles.body, { flex: 1 }]}>Organização: <Text style={{ color: colors.accent, fontWeight: '700' }}>{group.name}</Text></Text>
          </Pressable>
        ) : info('megaphone-outline', `Organização: ${event.organizer}`)}
        {info('people-outline', `${event.going.length} vão · ${event.interested.length} interessados`)}
      </Card>

      {friendsGoing.length ? (
        <View style={[styles.row, { gap: 10 }]}>
          <View style={{ flexDirection: 'row' }}>
            {friendsGoing.slice(0, 5).map((u, i) => (
              <View key={u.id} style={{ marginLeft: i ? -10 : 0, borderRadius: 99, borderWidth: 2, borderColor: colors.bg }}>
                <Avatar user={u} size={30} />
              </View>
            ))}
          </View>
          <Text style={[styles.muted, { flex: 1 }]}>
            {friendsGoing.slice(0, 2).map((u) => u.name.split(' ')[0]).join(', ')}
            {friendsGoing.length > 2 ? ` e mais ${friendsGoing.length - 2}` : ''} que você segue {friendsGoing.length === 1 ? 'vai' : 'vão'}
          </Text>
        </View>
      ) : null}

      {!ended ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label={interested ? 'Interessado ✓' : 'Tenho interesse'} icon={interested ? 'star' : 'star-outline'}
            variant={interested ? 'primary' : 'secondary'} onPress={() => actions.toggleEvent(event.id, 'interested')} style={{ flex: 1 }} />
          <Button label={going ? 'Eu vou ✓' : 'Eu vou'} icon={going ? 'checkmark-circle' : 'checkmark-circle-outline'}
            variant={going ? 'primary' : 'secondary'} onPress={() => actions.toggleEvent(event.id, 'going')} style={{ flex: 1 }} />
        </View>
      ) : null}

      {event.ticketUrl && !ended ? (
        <Button label="Comprar ingresso" icon="ticket-outline" variant="secondary" onPress={() => Linking.openURL(event.ticketUrl!)} />
      ) : null}

      {event.description ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.body}>{event.description}</Text>
        </View>
      ) : null}

      {!ended && (eventRides.length || isGroupAdmin) ? (
        <Section title="Como chegar: saídas">
          {eventRides.map((r) => <RideCard key={r.id} ride={r} />)}
          {isGroupAdmin ? (
            <Button label="Nova saída para este evento" icon="bus" variant="secondary" compact
              onPress={() => router.push({ pathname: '/criar', params: { tipo: 'saida', grupo: group!.id, evento: event.id } })} />
          ) : null}
        </Section>
      ) : null}

      {!ended ? (
        <Card>
          <Text style={styles.title}>Não quer ir sozinho?</Text>
          <Text style={styles.muted}>Crie um Bora? e combine com mais gente da comunidade.</Text>
          <Button label="Criar Bora? para este evento" icon="people" compact
            onPress={() => router.push({ pathname: '/criar', params: { tipo: 'bora', atividade: `Ir ao ${event.title}`, local: event.location } })} />
        </Card>
      ) : null}

      <Button label="Denunciar evento" icon="flag-outline" variant="ghost" compact
        onPress={() => router.push({ pathname: '/denunciar', params: { tipo: 'evento', id: event.id, autor: event.createdBy } })} />
    </ScrollView>
  );
}
