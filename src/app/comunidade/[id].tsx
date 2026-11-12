import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { EventCard, PostCard } from '@/components/cards';
import { GroupBadge, PersonRow, RideCard } from '@/components/social';
import { Badge, Button, Chip, ChipRow, Empty, Notice, styles } from '@/components/ui';
import { groupKind } from '@/lib/labels';
import { canPublish, useMe, useStore } from '@/lib/store';
import { useNow } from '@/lib/time';
import type { GroupRole } from '@/lib/types';
import { colors } from '@/theme';

type Tab = 'mural' | 'agenda' | 'saidas' | 'membros';

export default function ComunidadeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, posts, events, rides, users, isVisible, actions, refreshing } = useStore();
  const me = useMe();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('mural');
  const [error, setError] = useState<string | null>(null);
  const group = groups.find((g) => g.id === id);

  if (!group) {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Empty icon="people-outline" title="Comunidade não encontrada" /></ScrollView>;
  }

  const role = group.members[me.id];
  const isAdmin = role === 'admin';
  const members = Object.entries(group.members)
    .map(([uid, r]) => ({ user: users[uid], role: r }))
    .filter((m): m is { user: NonNullable<typeof m.user>; role: GroupRole } => !!m.user)
    .sort((a, b) => (a.role === b.role ? a.user.name.localeCompare(b.user.name) : a.role === 'admin' ? -1 : 1));
  const mural = posts.filter((p) => p.groupId === group.id && isVisible(p.authorId) && (!p.expiresAt || p.expiresAt > now))
    .sort((a, b) => b.createdAt - a.createdAt);
  const agenda = events.filter((e) => e.groupId === group.id && e.endsAt > now).sort((a, b) => a.startsAt - b.startsAt);
  const saidas = rides.filter((r) => r.groupId === group.id && r.departsAt > now - 3_600_000).sort((a, b) => a.departsAt - b.departsAt);

  const guard = (fn: () => void) => {
    try {
      setError(null);
      fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir.');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { gap: 18 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={actions.refresh} tintColor={colors.accent} />}>
      <Stack.Screen options={{ title: group.name }} />

      <View style={{ gap: 12 }}>
        <View style={[styles.row, { gap: 14 }]}>
          <GroupBadge group={group} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
              <Badge label={groupKind(group.kind).label} icon={groupKind(group.kind).icon} />
              {group.verified ? <Badge label="Oficial" icon="checkmark-circle" tone="accent" /> : null}
              {isAdmin ? <Badge label="Você é admin" tone="accent" /> : null}
            </View>
            <Text style={[styles.h2, { fontSize: 24 }]}>{group.name}</Text>
            <Text style={styles.muted}>{members.length} {members.length === 1 ? 'membro' : 'membros'}</Text>
          </View>
        </View>
        {group.description ? <Text style={styles.body}>{group.description}</Text> : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {role ? (
            <Button label="Participando ✓" variant="secondary" compact style={{ flex: 1 }} onPress={() => guard(() => actions.toggleMembership(group.id))} />
          ) : (
            <Button label="Entrar na comunidade" icon="add" compact style={{ flex: 1 }} onPress={() => guard(() => actions.toggleMembership(group.id))} />
          )}
          {isAdmin ? (
            <Button label="Editar" icon="create-outline" variant="secondary" compact
              onPress={() => router.push({ pathname: '/comunidade/nova', params: { editar: group.id } })} />
          ) : (
            <Button label="" icon="flag-outline" variant="ghost" compact accessibilityLabel="Denunciar comunidade"
              onPress={() => router.push({ pathname: '/denunciar', params: { tipo: 'comunidade', id: group.id } })} />
          )}
        </View>
        {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
      </View>

      <ChipRow>
        <Chip label="Mural" icon="chatbubbles-outline" active={tab === 'mural'} onPress={() => setTab('mural')} />
        <Chip label={`Agenda (${agenda.length})`} icon="calendar-outline" active={tab === 'agenda'} onPress={() => setTab('agenda')} />
        <Chip label={`Saídas (${saidas.length})`} icon="bus-outline" active={tab === 'saidas'} onPress={() => setTab('saidas')} />
        <Chip label="Membros" icon="people-outline" active={tab === 'membros'} onPress={() => setTab('membros')} />
      </ChipRow>

      {tab === 'mural' ? (
        <>
          {role && canPublish(me) ? (
            <Button label="Publicar no mural" icon="create-outline" variant="secondary"
              onPress={() => router.push({ pathname: '/criar', params: { tipo: 'post', grupo: group.id } })} />
          ) : !role ? (
            <Notice icon="information-circle" text="Entre na comunidade para publicar no mural." />
          ) : null}
          {mural.length ? mural.map((p) => <PostCard key={p.id} post={p} showGroup={false} />)
            : <Empty icon="chatbubbles-outline" title="Mural vazio" text="Avisos, fotos e enquetes da comunidade aparecem aqui." />}
        </>
      ) : null}

      {tab === 'agenda' ? (
        <>
          {isAdmin ? (
            <Button label="Novo evento (jogo, treino, ensaio…)" icon="calendar" variant="secondary"
              onPress={() => router.push({ pathname: '/criar', params: { tipo: 'evento', grupo: group.id } })} />
          ) : null}
          {agenda.length ? agenda.map((e) => <EventCard key={e.id} event={e} />)
            : <Empty icon="calendar-outline" title="Nada na agenda" text={isAdmin ? 'Cadastre jogos, treinos e ensaios.' : undefined} />}
        </>
      ) : null}

      {tab === 'saidas' ? (
        <>
          {isAdmin ? (
            <Button label="Nova saída (combi, ônibus…)" icon="bus" variant="secondary"
              onPress={() => router.push({ pathname: '/criar', params: { tipo: 'saida', grupo: group.id } })} />
          ) : null}
          {saidas.length ? saidas.map((r) => <RideCard key={r.id} ride={r} showGroup={false} />)
            : <Empty icon="bus-outline" title="Nenhuma saída marcada" text="Combis e ônibus para jogos e festas aparecem aqui, com ponto de partida e reserva de lugar." />}
        </>
      ) : null}

      {tab === 'membros' ? (
        <View style={{ gap: 2 }}>
          {members.map(({ user, role: r }) => (
            <PersonRow
              key={user.id}
              user={user}
              subtitle={r === 'admin' ? 'admin' : user.course}
              right={isAdmin && user.id !== me.id ? (
                <View style={[styles.row, { gap: 6 }]}>
                  <Button label={r === 'admin' ? 'Tirar admin' : 'Tornar admin'} compact variant="secondary"
                    onPress={() => guard(() => actions.setMemberRole(group.id, user.id, r === 'admin' ? 'membro' : 'admin'))} />
                  {r !== 'admin' ? (
                    <Button label="" icon="person-remove-outline" compact variant="ghost" accessibilityLabel={`Remover ${user.name}`} onPress={() => actions.removeMember(group.id, user.id)} />
                  ) : null}
                </View>
              ) : undefined}
            />
          ))}
          {isAdmin ? <Text style={[styles.hint, { marginTop: 8 }]}><Ionicons name="information-circle-outline" /> Admins publicam eventos e saídas e cuidam da comunidade.</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
