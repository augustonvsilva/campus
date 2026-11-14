import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Chip, ChipRow, Field, Notice, styles, VerifyPrompt } from '@/components/ui';
import { GROUP_COLORS, GROUP_KINDS } from '@/lib/labels';
import { canPublish, useMe, useStore } from '@/lib/store';
import type { GroupKind } from '@/lib/types';
import { colors } from '@/theme';

/** Criar comunidade, ou editar (?editar=<id>) se você for admin. */
export default function NovaComunidade() {
  const { editar } = useLocalSearchParams<{ editar?: string }>();
  const { groups, actions } = useStore();
  const me = useMe();
  const editing = editar ? groups.find((g) => g.id === editar && g.members[me.id] === 'admin') : undefined;
  const [name, setName] = useState(editing?.name ?? '');
  const [kind, setKind] = useState<GroupKind>(editing?.kind ?? 'atletica');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [color, setColor] = useState(editing?.color ?? GROUP_COLORS[0]!);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length >= 3 && name.trim().length <= 60;

  const submit = () => {
    try {
      if (editing) {
        actions.updateGroup(editing.id, { name: name.trim(), kind, description: description.trim(), color });
        router.back();
      } else {
        const id = actions.createGroup({ name, kind, description, color });
        router.replace(`/comunidade/${id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    }
  };

  if (!canPublish(me)) {
    return (
      <View style={[styles.screen, styles.content]}>
        <VerifyPrompt text="Para criar comunidades, confirme seu vínculo com a universidade pelo e-mail institucional." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: editing ? 'Editar comunidade' : 'Nova comunidade' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!editing ? (
          <Text style={styles.muted}>
            Atléticas, baterias, coletivos, CAs e grupos de interesse ganham mural, agenda de jogos/treinos/ensaios e saídas
            (combis e ônibus) com reserva de lugar. Quem cria vira admin.
          </Text>
        ) : null}
        <Field label="Nome" value={name} onChangeText={setName} maxLength={60} placeholder="Ex.: Atlética de Direito" />
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Tipo</Text>
          <ChipRow>
            {GROUP_KINDS.map((k) => <Chip key={k.id} label={k.label} icon={k.icon} active={kind === k.id} onPress={() => setKind(k.id)} />)}
          </ChipRow>
        </View>
        <Field label="Descrição" value={description} onChangeText={setDescription} multiline maxLength={500}
          placeholder="O que rola na comunidade, quando são os treinos/ensaios, como participar…" />
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Cor</Text>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {GROUP_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} accessibilityRole="button" accessibilityLabel={`Cor ${c}`}
                accessibilityState={{ selected: color === c }}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, borderWidth: 3, borderColor: color === c ? colors.text : 'transparent' }} />
            ))}
          </View>
        </View>
        <Text style={styles.hint}>O selo de comunidade oficial é concedido pela equipe Campus depois de confirmar quem representa a entidade.</Text>
        {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
        <Button label={editing ? 'Salvar' : 'Criar comunidade'} icon={editing ? 'checkmark' : 'add'} disabled={!valid} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
