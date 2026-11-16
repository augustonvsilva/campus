import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Tabs } from 'expo-router';
import { ColorValue, Pressable, View } from 'react-native';

import type { IconName } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useNow } from '@/lib/time';
import { colors, radius } from '@/theme';

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={typeof color === 'string' ? color : undefined} />;
  };

function CreateTabButton() {
  return (
    <Pressable
      onPress={() => router.push('/criar')}
      accessibilityRole="button"
      accessibilityLabel="Criar publicação, Bora? ou evento"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ backgroundColor: colors.accent, width: 48, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="add" size={28} color={colors.onAccent} />
      </View>
    </Pressable>
  );
}

/** Contas criadas nos últimos 7 dias passam uma vez pela tela de boas-vindas. */
const NEW_ACCOUNT_MS = 7 * 86_400_000;

export default function TabsLayout() {
  const { me, onboarded } = useStore();
  const now = useNow();
  if (me && !onboarded && me.joinedAt > now - NEW_ACCOUNT_MS) return <Redirect href="/boas-vindas" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="agora" options={{ title: 'Agora', tabBarIcon: icon('flash') }} />
      <Tabs.Screen name="novo" options={{ title: 'Criar', tabBarButton: () => <CreateTabButton /> }} />
      <Tabs.Screen name="eventos" options={{ title: 'Eventos', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar', tabBarIcon: icon('compass') }} />
    </Tabs>
  );
}
