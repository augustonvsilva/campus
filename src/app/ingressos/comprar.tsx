import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { QRCodeView } from '@/components/qr';
import { Button, Card, Chip, ChipRow, Empty, Field, Notice, Section, styles } from '@/components/ui';
import { pixPayload } from '@/lib/pix';
import { useMe, useStore } from '@/lib/store';
import { brl, cardBrand, expiryOk, formatCard, formatExpiry, luhn, onlyDigits, remainingOf } from '@/lib/tickets';
import { useNow, when } from '@/lib/time';
import type { PaymentMethod } from '@/lib/types';
import { colors } from '@/theme';

/** Checkout de ingresso: lote, quantidade, dados, Pix ou cartão. Na demo o pagamento é simulado. */
export default function Comprar() {
  const { evento } = useLocalSearchParams<{ evento: string }>();
  const { events, tickets, actions, community, ticketsEnabled } = useStore();
  const me = useMe();
  // Relógio de 1 s para a contagem do Pix.
  const now = useNow(1000);
  const event = events.find((e) => e.id === evento);
  const lots = event?.ticketing?.lots ?? [];
  const firstAvailable = lots.find((l) => remainingOf(l, tickets) > 0);

  const [lotId, setLotId] = useState(firstAvailable?.id ?? '');
  const [qty, setQty] = useState(1);
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email ?? '');
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [card, setCard] = useState({ number: '', holder: '', expiry: '', cvv: '', installments: 1 });
  const [stage, setStage] = useState<'form' | 'pix' | 'processing'>('form');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pixDeadline, setPixDeadline] = useState(0);

  // Pix: 15 minutos para pagar.
  const secondsLeft = Math.max(0, Math.round((pixDeadline - now) / 1000));
  const pixExpired = stage === 'pix' && secondsLeft === 0;

  if (!ticketsEnabled || !event?.ticketing) {
    return <View style={[styles.screen, styles.content]}><Empty icon="ticket-outline" title="Venda indisponível" text="Este evento não vende ingressos pelo Campus." /></View>;
  }
  const lot = lots.find((l) => l.id === lotId);
  const remaining = lot ? remainingOf(lot, tickets) : 0;
  const total = (lot?.priceCents ?? 0) * qty;
  const brand = cardBrand(card.number);

  const validate = (): string | null => {
    if (!lot || remaining < 1) return 'Escolha um lote disponível.';
    if (qty > remaining) return `Só restam ${remaining} ingressos nesse lote.`;
    if (name.trim().length < 3) return 'Informe o nome de quem vai usar o ingresso.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Informe um e-mail válido para receber o ingresso.';
    if (method === 'cartao') {
      if (!luhn(card.number)) return 'Número do cartão inválido.';
      if (card.holder.trim().length < 3) return 'Informe o nome impresso no cartão.';
      if (!expiryOk(card.expiry)) return 'Validade do cartão inválida ou vencida.';
      if (!/^\d{3,4}$/.test(card.cvv)) return 'CVV inválido.';
    }
    return null;
  };

  const issue = () => {
    const id = actions.buyTickets({
      eventId: event.id, lotId, quantity: qty, holderName: name, email, method,
      cardLabel: method === 'cartao' ? `${brand || 'Cartão'} final ${onlyDigits(card.number).slice(-4)}` : undefined,
    });
    router.replace({ pathname: '/ingressos/[id]', params: { id, novo: '1' } });
  };

  const pay = () => {
    const problem = validate();
    if (problem) return setError(problem);
    setError(null);
    if (method === 'pix') {
      setPixDeadline(now + 15 * 60_000);
      setStage('pix');
      return;
    }
    setStage('processing');
    // Demo: a "operadora" responde depois de um instante.
    setTimeout(() => {
      try { issue(); } catch (e) { setStage('form'); setError(e instanceof Error ? e.message : 'Pagamento recusado.'); }
    }, 1400);
  };

  const pix = pixPayload({
    key: event.ticketing.pixKey, amountCents: total, name: event.ticketing.receiver, city: community.city,
    txid: `CAMPUS${event.id}${qty}`.toUpperCase(), description: `${event.title} ${lot?.name ?? ''}`,
  });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={[styles.content, { gap: 20 }]} keyboardShouldPersistTaps="handled">
        <Notice icon="flask-outline" text="Demonstração: nenhum valor é cobrado e os dados do cartão não são guardados nem enviados." />

        <Card>
          <Text style={[styles.kicker]}>INGRESSO</Text>
          <Text style={styles.h2}>{event.title}</Text>
          <Text style={styles.muted}>{when(event.startsAt, now)} · {event.location}</Text>
        </Card>

        {stage === 'pix' ? (
          <Section title="Pague com Pix">
            <Card style={{ alignItems: 'center', gap: 14 }}>
              <Text style={[styles.h2, { fontSize: 28 }]}>{brl(total)}</Text>
              {pixExpired ? (
                <>
                  <Notice tone="warn" icon="time-outline" text="Este Pix expirou. Gere um novo para continuar." />
                  <Button label="Gerar novo Pix" icon="refresh" onPress={() => setPixDeadline(now + 15 * 60_000)} />
                </>
              ) : null}
              <View style={{ opacity: pixExpired ? 0.25 : 1 }}><QRCodeView value={pix} size={240} label="QR code do Pix" /></View>
              <Text style={styles.muted}>Abra o app do seu banco, escolha Pix → Ler QR code, ou copie o código.</Text>
              <Button label={copied ? 'Código copiado' : 'Copiar Pix copia e cola'} icon={copied ? 'checkmark' : 'copy-outline'} variant="secondary"
                onPress={() => Clipboard.setStringAsync(pix).then(() => setCopied(true))} />
              <View style={[styles.row, { gap: 8 }]}>
                <Ionicons name="time-outline" size={16} color={colors.muted} />
                <Text style={styles.muted}>Expira em {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</Text>
              </View>
              <Notice icon="hourglass-outline" text="Aguardando a confirmação do banco. Na versão final ela chega sozinha em segundos." />
              <Button label="Simular pagamento confirmado" icon="checkmark-done" disabled={pixExpired} onPress={() => { try { issue(); } catch (e) { setStage('form'); setError(e instanceof Error ? e.message : 'Erro.'); } }} />
              <Button label="Voltar e mudar o pagamento" variant="ghost" compact onPress={() => setStage('form')} />
            </Card>
          </Section>
        ) : (
          <>
            <Section title="1. Escolha o ingresso">
              {lots.map((l) => {
                const left = remainingOf(l, tickets);
                const active = l.id === lotId;
                return (
                  <Pressable key={l.id} disabled={!left} onPress={() => { setLotId(l.id); setQty(1); }}
                    accessibilityRole="radio" accessibilityState={{ selected: active, disabled: !left }} accessibilityLabel={`${l.name}, ${brl(l.priceCents)}${left ? '' : ', esgotado'}`}
                    style={[styles.card, styles.row, { padding: 16, opacity: left ? 1 : 0.5 }, active && { borderColor: colors.accent, borderWidth: 2 }]}>
                    <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.accent : colors.muted} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{l.name}</Text>
                      <Text style={styles.hint}>{left ? (left <= 20 ? `Últimos ${left}!` : `${left} disponíveis`) : 'Esgotado'}</Text>
                    </View>
                    <Text style={[styles.title, { fontSize: 18 }]}>{brl(l.priceCents)}</Text>
                  </Pressable>
                );
              })}
              {lot && remaining ? (
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Text style={styles.label}>Quantidade</Text>
                  <View style={[styles.row, { gap: 14 }]}>
                    <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} accessibilityRole="button" accessibilityLabel="Menos um ingresso" style={stepper()}>
                      <Ionicons name="remove" size={20} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.title, { fontSize: 20, minWidth: 20, textAlign: 'center' }]}>{qty}</Text>
                    <Pressable onPress={() => setQty((q) => Math.min(4, remaining, q + 1))} accessibilityRole="button" accessibilityLabel="Mais um ingresso" style={stepper()}>
                      <Ionicons name="add" size={20} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <Text style={styles.hint}>Até 4 ingressos por compra. Cada pessoa recebe um QR code próprio.</Text>
            </Section>

            <Section title="2. Seus dados">
              <Field label="Nome de quem vai usar" value={name} onChangeText={setName} autoComplete="name" />
              <Field label="E-mail para receber o ingresso" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            </Section>

            <Section title="3. Pagamento">
              <ChipRow>
                <Chip label="Pix" icon="flash-outline" active={method === 'pix'} onPress={() => setMethod('pix')} />
                <Chip label="Cartão de crédito" icon="card-outline" active={method === 'cartao'} onPress={() => setMethod('cartao')} />
              </ChipRow>
              {method === 'pix' ? (
                <Text style={styles.muted}>Aprovação na hora. Geramos o QR code e o Pix copia e cola na próxima tela.</Text>
              ) : (
                <View style={{ gap: 12 }}>
                  <Field label={`Número do cartão${brand ? ` · ${brand}` : ''}`} value={card.number}
                    onChangeText={(v) => setCard((c) => ({ ...c, number: formatCard(v) }))} keyboardType="number-pad" autoComplete="cc-number" placeholder="0000 0000 0000 0000" />
                  <Field label="Nome impresso no cartão" value={card.holder} onChangeText={(v) => setCard((c) => ({ ...c, holder: v.toUpperCase() }))}
                    autoCapitalize="characters" autoComplete="cc-name" />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Validade" value={card.expiry} onChangeText={(v) => setCard((c) => ({ ...c, expiry: formatExpiry(v) }))}
                        keyboardType="number-pad" placeholder="MM/AA" autoComplete="cc-exp" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="CVV" value={card.cvv} onChangeText={(v) => setCard((c) => ({ ...c, cvv: onlyDigits(v).slice(0, 4) }))}
                        keyboardType="number-pad" placeholder="123" secureTextEntry autoComplete="cc-csc" />
                    </View>
                  </View>
                  <Text style={styles.fieldLabel}>Parcelas</Text>
                  <ChipRow>
                    {[1, 2, 3].map((n) => (
                      <Chip key={n} label={n === 1 ? `À vista ${brl(total)}` : `${n}x ${brl(Math.ceil(total / n))}`} active={card.installments === n}
                        onPress={() => setCard((c) => ({ ...c, installments: n }))} />
                    ))}
                  </ChipRow>
                </View>
              )}
            </Section>

            <Card style={{ gap: 8 }}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.muted}>{qty}x {lot?.name ?? '—'}</Text>
                <Text style={styles.body}>{brl(total)}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.title}>Total</Text>
                <Text style={[styles.title, { fontSize: 22 }]}>{brl(total)}</Text>
              </View>
            </Card>

            {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
            <Button
              label={stage === 'processing' ? 'Processando pagamento…' : method === 'pix' ? `Gerar Pix de ${brl(total)}` : `Pagar ${brl(total)}`}
              icon={method === 'pix' ? 'qr-code-outline' : 'lock-closed'} disabled={stage === 'processing' || !lot || !remaining} onPress={pay}
            />
            <Text style={[styles.hint, { textAlign: 'center' }]}>Pagamento à organização do evento. O ingresso chega no app e no e-mail informado.</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Função (e não constante) para pegar as cores do tema ativo. */
const stepper = () => ({ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.surface2 });
