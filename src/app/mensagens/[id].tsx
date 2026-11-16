import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { Avatar, Empty, Notice, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import { hhmm } from '@/lib/time';
import { colors, radius } from '@/theme';

/** Conversa privada com uma pessoa (modo demonstração). */
export default function Conversa() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { users, messages, actions, blocked, messagesEnabled } = useStore();
  const me = useMe();
  const peer = id ? users[id] : undefined;
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const list = useRef<FlatList>(null);

  const thread = messages
    .filter((m) => (m.fromId === me.id && m.toId === id) || (m.fromId === id && m.toId === me.id))
    .sort((a, b) => a.createdAt - b.createdAt);

  // Abriu ou chegou mensagem nova: marca como lida.
  useEffect(() => {
    if (id) actions.markConversationRead(id);
  }, [actions, id, thread.length]);

  if (!messagesEnabled || !peer || !id) {
    return <View style={[styles.screen, styles.content]}><Empty icon="chatbubbles-outline" title="Conversa indisponível" /></View>;
  }
  const isBlocked = blocked.includes(id);

  const send = () => {
    try {
      setError(null);
      actions.sendMessage(id, text);
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não deu para enviar.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable onPress={() => router.push(`/usuario/${peer.id}`)} accessibilityRole="link" style={[styles.row, { gap: 8 }]}>
              <Avatar user={peer} size={30} />
              <View>
                <Text style={[styles.title, { fontSize: 15 }]} numberOfLines={1}>{peer.name}</Text>
                <Text style={styles.hint}>@{peer.handle}</Text>
              </View>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: '/denunciar', params: { tipo: 'usuario', id: peer.id, autor: peer.id } })}
              accessibilityRole="button" accessibilityLabel="Denunciar ou bloquear" hitSlop={10} style={{ paddingHorizontal: 8 }}>
              <Ionicons name="flag-outline" size={20} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        ref={list}
        data={thread}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.content, { gap: 8, flexGrow: 1 }]}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <Notice icon="lock-closed-outline" text={`Conversa privada com ${peer.name.split(' ')[0]}. Respeite as regras da comunidade: dá para denunciar ou bloquear pelo ícone da bandeira.`} />
        }
        ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 24 }]}>Diga oi! 👋</Text>}
        renderItem={({ item }) => {
          const mine = item.fromId === me.id;
          return (
            <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.body, { color: mine ? colors.onAccent : colors.text }]}>{item.text}</Text>
                <Text style={[styles.hint, { color: mine ? colors.onAccentMuted : colors.muted, alignSelf: 'flex-end', fontSize: 11 }]}>
                  {hhmm(item.createdAt)}{mine && item.readAt ? ' · lida' : ''}
                </Text>
              </View>
            </View>
          );
        }}
      />
      <View style={{ padding: 12, gap: 8, borderTopWidth: 2, borderTopColor: colors.border, backgroundColor: colors.bg }}>
        {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
        {isBlocked ? (
          <Notice tone="warn" icon="ban-outline" text="Você bloqueou essa pessoa. Desbloqueie no seu perfil para voltar a conversar." />
        ) : (
          <View style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, paddingLeft: 16, paddingRight: 6 }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Escreva uma mensagem…"
              placeholderTextColor={colors.muted}
              onSubmitEditing={send}
              returnKeyType="send"
              maxLength={1000}
              style={{ flex: 1, color: colors.text, paddingVertical: 12, fontSize: 15 }}
            />
            <Pressable onPress={send} disabled={!text.trim()} accessibilityRole="button" accessibilityLabel="Enviar mensagem"
              style={{ backgroundColor: colors.accent, borderRadius: 99, padding: 9, opacity: text.trim() ? 1 : 0.4 }}>
              <Ionicons name="send" size={16} color={colors.onAccent} />
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
