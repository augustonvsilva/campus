import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button, Card, Chip, ChipRow, Field, Notice, styles, ToggleRow, VerifyPrompt } from '@/components/ui';
import { EVENT_CATEGORIES } from '@/lib/labels';
import { canPublish, LocalImage, useMe, useStore } from '@/lib/store';
import { parseBRL } from '@/lib/tickets';
import { at, HOUR, MIN, parseDateTime, useNow, when, whenInline } from '@/lib/time';
import type { BoraVisibility, EventCategory } from '@/lib/types';

type Kind = 'post' | 'bora' | 'evento' | 'saida';

export default function Criar() {
  const params = useLocalSearchParams<{ tipo?: Kind; atividade?: string; local?: string; grupo?: string; evento?: string }>();
  const me = useMe();
  const { groups } = useStore();
  // Criando dentro de uma comunidade: mural (membros) ou agenda/saídas (admins).
  const group = params.grupo ? groups.find((g) => g.id === params.grupo && g.members[me.id]) : undefined;
  const isAdmin = !!group && group.members[me.id] === 'admin';
  const [kind, setKind] = useState<Kind>(params.tipo ?? 'post');

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: group ? `Criar em ${group.name}` : 'Criar' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ChipRow>
          <Chip label={group ? 'No mural' : 'Publicação'} icon="chatbubble-ellipses" active={kind === 'post'} onPress={() => setKind('post')} />
          {!group ? <Chip label="Bora?" icon="people" active={kind === 'bora'} onPress={() => setKind('bora')} /> : null}
          {!group || isAdmin ? <Chip label="Evento" icon="calendar" active={kind === 'evento'} onPress={() => setKind('evento')} /> : null}
          {isAdmin ? <Chip label="Saída" icon="bus" active={kind === 'saida'} onPress={() => setKind('saida')} /> : null}
        </ChipRow>

        {!canPublish(me) ? (
          <VerifyPrompt text="Para publicar, confirme seu vínculo com a universidade. Leva 1 minuto: enviamos um código para o seu e-mail institucional." />
        ) : kind === 'post' ? (
          <PostForm groupId={group?.id} />
        ) : kind === 'bora' ? (
          <BoraForm initialActivity={params.atividade} initialPlace={params.local} />
        ) : kind === 'saida' && group && isAdmin ? (
          <RideForm groupId={group.id} initialEventId={params.evento} />
        ) : kind === 'evento' && (!group || isAdmin) ? (
          <EventForm groupId={group?.id} organizerName={group?.name} />
        ) : (
          <Notice icon="lock-closed-outline" text="Só admins da comunidade podem criar eventos e saídas." />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RideForm({ groupId, initialEventId }: { groupId: string; initialEventId?: string }) {
  const { actions, events } = useStore();
  const now = useNow(60_000);
  const upcoming = events.filter((e) => e.endsAt > now).sort((a, b) => a.startsAt - b.startsAt).slice(0, 12);
  const [eventId, setEventId] = useState<string | undefined>(initialEventId);
  const linked = events.find((e) => e.id === eventId);
  const [title, setTitle] = useState(linked ? `Combi para ${linked.title}` : '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [departurePoint, setDeparturePoint] = useState('');
  const [destination, setDestination] = useState(linked?.location ?? '');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [pixKey, setPixKey] = useState('');

  const departsAt = parseDateTime(date, time, now);
  const nSeats = Number(seats);
  const valid = title.trim().length >= 3 && departsAt !== null && departurePoint.trim().length >= 3
    && destination.trim().length >= 3 && (!seats || (Number.isInteger(nSeats) && nSeats >= 1 && nSeats <= 200));

  const pickEvent = (id: string | undefined) => {
    setEventId(id);
    const e = events.find((x) => x.id === id);
    if (e) {
      if (!title.trim()) setTitle(`Combi para ${e.title}`);
      if (!destination.trim()) setDestination(e.location);
    }
  };

  const submit = () => {
    if (departsAt === null) return;
    const id = actions.addRide({
      groupId, eventId, title: title.trim(), departsAt, departurePoint: departurePoint.trim(), destination: destination.trim(),
      seats: seats ? nSeats : undefined, price: price.trim() || undefined, notes: notes.trim() || undefined,
      pixKey: pixKey.trim() || undefined, comments: [],
    });
    router.replace(`/saida/${id}`);
  };

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.h2}>Combi, ônibus ou van saindo junto.</Text>
      <View style={{ gap: 8 }}>
        <Text style={styles.fieldLabel}>Para qual evento? (opcional)</Text>
        <ChipRow>
          <Chip label="Nenhum" active={!eventId} onPress={() => pickEvent(undefined)} />
          {upcoming.map((e) => <Chip key={e.id} label={e.title} active={eventId === e.id} onPress={() => pickEvent(e.id)} />)}
        </ChipRow>
      </View>
      <Field label="Título" value={title} onChangeText={setTitle} maxLength={80} placeholder="Ex.: Combi para a Interatlética" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Field label="Data da saída" value={date} onChangeText={setDate} placeholder="dd/mm" keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><Field label="Horário" value={time} onChangeText={setTime} placeholder="hh:mm" keyboardType="numbers-and-punctuation" /></View>
      </View>
      {date && time ? <Text style={styles.hint}>{departsAt ? `Sai ${whenInline(departsAt, now)}` : 'Data ou horário inválido'}</Text> : null}
      <Field label="Ponto de partida" value={departurePoint} onChangeText={setDeparturePoint} maxLength={100}
        placeholder="Ex.: Portão principal" hint="Use um ponto público e fácil de achar." />
      <Field label="Destino" value={destination} onChangeText={setDestination} maxLength={100} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Field label="Lugares" value={seats} onChangeText={(v) => setSeats(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="Sem limite" /></View>
        <View style={{ flex: 1 }}><Field label="Valor (opcional)" value={price} onChangeText={setPrice} maxLength={30} placeholder="Ex.: R$ 15" /></View>
      </View>
      <Field label="Chave Pix (opcional)" value={pixKey} onChangeText={setPixKey} maxLength={140} autoCapitalize="none"
        placeholder="E-mail, telefone, CPF/CNPJ ou chave aleatória" hint="Aparece com botão de copiar para quem for pagar." />
      <Field label="Observações" value={notes} onChangeText={setNotes} multiline maxLength={500}
        placeholder="Horário de volta, como pagar, o que levar…" />
      <Button label="Publicar saída" icon="bus" disabled={!valid} onPress={submit} />
    </View>
  );
}

function PostForm({ groupId }: { groupId?: string }) {
  const { actions } = useStore();
  const [text, setText] = useState('');
  const [withPoll, setWithPoll] = useState(false);
  const [options, setOptions] = useState(['', '']);
  const [ttl, setTtl] = useState<number | undefined>();
  const [image, setImage] = useState<LocalImage | undefined>();

  const pollOptions = options.map((o) => o.trim()).filter(Boolean);
  const valid = text.trim().length > 0 && (!withPoll || pollOptions.length >= 2);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    const asset = res.canceled ? undefined : res.assets[0];
    if (asset) setImage({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
  };

  const submit = () => {
    actions.addPost({ text, pollOptions: withPoll ? pollOptions : undefined, ttlHours: ttl, image, groupId });
    router.back();
  };

  return (
    <View style={{ gap: 16 }}>
      <Field label="O que está rolando?" value={text} onChangeText={setText} multiline maxLength={1000}
        placeholder="Uma pergunta, recomendação ou aviso para a comunidade…" />

      {image ? (
        <View style={{ gap: 8 }}>
          <Image source={{ uri: image.uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 14 }} resizeMode="cover"
            accessibilityLabel="Foto selecionada" />
          <Button label="Remover foto" icon="close" variant="ghost" compact onPress={() => setImage(undefined)} />
        </View>
      ) : (
        <Button label="Adicionar foto" icon="image-outline" variant="secondary" compact onPress={pickImage} />
      )}
      <Text style={styles.hint}>Só publique fotos de pessoas que autorizaram o uso da imagem.</Text>

      <ToggleRow label="Adicionar enquete" value={withPoll} onValueChange={setWithPoll} />
      {withPoll ? (
        <View style={{ gap: 8 }}>
          {options.map((o, i) => (
            <Field key={i} label={`Opção ${i + 1}`} value={o} maxLength={60}
              onChangeText={(v) => setOptions(options.map((x, j) => (j === i ? v : x)))} />
          ))}
          {options.length < 4 ? (
            <Button label="Adicionar opção" icon="add" variant="ghost" compact onPress={() => setOptions([...options, ''])} />
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text style={styles.fieldLabel}>Validade</Text>
        <Text style={styles.hint}>Avisos com validade aparecem no Agora e somem quando expiram.</Text>
        <ChipRow>
          {[undefined, 2, 6, 24].map((h) => (
            <Chip key={String(h)} label={h ? `${h} h` : 'Sem validade'} active={ttl === h} onPress={() => setTtl(h)} />
          ))}
        </ChipRow>
      </View>

      <Button label="Publicar" icon="send" disabled={!valid} onPress={submit} />
    </View>
  );
}

function BoraForm({ initialActivity, initialPlace }: { initialActivity?: string; initialPlace?: string }) {
  const { actions } = useStore();
  const now = useNow();
  const slots = [
    { label: 'Agora', ts: now },
    { label: 'Em 30 min', ts: now + 30 * MIN },
    { label: 'Em 1 h', ts: now + HOUR },
    { label: 'Em 2 h', ts: now + 2 * HOUR },
    { label: 'Hoje 19h', ts: at(0, 19, 0, now) },
    { label: 'Amanhã 12h', ts: at(1, 12, 0, now) },
  ].filter((s) => s.ts >= now - MIN);

  const [activity, setActivity] = useState(initialActivity ?? '');
  const [slot, setSlot] = useState(1);
  const [meetingPoint, setMeetingPoint] = useState(initialPlace ?? '');
  const [visibility, setVisibility] = useState<BoraVisibility>('comunidade');
  const [capacity, setCapacity] = useState('');

  const startsAt = slots[slot]?.ts ?? now;
  const cap = Number(capacity);
  const valid = activity.trim().length >= 3 && meetingPoint.trim().length >= 3 && (!capacity || (Number.isInteger(cap) && cap >= 2));

  const submit = () => {
    const id = actions.addBora({
      activity: activity.trim(), startsAt, meetingPoint: meetingPoint.trim(), visibility, capacity: capacity ? cap : undefined,
    });
    router.replace(`/bora/${id}`);
  };

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.h2}>Transforme a vontade em encontro.</Text>
      <Field label="Bora…" value={activity} onChangeText={setActivity} maxLength={80}
        placeholder="estudar em grupo, ver o jogo, almoçar depois da aula…" />

      <View style={{ gap: 8 }}>
        <Text style={styles.fieldLabel}>Quando (aproximado)</Text>
        <ChipRow>
          {slots.map((s, i) => <Chip key={s.label} label={s.label} active={slot === i} onPress={() => setSlot(i)} />)}
        </ChipRow>
        <Text style={styles.hint}>{when(startsAt)}</Text>
      </View>

      <Field label="Ponto de encontro" value={meetingPoint} onChangeText={setMeetingPoint} maxLength={80}
        placeholder="Ex.: portão principal, biblioteca, entrada do ginásio"
        hint="Escolha sempre um local público. Nunca compartilhe seu endereço." />

      <View style={{ gap: 8 }}>
        <Text style={styles.fieldLabel}>Quem pode ver</Text>
        <ChipRow>
          <Chip label="Toda a comunidade" icon="globe-outline" active={visibility === 'comunidade'} onPress={() => setVisibility('comunidade')} />
          <Chip label="Só quem tiver o link" icon="link" active={visibility === 'link'} onPress={() => setVisibility('link')} />
        </ChipRow>
      </View>

      <Field label="Limite de pessoas (opcional)" value={capacity} onChangeText={(v) => setCapacity(v.replace(/\D/g, ''))}
        keyboardType="number-pad" placeholder="Sem limite" />

      <Button label="Publicar Bora?" icon="flash" disabled={!valid} onPress={submit} />
    </View>
  );
}

interface LotDraft { name: string; price: string; quantity: string }

function EventForm({ groupId, organizerName }: { groupId?: string; organizerName?: string }) {
  const { actions, ticketsEnabled } = useStore();
  const [selling, setSelling] = useState(false);
  const [lots, setLots] = useState<LotDraft[]>([{ name: '1º lote', price: '', quantity: '' }]);
  const [pixKey, setPixKey] = useState('');
  const me = useMe();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('encontro');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(3);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState(organizerName ?? me.name);
  const [ticketUrl, setTicketUrl] = useState('');

  const startsAt = parseDateTime(date, time);
  const urlOk = !ticketUrl.trim() || /^https?:\/\/\S+\.\S+/.test(ticketUrl.trim());
  const parsedLots = lots.map((l) => ({ name: l.name.trim(), priceCents: parseBRL(l.price), quantity: Number(l.quantity) }));
  const lotsOk = !selling || (pixKey.trim().length >= 5 && parsedLots.every((l) =>
    l.name.length >= 2 && l.priceCents !== null && l.priceCents >= 100 && Number.isInteger(l.quantity) && l.quantity >= 1 && l.quantity <= 5000));
  const valid = title.trim().length >= 3 && startsAt !== null && location.trim().length >= 3 && organizer.trim() && urlOk && lotsOk;
  const setLot = (i: number, patch: Partial<LotDraft>) => setLots((list) => list.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const submit = () => {
    if (startsAt === null) return;
    const id = actions.addEvent({
      title: title.trim(), category, startsAt, endsAt: startsAt + duration * HOUR, location: location.trim(),
      description: description.trim(), organizer: organizer.trim(), ticketUrl: ticketUrl.trim() || undefined, groupId,
      ticketing: selling ? {
        pixKey: pixKey.trim(), receiver: organizer.trim(),
        lots: parsedLots.map((l, i) => ({ id: `${Date.now().toString(36)}-${i}`, name: l.name, priceCents: l.priceCents!, quantity: l.quantity, sold: 0 })),
      } : undefined,
    });
    router.replace(`/evento/${id}`);
  };

  return (
    <View style={{ gap: 16 }}>
      <Field label="Nome do evento" value={title} onChangeText={setTitle} maxLength={80} />
      <View style={{ gap: 8 }}>
        <Text style={styles.fieldLabel}>Categoria</Text>
        <ChipRow>
          {EVENT_CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} icon={c.icon} active={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </ChipRow>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Field label="Data" value={date} onChangeText={setDate} placeholder="dd/mm" keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><Field label="Horário" value={time} onChangeText={setTime} placeholder="hh:mm" keyboardType="numbers-and-punctuation" /></View>
      </View>
      {date && time ? <Text style={styles.hint}>{startsAt ? when(startsAt) : 'Data ou horário inválido'}</Text> : null}
      <View style={{ gap: 8 }}>
        <Text style={styles.fieldLabel}>Duração</Text>
        <ChipRow>
          {[1, 2, 3, 5, 8].map((h) => <Chip key={h} label={`${h} h`} active={duration === h} onPress={() => setDuration(h)} />)}
        </ChipRow>
      </View>
      <Field label="Local" value={location} onChangeText={setLocation} maxLength={100} />
      {groupId ? <Text style={styles.hint}>Organização: {organizer}</Text> : <Field label="Organizador" value={organizer} onChangeText={setOrganizer} maxLength={60} />}
      <Field label="Descrição" value={description} onChangeText={setDescription} multiline maxLength={1500} />
      {ticketsEnabled ? (
        <Card style={{ gap: 12 }}>
          <ToggleRow label="Vender ingressos pelo Campus" value={selling} onValueChange={setSelling}
            hint="Pix e cartão no app; cada pessoa recebe ingresso com QR code e você valida na entrada. (Demonstração: nada é cobrado.)" />
          {selling ? (
            <>
              {lots.map((l, i) => (
                <View key={i} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                    <View style={{ flex: 2 }}><Field label={`Lote ${i + 1}`} value={l.name} onChangeText={(v) => setLot(i, { name: v })} maxLength={30} placeholder="Ex.: 1º lote, Meia, Open bar" /></View>
                    {lots.length > 1 ? (
                      <Button label="" icon="trash-outline" variant="ghost" compact accessibilityLabel={`Remover lote ${i + 1}`}
                        onPress={() => setLots((list) => list.filter((_, j) => j !== i))} />
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}><Field label="Preço (R$)" value={l.price} onChangeText={(v) => setLot(i, { price: v })} keyboardType="decimal-pad" placeholder="40,00" /></View>
                    <View style={{ flex: 1 }}><Field label="Quantidade" value={l.quantity} onChangeText={(v) => setLot(i, { quantity: v.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="200" /></View>
                  </View>
                </View>
              ))}
              {lots.length < 4 ? (
                <Button label="Adicionar lote" icon="add" variant="secondary" compact
                  onPress={() => setLots((list) => [...list, { name: `${list.length + 1}º lote`, price: '', quantity: '' }])} />
              ) : null}
              <Field label="Chave Pix de quem recebe" value={pixKey} onChangeText={setPixKey} autoCapitalize="none"
                placeholder="E-mail, telefone, CPF/CNPJ ou chave aleatória" hint={`Recebedor: ${organizer || 'organização'}`} />
              {!lotsOk ? <Text style={styles.hint}>Preencha nome, preço (mínimo R$ 1,00) e quantidade de cada lote, e a chave Pix.</Text> : null}
            </>
          ) : null}
        </Card>
      ) : null}
      {!selling ? (
        <Field label="Link de ingressos (opcional)" value={ticketUrl} onChangeText={setTicketUrl} autoCapitalize="none" keyboardType="url"
          placeholder="https://…" hint={urlOk ? undefined : 'O link precisa começar com https://'} />
      ) : null}
      <Button label="Publicar evento" icon="calendar" disabled={!valid} onPress={submit} />
    </View>
  );
}
