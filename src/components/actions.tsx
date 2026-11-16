// Ações rápidas das telas de detalhe: compartilhar, mapa, agenda e Pix.
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { downloadIcs, openGoogleCalendar, openMap, shareLink, type CalendarItem } from '@/lib/links';
import { useStore } from '@/lib/store';
import { colors } from '@/theme';
import { Button, Card, styles } from './ui';

/** Mensagem curta que some sozinha ("Link copiado"). */
function useFlash() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg] as const;
}

export function QuickActions({ share, place, calendar }: {
  share?: { title: string; path: string };
  place?: string;
  calendar?: CalendarItem;
}) {
  const { community } = useStore();
  const [flash, setFlash] = useFlash();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {share ? (
          <Button label="Compartilhar" icon="share-social-outline" variant="secondary" compact
            onPress={() => shareLink(share.title, share.path).then((r) => r === 'copied' && setFlash('Link copiado. É só colar no WhatsApp ou no Instagram.'))} />
        ) : null}
        {place ? <Button label="Ver no mapa" icon="map-outline" variant="secondary" compact onPress={() => openMap(place, community.city)} /> : null}
        {calendar ? <Button label="Google Agenda" icon="calendar-outline" variant="secondary" compact onPress={() => openGoogleCalendar(calendar)} /> : null}
        {calendar && Platform.OS === 'web' ? (
          <Button label="Baixar .ics" icon="download-outline" variant="ghost" compact onPress={() => downloadIcs(calendar)} />
        ) : null}
      </View>
      {flash ? <Text style={[styles.hint, { color: colors.accent }]}>{flash}</Text> : null}
    </View>
  );
}

/** Chave Pix com botão de copiar. */
export function PixBox({ pixKey, amount }: { pixKey: string; amount?: string }) {
  const [flash, setFlash] = useFlash();
  return (
    <Card>
      <Text style={styles.label}>Pagamento via Pix{amount ? ` · ${amount}` : ''}</Text>
      <Text style={[styles.body, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]} selectable>{pixKey}</Text>
      <Button label={flash ? 'Chave copiada' : 'Copiar chave Pix'} icon={flash ? 'checkmark' : 'copy-outline'} compact
        onPress={() => Clipboard.setStringAsync(pixKey).then(() => setFlash('ok'))} />
      <Text style={styles.hint}>Confira o nome de quem recebe no app do banco antes de pagar. O Campus não intermedeia valores.</Text>
    </Card>
  );
}
