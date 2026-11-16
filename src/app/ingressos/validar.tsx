import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button, Card, Empty, Field, Notice, Section, styles } from '@/components/ui';
import { isModerator, useMe, useStore } from '@/lib/store';
import { brl, canManageEvent, soldOf } from '@/lib/tickets';
import { hhmm } from '@/lib/time';
import type { Ticket } from '@/lib/types';
import { colors, radius } from '@/theme';

type Result = { status: 'ok' | 'usado' | 'invalido' | 'outro_evento'; ticket?: Ticket };

/** Portaria: resumo de vendas e validação do código do ingresso (cada um entra uma vez). */
export default function Validar() {
  const { evento } = useLocalSearchParams<{ evento: string }>();
  const { events, groups, tickets, actions, ticketsEnabled } = useStore();
  const me = useMe();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const event = events.find((e) => e.id === evento);
  const group = event?.groupId ? groups.find((g) => g.id === event.groupId) : undefined;

  if (!ticketsEnabled || !event?.ticketing || !canManageEvent(event, me.id, group?.members[me.id] === 'admin', isModerator(me))) {
    return <View style={[styles.screen, styles.content]}><Empty icon="lock-closed-outline" title="Só a organização valida ingressos" /></View>;
  }
  const evTickets = tickets.filter((t) => t.eventId === event.id);
  const checked = evTickets.filter((t) => t.checkedInAt).length;
  const lots = event.ticketing.lots;
  const sold = lots.reduce((n, l) => n + soldOf(l, tickets), 0);
  const revenue = lots.reduce((n, l) => n + soldOf(l, tickets) * l.priceCents, 0);

  const check = () => {
    if (!code.trim()) return;
    setResult(actions.checkInTicket(event.id, code));
    setCode('');
  };

  const feedback: Record<Result['status'], { icon: 'checkmark-circle' | 'alert-circle' | 'close-circle'; color: string; title: string }> = {
    ok: { icon: 'checkmark-circle', color: colors.online, title: 'Entrada liberada' },
    usado: { icon: 'alert-circle', color: colors.warn, title: 'Ingresso já utilizado' },
    invalido: { icon: 'close-circle', color: colors.danger, title: 'Código não encontrado' },
    outro_evento: { icon: 'close-circle', color: colors.danger, title: 'Ingresso de outro evento' },
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={[styles.content, { gap: 18 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.h2}>{event.title}</Text>
        <Stat label="Arrecadado" value={brl(revenue)} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Ingressos vendidos" value={String(sold)} />
          <Stat label="Entraram" value={`${checked}/${evTickets.length}`} />
        </View>
        <Text style={styles.hint}>{'"Entraram" conta os ingressos comprados por este aparelho (demonstração).'}</Text>

        <Section title="Validar na entrada">
          <Field label="Código do ingresso" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters"
            autoCorrect={false} placeholder="Ex.: K7QX2M9PLA" onSubmitEditing={check} returnKeyType="done" />
          <Button label="Validar" icon="scan-outline" disabled={!code.trim()} onPress={check} />
          <Notice icon="camera-outline" text="Na versão final, a câmera do celular lê o QR code direto. Aqui, digite o código impresso abaixo do QR." />
        </Section>

        {result ? (
          <Card style={{ borderColor: feedback[result.status].color, borderWidth: 2, alignItems: 'center', gap: 6 }}>
            <Ionicons name={feedback[result.status].icon} size={54} color={feedback[result.status].color} />
            <Text style={[styles.h2, { color: feedback[result.status].color }]}>{feedback[result.status].title}</Text>
            {result.ticket ? (
              <Text style={styles.body}>
                {result.ticket.holderName} · {lots.find((l) => l.id === result.ticket!.lotId)?.name ?? ''}
                {result.status === 'usado' && result.ticket.checkedInAt ? ` · entrou às ${hhmm(result.ticket.checkedInAt)}` : ''}
              </Text>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 2 }}>
      <Text style={[styles.title, { fontSize: 20 }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.hint}>{label}</Text>
    </View>
  );
}
