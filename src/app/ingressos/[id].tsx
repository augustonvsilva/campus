import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { QuickActions } from '@/components/actions';
import { QRCodeView } from '@/components/qr';
import { Badge, Button, CampusLogo, Empty, Notice, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import { brl } from '@/lib/tickets';
import { hhmm, useNow, when } from '@/lib/time';
import type { Ticket } from '@/lib/types';
import { colors, hardShadow, radius } from '@/theme';

/** Um ingresso, no formato de bilhete: dados do evento, titular e QR code para a portaria. */
function TicketCard({ ticket, index, total }: { ticket: Ticket; index: number; total: number }) {
  const { events } = useStore();
  const now = useNow();
  const event = events.find((e) => e.id === ticket.eventId);
  const lot = event?.ticketing?.lots.find((l) => l.id === ticket.lotId);
  return (
    <View style={{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...hardShadow(5) }}>
      <View style={{ backgroundColor: colors.accent, padding: 16, gap: 4 }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={{ color: colors.onAccent, fontWeight: '900', letterSpacing: 1.2, fontSize: 12 }}>INGRESSO{total > 1 ? ` ${index + 1} DE ${total}` : ''}</Text>
          <CampusLogo size={28} />
        </View>
        <Text style={{ color: colors.onAccent, fontWeight: '900', fontSize: 22 }}>{event?.title ?? 'Evento'}</Text>
        {event ? <Text style={{ color: colors.onAccentMuted, fontSize: 13 }}>{when(event.startsAt, now)} · {event.location}</Text> : null}
      </View>
      {/* Picote do bilhete */}
      <View style={{ height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.border, marginHorizontal: 12 }} />
      <View style={{ padding: 18, gap: 14, alignItems: 'center' }}>
        <View style={{ opacity: ticket.checkedInAt ? 0.35 : 1 }}>
          <QRCodeView value={`CAMPUS:${ticket.code}`} size={220} label={`QR code do ingresso ${ticket.code}`} />
        </View>
        <Text style={[styles.title, { letterSpacing: 3, fontSize: 18 }]} selectable>{ticket.code}</Text>
        {ticket.checkedInAt
          ? <Badge label={`Utilizado às ${hhmm(ticket.checkedInAt)}`} icon="checkmark-done" tone="warn" />
          : <Badge label="Válido · apresente na entrada" icon="shield-checkmark" tone="accent" />}
        <View style={{ alignSelf: 'stretch', gap: 6 }}>
          <Row k="Titular" v={ticket.holderName} />
          <Row k="Tipo" v={lot?.name ?? '—'} />
          <Row k="Valor" v={brl(ticket.priceCents)} />
          <Row k="Pagamento" v={ticket.method === 'pix' ? 'Pix' : ticket.cardLabel ?? 'Cartão'} />
        </View>
      </View>
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <Text style={styles.muted}>{k}</Text>
      <Text style={[styles.label, { flexShrink: 1, textAlign: 'right' }]}>{v}</Text>
    </View>
  );
}

/** Pedido: mostra todos os ingressos comprados juntos. Com ?novo=1, a confirmação da compra. */
export default function Ingresso() {
  const { id, novo } = useLocalSearchParams<{ id: string; novo?: string }>();
  const { tickets, events } = useStore();
  const me = useMe();
  const ticket = tickets.find((t) => t.id === id && t.buyerId === me.id);
  if (!ticket) {
    return <View style={[styles.screen, styles.content]}><Empty icon="ticket-outline" title="Ingresso não encontrado" /></View>;
  }
  const order = tickets.filter((t) => t.orderId === ticket.orderId).sort((a, b) => a.holderName.localeCompare(b.holderName));
  const event = events.find((e) => e.id === ticket.eventId);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { gap: 18 }]}>
      {novo ? (
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.online, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.h2}>Pagamento aprovado!</Text>
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            {order.length > 1 ? `Seus ${order.length} ingressos estão aqui` : 'Seu ingresso está aqui'} e em “Meus ingressos”.
          </Text>
        </View>
      ) : null}
      <Notice icon="mail-outline"
        text={`Enviamos ${order.length > 1 ? 'os ingressos' : 'o ingresso'} para ${ticket.email}. Demonstração: nenhum e-mail sai do aparelho; na versão final ele chega com o QR code.`} />
      {order.map((t, i) => <TicketCard key={t.id} ticket={t} index={i} total={order.length} />)}
      {event ? (
        <QuickActions place={event.location} calendar={{
          title: event.title, start: event.startsAt, end: event.endsAt, location: event.location, details: `Ingresso Campus: ${ticket.code}`,
        }} />
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Meus ingressos" icon="ticket-outline" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/ingressos')} />
        {event ? <Button label="Ver evento" icon="calendar-outline" variant="secondary" style={{ flex: 1 }} onPress={() => router.push(`/evento/${event.id}`)} /> : null}
      </View>
    </ScrollView>
  );
}
