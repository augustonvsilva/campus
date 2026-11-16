import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/error-banner';
import { BackgroundGlow, MobileWatermark, RightRail, Sidebar, TopBar } from '@/components/shell';
import { WIDE } from '@/components/ui';
import { isModerator, StoreProvider, useStore } from '@/lib/store';
import { colors, themeMode } from '@/theme';

/** Largura máxima da coluna de conteúdo (feed e telas). */
const MAX_WIDTH = 980;
/** A partir desta largura aparece também a coluna da direita (em alta, pessoas). */
const RAIL = 1320;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemedRoot />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

/**
 * Celular: só a pilha de telas. Computador (logado): menu lateral, barra superior,
 * coluna central e, em telas bem largas, a coluna da direita.
 */
/** Remonta tudo quando o tema muda (as cores são lidas na hora de desenhar). */
function ThemedRoot() {
  const { themeKey } = useStore();
  return (
    <View key={themeKey} style={{ flex: 1 }}>
      <StatusBar style={themeMode() === 'light' ? 'dark' : 'light'} />
      <Shell />
    </View>
  );
}

function Shell() {
  const { width } = useWindowDimensions();
  const { session } = useStore();
  const wide = width >= WIDE && !!session;

  if (!wide) {
    return (
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: width > 640 ? colors.wideBg : colors.bg }}>
        <View style={[{ flex: 1, width: '100%', maxWidth: 640, backgroundColor: colors.bg }, width > 640 && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }]}>
          <RootStack />
          {session ? <MobileWatermark /> : null}
          <ErrorBanner />
        </View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      <BackgroundGlow />
      <Sidebar />
      <View style={{ flex: 1 }}>
        <TopBar />
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 24, paddingLeft: 24 }}>
          <View style={{ flex: 1, maxWidth: MAX_WIDTH, borderRadius: 18, overflow: 'hidden' }}>
            <RootStack />
            <ErrorBanner />
          </View>
          {width >= RAIL ? <RightRail /> : null}
        </View>
      </View>
    </View>
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
        <Stack.Screen name="ingressos/index" options={{ title: 'Meus ingressos' }} />
        <Stack.Screen name="ingressos/comprar" options={{ title: 'Comprar ingresso' }} />
        <Stack.Screen name="ingressos/[id]" options={{ title: 'Ingresso' }} />
        <Stack.Screen name="ingressos/validar" options={{ title: 'Vendas e portaria' }} />
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
