import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { QuickActions } from '@/components/actions';
import { openGroup, RideCard } from '@/components/social';
import { Avatar, Badge, Button, Card, Empty, IconName, Section, styles } from '@/components/ui';
import { eventCategory } from '@/lib/labels';
import { followingOf } from '@/lib/social';
import { isModerator, useMe, useStore } from '@/lib/store';
import { brl, canManageEvent, remainingOf } from '@/lib/tickets';
import { hhmm, useNow, when } from '@/lib/time';
import { colors } from '@/theme';

export default function EventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, actions, groups, rides, following, users, tickets, ticketsEnabled } = useStore();
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

  const myTickets = tickets.filter((t) => t.eventId === event.id && t.buyerId === me.id);
  const manager = canManageEvent(event, me.id, isGroupAdmin, isModerator(me));

  /** Ingressos vendidos pelo Campus: lotes, comprar, meus ingressos e (organização) portaria. */
  const ticketsSection = event.ticketing ? (() => {
    const lots = event.ticketing.lots;
    const from = Math.min(...lots.filter((l) => remainingOf(l, tickets) > 0).map((l) => l.priceCents));
    const soldOut = !Number.isFinite(from);
    return (
      <Card style={{ gap: 12, borderColor: colors.navActiveBorder }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={[styles.row, { gap: 8 }]}>
            <Ionicons name="ticket" size={20} color={colors.accentSoft} />
            <Text style={styles.title}>Ingressos</Text>
          </View>
          {!soldOut ? <Text style={styles.label}>a partir de {brl(from)}</Text> : <Badge label="Esgotado" tone="warn" />}
        </View>
        {lots.map((l) => {
          const left = remainingOf(l, tickets);
          return (
            <View key={l.id} style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={[styles.body, !left && { color: colors.muted, textDecorationLine: 'line-through' }]}>{l.name}</Text>
              <Text style={[styles.label, !left && { color: colors.muted }]}>{left ? brl(l.priceCents) : 'Esgotado'}</Text>
            </View>
          );
        })}
        {!ended && !soldOut ? (
          <Button label="Comprar ingresso" icon="ticket-outline" onPress={() => router.push({ pathname: '/ingressos/comprar', params: { evento: event.id } })} />
        ) : null}
        {myTickets.length ? (
          <Button label={`Ver meu${myTickets.length > 1 ? 's' : ''} ingresso${myTickets.length > 1 ? 's' : ''} (${myTickets.length})`} icon="qr-code-outline" variant="secondary"
            onPress={() => router.push({ pathname: '/ingressos/[id]', params: { id: myTickets[0]!.id } })} />
        ) : null}
        {manager ? (
          <Button label="Vendas e portaria" icon="scan-outline" variant="ghost" compact
            onPress={() => router.push({ pathname: '/ingressos/validar', params: { evento: event.id } })} />
        ) : null}
        <Text style={styles.hint}>Pix ou cartão. O ingresso chega no app e no seu e-mail, com QR code.</Text>
      </Card>
    );
  })() : null;

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
            <Text style={[styles.body, { flex: 1 }]}>Organização: <Text style={{ color: colors.accentSoft, fontWeight: '700' }}>{group.name}</Text></Text>
          </Pressable>
        ) : info('megaphone-outline', `Organização: ${event.organizer}`)}
        {info('people-outline', `${event.going.length} vão · ${event.interested.length} interessados`)}
      </Card>

      <QuickActions
        share={{ title: event.title, path: `/evento/${event.id}` }}
        place={event.location}
        calendar={ended ? undefined : {
          title: event.title, start: event.startsAt, end: event.endsAt, location: event.location,
          details: event.description || `Organização: ${event.organizer}`,
        }}
      />

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

      {ticketsEnabled && event.ticketing ? (
        ticketsSection
      ) : event.ticketUrl && !ended ? (
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
