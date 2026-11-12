import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { canPublish, useMe, useStore } from '@/lib/store';
import { ago, useNow } from '@/lib/time';
import type { Comment, ReportTarget } from '@/lib/types';
import { colors, radius } from '@/theme';
import { Avatar, Notice, styles } from './ui';

/** Lista de comentários/recomendações com botão de denúncia para conteúdo de terceiros. */
export function CommentList({ items, reportAs, emptyText }: { items: Comment[]; reportAs: ReportTarget; emptyText: string }) {
  const { users, isVisible } = useStore();
  const me = useMe();
  const now = useNow();
  const visible = items.filter((c) => isVisible(c.authorId));
  if (!visible.length) return <Text style={styles.muted}>{emptyText}</Text>;
  return (
    <>
      {visible.map((c) => {
        const author = users[c.authorId];
        return (
          <View key={c.id} style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => router.push(`/usuario/${c.authorId}`)} accessibilityRole="link" accessibilityLabel={`Ver perfil de ${author?.name ?? 'alguém'}`}>
              <Avatar user={author} size={30} />
            </Pressable>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.label} onPress={() => router.push(`/usuario/${c.authorId}`)}>
                {author?.name ?? 'Alguém'} <Text style={styles.hint}>· {ago(c.createdAt, now)}</Text>
              </Text>
              <Text style={styles.body}>{c.text}</Text>
            </View>
            {c.authorId !== me.id ? (
              <Pressable
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Denunciar comentário de ${author?.name ?? 'alguém'}`}
                onPress={() => router.push({ pathname: '/denunciar', params: { tipo: reportAs, id: c.id, autor: c.authorId } })}>
                <Ionicons name="flag-outline" size={15} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

export function CommentThread({ comments, onSend }: { comments: Comment[]; onSend: (text: string) => void }) {
  const { isVisible } = useStore();
  const me = useMe();
  const [text, setText] = useState('');
  const count = comments.filter((c) => isVisible(c.authorId)).length;
  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.sectionTitle}>Comentários {count ? `(${count})` : ''}</Text>
      <CommentList items={comments} reportAs="comentario" emptyText="Ninguém comentou ainda. Puxa o assunto!" />

      {canPublish(me) ? (
        <View style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingLeft: 16, paddingRight: 6 }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escreva um comentário…"
            placeholderTextColor={colors.muted}
            onSubmitEditing={send}
            returnKeyType="send"
            maxLength={500}
            style={{ flex: 1, color: colors.text, paddingVertical: 12, fontSize: 15 }}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim()}
            accessibilityRole="button"
            accessibilityLabel="Enviar comentário"
            style={{ backgroundColor: colors.accent, borderRadius: 99, padding: 8, opacity: text.trim() ? 1 : 0.4 }}>
            <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
          </Pressable>
        </View>
      ) : (
        <Notice tone="warn" icon="hourglass-outline" text="Sua verificação ainda não foi aprovada. Assim que for, você poderá comentar." />
      )}
    </View>
  );
}
