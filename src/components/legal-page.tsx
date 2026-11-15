import { ScrollView, Text, View } from 'react-native';

import { styles } from '@/components/ui';
import { LEGAL, type LegalDoc } from '@/lib/legal';

/** Página de texto legal (Termos, Privacidade). Funciona com e sem sessão. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { gap: 20 }]}>
      <View style={{ gap: 6 }}>
        <Text style={styles.h2}>{doc.title}</Text>
        <Text style={styles.hint}>Atualizado em {LEGAL.updatedAt}</Text>
      </View>
      <Text style={styles.body}>{doc.intro}</Text>
      {doc.sections.map((s) => (
        <View key={s.heading} style={{ gap: 8 }}>
          <Text style={styles.title}>{s.heading}</Text>
          {s.paragraphs.map((p) => <Text key={p} style={styles.body}>{p}</Text>)}
        </View>
      ))}
    </ScrollView>
  );
}
