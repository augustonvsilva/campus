import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Chip, ChipRow, Field, Notice, Section, styles, ToggleRow } from '@/components/ui';
import { GroupCard } from '@/components/social';
import { pickAvatar } from '@/lib/images';
import { followersOf, followingOf } from '@/lib/social';
import { canPublish, isModerator, useMe, useStore } from '@/lib/store';
import { colors } from '@/theme';

function useAsync() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado.');
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function AvatarEditor() {
  const { actions } = useStore();
  const me = useMe();
  const { busy, error, run } = useAsync();

  const change = () => run(async () => {
    const image = await pickAvatar();
    if (image) await actions.setAvatar(image);
  });

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Pressable onPress={change} disabled={busy} accessibilityRole="button" accessibilityLabel="Trocar foto de perfil">
        <Avatar user={me} size={96} />
        <View style={{
          position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16,
          backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg,
        }}>
          {busy ? <ActivityIndicator size="small" color={colors.onAccent} /> : <Ionicons name="camera" size={15} color={colors.onAccent} />}
        </View>
      </Pressable>
      {me.avatarUrl && !busy ? (
        <Button label="Remover foto" variant="ghost" compact onPress={() => run(() => actions.setAvatar(null))} />
      ) : null}
      {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
    </View>
  );
}

