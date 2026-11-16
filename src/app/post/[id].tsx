import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { QuickActions } from '@/components/actions';
import { PostCard } from '@/components/cards';
import { CommentThread } from '@/components/comments';
import { Button, Card, Empty, Field, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, actions, isVisible, users } = useStore();
  const me = useMe();
  const post = posts.find((p) => p.id === id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!post || !isVisible(post.authorId)) {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Empty icon="eye-off-outline" title="Publicação indisponível" /></ScrollView>;
  }
  const mine = post.authorId === me.id;
  const author = users[post.authorId];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {editing ? (
          <Card>
            <Field label="Editar publicação" value={draft} onChangeText={setDraft} multiline maxLength={2000} autoFocus />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Cancelar" variant="secondary" compact style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button label="Salvar" compact style={{ flex: 1 }} disabled={!draft.trim()}
                onPress={() => { actions.editPost(post.id, draft); setEditing(false); }} />
            </View>
          </Card>
        ) : (
          <PostCard post={post} linked={false} />
        )}
        <QuickActions share={{ title: `${author?.name ?? 'Alguém'} no Campus: "${post.text.slice(0, 60)}${post.text.length > 60 ? '…' : ''}"`, path: `/post/${post.id}` }} />
        <CommentThread comments={post.comments} target="post" parentId={post.id} />
        {mine && !editing ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Editar" icon="create-outline" variant="secondary" compact style={{ flex: 1 }}
              onPress={() => { setDraft(post.text); setEditing(true); }} />
            <Button label="Apagar" icon="trash-outline" variant="danger" compact style={{ flex: 1 }}
              onPress={() => { actions.deletePost(post.id); router.back(); }} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
