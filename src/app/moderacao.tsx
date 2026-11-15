import { useState } from 'react';
import { Image, Linking, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Chip, ChipRow, Empty, Notice, styles } from '@/components/ui';
import * as remote from '@/lib/remote';
import { useStore } from '@/lib/store';
import { ago, useNow } from '@/lib/time';
import type { ID, RemovableTarget, Report, ReportTarget } from '@/lib/types';
import { colors, radius } from '@/theme';

const TARGET_LABEL: Record<ReportTarget, string> = {
  post: 'Publicação', bora: 'Bora?', evento: 'Evento', lugar: 'Lugar', usuario: 'Usuário',
  comentario: 'Comentário', recomendacao: 'Recomendação', comunidade: 'Comunidade', saida: 'Saída',
};
const REMOVABLE: ReportTarget[] = ['post', 'bora', 'evento', 'comentario', 'recomendacao', 'comunidade', 'saida'];

/** Localiza o conteúdo denunciado no estado carregado. */
function useTarget(r: Report): { text: string; authorId?: ID } | null {
  const { posts, boras, events, places, users, groups, rides } = useStore();
  switch (r.targetType) {
    case 'post': { const p = posts.find((x) => x.id === r.targetId); return p ? { text: p.text, authorId: p.authorId } : null; }
    case 'bora': { const b = boras.find((x) => x.id === r.targetId); return b ? { text: `${b.activity} — ${b.meetingPoint}`, authorId: b.authorId } : null; }
    case 'evento': { const e = events.find((x) => x.id === r.targetId); return e ? { text: `${e.title} — ${e.location}`, authorId: e.createdBy } : null; }
    case 'lugar': { const p = places.find((x) => x.id === r.targetId); return p ? { text: `${p.name} — ${p.address}` } : null; }
    case 'usuario': { const u = users[r.targetId]; return u ? { text: u.name, authorId: u.id } : null; }
    case 'comentario': {
      const c = [...posts, ...boras].flatMap((x) => x.comments).find((x) => x.id === r.targetId);
      return c ? { text: c.text, authorId: c.authorId } : null;
    }
    case 'recomendacao': {
      const c = places.flatMap((p) => p.recommendations).find((x) => x.id === r.targetId);
      return c ? { text: c.text, authorId: c.authorId } : null;
    }
    case 'comunidade': { const g = groups.find((x) => x.id === r.targetId); return g ? { text: `${g.name} — ${g.description}`, authorId: g.createdBy } : null; }
    case 'saida': {
      const x = rides.find((y) => y.id === r.targetId);
      return x ? { text: `${x.title} — sai de ${x.departurePoint}${x.price ? ` · ${x.price}` : ''}`, authorId: x.createdBy } : null;
    }
  }
}

function ReportCard({ report }: { report: Report }) {
  const { users, actions } = useStore();
  const now = useNow();
  const target = useTarget(report);
  const author = target?.authorId ? users[target.authorId] : undefined;
  const reporter = users[report.reporterId];
  const removable = REMOVABLE.includes(report.targetType) && !!target;

  return (
    <Card>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Badge label={TARGET_LABEL[report.targetType]} />
        <Text style={styles.hint}>{ago(report.createdAt, now)}</Text>
      </View>
      <Text style={[styles.title, { color: colors.warn }]}>{report.reason}</Text>
      {report.details ? <Text style={styles.muted}>“{report.details}”</Text> : null}

      <View style={{ backgroundColor: colors.surface2, borderRadius: radius.md, padding: 12, gap: 6 }}>
        {target ? (
          <>
            {author ? (
              <View style={styles.row}>
                <Avatar user={author} size={22} />
                <Text style={styles.label}>{author.name}</Text>
              </View>
            ) : null}
            <Text style={styles.body}>{target.text}</Text>
          </>
        ) : (
          <Text style={styles.muted}>Conteúdo já removido ou fora do período carregado.</Text>
        )}
      </View>
      <Text style={styles.hint}>Denunciado por {reporter?.name ?? 'membro da comunidade'} (sigiloso para o autor)</Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {removable ? (
          <Button label="Remover" icon="trash-outline" variant="danger" compact style={{ flex: 1 }}
            onPress={() => {
              actions.removeContent(report.targetType as RemovableTarget, report.targetId);
              actions.resolveReport(report.id, 'resolvida');
            }} />
        ) : null}
        <Button label={removable ? 'Manter' : 'Resolvida'} icon="checkmark" variant="secondary" compact style={{ flex: 1 }}
          onPress={() => actions.resolveReport(report.id, removable ? 'descartada' : 'resolvida')} />
      </View>
    </Card>
  );
}

