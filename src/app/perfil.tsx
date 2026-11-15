import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Chip, ChipRow, CoursePicker, Field, Notice, PasswordField, Section, SemesterPicker, styles, ToggleRow } from '@/components/ui';
import { HANDLE_MAX, normalizeHandle } from '@/lib/handle';
import { GroupCard } from '@/components/social';
import { pickAvatar } from '@/lib/images';
import { NOT_AFFILIATED } from '@/lib/legal';
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

/** Confirma o vínculo com um código enviado ao e-mail institucional. */
function InstitutionalEmailVerification() {
  const { actions, community, backend } = useStore();
  const { busy, error, run } = useAsync();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | undefined>();
  const domains = community.emailDomains.map((d) => '@' + d).join(' ou ');

  const send = () => run(async () => {
    const res = await actions.requestInstitutionalCode(email);
    setSentTo(email.trim().toLowerCase());
    setDemoCode(res.demoCode);
    setCode('');
  });
  const confirm = () => run(async () => {
    if (!/^\d{6}$/.test(code.trim())) throw new Error('O código tem 6 números.');
    await actions.confirmInstitutionalCode(code);
  });

  return (
    <>
      <Text style={styles.muted}>
        Para publicar, confirme que você é aluno: enviamos um código para o seu e-mail institucional ({domains}).
        Seu login continua sendo o e-mail que você já usa.
      </Text>
      {sentTo ? (
        <>
          <Notice icon="mail-outline" text={`Enviamos um código de 6 números para ${sentTo}. Ele vale por 15 minutos.`} />
          {backend === 'demo' && demoCode ? <Notice icon="flask-outline" text={`Modo demonstração: o código é ${demoCode}.`} /> : null}
          <Field label="Código" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" placeholder="000000" />
          {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
          <Button label={busy ? 'Confirmando…' : 'Confirmar vínculo'} icon="shield-checkmark" compact disabled={busy} onPress={confirm} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Reenviar código" variant="ghost" compact disabled={busy} onPress={send} style={{ flex: 1 }} />
            <Button label="Trocar e-mail" variant="ghost" compact disabled={busy} style={{ flex: 1 }}
              onPress={() => { setSentTo(null); setCode(''); }} />
          </View>
        </>
      ) : (
        <>
          <Field label="E-mail institucional" value={email} onChangeText={setEmail} placeholder={`voce@${community.emailDomains[0]}`}
            keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
          <Button label={busy ? 'Enviando…' : 'Enviar código'} icon="mail-outline" compact disabled={busy} onPress={send} />
        </>
      )}
      <Text style={styles.hint}>
        Usamos o e-mail institucional só para confirmar o vínculo. Ele não aparece no seu perfil e não recebe nada além deste código.
      </Text>
    </>
  );
}

/** Alternativa para quem não tem acesso ao e-mail institucional: comprovante analisado pela moderação. */
function EvidenceVerification() {
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
    <>
      <Text style={styles.muted}>
        Envie uma foto do comprovante de matrícula ou da carteirinha (cubra dados que não forem necessários).
        A moderação analisa e libera sua conta.
      </Text>
      {sent && me.verification === 'pending' ? (
        <Notice icon="checkmark-circle" text="Comprovante enviado. Avisaremos quando for analisado." />
      ) : null}
      {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
      <Button label={busy ? 'Enviando…' : sent ? 'Enviar outro comprovante' : 'Enviar comprovante'} icon="cloud-upload-outline"
        compact variant="secondary" disabled={busy} onPress={pick} />
      <Text style={styles.hint}>O comprovante só é visto pela moderação e serve apenas para a verificação.</Text>
    </>
  );
}

function VerificationSection() {
  const me = useMe();
  const [method, setMethod] = useState<'email' | 'comprovante'>('email');

  return (
    <Section title="Verificação de vínculo">
      <Card>
        {me.verification === 'rejected' ? (
          <Notice tone="warn" icon="close-circle" text="Não conseguimos confirmar seu vínculo pelo comprovante. Confirme pelo e-mail institucional ou envie um novo comprovante." />
        ) : null}
        <ChipRow>
          <Chip label="E-mail institucional" icon="mail-outline" active={method === 'email'} onPress={() => setMethod('email')} />
          <Chip label="Não tenho acesso" icon="document-text-outline" active={method === 'comprovante'} onPress={() => setMethod('comprovante')} />
        </ChipRow>
        {method === 'email' ? <InstitutionalEmailVerification /> : <EvidenceVerification />}
      </Card>
    </Section>
  );
}

/** Criar ou trocar a senha (contas antigas, sem senha, também usam isto). */
function PasswordSection() {
  const { actions } = useStore();
  const { busy, error, run } = useAsync();
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => run(async () => {
    setSaved(false);
    await actions.setPassword(password);
    setPassword('');
    setSaved(true);
  });

  return (
    <Section title="Senha">
      <Card>
        <Text style={styles.muted}>Crie ou troque a senha que você usa para entrar. Se esquecer, dá para entrar com um código enviado ao seu e-mail.</Text>
        <PasswordField label="Nova senha" value={password} onChangeText={(v) => { setPassword(v); setSaved(false); }}
          autoComplete="new-password" textContentType="newPassword" placeholder="Mínimo de 8 caracteres, com letras e números" />
        {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
        {saved ? <Notice icon="checkmark-circle" text="Senha salva." /> : null}
        <Button label={busy ? 'Salvando…' : 'Salvar senha'} icon="key-outline" compact variant="secondary"
          disabled={busy || !password} onPress={save} />
      </Card>
    </Section>
  );
}

/** Exclusão da conta: pede o nome de usuário para confirmar, porque não dá para desfazer. */
function DeleteAccountSection() {
  const { actions } = useStore();
  const me = useMe();
  const { busy, error, run } = useAsync();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim().replace(/^@/, '').toLowerCase() === me.handle;

  if (!open) {
    return <Button label="Excluir conta" icon="trash-outline" variant="ghost" compact onPress={() => setOpen(true)} />;
  }
  return (
    <Card>
      <Text style={styles.title}>Excluir conta</Text>
      <Text style={styles.muted}>
        Apaga sua conta e tudo o que você criou: perfil, foto, publicações, comentários, Bora?, conexões e o vínculo verificado.
        Comunidades em que você é o único admin passam para o membro mais antigo. Não dá para desfazer.
      </Text>
      <Field label={`Para confirmar, digite seu nome de usuário (${me.handle})`} value={typed} onChangeText={setTyped}
        autoCapitalize="none" autoCorrect={false} placeholder={me.handle} />
      {error ? <Notice tone="warn" icon="alert-circle" text={error} /> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Cancelar" variant="secondary" compact style={{ flex: 1 }} onPress={() => { setOpen(false); setTyped(''); }} />
        <Button label={busy ? 'Excluindo…' : 'Excluir para sempre'} icon="trash" variant="danger" compact style={{ flex: 1 }}
          disabled={busy || !confirmed} onPress={() => run(actions.deleteAccount)} />
      </View>
    </Card>
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
  const { actions, settings, blocked, users, posts, boras, community, backend, following, groups, verificationRequests } = useStore();
  const me = useMe();
  const evidenceSent = verificationRequests.some((v) => v.userId === me.id && v.evidence);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.name);
  const [handle, setHandle] = useState(me.handle);
  const [course, setCourse] = useState(me.course ?? '');
  const [semester, setSemester] = useState(me.semester ?? '');
  const [interests, setInterests] = useState(me.interests.join(', '));

  const edit = useAsync();
  const startEditing = () => {
    setName(me.name);
    setHandle(me.handle);
    setCourse(me.course ?? '');
    setSemester(me.semester ?? '');
    setInterests(me.interests.join(', '));
    setEditing(true);
  };
  const save = () => edit.run(async () => {
    if (course.trim().length < 2) throw new Error('Escolha seu curso.');
    if (!semester) throw new Error('Escolha seu semestre.');
    const nick = normalizeHandle(handle) === me.handle ? me.handle : await actions.checkHandle(handle);
    actions.updateProfile({
      name: name.trim() || me.name,
      handle: nick,
      course: course.trim(),
      semester,
      interests: interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean).slice(0, 10),
    });
    setEditing(false);
  });

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
            : evidenceSent
              ? <Badge label="Verificação em análise" icon="hourglass-outline" tone="warn" style={{ alignSelf: 'center' }} />
              : <Badge label="Vínculo não verificado" icon="alert-circle-outline" tone="warn" style={{ alignSelf: 'center' }} />}
        {me.institutionalEmail ? <Text style={styles.hint}>Verificado por {me.institutionalEmail}</Text> : null}
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
          <Field label="Nome de usuário" value={handle} onChangeText={(v) => setHandle(normalizeHandle(v).slice(0, HANDLE_MAX))}
            autoCapitalize="none" autoCorrect={false} hint={`Você aparece como @${normalizeHandle(handle) || '…'}`} />
          <CoursePicker value={course} onChange={setCourse} courses={community.courses} />
          <SemesterPicker value={semester} onChange={setSemester} />
          <Field label="Interesses" value={interests} onChangeText={setInterests} hint="Separados por vírgula: futsal, fotografia, games…" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancelar" variant="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            <Button label={edit.busy ? 'Salvando…' : 'Salvar'} disabled={edit.busy} onPress={save} style={{ flex: 1 }} />
          </View>
          {edit.error ? <Notice tone="warn" icon="alert-circle" text={edit.error} /> : null}
        </Card>
      ) : (
        <Button label="Editar perfil" icon="create-outline" variant="secondary" onPress={startEditing} />
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

      <PasswordSection />

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

      <Section title="Sobre">
        <Card>
          <Pressable onPress={() => router.push('/termos')} accessibilityRole="link" style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.body}>Termos de uso</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
          <Pressable onPress={() => router.push('/privacidade')} accessibilityRole="link" style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.body}>Política de Privacidade</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
          <Text style={styles.hint}>{NOT_AFFILIATED}</Text>
        </Card>
      </Section>

      <View style={{ gap: 10 }}>
        <Button label="Sair" icon="log-out-outline" variant="danger" onPress={actions.signOut} />
        <DeleteAccountSection />
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
