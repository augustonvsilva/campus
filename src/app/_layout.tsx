import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/error-banner';
import { isModerator, StoreProvider, useStore } from '@/lib/store';
import { colors } from '@/theme';

/** Largura máxima do conteúdo. No celular não faz diferença; em tablet e desktop vira uma coluna central. */
const MAX_WIDTH = 640;

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const wide = width > MAX_WIDTH;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, alignItems: 'center', backgroundColor: wide ? '#07080B' : colors.bg }}>
          <View
            style={[
              { flex: 1, width: '100%', maxWidth: MAX_WIDTH, backgroundColor: colors.bg },
              wide && { borderLeftWidth: 2, borderRightWidth: 2, borderColor: colors.border },
            ]}>
            <RootStack />
            <ErrorBanner />
          </View>
        </View>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { session, me } = useStore();
  const signedIn = !!session;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '900' },
        headerTransparent: false,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: 'Publicação' }} />
        <Stack.Screen name="evento/[id]" options={{ title: 'Evento' }} />
        <Stack.Screen name="bora/[id]" options={{ title: 'Bora?' }} />
        <Stack.Screen name="lugar/[id]" options={{ title: 'Lugar' }} />
        <Stack.Screen name="perfil" options={{ title: 'Perfil' }} />
        <Stack.Screen name="atividade" options={{ title: 'Atividade' }} />
        <Stack.Screen name="mensagens/index" options={{ title: 'Mensagens' }} />
        <Stack.Screen name="mensagens/[id]" options={{ title: 'Conversa' }} />
        <Stack.Screen name="buscar" options={{ title: 'Buscar' }} />
        <Stack.Screen name="boas-vindas" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="usuario/[id]" options={{ title: 'Perfil' }} />
        <Stack.Screen name="conexoes" options={{ title: 'Conexões' }} />
        <Stack.Screen name="comunidade/[id]" options={{ title: 'Comunidade' }} />
        <Stack.Screen name="comunidade/nova" options={{ presentation: 'modal', title: 'Nova comunidade' }} />
        <Stack.Screen name="saida/[id]" options={{ title: 'Saída' }} />
        <Stack.Screen name="criar" options={{ presentation: 'modal', title: 'Criar' }} />
        <Stack.Screen name="denunciar" options={{ presentation: 'modal', title: 'Denunciar' }} />
        <Stack.Protected guard={isModerator(me)}>
          <Stack.Screen name="moderacao" options={{ title: 'Moderação' }} />
        </Stack.Protected>
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="entrar" options={{ headerShown: false }} />
      </Stack.Protected>
      {/* Textos legais: abertos com ou sem sessão (o cadastro linka para eles). */}
      <Stack.Screen name="termos" options={{ title: 'Termos de uso' }} />
      <Stack.Screen name="privacidade" options={{ title: 'Privacidade' }} />
    </Stack>
  );
}
