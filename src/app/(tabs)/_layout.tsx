import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Tabs } from 'expo-router';
import { ColorValue, Pressable, View } from 'react-native';

import type { IconName } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useNow } from '@/lib/time';
import { useWide } from '@/components/ui';
import { colors, glow } from '@/theme';

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
      <View style={{
        backgroundColor: colors.accent, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
        marginTop: -26, borderWidth: 4, borderColor: colors.bg, ...glow(1),
      }}>
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
  const wide = useWide();
  if (me && !onboarded && me.joinedAt > now - NEW_ACCOUNT_MS) return <Redirect href="/boas-vindas" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // No computador o menu lateral substitui a barra; no celular ela flutua sobre o conteúdo.
        tabBarStyle: wide ? { display: 'none' } : {
          position: 'absolute', left: 12, right: 12, bottom: 12, height: 66, paddingTop: 6, paddingBottom: 8,
          borderRadius: 22, borderTopWidth: 1, borderWidth: 1, borderColor: colors.border, borderTopColor: colors.border,
          backgroundColor: 'rgba(21,18,30,0.96)', boxShadow: '0px 8px 30px rgba(0,0,0,0.55)',
        },
        tabBarActiveTintColor: colors.accentSoft,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '900', fontSize: 11, letterSpacing: 0.3 },
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
