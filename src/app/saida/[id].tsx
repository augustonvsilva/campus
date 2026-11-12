import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { EventCard } from '@/components/cards';
import { GroupCard, PersonRow } from '@/components/social';
import { Badge, Button, Card, Empty, IconName, Notice, Section, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import { relativeStart, useNow, whenInline } from '@/lib/time';
import { colors } from '@/theme';

export default function SaidaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rides, groups, events, users, actions, isVisible } = useStore();
  const me = useMe();
  const now = useNow();
  const ride = rides.find((r) => r.id === id);
  if (!ride) {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Empty icon="bus-outline" title="Saída não encontrada" /></ScrollView>;
  }
  const group = groups.find((g) => g.id === ride.groupId);
  const event = ride.eventId ? events.find((e) => e.id === ride.eventId) : undefined;
  const isAdmin = !!group && group.members[me.id] === 'admin';
  const reserved = ride.reservations.includes(me.id);
  const full = !!ride.seats && ride.reservations.length >= ride.seats;
  const departed = ride.departsAt < now - 15 * 60_000;

  const info = (icon: IconName, text: string) => (
    <View style={[styles.row, { alignItems: 'flex-start' }]}>
      <Ionicons name={icon} size={18} color={colors.accent} style={{ marginTop: 1 }} />
      <Text style={[styles.body, { flex: 1 }]}>{text}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { gap: 20 }]}>
      {ride.cancelled ? <Notice tone="warn" icon="close-circle" text="Esta saída foi cancelada pela comunidade." /> : null}
      <View style={{ gap: 8 }}>
        <Text style={[styles.label, { color: colors.accent }]}>SAÍDA · {relativeStart(ride.departsAt, now).toUpperCase()}</Text>
        <Text style={[styles.h1, { fontSize: 28 }]}>{ride.title}</Text>
        {full && !ride.cancelled ? <Badge label="Lotada" tone="warn" /> : null}
      </View>

      <Card>
        {info('time-outline', `Sai ${whenInline(ride.departsAt, now)}`)}
        {info('location-outline', `Ponto de partida: ${ride.departurePoint}`)}
        {info('flag-outline', `Destino: ${ride.destination}`)}
        {info('people-outline', `${ride.reservations.length}${ride.seats ? ` de ${ride.seats}` : ''} lugares reservados`)}
        {ride.price ? info('cash-outline', ride.price) : null}
        {ride.notes ? info('chatbox-ellipses-outline', ride.notes) : null}
        <Text style={styles.hint}>Pagamento e embarque são combinados com a comunidade organizadora. O Campus não intermedeia valores.</Text>
      </Card>

      {!ride.cancelled && !departed ? (
        <Button
          label={reserved ? 'Cancelar minha reserva' : full ? 'Lotada' : 'Reservar meu lugar'}
          icon={reserved ? 'close' : 'bus'}
          variant={reserved ? 'secondary' : 'primary'}
          disabled={!reserved && full}
          onPress={() => actions.toggleRide(ride.id)}
        />
      ) : null}

      {event ? <Section title="Para o evento"><EventCard event={event} /></Section> : null}
      {group ? <Section title="Organização"><GroupCard group={group} /></Section> : null}

      <Section title={`Quem vai (${ride.reservations.length})`}>
        {ride.reservations.filter(isVisible).map((uid) => {
          const u = users[uid];
          return u ? <PersonRow key={uid} user={u} /> : null;
        })}
        {!ride.reservations.length ? <Text style={styles.muted}>Ninguém reservou ainda.</Text> : null}
      </Section>

      {isAdmin && !ride.cancelled ? (
        <Button label="Cancelar saída" icon="close" variant="danger" onPress={() => actions.cancelRide(ride.id)} />
      ) : !isAdmin ? (
        <Button label="Denunciar saída" icon="flag-outline" variant="ghost" compact
          onPress={() => router.push({ pathname: '/denunciar', params: { tipo: 'saida', id: ride.id, autor: ride.createdBy } })} />
      ) : null}
    </ScrollView>
  );
}