function VerificationCard({ userId }: { userId: ID }) {
  const { users, verificationRequests, actions, backend } = useStore();
  const now = useNow();
  const user = users[userId];
  const request = verificationRequests.find((v) => v.userId === userId);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!user) return null;

  const showEvidence = async () => {
    if (!request?.evidence) return;
    if (backend === 'demo') return setEvidenceUrl(request.evidence);
    setLoading(true);
    try {
      const url = await remote.signedEvidenceUrl(request.evidence);
      if (url && request.evidence.endsWith('.pdf')) await Linking.openURL(url);
      else setEvidenceUrl(url ?? null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <View style={styles.row}>
        <Avatar user={user} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{user.name}</Text>
          <Text style={styles.muted}>{user.course ?? 'Curso não informado'} · entrou {ago(user.joinedAt, now)}</Text>
        </View>
      </View>
      {request?.evidence ? (
        evidenceUrl ? (
          <Image source={{ uri: evidenceUrl }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md }} resizeMode="contain"
            accessibilityLabel="Comprovante de vínculo" />
        ) : (
          <Button label={loading ? 'Carregando…' : 'Ver comprovante'} icon="document-text-outline" variant="secondary" compact onPress={showEvidence} />
        )
      ) : (
        <Notice icon="hourglass-outline" text="Ainda não enviou comprovante." />
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label="Recusar" icon="close" variant="danger" compact style={{ flex: 1 }} onPress={() => actions.reviewVerification(userId, false)} />
        <Button label="Aprovar" icon="checkmark" compact style={{ flex: 1 }} onPress={() => actions.reviewVerification(userId, true)} />
      </View>
    </Card>
  );
}

export default function Moderacao() {
  const { reports, users, refreshing, actions, verificationRequests } = useStore();
  const [tab, setTab] = useState<'denuncias' | 'verificacoes'>('denuncias');
  const open = reports.filter((r) => r.status === 'aberta').sort((a, b) => b.createdAt - a.createdAt);
  // Só quem pediu verificação manual (comprovante). Quem ainda vai confirmar pelo e-mail institucional não entra na fila.
  const requested = new Set(verificationRequests.map((v) => v.userId));
  const pending = Object.values(users).filter((u) => u.verification === 'pending' && requested.has(u.id)).sort((a, b) => a.joinedAt - b.joinedAt);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={actions.refresh} tintColor={colors.accent} />}>
      <ChipRow>
        <Chip label={`Denúncias (${open.length})`} icon="flag" active={tab === 'denuncias'} onPress={() => setTab('denuncias')} />
        <Chip label={`Verificações (${pending.length})`} icon="shield-checkmark" active={tab === 'verificacoes'} onPress={() => setTab('verificacoes')} />
      </ChipRow>

      {tab === 'denuncias' ? (
        open.length ? open.map((r) => <ReportCard key={r.id} report={r} />) : <Empty icon="happy-outline" title="Nenhuma denúncia aberta" />
      ) : pending.length ? (
        pending.map((u) => <VerificationCard key={u.id} userId={u.id} />)
      ) : (
        <Empty icon="shield-checkmark-outline" title="Nenhuma verificação pendente" />
      )}

      <Notice text="Remoções escondem o conteúdo para toda a comunidade e ficam registradas. Na dúvida, discuta com a equipe antes de agir." />
    </ScrollView>
  );
}
