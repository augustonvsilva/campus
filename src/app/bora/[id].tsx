import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { CommentThread } from '@/components/comments';
import { PersonRow } from '@/components/social';
import { Avatar, Badge, Button, Card, Empty, Notice, styles } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import { relativeStart, useNow, when } from '@/lib/time';
import { colors } from '@/theme';

export default function BoraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { boras, users, actions, isVisible } = useStore();
  const me = useMe();
  const now = useNow();
  const bora = boras.find((b) => b.id === id);

  if (!bora || !isVisible(bora.authorId)) {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Empty icon="people-outline" title="Bora? indisponível" /></ScrollView>;
  }

  const author = users[bora.authorId];
  const isAuthor = bora.authorId === me.id;
  const joined = bora.participants.includes(me.id);
  const full = !!bora.capacity && bora.participants.length >= bora.capacity;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={[styles.content, { gap: 20 }]} keyboardShouldPersistTaps="handled">
        {bora.cancelled ? <Notice tone="warn" icon="close-circle" text="Este plano foi cancelado por quem criou." /> : null}

        <View style={{ gap: 8 }}>
          <Text style={[styles.label, { color: colors.accent }]}>BORA? · {relativeStart(bora.startsAt, now).toUpperCase()}</Text>
          <Text style={[styles.h1, { fontSize: 30 }]}>{bora.activity}</Text>
          <View style={styles.row}>
            <Avatar user={author} size={26} />
            <Text style={styles.muted}>proposto por {author?.name ?? 'alguém'}</Text>
          </View>
        </View>

        <Card>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={styles.body}>{when(bora.startsAt, now)} (aprox.)</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={colors.accent} />
            <Text style={[styles.body, { flex: 1 }]}>{bora.meetingPoint}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name={bora.visibility === 'comunidade' ? 'globe-outline' : 'link'} size={18} color={colors.accent} />
            <Text style={styles.body}>{bora.visibility === 'comunidade' ? 'Aberto à comunidade' : 'Só para quem tem o link'}</Text>
          </View>
          <Text style={styles.hint}>Ponto de encontro público. O Campus não compartilha a localização de ninguém.</Text>
        </Card>

        <View style={{ gap: 10 }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.sectionTitle}>Quem vai</Text>
            <Badge label={`${bora.participants.length}${bora.capacity ? ` de ${bora.capacity}` : ''}`} tone={full ? 'warn' : 'muted'} />
          </View>
          {bora.participants.filter(isVisible).map((pid) => {
            const u = users[pid];
            return u ? (
              <PersonRow key={pid} user={u} subtitle={pid === bora.authorId ? 'criou o plano' : undefined} />
            ) : null;
          })}
        </View>

        {!bora.cancelled ? (
          isAuthor ? (
            <Button label="Cancelar plano" icon="close" variant="danger" onPress={() => actions.cancelBora(bora.id)} />
          ) : (
            <Button
              label={joined ? 'Sair do plano' : full ? 'Lotado' : 'Bora! Tô dentro'}
              icon={joined ? 'exit-outline' : 'flash'}
              variant={joined ? 'secondary' : 'primary'}
              disabled={!joined && full}
              onPress={() => actions.toggleBora(bora.id)}
            />
          )
        ) : null}

        <CommentThread comments={bora.comments} onSend={(t) => actions.addComment('bora', bora.id, t)} />

        {!isAuthor ? (
          <Button label="Denunciar plano" icon="flag-outline" variant="ghost" compact
            onPress={() => router.push({ pathname: '/denunciar', params: { tipo: 'bora', id: bora.id, autor: bora.authorId } })} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
