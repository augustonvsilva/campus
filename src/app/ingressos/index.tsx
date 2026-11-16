import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Badge, Empty, Notice, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import { brl } from '@/lib/tickets';
import { shortDate, useNow, when } from '@/lib/time';
import { colors, radius } from '@/theme';

/** Meus ingressos: um item por pedido, os próximos primeiro. */
export default function MeusIngressos() {
  const { tickets, events } = useStore();
  const me = useMe();
  const now = useNow();
  const mine = tickets.filter((t) => t.buyerId === me.id);
  const orders = [...new Map(mine.map((t) => [t.orderId, mine.filter((x) => x.orderId === t.orderId)])).values()]
    .map((list) => ({ list, event: events.find((e) => e.id === list[0]!.eventId) }))
    .sort((a, b) => {
      const pa = (a.event?.endsAt ?? 0) < now, pb = (b.event?.endsAt ?? 0) < now;
      if (pa !== pb) return pa ? 1 : -1;
      return (a.event?.startsAt ?? 0) - (b.event?.startsAt ?? 0);
    });

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { gap: 12 }]}
      data={orders}
      keyExtractor={(o) => o.list[0]!.orderId}
      ListHeaderComponent={<Notice icon="flask-outline" text="Demonstração: os ingressos ficam salvos neste aparelho." />}
      ListEmptyComponent={
        <Empty icon="ticket-outline" title="Nenhum ingresso ainda" text="Quando você comprar ingresso de uma festa ou evento pelo Campus, ele aparece aqui com o QR code." />
      }
      renderItem={({ item: { list, event } }) => {
        const past = (event?.endsAt ?? 0) < now;
        const used = list.filter((t) => t.checkedInAt).length;
        return (
          <Pressable onPress={() => router.push({ pathname: '/ingressos/[id]', params: { id: list[0]!.id } })} accessibilityRole="link"
            accessibilityLabel={`Ingresso para ${event?.title ?? 'evento'}`}
            style={({ pressed }) => [styles.card, styles.row, { gap: 14, opacity: past ? 0.6 : pressed ? 0.85 : 1 }]}>
            <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              {event ? (
                <>
                  <Text style={{ color: colors.onAccent, fontWeight: '900', fontSize: 20 }}>{shortDate(event.startsAt).day}</Text>
                  <Text style={{ color: colors.onAccentMuted, fontWeight: '800', fontSize: 11 }}>{shortDate(event.startsAt).month.toUpperCase()}</Text>
                </>
              ) : <Ionicons name="ticket" size={24} color={colors.onAccent} />}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.title} numberOfLines={1}>{event?.title ?? 'Evento'}</Text>
              <Text style={styles.hint} numberOfLines={1}>{event ? when(event.startsAt, now) : ''}</Text>
              <View style={[styles.row, { gap: 6, marginTop: 4 }]}>
                <Badge label={`${list.length} ${list.length === 1 ? 'ingresso' : 'ingressos'} · ${brl(list.reduce((n, t) => n + t.priceCents, 0))}`} />
                {past ? <Badge label="Encerrado" /> : used ? <Badge label={`${used} usado${used > 1 ? 's' : ''}`} tone="warn" /> : <Badge label="Válido" tone="accent" />}
              </View>
            </View>
            <Ionicons name="qr-code-outline" size={26} color={colors.muted} />
          </Pressable>
        );
      }}
    />
  );
}
