import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { CommentList } from '@/components/comments';
import { Badge, Button, Card, Empty, Field, Notice, styles } from '@/components/ui';
import { placeCategory, price } from '@/lib/labels';
import { canPublish, useMe, useStore } from '@/lib/store';
import { colors } from '@/theme';

export default function LugarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { places, actions } = useStore();
  const me = useMe();
  const [text, setText] = useState('');
  const place = places.find((p) => p.id === id);

  if (!place) {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Empty icon="map-outline" title="Lugar não encontrado" /></ScrollView>;
  }

  const cat = placeCategory(place.category);
  const alreadyRecommended = place.recommendations.some((r) => r.authorId === me.id);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={[styles.content, { gap: 20 }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <View style={[styles.row, { gap: 6 }]}>
            <Badge label={cat.label} icon={cat.icon} />
            <Badge label={price(place.priceRange)} />
            {place.verified ? <Badge label="Verificado" icon="checkmark-circle" tone="accent" /> : null}
          </View>
          <Text style={[styles.h1, { fontSize: 30 }]}>{place.name}</Text>
        </View>

        <Card>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={colors.accent} />
            <Text style={[styles.body, { flex: 1 }]}>{place.address}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={[styles.body, { flex: 1 }]}>
              {place.verified && place.hours ? place.hours : 'Horário ainda não verificado'}
            </Text>
          </View>
        </Card>

        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Recomendações da comunidade</Text>
          <CommentList items={place.recommendations} reportAs="recomendacao" emptyText="Ninguém recomendou ainda." />
        </View>

        {!canPublish(me) ? (
          <Notice tone="warn" icon="hourglass-outline" text="Assim que sua verificação for aprovada, você poderá recomendar lugares." />
        ) : alreadyRecommended ? (
          <Notice icon="checkmark-circle" text="Você já recomendou este lugar." />
        ) : (
          <Card>
            <Field label="Recomende este lugar" value={text} onChangeText={setText} multiline maxLength={280}
              placeholder="O que vale a pena? Preço, prato, clima, horário bom…"
              hint="Seja específico e respeitoso. Recomendações passam por moderação." />
            <Button label="Publicar recomendação" compact disabled={text.trim().length < 5}
              onPress={() => { actions.addRecommendation(place.id, text); setText(''); }} />
          </Card>
        )}

        <Button label="Informação errada? Reportar" icon="flag-outline" variant="ghost" compact
          onPress={() => router.push({ pathname: '/denunciar', params: { tipo: 'lugar', id: place.id } })} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
