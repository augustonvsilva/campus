import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { Avatar, Empty, styles } from '@/components/ui';
import { activityHref, activityText } from '@/lib/activity';
import { useStore } from '@/lib/store';
import { ago, useNow } from '@/lib/time';
import { colors, radius } from '@/theme';

/** Central de atividade: quem seguiu, curtiu, comentou, entrou no Bora?, reservou a saída… */
export default function Atividade() {
  const { activity, activitySeenAt, users, actions, refreshing } = useStore();
  const now = useNow();
  // Guarda o "visto até" de quando a tela abriu, para destacar o que é novo nesta visita.
  const [seenBefore] = useState(activitySeenAt);
  useEffect(() => {
    actions.markActivitySeen();
  }, [actions, activity.length]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { gap: 8 }]}
      data={activity}
      keyExtractor={(a) => a.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={actions.refresh} tintColor={colors.accent} />}
      ListEmptyComponent={
        <Empty icon="notifications-outline" title="Nada por aqui ainda"
          text="Quando alguém seguir você, curtir, comentar ou entrar nos seus planos, aparece aqui." />
      }
      renderItem={({ item }) => {
        const actor = users[item.actorId];
        const fresh = item.at > seenBefore;
        return (
          <Pressable
            onPress={() => router.push(activityHref(item) as never)}
            accessibilityRole="link"
            style={[styles.row, {
              alignItems: 'flex-start', padding: 12, borderRadius: radius.md,
              backgroundColor: fresh ? colors.surface : 'transparent', borderWidth: 1, borderColor: fresh ? colors.border : 'transparent',
            }]}>
            <Avatar user={actor} size={40} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.body}>
                <Text style={{ fontWeight: '800' }}>{actor?.name ?? 'Alguém'}</Text> {activityText(item)}
                {item.kind === 'group_join' && item.snippet ? <Text style={{ fontWeight: '700' }}> {item.snippet}</Text> : null}
              </Text>
              {item.snippet && item.kind !== 'group_join' && item.kind !== 'follow' ? (
                <Text style={styles.muted} numberOfLines={2}>“{item.snippet}”</Text>
              ) : null}
              <Text style={styles.hint}>{ago(item.at, now)}</Text>
            </View>
            {fresh ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 }} /> : null}
          </Pressable>
        );
      }}
    />
  );
}