function VerificationSection() {
  const { actions, verificationRequests } = useStore();
  const me = useMe();
  const { busy, error, run } = useAsync();
  const sent = verificationRequests.some((v) => v.userId === me.id && v.evidence);

  const pick = () => run(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = res.canceled ? undefined : res.assets[0];
    if (asset) await actions.requestVerification({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
  });

  return (
    <Section title="Verificação de vínculo">
      <Card>
        {me.verification === 'rejected' ? (
          <Notice tone="warn" icon="close-circle" text="Não conseguimos confirmar seu vínculo com a universidade. Envie um novo comprovante ou fale com a equipe." />
        ) : (
          <Text style={styles.muted}>
            Como você entrou sem e-mail institucional, a moderação precisa confirmar seu vínculo antes de você publicar.
            Envie uma foto do comprovante de matrícula ou da carteirinha (cubra dados que não forem necessários).
          </Text>
        )}
        {sent && me.verification === 'pending' ? (
          <Notice icon="checkmark-circle" text="Comprovante enviado. Avisaremos quando for analisado." />
        ) : null}
        {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
        <Button label={busy ? 'Enviando…' : sent ? 'Enviar outro comprovante' : 'Enviar comprovante'} icon="cloud-upload-outline"
          compact disabled={busy} onPress={pick} />
        <Text style={styles.hint}>O comprovante só é visto pela moderação e serve apenas para a verificação.</Text>
      </Card>
    </Section>
  );
}

function InviteSection() {
  const { actions, invites } = useStore();
  const me = useMe();
  const { busy, error, run } = useAsync();
  const mine = invites.filter((i) => i.createdBy === me.id).sort((a, b) => b.createdAt - a.createdAt);

  const share = (code: string) => {
    const message = `Bora pro Campus? É a rede da comunidade Mackenzie. Use meu convite: ${code}`;
    Share.share({ message }).catch(() => Clipboard.setStringAsync(code));
  };

  return (
    <Section title="Convidar amigos">
      <Card>
        <Text style={styles.muted}>Cada convite vale para 5 pessoas. Você pode ter até 3 convites ativos.</Text>
        {mine.map((i) => (
          <View key={i.code} style={[styles.row, { justifyContent: 'space-between' }]}>
            <View>
              <Text style={[styles.title, { letterSpacing: 1 }]}>{i.code}</Text>
              <Text style={styles.hint}>{i.uses} de {i.maxUses} usados</Text>
            </View>
            {i.uses < i.maxUses ? <Button label="Compartilhar" icon="share-outline" compact variant="secondary" onPress={() => share(i.code)} /> : <Badge label="Esgotado" />}
          </View>
        ))}
        {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
        <Button label={busy ? 'Gerando…' : 'Gerar convite'} icon="add" compact disabled={busy}
          onPress={() => run(async () => { share(await actions.createInvite()); })} />
      </Card>
    </Section>
  );
}

export default function Perfil() {
  const { actions, settings, blocked, users, posts, boras, community, backend, following, groups } = useStore();
  const me = useMe();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.name);
  const [course, setCourse] = useState(me.course ?? '');
  const [semester, setSemester] = useState(me.semester ?? '');
  const [interests, setInterests] = useState(me.interests.join(', '));

  const save = () => {
    actions.updateProfile({
      name: name.trim() || me.name,
      course: course.trim() || undefined,
      semester: semester.trim() || undefined,
      interests: interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean).slice(0, 10),
    });
    setEditing(false);
  };

  const myGroups = groups.filter((g) => g.members[me.id]);
  const myPosts = posts.filter((p) => p.authorId === me.id).length;
  const myBoras = boras.filter((b) => b.participants.includes(me.id)).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { gap: 28 }]} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', gap: 8 }}>
        <AvatarEditor />
        <Text style={styles.h2}>{me.name}</Text>
        <Text style={styles.muted}>
          @{me.handle} · {community.shortName}
          {me.course ? ` · ${me.course}` : ''}
          {me.semester ? ` (${me.semester} sem.)` : ''}
        </Text>
        {canPublish(me)
          ? <Badge label="Vínculo verificado" icon="shield-checkmark" tone="accent" style={{ alignSelf: 'center' }} />
          : me.verification === 'rejected'
            ? <Badge label="Vínculo não comprovado" icon="close-circle" tone="warn" style={{ alignSelf: 'center' }} />
            : <Badge label="Verificação em análise" icon="hourglass-outline" tone="warn" style={{ alignSelf: 'center' }} />}
        {me.interests.length ? (
          <ChipRow>{me.interests.map((i) => <Chip key={i} label={i} />)}</ChipRow>
        ) : null}
        <Text style={styles.hint}>{myPosts} {myPosts === 1 ? 'publicação' : 'publicações'} · {myBoras} Bora?</Text>
        <View style={[styles.row, { gap: 10 }]}>
          <Chip label={`${followersOf(following, me.id).length} seguidores`}
            onPress={() => router.push({ pathname: '/conexoes', params: { usuario: me.id, lista: 'seguidores' } })} />
          <Chip label={`${followingOf(following, me.id).length} seguindo`}
            onPress={() => router.push({ pathname: '/conexoes', params: { usuario: me.id, lista: 'seguindo' } })} />
        </View>
        <Text style={[styles.label, { color: colors.accent }]} onPress={() => router.push(`/usuario/${me.id}`)}>
          Ver como os outros me veem
        </Text>
      </View>

      {editing ? (
        <Card>
          <Field label="Nome" value={name} onChangeText={setName} />
          <Field label="Curso (opcional)" value={course} onChangeText={setCourse} />
          <Field label="Semestre (opcional)" value={semester} onChangeText={setSemester} placeholder="Ex.: 3º" />
          <Field label="Interesses" value={interests} onChangeText={setInterests} hint="Separados por vírgula: futsal, fotografia, games…" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancelar" variant="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            <Button label="Salvar" onPress={save} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Button label="Editar perfil" icon="create-outline" variant="secondary" onPress={() => setEditing(true)} />
      )}

      <Section
        title="Minhas comunidades"
        right={<Text style={[styles.label, { color: colors.accent }]} onPress={() => router.push({ pathname: '/explorar', params: { aba: 'comunidades' } })}>Explorar</Text>}>
        {myGroups.length
          ? myGroups.map((g) => <GroupCard key={g.id} group={g} />)
          : <Text style={styles.muted}>Você ainda não participa de nenhuma. Atléticas, baterias e coletivos estão em Explorar.</Text>}
      </Section>

      {!canPublish(me) ? <VerificationSection /> : <InviteSection />}

      {isModerator(me) ? (
        <Button label="Painel de moderação" icon="shield-half-outline" variant="secondary" onPress={() => router.push('/moderacao')} />
      ) : null}

      <Section title="Privacidade">
        <Card>
          <ToggleRow
            label="Perfil visível para a comunidade"
            hint="Desligado, só seu nome e foto aparecem nas suas interações."
            value={settings.profileVisible}
            onValueChange={(v) => actions.updateSettings({ profileVisible: v })}
          />
          <ToggleRow
            label="Mostrar de quais Bora? eu participo"
            value={settings.showBoraParticipation}
            onValueChange={(v) => actions.updateSettings({ showBoraParticipation: v })}
          />
          <Text style={styles.hint}>O Campus nunca compartilha sua localização em tempo real.</Text>
        </Card>
      </Section>

      <Section title="Notificações">
        <Card>
          <ToggleRow label="Novos Bora? perto do horário" value={settings.notify.boras}
            onValueChange={(v) => actions.updateSettings({ notify: { ...settings.notify, boras: v } })} />
          <ToggleRow label="Lembretes de eventos marcados" value={settings.notify.eventos}
            onValueChange={(v) => actions.updateSettings({ notify: { ...settings.notify, eventos: v } })} />
          <ToggleRow label="Comentários nas minhas publicações" value={settings.notify.comentarios}
            onValueChange={(v) => actions.updateSettings({ notify: { ...settings.notify, comentarios: v } })} />
        </Card>
      </Section>

      <Section title="Bloqueados">
        {blocked.length === 0 ? (
          <Text style={styles.muted}>Você não bloqueou ninguém.</Text>
        ) : (
          <Card>
            {blocked.map((id) => (
              <View key={id} style={[styles.row, { justifyContent: 'space-between' }]}>
                <View style={styles.row}>
                  <Avatar user={users[id]} size={30} />
                  <Text style={styles.body}>{users[id]?.name ?? 'Usuário'}</Text>
                </View>
                <Button label="Desbloquear" compact variant="secondary" onPress={() => actions.toggleBlock(id)} />
              </View>
            ))}
          </Card>
        )}
      </Section>

      <View style={{ gap: 10 }}>
        <Button label="Sair" icon="log-out-outline" variant="danger" onPress={actions.signOut} />
        {backend === 'demo' ? (
          <Button label="Restaurar dados de demonstração" icon="refresh" variant="ghost" compact onPress={actions.resetDemo} />
        ) : null}
        <Text style={[styles.hint, { textAlign: 'center' }]}>
          Campus · um produto Cúpula · v0.2{backend === 'demo' ? ' (demonstração)' : ''}
        </Text>
      </View>
    </ScrollView>
  );
}
