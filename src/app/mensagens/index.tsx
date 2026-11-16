import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Avatar, Empty, Notice, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import { ago, useNow } from '@/lib/time';
import { colors, radius } from '@/theme';

/** Caixa de entrada das mensagens privadas (modo demonstração). */
export default function Mensagens() {
  const { conversations, users } = useStore();
  const me = useMe();
  const now = useNow();

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { gap: 10 }]}
      data={conversations}
      keyExtractor={(c) => c.peerId}
      ListHeaderComponent={
        <Notice icon="flask-outline" text="Demonstração: as mensagens privadas ficam só neste aparelho e ainda não vão para o servidor." />
      }
      ListEmptyComponent={
        <Empty icon="chatbubbles-outline" title="Nenhuma conversa ainda"
          text="Abra o perfil de alguém da comunidade e toque em Mensagem." />
      }
      renderItem={({ item }) => {
        const peer = users[item.peerId];
        const mine = item.last.fromId === me.id;
        return (
          <Pressable
            onPress={() => router.push(`/mensagens/${item.peerId}`)}
            accessibilityRole="link"
            accessibilityLabel={`Conversa com ${peer?.name ?? 'alguém'}${item.unread ? `, ${item.unread} não lidas` : ''}`}
            style={({ pressed }) => [styles.card, styles.row, { gap: 12, padding: 14 }, item.unread ? { borderColor: colors.accent } : null, pressed && { opacity: 0.85 }]}>
            <Avatar user={peer} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={[styles.title, { flex: 1 }]} numberOfLines={1}>{peer?.name ?? 'Alguém'}</Text>
                <Text style={styles.hint}>{ago(item.last.createdAt, now)}</Text>
              </View>
              <Text style={[styles.muted, item.unread ? { color: colors.text, fontWeight: '700' } : null]} numberOfLines={1}>
                {mine ? 'Você: ' : ''}{item.last.text}
              </Text>
            </View>
            {item.unread ? (
              <View style={{ minWidth: 22, height: 22, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                <Text style={{ color: colors.onAccent, fontWeight: '900', fontSize: 12 }}>{item.unread}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}
