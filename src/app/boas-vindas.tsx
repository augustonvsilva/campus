import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FollowButton, GroupBadge, PersonRow } from '@/components/social';
import { BrandWatermark, Button, CampusLogo, Card, Chip, ChipRow, Notice, Section, styles } from '@/components/ui';
import { groupKind } from '@/lib/labels';
import { suggestPeople } from '@/lib/social';
import { canPublish, useMe, useStore } from '@/lib/store';
import { colors } from '@/theme';

const INTERESTS = [
  'futsal', 'vôlei', 'corrida', 'academia', 'festas', 'música', 'bateria', 'games', 'estudos', 'cinema',
  'fotografia', 'design', 'tecnologia', 'empreendedorismo', 'debates', 'cultura', 'café', 'voluntariado',
];

/**
 * Primeiro acesso: interesses, comunidades para entrar e pessoas para seguir.
 * Aparece uma vez para contas novas (ver o redirecionamento em (tabs)/_layout.tsx).
 */
export default function BoasVindas() {
  const { actions, groups, users, following, events, boras, blocked } = useStore();
  const me = useMe();
  const insets = useSafeAreaInsets();
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [error, setError] = useState<string | null>(null);
  const first = me.name.split(' ')[0];

  const toggle = (i: string) => setInterests((list) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i].slice(0, 10)));
  const topGroups = useMemo(
    () => [...groups].sort((a, b) => Number(b.verified) - Number(a.verified) || Object.keys(b.members).length - Object.keys(a.members).length).slice(0, 6),
    [groups],
  );
  // Sugestões já consideram os interesses marcados nesta tela.
  const people = suggestPeople({ ...me, interests }, users, following, events, boras, groups, blocked).slice(0, 6);
  const fallback = people.length ? [] : Object.values(users).filter((u) => u.id !== me.id && !blocked.includes(u.id)).slice(0, 6);

  const finish = () => {
    if (interests.join() !== me.interests.join()) actions.updateProfile({ interests });
    actions.finishOnboarding();
    router.replace('/');
  };

  const join = (id: string) => {
    try {
      setError(null);
      actions.toggleMembership(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não deu para entrar agora.');
    }
  };

  return (
    <View style={styles.screen}>
    <BrandWatermark size={420} opacity={0.06} style={{ right: -140, top: -30 }} />
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, gap: 26 }]}>
      <View style={{ gap: 6 }}>
        <CampusLogo size={56} />
        <Text style={styles.kicker}>BOAS-VINDAS</Text>
        <Text style={styles.h1}>Que bom ter você aqui, {first}!</Text>
        <Text style={styles.muted}>Três passos rápidos para o seu feed não começar vazio.</Text>
      </View>

      <Section title="1. Do que você curte?">
        <ChipRow>
          {INTERESTS.map((i) => <Chip key={i} label={i} active={interests.includes(i)} onPress={() => toggle(i)} />)}
        </ChipRow>
      </Section>

      <Section title="2. Entre em comunidades">
        {topGroups.length ? topGroups.map((g) => {
          const member = !!g.members[me.id];
          return (
            <Card key={g.id}>
              <View style={[styles.row, { gap: 12 }]}>
                <GroupBadge group={g} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{g.name}</Text>
                  <Text style={styles.hint}>{groupKind(g.kind).label} · {Object.keys(g.members).length} membros</Text>
                </View>
                <Pressable onPress={() => join(g.id)} accessibilityRole="button" accessibilityLabel={member ? `Sair de ${g.name}` : `Entrar em ${g.name}`}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: member ? colors.surface2 : colors.accent }}>
                  <Text style={{ fontWeight: '800', color: member ? colors.text : colors.onAccent }}>{member ? 'Participando' : 'Entrar'}</Text>
                </Pressable>
              </View>
            </Card>
          );
        }) : <Text style={styles.muted}>Ainda não há comunidades. Atléticas, baterias e coletivos aparecem aqui quando forem criados.</Text>}
        {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
      </Section>

      <Section title="3. Siga quem você conhece">
        {[...people.map((s) => ({ user: s.user, reason: s.reason })), ...fallback.map((u) => ({ user: u, reason: u.course ?? '' }))].map(({ user, reason }) => (
          <PersonRow key={user.id} user={user} subtitle={reason} right={<FollowButton userId={user.id} compact />} />
        ))}
        {!people.length && !fallback.length ? <Text style={styles.muted}>Assim que mais gente chegar, sugerimos pessoas aqui.</Text> : null}
      </Section>

      {!canPublish(me) ? (
        <Notice icon="shield-outline" text="Depois, confirme seu vínculo no perfil (código no e-mail institucional) para poder publicar e comentar." />
      ) : null}

      <View style={{ gap: 8 }}>
        <Button label="Começar" icon="arrow-forward" onPress={finish} />
        <Button label="Pular por agora" variant="ghost" compact onPress={finish} />
      </View>
    </ScrollView>
    </View>
  );
}
