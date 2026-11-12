import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/lib/store';
import { colors, radius } from '@/theme';

/** Aviso no topo quando uma sincronização com o servidor falha. */
export function ErrorBanner() {
  const { error, actions } = useStore();
  const insets = useSafeAreaInsets();
  if (!error) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12 }}>
      <Pressable
        onPress={actions.clearError}
        accessibilityRole="alert"
        accessibilityHint="Toque para fechar"
        style={{
          flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: radius.md,
          backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.danger,
        }}>
        <Ionicons name="cloud-offline-outline" size={18} color={colors.danger} />
        <Text style={{ color: colors.text, flex: 1, fontSize: 14 }}>{error}</Text>
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}
