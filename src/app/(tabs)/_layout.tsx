import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { ColorValue, Pressable, View } from 'react-native';

import type { IconName } from '@/components/ui';
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

export default function TabsLayout() {
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
