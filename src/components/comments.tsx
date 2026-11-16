import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { canPublish, useMe, useStore } from '@/lib/store';
import { ago, useNow } from '@/lib/time';
import type { Comment, CommentTarget, ID, ReportTarget } from '@/lib/types';
import { colors, radius } from '@/theme';
import { Avatar, Button, styles, VerifyPrompt } from './ui';

/**
 * Lista de comentários/recomendações. Conteúdo de terceiros tem botão de denúncia;
 * com `thread`, os próprios comentários podem ser editados e apagados.
 */
export function CommentList({ items, reportAs, emptyText, thread }: {
  items: Comment[]; reportAs: ReportTarget; emptyText: string; thread?: { target: CommentTarget; parentId: ID };
}) {
  const { users, isVisible, actions } = useStore();
  const me = useMe();
  const now = useNow();
  const [editing, setEditing] = useState<ID | null>(null);
  const [draft, setDraft] = useState('');
  const visible = items.filter((c) => isVisible(c.authorId));
  if (!visible.length) return <Text style={styles.muted}>{emptyText}</Text>;

  const save = (c: Comment) => {
    if (thread && draft.trim() && draft.trim() !== c.text) actions.editComment(thread.target, thread.parentId, c.id, draft);
    setEditing(null);
  };

  return (
    <>
      {visible.map((c) => {
        const author = users[c.authorId];
        const mine = c.authorId === me.id;
        return (
          <View key={c.id} style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => router.push(`/usuario/${c.authorId}`)} accessibilityRole="link" accessibilityLabel={`Ver perfil de ${author?.name ?? 'alguém'}`}>
              <Avatar user={author} size={30} />
            </Pressable>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.label} onPress={() => router.push(`/usuario/${c.authorId}`)}>
                {author?.name ?? 'Alguém'} <Text style={styles.hint}>· {ago(c.createdAt, now)}{c.editedAt ? ' · editado' : ''}</Text>
              </Text>
              {editing === c.id ? (
                <View style={{ gap: 8 }}>
                  <TextInput value={draft} onChangeText={setDraft} multiline maxLength={500} autoFocus
                    style={[styles.input, { minHeight: 60 }]} placeholderTextColor={colors.muted} accessibilityLabel="Editar comentário" />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button label="Cancelar" variant="ghost" compact onPress={() => setEditing(null)} />
                    <Button label="Salvar" compact disabled={!draft.trim()} onPress={() => save(c)} />
                  </View>
                </View>
              ) : (
                <Text style={styles.body}>{c.text}</Text>
              )}
              {mine && thread && editing !== c.id ? (
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 2 }}>
                  <Text style={[styles.hint, { color: colors.accentSoft }]} accessibilityRole="button"
                    onPress={() => { setEditing(c.id); setDraft(c.text); }}>Editar</Text>
                  <Text style={[styles.hint, { color: colors.danger }]} accessibilityRole="button"
                    onPress={() => actions.deleteComment(thread.target, thread.parentId, c.id)}>Apagar</Text>
                </View>
              ) : null}
            </View>
            {!mine ? (
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

/** Conversa de uma publicação, Bora? ou saída, com campo para escrever. */
export function CommentThread({ comments, target, parentId, title = 'Comentários', emptyText = 'Ninguém comentou ainda. Puxa o assunto!', placeholder = 'Escreva um comentário…', disabledText }: {
  comments: Comment[]; target: CommentTarget; parentId: ID; title?: string; emptyText?: string; placeholder?: string;
  /** Quando preenchido, a conversa fica só para leitura (ex.: saída cancelada). */
  disabledText?: string;
}) {
  const { isVisible, actions } = useStore();
  const me = useMe();
  const [text, setText] = useState('');
  const count = comments.filter((c) => isVisible(c.authorId)).length;
  const send = () => {
    if (!text.trim()) return;
    actions.addComment(target, parentId, text);
    setText('');
  };

  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.sectionTitle}>{title} {count ? `(${count})` : ''}</Text>
      <CommentList items={comments} reportAs="comentario" emptyText={emptyText} thread={{ target, parentId }} />

      {disabledText ? (
        <Text style={styles.hint}>{disabledText}</Text>
      ) : canPublish(me) ? (
        <View style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingLeft: 16, paddingRight: 6 }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
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
        <VerifyPrompt text="Para participar da conversa, confirme seu vínculo com a universidade pelo e-mail institucional." />
      )}
    </View>
  );
}
