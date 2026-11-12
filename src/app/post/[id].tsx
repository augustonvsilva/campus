import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { PostCard } from '@/components/cards';
import { CommentThread } from '@/components/comments';
import { Button, Empty, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, actions, isVisible } = useStore();
  const me = useMe();
  const post = posts.find((p) => p.id === id);

  if (!post || !isVisible(post.authorId)) {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Empty icon="eye-off-outline" title="Publicação indisponível" /></ScrollView>;
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PostCard post={post} linked={false} />
        <CommentThread comments={post.comments} onSend={(t) => actions.addComment('post', post.id, t)} />
        {post.authorId === me.id ? (
          <Button label="Apagar publicação" icon="trash-outline" variant="danger" compact
            onPress={() => { actions.deletePost(post.id); router.back(); }} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
