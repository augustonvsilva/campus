import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { PersonRow } from '@/components/social';
import { Chip, ChipRow, Empty, styles } from '@/components/ui';
import { useStore } from '@/lib/store';
import { followersOf, followingOf } from '@/lib/social';

type Lista = 'seguidores' | 'seguindo';

export default function Conexoes() {
  const params = useLocalSearchParams<{ usuario: string; lista?: Lista }>();
  const { users, following, isVisible } = useStore();
  const [lista, setLista] = useState<Lista>(params.lista ?? 'seguidores');
  const user = users[params.usuario];
  const ids = user ? (lista === 'seguidores' ? followersOf(following, user.id) : followingOf(following, user.id)) : [];
  const people = ids.map((id) => users[id]).filter((u): u is NonNullable<typeof u> => !!u && isVisible(u.id));

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: user?.name ?? 'Conexões' }} />
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <ChipRow>
          <Chip label={`Seguidores (${user ? followersOf(following, user.id).length : 0})`} active={lista === 'seguidores'} onPress={() => setLista('seguidores')} />
          <Chip label={`Seguindo (${user ? followingOf(following, user.id).length : 0})`} active={lista === 'seguindo'} onPress={() => setLista('seguindo')} />
        </ChipRow>
      </View>
      <FlatList
        data={people}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => <PersonRow user={item} />}
        contentContainerStyle={[styles.content, { gap: 4 }]}
        ListEmptyComponent={<Empty icon="people-outline" title={lista === 'seguidores' ? 'Ninguém segue ainda' : 'Não segue ninguém ainda'} />}
      />
    </View>
  );
}
