import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Chip, Field, styles, ToggleRow } from '@/components/ui';
import { REPORT_REASONS } from '@/lib/labels';
import { useMe, useStore } from '@/lib/store';
import type { ReportTarget } from '@/lib/types';
import { colors } from '@/theme';

export default function Denunciar() {
  const { tipo, id, autor } = useLocalSearchParams<{ tipo: ReportTarget; id: string; autor?: string }>();
  const { actions, users, blocked } = useStore();
  const me = useMe();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [block, setBlock] = useState(false);
  const [sent, setSent] = useState(false);
  const author = autor && autor !== me.id ? users[autor] : undefined;

  if (sent) {
    return (
      <View style={[styles.screen, styles.content, { justifyContent: 'center', alignItems: 'center', gap: 12 }]}>
        <Text style={{ fontSize: 40 }}>✅</Text>
        <Text style={styles.h2}>Recebemos sua denúncia</Text>
        <Text style={[styles.muted, { textAlign: 'center' }]}>
          A moderação vai analisar o conteúdo. Quem foi denunciado não fica sabendo que foi você.
        </Text>
        <Button label="Fechar" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const submit = () => {
    if (!reason || !tipo || !id) return;
    actions.report({ targetType: tipo, targetId: id, reason, details: details.trim() || undefined });
    if (block && author && !blocked.includes(author.id)) actions.toggleBlock(author.id);
    setSent(true);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.h2}>Qual é o problema?</Text>
      <View style={{ gap: 8 }}>
        {REPORT_REASONS.map((r) => <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />)}
      </View>
      <Field label="Detalhes (opcional)" value={details} onChangeText={setDetails} multiline maxLength={500}
        placeholder="Conte o que aconteceu, se quiser" />
      {author ? (
        <ToggleRow
          label={`Bloquear ${author.name}`}
          hint="Você deixa de ver as publicações, comentários e planos dessa pessoa."
          value={block}
          onValueChange={setBlock}
        />
      ) : null}
      <Text style={[styles.hint, { color: colors.muted }]}>Em caso de risco imediato, procure a segurança do campus ou ligue 190.</Text>
      <Button label="Enviar denúncia" icon="flag" disabled={!reason} onPress={submit} />
    </ScrollView>
  );
}
